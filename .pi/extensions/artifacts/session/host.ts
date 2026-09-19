// The pi side's orchestrator: what a page event becomes in this session —
// the answer to a blocked `ask`, a wake, a queued notice, or a held event
// when the artifact is unwatched or the hourly cap is reached. It reads and
// writes artifacts only through the client; the server owns the store. What
// the session is told goes through `deps.send`, what the user is told through
// `deps.notify`; nothing here knows about Pi or about Bun.

import { slugFromRef } from "../shared/protocol";
import type { Config, PageEvent, PublishRequest, PublishResponse } from "../shared/types";
import { ArtifactClient, type Endpoint, type Locator } from "./client";
import { envelope, pendingSummary } from "./feedback";

export type SendOptions = { triggerTurn?: boolean; deliverAs?: "steer" | "followUp" | "nextTurn" };
export type SendFn = (
  content: string,
  options: SendOptions,
  details: Record<string, unknown>,
) => void;
export type NotifyFn = (message: string, type: "info" | "warning" | "error") => void;

export interface HostDeps {
  config: Config;
  session: string;
  locate: Locator;
  send: SendFn;
  notify: NotifyFn;
  /** Opens the browser; resolves to an error message when it could not. */
  open: (url: string) => Promise<string | null>;
  /** Stops the server process; used when keepAlive is off or on /artifacts stop. */
  stop: () => Promise<boolean>;
  now?: () => Date;
}

export type WaitOutcome =
  { kind: "event"; event: PageEvent } | { kind: "timeout" } | { kind: "aborted" };

export interface Published extends PublishResponse {
  url: string;
}

export class Host {
  readonly client: ArtifactClient;
  private readonly waiters = new Map<string, (event: PageEvent | null) => void>();
  private readonly capNotified = new Set<string>();
  private readonly wakes = new Map<string, number[]>();
  private readonly now: () => Date;
  private stream: { close(): void } | null = null;
  private started = false;

  constructor(private readonly deps: HostDeps) {
    this.now = deps.now ?? (() => new Date());
    this.client = new ArtifactClient(deps.locate, deps.session);
  }

  // ---- server ----------------------------------------------------------------

  /** Locates or starts the server and opens the event stream; idempotent. */
  async start(): Promise<Endpoint> {
    const endpoint = await this.client.connect();
    if (!this.started) {
      this.started = true;
      this.stream = this.client.subscribe(
        (event) => this.onEvent(event),
        () => void this.catchUp(),
      );
    }
    return endpoint;
  }

  get endpoint(): Endpoint | null {
    return this.client.connected;
  }

  /** Closes this session's stream; stops the server only when asked. Idempotent. */
  async shutdown(stopServer: boolean): Promise<void> {
    if (this.stream) this.stream.close();
    this.stream = null;
    this.started = false;
    for (const resolve of this.waiters.values()) resolve(null);
    this.waiters.clear();
    if (stopServer) await this.deps.stop();
  }

  url(slug: string, withToken = true): string {
    return this.client.pageUrl(slug, withToken);
  }

  /** Accepts a slug, a path, or a page URL and returns the slug when it exists. */
  async resolveSlug(ref: string | undefined): Promise<string | null> {
    const candidate = ref ? slugFromRef(ref) : null;
    if (!candidate) return null;
    return (await this.client.get(candidate)) ? candidate : null;
  }

  // ---- publish ---------------------------------------------------------------

  async publish(request: PublishRequest): Promise<Published> {
    await this.start();
    const result = await this.client.publish(request);
    return { ...result, url: this.client.pageUrl(result.manifest.slug) };
  }

  // ---- delivery --------------------------------------------------------------

