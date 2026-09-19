// The artifact operations, run inside the server process: publish from the
// session, republish from the page, comments, watch state, deletion. The Core
// is the store's only writer. Every page event it records is handed to the
// listener the server installs, which routes it to a session's event stream;
// the event stays pending until a session acknowledges it.

import { randomBytes } from "node:crypto";

import { SLUG_RE } from "../shared/protocol";
import { declaredSchema, validateAnswers, validateQuestionsShape } from "../shared/schemas";
import { buildPage, extractTitle } from "./render/shell";
import { Store } from "./store";
import type {
  CommentThread,
  Island,
  Manifest,
  PageEvent,
  PagePublishBody,
  PublishRequest,
  PublishResponse,
  SourceKind,
  Validation,
} from "../shared/types";

export interface Outcome {
  status: number;
  body: Record<string, unknown>;
}

export type EventListener = (event: PageEvent, manifest: Manifest) => void;

const id = (prefix: string) => `${prefix}_${randomBytes(4).toString("hex")}`;

export class Core {
  private listener: EventListener = () => {};

  constructor(
    readonly store: Store,
    readonly prefix: string,
    readonly trashDir: string,
    private readonly now: () => Date = () => new Date(),
  ) {}

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

  island(slug: string, version?: number): Island | null {
    return this.store.readIsland(slug, version);
  }

  source(slug: string): { kind: SourceKind; source: string } | null {
    return this.store.readSource(slug);
  }

  page(slug: string, version?: number): string | null {
    return this.store.readVersion(slug, version);
  }

  comments(slug: string): CommentThread[] {
    return this.store.comments(slug);
  }

  /** Every pending event across the store, as full page events, oldest first. */
  pending(): PageEvent[] {
    const out: PageEvent[] = [];
    for (const m of this.store.list()) {
      for (const p of m.pending) {
        out.push({
          pendingId: p.id,
          slug: m.slug,
          title: m.title,
          watched: m.watched,
          kind: p.kind,
          version: p.version,
          previousVersion: Math.max(0, p.version - 1),
          at: p.at,
          island: p.kind === "republish" ? this.store.readIsland(m.slug, p.version) : null,
          validation:
            p.kind === "republish" ? this.check(this.store.readIsland(m.slug, p.version)) : null,
          thread: p.threadId
            ? this.store.comments(m.slug).find((t) => t.id === p.threadId)
            : undefined,
        });
      }
    }
    return out.sort((a, b) => (a.at < b.at ? -1 : 1));
  }

  // ---- session-side operations ----------------------------------------------

  publish(input: PublishRequest): PublishResponse {
    const existing = input.update ? this.store.get(input.update) : null;
    if (input.update && !existing) throw new Error(`no artifact "${input.update}" to update`);
    const nextVersion = existing ? existing.current + 1 : 1;
    const title =
      input.title?.trim() ||
      titleFrom(input.island) ||
      extractTitle(input.source, input.kind) ||
      existing?.title ||
      "artifact";
    let slug: string;
    if (existing) slug = existing.slug;
    else if (input.slug) {
      const wanted = input.slug.trim().toLowerCase();
      if (!SLUG_RE.test(wanted)) {
        throw new Error(
          `slug "${input.slug}" must be lowercase letters, digits, and hyphens, starting with a letter or digit`,
        );
      }
      if (this.store.exists(wanted)) {
        throw new Error(
          `an artifact already lives at ${this.prefix}/${wanted}; pass url "${wanted}" to update it, or choose another slug`,
        );
      }
      slug = wanted;
    } else slug = this.store.freeSlug(title);
    const page = buildPage({
      source: input.source,
      kind: input.kind,
      island: input.island,
      title,
      icon: input.icon ?? existing?.icon,
      slug,
      version: nextVersion,
      endpoint: `${this.prefix}/${slug}`,
    });
    const validation = this.check(page.island);
    if (validation && !validation.ok && validateQuestionsShape(page.island).length) {
      throw new Error(`the questions island is malformed: ${validation.errors.join("; ")}`);
    }
    let manifest: Manifest;
    if (existing) {
      this.store.addVersion(slug, {
        html: page.html,
        island: page.island,
        by: "agent",
        source: input.source,
        kind: input.kind,
        title,
        description: input.description,
        icon: input.icon,
        note: input.note,
        owner: input.owner,
      });
      manifest = this.store.setWatched(slug, true);
    } else {
      manifest = this.store.create({
        slug,
        title,
        description: input.description,
        icon: input.icon,
        kind: input.kind,
        source: input.source,
        html: page.html,
        island: page.island,
        owner: input.owner,
      });
    }
    return { manifest, version: nextVersion, island: page.island, validation, created: !existing };
  }

