// The pi side's HTTP client for the artifact server: typed calls over the
// /api routes and one long-lived event stream with reconnection. Plain fetch,
// so it runs under Node or Bun. The origin comes from a locator (find-or-spawn
// in production, a fixed origin in tests). Every call carries the session
// token and this session's id.

import {
  API_PREFIX,
  galleryUrl,
  pageUrl,
  SESSION_HEADER,
  SESSION_ID_HEADER,
} from "../../domain/protocol";
import type {
  CommentThread,
  Diagnostic,
  FileMap,
  FileRecord,
  Island,
  Manifest,
  PageEvent,
  PublishRequest,
  PublishResponse,
  ServerStatus,
  SourceKind,
  StreamMessage,
} from "../../domain/types";

export interface Endpoint {
  origin: string;
  port: number;
  token: string;
  viewer: string;
}

export type Locator = () => Promise<Endpoint>;

export interface ArtifactRead {
  manifest: Manifest;
  island: Island | null;
  source: { kind: SourceKind; source: string } | null;
}

/** One supporting file as the server reads it back; `text` only for a small text file. */
export interface FileRead extends FileRecord {
  version: number;
  path: string;
  text: string | null;
}

export interface StreamHandle {
  close(): void;
}

export class ClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: Record<string, unknown> = {},
  ) {
    super(message);
  }
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
    return pageUrl(e.origin, slug, withToken ? e.viewer : undefined);
  }

  galleryUrl(): string {
    const e = this.endpoint;
    if (!e) throw new Error("artifact server not connected");
    return galleryUrl(e.origin, e.viewer);
  }

  private async call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
    const e = await this.connect();
    let res: Response;
    try {
      res = await fetch(`${e.origin}${API_PREFIX}${path}`, {
        method,
        headers: {
          [SESSION_HEADER]: e.token,
          [SESSION_ID_HEADER]: this.session,
          ...(body !== undefined ? { "content-type": "application/json" } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(30_000),
      });
    } catch (err) {
      this.forget();
      throw new Error(
        `the artifact server at ${e.origin} did not answer (${(err as Error).message}); it will be located again on the next call`,
      );
    }
    const parsed = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      // A capability's route refuses as {code, message}; every other route as {error}.
      const said = [parsed.error, parsed.message].find((text) => typeof text === "string");
      throw new ClientError(
        (said as string | undefined) ?? `HTTP ${res.status}`,
        res.status,
        parsed,
      );
    }
    return parsed as T;
  }

  /** What the server says of itself: never a secret. */
  status(): Promise<ServerStatus> {
    return this.call<ServerStatus>("GET", "/status");
  }

  list(): Promise<Manifest[]> {
    return this.call<{ artifacts: Manifest[] }>("GET", "/artifacts").then((r) => r.artifacts);
  }

  async get(slug: string): Promise<ArtifactRead | null> {
    try {
      return await this.call<ArtifactRead>("GET", `/artifacts/${slug}`);
    } catch (e) {
      if (e instanceof ClientError && e.status === 404) return null;
      throw e;
    }
  }

  comments(slug: string): Promise<CommentThread[]> {
    return this.call<{ threads: CommentThread[] }>("GET", `/artifacts/${slug}/comments`).then(
      (r) => r.threads,
    );
  }

  diagnostics(slug: string): Promise<Diagnostic[]> {
    return this.call<{ rows: Diagnostic[] }>("GET", `/artifacts/${slug}/diagnostics`).then(
      (r) => r.rows,
    );
  }

  /** The supporting files of the current version. */
  files(slug: string): Promise<{ version: number; files: FileMap }> {
    return this.call("GET", `/artifacts/${slug}/files`);
  }

  /** One supporting file by its published path; null when the current version has none there. */
  async file(slug: string, path: string): Promise<FileRead | null> {
    try {
      return await this.call<FileRead>(
        "GET",
        `/artifacts/${slug}/files?path=${encodeURIComponent(path)}`,
      );
    } catch (e) {
      if (e instanceof ClientError && e.status === 404) return null;
      throw e;
    }
  }

  /**
   * One operation on the artifact's database, in the body routes/db.ts reads. A
   * refusal is a ClientError whose body is the server's {code, message, current?, entry?}.
   */
  db<T>(slug: string, body: Record<string, unknown>): Promise<T> {
    return this.call<T>("POST", `/artifacts/${slug}/db`, body);
  }

  pending(): Promise<PageEvent[]> {
    return this.call<{ events: PageEvent[] }>("GET", "/pending").then((r) => r.events);
  }

  publish(request: Omit<PublishRequest, "session">): Promise<PublishResponse> {
    return this.call<PublishResponse>("POST", "/publish", request);
  }

  watch(slug: string, watched: boolean): Promise<Manifest> {
    return this.call<{ manifest: Manifest }>("POST", `/artifacts/${slug}/watch`, { watched }).then(
      (r) => r.manifest,
    );
  }

  pin(slug: string, pinned: boolean): Promise<Manifest> {
    return this.call<{ manifest: Manifest }>("POST", `/artifacts/${slug}/pin`, { pinned }).then(
      (r) => r.manifest,
    );
  }

  /** The user's rename; the server trims the title, and refuses an empty or oversized one. */
  rename(slug: string, title: string): Promise<Manifest> {
    return this.call<{ manifest: Manifest }>("POST", `/artifacts/${slug}/rename`, { title }).then(
      (r) => r.manifest,
    );
  }

  ack(slug: string, ids: string[]): Promise<number> {
    return this.call<{ acked: number }>("POST", `/artifacts/${slug}/ack`, { ids }).then(
      (r) => r.acked,
    );
  }

  reply(
    slug: string,
    threadId: string,
    text: string,
    acknowledgeDuplicate = false,
  ): Promise<CommentThread> {
    return this.call<{ thread: CommentThread }>("POST", `/artifacts/${slug}/reply`, {
      threadId,
      text,
      acknowledgeDuplicate,
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

  sweep(): Promise<{ artifacts: string[]; logs: string[] }> {
    return this.call("POST", "/sweep", {});
  }

  detach(): Promise<void> {
    return this.call<unknown>("POST", "/detach", {}).then(() => undefined);
  }

  stop(): Promise<void> {
    return this.call<unknown>("POST", "/stop", {}).then(() => this.forget());
  }

  /**
   * Opens the event stream and keeps it open: on a drop it reconnects with
   * backoff and calls `onReconnect`, so the caller can fetch what it missed.
   */
  subscribe(onMessage: (message: StreamMessage) => void, onReconnect?: () => void): StreamHandle {
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
            `${endpoint.origin}${API_PREFIX}/events?session=${encodeURIComponent(this.session)}`,
            {
              headers: { [SESSION_HEADER]: endpoint.token, [SESSION_ID_HEADER]: this.session },
              signal: controller.signal,
            },
          );
          if (!res.ok || !res.body) throw new Error(`events stream refused: ${res.status}`);
          if (attempts > 0) onReconnect?.();
          attempts = 0;
          await readSse(res.body, onMessage);
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
  onMessage: (message: StreamMessage) => void,
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
        onMessage(JSON.parse(data) as StreamMessage);
      } catch {
        // a malformed frame is dropped, never fatal
      }
    }
  }
}
