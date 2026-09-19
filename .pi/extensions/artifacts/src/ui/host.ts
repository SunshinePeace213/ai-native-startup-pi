// The pi side's orchestrator: one per project per session. It locates the
// server, keeps the event stream open, turns each page event into what this
// session should see (the answer to a blocked `ask`, a wake, a notice, or a
// held count), keeps the footer strip current, and reads and writes
// artifacts only through the client; the server owns the store. What the
// session is told goes through `deps.send`, what the user is told through
// `deps.notify`; nothing here knows about Pi's UI or about Bun.

import { type Logger, silentLogger } from "../app/ports";
import { decideDelivery } from "../app/routing";
import { attachedNote, envelope, pendingSummary } from "../domain/envelope";
import { slugFromRef } from "../domain/protocol";
import type {
  Config,
  Manifest,
  PageEvent,
  PublishRequest,
  PublishResponse,
  StreamMessage,
} from "../domain/types";
import { ArtifactClient, type Endpoint, type Locator } from "../infra/client/client";
import { type Badge, badgeFrom, Strip } from "./strip";

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
  log?: Logger;
}

export type WaitOutcome =
  { kind: "event"; event: PageEvent } | { kind: "timeout" } | { kind: "aborted" };

export interface Published extends PublishResponse {
  url: string;
}

export class Host {
  readonly client: ArtifactClient;
  readonly strip = new Strip();
  private readonly waiters = new Map<string, (event: PageEvent | null) => void>();
  private readonly capNotified = new Set<string>();
  private readonly wakes = new Map<string, number[]>();
  /** The version this session last saw of each artifact: the stale guard on republish. */
  private readonly seen = new Map<string, number>();
  /** Source path → slug, so the same file_path republished carries the guard too. */
  private readonly slugByPath = new Map<string, string>();
  private readonly heldNoticed = new Set<string>();
  private readonly now: () => Date;
  private readonly log: Logger;
  private stream: { close(): void } | null = null;
  private started = false;

  constructor(private readonly deps: HostDeps) {
    this.now = deps.now ?? (() => new Date());
    this.log = deps.log ?? silentLogger;
    this.client = new ArtifactClient(deps.locate, deps.session);
  }

  get session(): string {
    return this.deps.session;
  }

  // ---- server ----------------------------------------------------------------