  setWatched(slug: string, watched: boolean, owner?: string): Manifest {
    return this.store.setWatched(slug, watched, owner);
  }

  /** A session acknowledges events it delivered; it becomes the artifact's owner. */
  ack(slug: string, ids: string[], owner?: string): number {
    const taken = this.store.takePending(slug, ids);
    if (owner) this.store.setOwner(slug, owner);
    return taken.length;
  }

  reply(slug: string, threadId: string, text: string): CommentThread {
    const threads = this.store.comments(slug);
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) throw new Error(`no thread ${threadId} on "${slug}"`);
    if (!thread.toAgent) {
      throw new Error(
        `thread ${threadId} was not sent to the agent; ask the user to send it from the page before replying`,
      );
    }
    thread.messages.push({ id: id("c"), at: this.now().toISOString(), author: "agent", text });
    this.store.saveComments(slug, threads);
    return thread;
  }

  resolveThread(slug: string, threadId: string): CommentThread {
    const threads = this.store.comments(slug);
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) throw new Error(`no thread ${threadId} on "${slug}"`);
    thread.resolved = true;
    this.store.saveComments(slug, threads);
    return thread;
  }

  remove(slug: string): string {
    return this.store.remove(slug, this.trashDir);
  }

  // ---- page-side operations -------------------------------------------------

  republishFromPage(slug: string, body: PagePublishBody): Outcome {
    const manifest = this.store.get(slug);
    if (!manifest) return { status: 404, body: { error: "no such artifact" } };
    if (body.base_version !== manifest.current) {
      return { status: 409, body: { error: "stale", current: manifest.current } };
    }
    const island = body.data;
    const validation = this.check(island);
    if (validation && !validation.ok) {
      return { status: 400, body: { error: "island out of contract", errors: validation.errors } };
    }
    const src = this.store.readSource(slug);
    if (!src) return { status: 500, body: { error: "the artifact's source is missing" } };
    const nextVersion = manifest.current + 1;
    let html: string;
    try {
      html = buildPage({
        source: src.source,
        kind: src.kind,
        island,
        title: manifest.title,
        icon: manifest.icon,
        slug,
        version: nextVersion,
        endpoint: `${this.prefix}/${slug}`,
      }).html;
    } catch (e) {
      return { status: 400, body: { error: (e as Error).message } };
    }
    this.store.addVersion(slug, { html, island, by: "page" });
    const at = this.now().toISOString();
    const pendingId = id("e");
    this.store.pushPending(slug, { id: pendingId, at, kind: "republish", version: nextVersion });
    const updated = this.store.get(slug) as Manifest;
    this.listener(
      {
        pendingId,
        slug,
        title: updated.title,
        watched: updated.watched,
        kind: "republish",
        version: nextVersion,
        previousVersion: manifest.current,
        at,
        island,
        validation,
      },
      updated,
    );
    return { status: 200, body: { ok: true, version: nextVersion } };
  }

  addComment(
    slug: string,
    body: { text: string; toAgent: boolean; anchor?: string; threadId?: string },
  ): Outcome {
    const manifest = this.store.get(slug);
    if (!manifest) return { status: 404, body: { error: "no such artifact" } };
    const threads = this.store.comments(slug);
    const at = this.now().toISOString();
    const message = { id: id("c"), at, author: "user" as const, text: body.text };
    let thread = body.threadId ? threads.find((t) => t.id === body.threadId) : undefined;
    if (body.threadId && !thread) return { status: 404, body: { error: "no such thread" } };
    if (thread) {
      thread.messages.push(message);
      thread.resolved = false;
      if (body.toAgent) thread.toAgent = true;
    } else {
      thread = {
        id: id("t"),
        createdAt: at,
        anchor: body.anchor,
        toAgent: body.toAgent,
        resolved: false,
        messages: [message],
      };
      threads.push(thread);
    }
    this.store.saveComments(slug, threads);
    if (body.toAgent) {
      const pendingId = id("e");
      this.store.pushPending(slug, {
        id: pendingId,
        at,
        kind: "comment",
        version: manifest.current,
        threadId: thread.id,
      });
      this.listener(
        {
          pendingId,
          slug,
          title: manifest.title,
          watched: manifest.watched,
          kind: "comment",
          version: manifest.current,
          previousVersion: manifest.current,
          at,
          island: null,
          validation: null,
          thread,
        },
        this.store.get(slug) as Manifest,
      );
    }
    return { status: 200, body: { ok: true, thread } };
  }

  private check(island: Island | null): Validation | null {
    if (!island) return null;
    if (declaredSchema(island) === "questions/v1") return validateAnswers(island);
    return null;
  }
}

function titleFrom(island: Island | null | undefined): string | null {
  if (island && typeof island.title === "string" && island.title.trim()) return island.title.trim();
  return null;
}
