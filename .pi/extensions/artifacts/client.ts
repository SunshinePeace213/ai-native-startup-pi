// The pi side's HTTP client for the artifact server: typed calls over the
// /api routes and one long-lived event stream with reconnection. Plain fetch,
// so it runs under Node or Bun. The origin comes from a locator (find-or-spawn
// in production, a fixed origin in tests).

import { HEADER, PREFIX } from "./server-const";
import type {
  CommentThread,
  Island,
  Manifest,
  PageEvent,
  PublishRequest,
  PublishResponse,
  SourceKind,
} from "./types";

export interface Endpoint {
  origin: string;
  port: number;
  requestedPort: number;
  token: string;
}

export type Locator = () => Promise<Endpoint>;

export interface ArtifactRead {
  manifest: Manifest;
  island: Island | null;
  source: { kind: SourceKind; source: string } | null;
}

export interface StreamHandle {
  close(): void;
}

const RECONNECT_MIN_MS = 500;
const RECONNECT_MAX_MS = 10_000;

export class ArtifactClient {
  private endpoint: Endpoint | null = null;

  constructor(
    private readonly locate: Locator,
    readonly session: string,
  ) {}

  /** The endpoint, located on first use; a failed call forgets it so the next call re-locates. */
  async connect(): Promise<Endpoint> {
    return (this.endpoint ??= await this.locate());
  }

  get connected(): Endpoint | null {
    return this.endpoint;
  }

  forget(): void {
    this.endpoint = null;
  }

  pageUrl(slug: string, withToken = true): string {
    const e = this.endpoint;
    if (!e) throw new Error("artifact server not connected");
    return `${e.origin}${PREFIX}/${slug}${withToken ? `?t=${encodeURIComponent(e.token)}` : ""}`;
  }

  galleryUrl(): string {
    const e = this.endpoint;
    if (!e) throw new Error("artifact server not connected");
    return `${e.origin}${PREFIX}/?t=${encodeURIComponent(e.token)}`;
  }

  private async call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
    const e = await this.connect();
    let res: Response;
    try {
      res = await fetch(`${e.origin}/api${path}`, {
        method,
        headers: {
          [HEADER]: e.token,
          ...(body !== undefined ? { "content-type": "application/json" } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(30_000),
      });
    } catch (err) {
      this.forget();
      throw new Error(
        `the artifact server at ${e.origin} did not answer (${(err as Error).message}); it will be restarted on the next call`,
      );
    }
    const parsed = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const message = typeof parsed.error === "string" ? parsed.error : `HTTP ${res.status}`;
      throw new Error(message);
    }
    return parsed as T;
  }

  list(): Promise<Manifest[]> {
    return this.call<{ artifacts: Manifest[] }>("GET", "/artifacts").then((r) => r.artifacts);
  }

  async get(slug: string): Promise<ArtifactRead | null> {
    try {
      return await this.call<ArtifactRead>("GET", `/artifacts/${slug}`);
    } catch (e) {
      if ((e as Error).message === "no such artifact") return null;
      throw e;
    }
  }

  comments(slug: string): Promise<CommentThread[]> {
    return this.call<{ threads: CommentThread[] }>("GET", `/artifacts/${slug}/comments`).then(
      (r) => r.threads,
    );
  }

  pending(): Promise<PageEvent[]> {
    return this.call<{ events: PageEvent[] }>("GET", "/pending").then((r) => r.events);
  }

  publish(request: PublishRequest): Promise<PublishResponse> {
    return this.call<PublishResponse>("POST", "/publish", {
      ...request,
      owner: request.owner ?? this.session,
    });
  }

  watch(slug: string, watched: boolean): Promise<Manifest> {
    return this.call<{ manifest: Manifest }>("POST", `/artifacts/${slug}/watch`, {
      watched,
      owner: this.session,
    }).then((r) => r.manifest);
  }

  ack(slug: string, ids: string[]): Promise<number> {
    return this.call<{ acked: number }>("POST", `/artifacts/${slug}/ack`, {
      ids,
      owner: this.session,
    }).then((r) => r.acked);
  }

  reply(slug: string, threadId: string, text: string): Promise<CommentThread> {
    return this.call<{ thread: CommentThread }>("POST", `/artifacts/${slug}/reply`, {
      threadId,
      text,
    }).then((r) => r.thread);
  }

  resolve(slug: string, threadId: string): Promise<CommentThread> {
    return this.call<{ thread: CommentThread }>("POST", `/artifacts/${slug}/resolve`, {
      threadId,
    }).then((r) => r.thread);
  }

  remove(slug: string): Promise<string> {
    return this.call<{ trash: string }>("POST", `/artifacts/${slug}/delete`, {}).then(
      (r) => r.trash,
    );
  }

  stop(): Promise<void> {
    return this.call<unknown>("POST", "/stop", {}).then(() => this.forget());
  }

  /**
   * Opens the event stream and keeps it open: on a drop it reconnects with
   * backoff and calls `onReconnect`, so the caller can fetch what it missed.
   */
  subscribe(onEvent: (event: PageEvent) => void, onReconnect?: () => void): StreamHandle {
    let closed = false;
    let controller: AbortController | null = null;
    let attempts = 0;

    const run = async () => {
      while (!closed) {
        let endpoint: Endpoint;
        try {
          endpoint = await this.connect();
        } catch {
          await sleep(backoff(attempts++));
          continue;
        }
        controller = new AbortController();
        try {
          const res = await fetch(
            `${endpoint.origin}/api/events?session=${encodeURIComponent(this.session)}`,
            {
              headers: { [HEADER]: endpoint.token },
              signal: controller.signal,
            },
          );
          if (!res.ok || !res.body) throw new Error(`events stream refused: ${res.status}`);
          if (attempts > 0) onReconnect?.();
          attempts = 0;
          await readSse(res.body, onEvent);
        } catch {
          // dropped; fall through to reconnect
        }
        if (closed) break;
        this.forget();
        await sleep(backoff(attempts++));
      }
    };
    void run();
    return {
      close() {
        closed = true;
        controller?.abort();
      },
    };
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const backoff = (attempt: number) =>
  Math.min(RECONNECT_MAX_MS, RECONNECT_MIN_MS * 2 ** Math.min(attempt, 5));

async function readSse(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: PageEvent) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return;
    buffer += decoder.decode(value, { stream: true });
    let k: number;
    while ((k = buffer.indexOf("\n\n")) >= 0) {
      const frame = buffer.slice(0, k);
      buffer = buffer.slice(k + 2);
      const data = frame
        .split("\n")
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(5).trim())
        .join("\n");
      if (!data) continue;
      try {
        onEvent(JSON.parse(data) as PageEvent);
      } catch {
        // a malformed frame is dropped, never fatal
      }
    }
  }
}