  /** Locates or starts the server and opens the event stream; idempotent. */
  async start(): Promise<Endpoint> {
    const endpoint = await this.client.connect();
    if (!this.started) {
      this.started = true;
      this.stream = this.client.subscribe(
        (message) => this.onMessage(message),
        () => void this.catchUp(),
      );
      this.log.info({ action: "connect", origin: endpoint.origin }, "connected");
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
    if (this.started && this.client.connected) await this.client.detach().catch(() => {});
    this.started = false;
    for (const resolve of this.waiters.values()) resolve(null);
    this.waiters.clear();
    if (stopServer) {
      const stopped = await this.deps.stop();
      this.log.info({ action: "stop", stopped }, "server stop requested");
    }
    this.log.info({ action: "disconnect" }, "disconnected");
  }

  /** Ends the server process and starts a fresh one; this session keeps its badges and versions. */
  async restart(): Promise<Endpoint> {
    await this.shutdown(true);
    this.client.forget();
    return this.start();
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

  async publish(request: Omit<PublishRequest, "session" | "baseVersion">): Promise<Published> {
    await this.start();
    const slug =
      request.update ?? (request.sourcePath ? this.slugByPath.get(request.sourcePath) : undefined);
    const baseVersion = slug ? this.seen.get(slug) : undefined;
    const result = await this.client.publish({ ...request, baseVersion });
    this.remember(result.manifest);
    this.log.info(
      {
        action: "publish",
        slug: result.manifest.slug,
        version: result.version,
        created: result.created,
      },
      "published",
    );
    return { ...result, url: this.client.pageUrl(result.manifest.slug) };
  }

  /** Records that this session now holds this version, and shows it in the strip. */
  remember(m: Manifest): void {
    this.seen.set(m.slug, m.current);
    if (m.sourcePath) this.slugByPath.set(m.sourcePath, m.slug);
    this.strip.upsert(badgeFrom(m, this.client.pageUrl(m.slug)));
  }

  /** The user's attach from /artifacts: adopt the page, show it, and tell the model with the next prompt. */
  async attach(slug: string): Promise<Manifest> {
    const m = await this.client.watch(slug, true);
    this.remember(m);
    const url = this.client.pageUrl(slug, false);
    this.deps.send(
      attachedNote(m.title, slug, m.current, url),
      { deliverAs: "nextTurn" },
      { slug, version: m.current, kind: "attach", url },
    );
    this.log.info({ action: "attach", slug }, "attached");
    return m;
  }

  forget(slug: string): void {
    this.seen.delete(slug);
    for (const [path, s] of this.slugByPath) if (s === slug) this.slugByPath.delete(path);
    this.strip.remove(slug);
  }

  /** The artifacts this session published or adopted, from the server. */
  async mine(): Promise<Manifest[]> {
    const all = await this.client.list();
    return all.filter(
      (m) => m.owner === this.deps.session || m.sessions.includes(this.deps.session),
    );
  }

  // ---- delivery --------------------------------------------------------------

  private onMessage(message: StreamMessage): void {
    if (message.kind === "held") {
      this.strip.setPending(message.slug, message.pending);
      if (!this.heldNoticed.has(message.slug)) {
        this.heldNoticed.add(message.slug);
        this.deps.notify(
          `Artifact "${message.title}" has a reply waiting for the session that published it; watch it here with the artifact tool to take it over.`,
          "info",
        );
      }
      return;
    }
    this.onEvent(message);
  }

  private onEvent(event: PageEvent): void {
    if (event.owner !== this.deps.session) return;
    const waiter = this.waiters.get(event.slug);
    const decision = decideDelivery({
      event,
      config: this.deps.config,
      waiting: waiter !== undefined,
      wakesThisHour: this.wakesInLastHour(event.slug),
    });
    this.log.info(
      { action: "deliver", slug: event.slug, kind: event.kind, decision: decision.kind },
      "page event",
    );
    if (decision.kind === "answer" && waiter) {
      this.waiters.delete(event.slug);
      void this.client.ack(event.slug, [event.pendingId]).catch(() => {});
      waiter(event);
      return;
    }
    if (decision.kind === "silent") return;
    if (decision.kind === "capped") {
      this.strip.setPending(event.slug, (this.strip.get(event.slug)?.pending ?? 0) + 1);
      if (!this.capNotified.has(event.slug)) {
        this.capNotified.add(event.slug);
        this.deps.notify(
          `Feedback is waiting on artifact "${event.title}": ${decision.cap} wakes in the last hour is the cap. Read it with the artifact tool, or wait for the hour to pass.`,
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
      response: event.response,
      kind: event.kind,
      url,
      valid: event.validation?.ok ?? null,
      gesture: event.gesture ?? null,
    };
    if (decision.kind === "wake") {
      this.deps.send(content, { triggerTurn: true, deliverAs: "followUp" }, details);
    } else {
      this.deps.send(content, { deliverAs: "nextTurn" }, details);
      this.deps.notify(
        `Artifact "${event.title}" sent feedback; it is delivered with your next prompt.`,
        "info",
      );
    }
    this.recordWake(event.slug);
    this.strip.setPending(event.slug, 0);
    void this.client.ack(event.slug, [event.pendingId]).catch(() => {});
  }

  /** After a dropped stream, every event that stayed pending for this session is delivered again. */
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

  /**
   * On session_start: this session's artifacts fill the strip; pending
   * events on them become one summary and are acknowledged; pending events
   * on other sessions' artifacts only count on their badges.
   */
  async replayPending(): Promise<string | null> {
    for (const m of await this.mine()) this.remember(m);
    const events = (await this.client.pending()).filter((e) => e.owner === this.deps.session);
    if (!events.length) return null;
    const bySlug = new Map<string, PageEvent[]>();
    for (const e of events) bySlug.set(e.slug, [...(bySlug.get(e.slug) ?? []), e]);
    const rows = [...bySlug.entries()].map(([slug, list]) => ({
      slug,
      title: list[0]?.title ?? slug,
      version: Math.max(...list.map((e) => e.version)),
      responses: list.filter((e) => e.kind === "response").length,
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
      this.strip.setPending(slug, 0);
    }
    this.log.info(
      { action: "replay", pages: rows.length, events: events.length },
      "pending replayed",
    );
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
    const error = await this.deps.open(this.url(slug));
    this.log.info({ action: "open", slug, error }, "browser");
    return error;
  }

  badges(): Badge[] {
    return this.strip.list();
  }
}
