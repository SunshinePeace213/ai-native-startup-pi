// The artifact operations, run inside the server process over the store
// port: publish from a session, respond from the page, comments, watch and
// pin state, diagnostics, deletion, and the retention sweep. The Core is the
// store's only writer. Every page event it records is handed to the listener
// the server installs; the event stays pending until a session acknowledges
// it. No filesystem, no network: the ports do that.

import { PREFIX, SLUG_RE } from "../domain/protocol";
import { expiredLogDates, isExpired } from "../domain/retention";
import { declaredSchema, validateAnswers, validateQuestionsShape } from "../domain/schemas";
import {
  isStale,
  latestResponse,
  mergedIsland,
  nextResponse,
  nextVersion,
} from "../domain/versioning";
import type {
  CommentThread,
  Diagnostic,
  Island,
  Manifest,
  PageEvent,
  PageRespondBody,
  PublishRequest,
  PublishResponse,
  SourceKind,
  Validation,
} from "../domain/types";
import { type ArtifactStore, type Logger, type Renderer, silentLogger } from "./ports";

export interface Outcome {
  status: number;
  body: Record<string, unknown>;
}

export type EventListener = (event: PageEvent, manifest: Manifest) => void;

export class PublishError extends Error {
  constructor(
    message: string,
    readonly status = 400,
    readonly extra: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

export interface CoreOptions {
  now?: () => Date;
  id?: (prefix: string) => string;
  log?: Logger;
  retentionDays?: number;
}

let counter = 0;
const defaultId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${(counter++).toString(36)}`;

export class Core {
  private listener: EventListener = () => {};
  private readonly now: () => Date;
  private readonly id: (prefix: string) => string;
  private readonly log: Logger;
  private readonly retentionDays: number;

  constructor(
    readonly store: ArtifactStore,
    readonly renderer: Renderer,
    options: CoreOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
    this.id = options.id ?? defaultId;
    this.log = options.log ?? silentLogger;
    this.retentionDays = options.retentionDays ?? 14;
  }

  onEvent(listener: EventListener): void {
    this.listener = listener;
  }

  // ---- reads ---------------------------------------------------------------

  list(): Manifest[] {
    return this.store.list();
  }

  get(slug: string): Manifest | null {
    return this.store.get(slug);
  }

  island(slug: string): Island | null {
    return this.store.readIsland(slug);
  }

  source(slug: string): { kind: SourceKind; source: string } | null {
    return this.store.readSource(slug);
  }

  page(slug: string, version?: number): string | null {
    return this.store.readPage(slug, version);
  }

  comments(slug: string): CommentThread[] {
    return this.store.comments(slug);
  }

  diagnostics(slug: string): Diagnostic[] {
    return this.store.diagnostics(slug);
  }

  /** Every pending event across the store, as full page events, oldest first. */
  pending(): PageEvent[] {
    const out: PageEvent[] = [];
    for (const m of this.store.list()) {
      for (const p of m.pending)
        out.push(this.toEvent(m, p.id, p.kind, p.version, p.response, p.threadId, p.at));
    }
    return out.sort((a, b) => (a.at < b.at ? -1 : 1));
  }

  // ---- session-side operations ----------------------------------------------

  publish(input: PublishRequest): PublishResponse {
    let existing = input.update ? this.store.get(input.update) : null;
    if (input.update && !existing)
      throw new PublishError(`no artifact "${input.update}" to update`, 404);
    // Claude Code's rule: the same source file republishes to the same URL.
    if (!existing && !input.slug && input.sourcePath) {
      existing = this.store.findBySourcePath(input.sourcePath);
    }
    if (
      existing &&
      input.baseVersion !== undefined &&
      isStale(input.baseVersion, existing.current)
    ) {
      throw new PublishError(
        `v${existing.current} of "${existing.slug}" was published after v${input.baseVersion}, the version you have; read it again and merge your change onto it`,
        409,
        { current: existing.current },
      );
    }
    const version = nextVersion(existing);
    const title =
      input.title?.trim() ||
      titleFrom(input.island) ||
      this.renderer.title(input.source, input.kind) ||
      existing?.title ||
      "artifact";
    const slug = existing ? existing.slug : this.newSlug(input.slug, title);
    const page = this.renderer.build({
      source: input.source,
      kind: input.kind,
      island: input.island,
      title,
      icon: input.icon ?? existing?.icon,
      slug,
      version,
      endpoint: `${PREFIX}/${slug}`,
    });
    const validation = this.check(page.island);
    if (validation && !validation.ok && validateQuestionsShape(page.island).length) {
      throw new PublishError(`the questions island is malformed: ${validation.errors.join("; ")}`);
    }
    let manifest: Manifest;
    if (existing) {
      this.store.addVersion(slug, {
        html: page.html,
        island: page.island,
        source: input.source,
        kind: input.kind,
        sourcePath: input.sourcePath,
        title,
        description: input.description,
        icon: input.icon,
        note: input.note,
        session: input.session,
      });
      manifest = this.store.setWatched(slug, true, input.session);
    } else {
      manifest = this.store.create({
        slug,
        title,
        description: input.description,
        icon: input.icon,
        kind: input.kind,
        sourcePath: input.sourcePath,
        source: input.source,
        html: page.html,
        island: page.island,
        session: input.session,
      });
    }
    this.log.info(
      {
        action: "publish",
        slug,
        version,
        session: input.session,
        created: !existing,
        bytes: page.html.length,
      },
      existing ? "republished" : "published",
    );
    return { manifest, version, island: page.island, validation, created: !existing };
  }

  setWatched(slug: string, watched: boolean, session?: string): Manifest {
    const m = this.store.setWatched(slug, watched, session);
    this.log.info({ action: watched ? "watch" : "unwatch", slug, session }, "watch changed");
    return m;
  }

  setPinned(slug: string, pinned: boolean): Manifest {
    const m = this.store.setPinned(slug, pinned);
    this.log.info({ action: pinned ? "pin" : "unpin", slug }, "pin changed");
    return m;
  }

  /** A session acknowledges events it delivered. Ownership does not move. */
  ack(slug: string, ids: string[]): number {
    const taken = this.store.takePending(slug, ids);
    if (taken.length) this.log.info({ action: "ack", slug, count: taken.length }, "acknowledged");
    return taken.length;
  }

  reply(slug: string, threadId: string, text: string): CommentThread {
    const threads = this.store.comments(slug);
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) throw new PublishError(`no thread ${threadId} on "${slug}"`, 404);
    if (!thread.toAgent) {
      throw new PublishError(
        `thread ${threadId} was not sent to the agent; ask the user to send it from the page before replying`,
      );
    }
    thread.messages.push({ id: this.id("c"), at: this.now().toISOString(), author: "agent", text });
    this.store.saveComments(slug, threads);
    this.store.touch(slug);
    this.log.info({ action: "reply", slug, threadId }, "replied");
    return thread;
  }

  resolveThread(slug: string, threadId: string): CommentThread {
    const threads = this.store.comments(slug);
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) throw new PublishError(`no thread ${threadId} on "${slug}"`, 404);
    thread.resolved = true;
    this.store.saveComments(slug, threads);
    this.log.info({ action: "resolve", slug, threadId }, "resolved");
    return thread;
  }

  remove(slug: string): string {
    const dest = this.store.remove(slug);
    this.log.info({ action: "delete", slug, dest }, "moved to trash");
    return dest;
  }

  /** Retention: expired artifacts go to the trash, expired log folders are removed. */
  sweep(): { artifacts: string[]; logs: string[] } {
    const now = this.now();
    const artifacts: string[] = [];
    for (const m of this.store.list()) {
      if (!isExpired(m, now, this.retentionDays)) continue;
      artifacts.push(m.slug);
      const dest = this.store.remove(m.slug);
      this.log.info(
        { action: "sweep", slug: m.slug, dest, lastActivityAt: m.lastActivityAt },
        "expired artifact trashed",
      );
    }
    const logs = expiredLogDates(this.store.logDates(), now, this.retentionDays);
    for (const name of logs) {
      this.store.removeLogDate(name);
      this.log.info({ action: "sweep", logs: name }, "expired logs removed");
    }
    return { artifacts, logs };
  }

  // ---- page-side operations -------------------------------------------------

  respondFromPage(slug: string, body: PageRespondBody): Outcome {
    const manifest = this.store.get(slug);
    if (!manifest) return { status: 404, body: { error: "no such artifact" } };
    if (isStale(body.base_version, manifest.current)) {
      return { status: 409, body: { error: "stale", current: manifest.current } };
    }
    const island = body.data;
    const validation = this.check(island);
    if (validation && !validation.ok) {
      return { status: 400, body: { error: "island out of contract", errors: validation.errors } };
    }
    const src = this.store.readSource(slug);
    if (!src) return { status: 500, body: { error: "the artifact's source is missing" } };
    let html: string;
    try {
      html = this.renderer.build({
        source: src.source,
        kind: src.kind,
        island: mergedIsland(this.store.readVersionIsland(slug, manifest.current), island),
        title: manifest.title,
        icon: manifest.icon,
        slug,
        version: manifest.current,
        endpoint: `${PREFIX}/${slug}`,
      }).html;
    } catch (e) {
      return { status: 400, body: { error: (e as Error).message } };
    }
    const gesture = body.gesture === true;
    const record = this.store.addResponse(slug, { island, html, gesture });
    const pendingId = this.id("e");
    this.store.pushPending(slug, {
      id: pendingId,
      at: record.at,
      kind: "response",
      version: record.version,
      response: record.r,
    });
    const updated = this.store.get(slug) as Manifest;
    this.log.info(
      {
        action: "respond",
        slug,
        version: record.version,
        response: record.r,
        gesture,
        valid: validation?.ok ?? null,
      },
      "page responded",
    );
    this.listener(
      this.toEvent(updated, pendingId, "response", record.version, record.r, undefined, record.at),
      updated,
    );
    return { status: 200, body: { ok: true, version: record.version, response: record.r } };
  }

  addComment(
    slug: string,
    body: { text: string; toAgent: boolean; anchor?: string; threadId?: string },
  ): Outcome {
    const manifest = this.store.get(slug);
    if (!manifest) return { status: 404, body: { error: "no such artifact" } };
    const threads = this.store.comments(slug);
    const at = this.now().toISOString();
    const message = { id: this.id("c"), at, author: "user" as const, text: body.text };
    let thread = body.threadId ? threads.find((t) => t.id === body.threadId) : undefined;
    if (body.threadId && !thread) return { status: 404, body: { error: "no such thread" } };
    if (thread) {
      thread.messages.push(message);
      thread.resolved = false;
      if (body.toAgent) thread.toAgent = true;
    } else {
      thread = {
        id: this.id("t"),
        createdAt: at,
        anchor: body.anchor,
        toAgent: body.toAgent,
        resolved: false,
        messages: [message],
      };
      threads.push(thread);
    }
    this.store.saveComments(slug, threads);
    this.store.touch(slug);
    this.log.info(
      { action: "comment", slug, threadId: thread.id, toAgent: body.toAgent },
      "comment added",
    );
    if (body.toAgent) {
      const pendingId = this.id("e");
      this.store.pushPending(slug, {
        id: pendingId,
        at,
        kind: "comment",
        version: manifest.current,
        threadId: thread.id,
      });
      const updated = this.store.get(slug) as Manifest;
      this.listener(
        this.toEvent(updated, pendingId, "comment", manifest.current, undefined, thread.id, at),
        updated,
      );
    }
    return { status: 200, body: { ok: true, thread } };
  }

  addDiagnostics(
    slug: string,
    version: number,
    rows: Array<{ level: string; message: string }>,
  ): Outcome {
    if (!this.store.get(slug)) return { status: 404, body: { error: "no such artifact" } };
    const at = this.now().toISOString();
    const kept: Diagnostic[] = rows.slice(0, 50).map((r) => ({
      at,
      version,
      level: r.level === "error" ? "error" : r.level === "warn" ? "warn" : "log",
      message: String(r.message).slice(0, 2000),
    }));
    this.store.addDiagnostics(slug, kept);
    for (const d of kept)
      this.log.info(
        { action: "diagnostic", slug, version, level: d.level, message: d.message },
        "page diagnostic",
      );
    return { status: 200, body: { ok: true, kept: kept.length } };
  }

  /** A view counts as activity for retention. */
  viewed(slug: string): void {
    this.store.touch(slug);
  }

  // ---- helpers ---------------------------------------------------------------

  private newSlug(wanted: string | undefined, title: string): string {
    if (!wanted) return this.store.freeSlug(title);
    const slug = wanted.trim().toLowerCase();
    if (!SLUG_RE.test(slug)) {
      throw new PublishError(
        `slug "${wanted}" must be lowercase letters, digits, and hyphens, starting with a letter or digit`,
      );
    }
    if (this.store.exists(slug)) {
      throw new PublishError(
        `an artifact already lives at ${PREFIX}/${slug}; pass url "${slug}" to update it, or choose another slug`,
      );
    }
    return slug;
  }

  private toEvent(
    m: Manifest,
    pendingId: string,
    kind: "response" | "comment",
    version: number,
    response: number | undefined,
    threadId: string | undefined,
    at: string,
  ): PageEvent {
    const island =
      kind === "response" && response !== undefined
        ? mergedIsland(
            this.store.readVersionIsland(m.slug, version),
            this.store.readResponseIsland(m.slug, version, response),
          )
        : null;
    const record =
      kind === "response" && response !== undefined
        ? m.responses.find((r) => r.version === version && r.r === response)
        : undefined;
    return {
      pendingId,
      slug: m.slug,
      title: m.title,
      owner: m.owner,
      watched: m.watched,
      kind,
      version,
      response,
      gesture: record?.gesture,
      at,
      island,
      validation: kind === "response" ? this.check(island) : null,
      thread: threadId ? this.store.comments(m.slug).find((t) => t.id === threadId) : undefined,
    };
  }

  private check(island: Island | null): Validation | null {
    if (!island) return null;
    if (declaredSchema(island) === "questions/v1") return validateAnswers(island);
    return null;
  }
}

export { latestResponse };

function titleFrom(island: Island | null | undefined): string | null {
  if (island && typeof island.title === "string" && island.title.trim()) return island.title.trim();
  return null;
}