  private onEvent(event: PageEvent): void {
    const waiter = this.waiters.get(event.slug);
    if (waiter && event.kind === "republish") {
      this.waiters.delete(event.slug);
      void this.client.ack(event.slug, [event.pendingId]).catch(() => {});
      waiter(event);
      return;
    }
    if (!event.watched) return;
    const cap = this.deps.config.wakesPerHour;
    if (this.wakesInLastHour(event.slug) >= cap) {
      if (!this.capNotified.has(event.slug)) {
        this.capNotified.add(event.slug);
        this.deps.notify(
          `Feedback is waiting on artifact "${event.title}": ${cap} wakes in the last hour is the cap. Read it with the artifact tool, or wait for the hour to pass.`,
          "warning",
        );
      }
      return;
    }
    this.capNotified.delete(event.slug);
    const url = this.client.pageUrl(event.slug, false);
    const content = envelope({ event, url });
    const details = {
      slug: event.slug,
      version: event.version,
      kind: event.kind,
      url,
      valid: event.validation?.ok ?? null,
    };
    if (this.deps.config.delivery === "wake") {
      this.deps.send(content, { triggerTurn: true, deliverAs: "followUp" }, details);
    } else {
      this.deps.send(content, { deliverAs: "nextTurn" }, details);
      this.deps.notify(
        `Artifact "${event.title}" sent feedback; it is delivered with your next prompt.`,
        "info",
      );
    }
    this.recordWake(event.slug);
    void this.client.ack(event.slug, [event.pendingId]).catch(() => {});
  }

  /** After a dropped stream, every event that stayed pending is delivered again. */
  private async catchUp(): Promise<void> {
    try {
      for (const event of await this.client.pending()) this.onEvent(event);
    } catch {
      // the next reconnect tries again
    }
  }

  /** Blocks until the page sends, the timeout passes, or the signal aborts. */
  waitForPage(slug: string, timeoutMs: number, signal?: AbortSignal): Promise<WaitOutcome> {
    return new Promise((resolve) => {
      let timer: ReturnType<typeof setTimeout> | null = null;
      const finish = (outcome: WaitOutcome) => {
        if (timer) clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
        if (this.waiters.get(slug) === onEvent) this.waiters.delete(slug);
        resolve(outcome);
      };
      const onEvent = (event: PageEvent | null) =>
        finish(event ? { kind: "event", event } : { kind: "aborted" });
      const onAbort = () => finish({ kind: "aborted" });
      this.waiters.set(slug, onEvent);
      if (signal?.aborted) return onAbort();
      signal?.addEventListener("abort", onAbort, { once: true });
      timer = setTimeout(() => finish({ kind: "timeout" }), timeoutMs);
    });
  }

  /** The summary session_start sends when pages sent things while nobody listened; acknowledges them. */
  async replayPending(): Promise<string | null> {
    const events = await this.client.pending();
    if (!events.length) return null;
    const bySlug = new Map<string, PageEvent[]>();
    for (const e of events) bySlug.set(e.slug, [...(bySlug.get(e.slug) ?? []), e]);
    const rows = [...bySlug.entries()].map(([slug, list]) => ({
      slug,
      title: list[0]?.title ?? slug,
      version: Math.max(...list.map((e) => e.version)),
      republishes: list.filter((e) => e.kind === "republish").length,
      comments: list.filter((e) => e.kind === "comment").length,
      url: this.client.pageUrl(slug, false),
    }));
    for (const [slug, list] of bySlug) {
      await this.client
        .ack(
          slug,
          list.map((e) => e.pendingId),
        )
        .catch(() => {});
    }
    return pendingSummary(rows);
  }

  wakesInLastHour(slug: string): number {
    const cutoff = this.now().getTime() - 3_600_000;
    const kept = (this.wakes.get(slug) ?? []).filter((t) => t > cutoff);
    this.wakes.set(slug, kept);
    return kept.length;
  }

  private recordWake(slug: string): void {
    this.wakes.set(slug, [...(this.wakes.get(slug) ?? []), this.now().getTime()]);
  }

  async open(slug: string): Promise<string | null> {
    return this.deps.open(this.url(slug));
  }
}
