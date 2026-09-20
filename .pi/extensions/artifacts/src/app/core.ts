// The artifact operations, run inside the server process over the store
// port: publish from a session — the page, its supporting files, and the
// capabilities it declares, or an artifact made from a type, whose page and
// files stay read-only — the viewer's own publish from the page, respond from
// the page, the page's database and the assets it uploads, comments, watch
// and pin state, rename and duplicate, diagnostics, deletion, and the
// retention sweep. The Core is the store's only writer, and whatever refuses
// a publish is decided before the first write. A version's document and
// files are written once and never again: a reply is stored beside it, and
// the island a page works with reaches it through the viewer shell. Every
// page event the Core records is handed to the listener the server installs;
// the event stays pending until a session acknowledges it. No filesystem, no
// network: the ports do that.

import {
  acceptUpload,
  assetIdOf,
  type AssetRecord,
  type AssetRefusal,
  assetUrl,
  assetUsage,
  isAssetRefusal,
} from "../domain/assets";
import { declarationProblem, nextDeclaration, servedCapabilities } from "../domain/capabilities";
import {
  acquireLease,
  applyWrites,
  type DbRefusal,
  type DbWrite,
  isDbRefusal,
  readDocument,
  runQuery,
} from "../domain/db";
import {
  type ChangedFile,
  changedFiles,
  failedPreconditions,
  type FileRefusal,
  isRefusal,
  isTextType,
  planFiles,
  RESERVED_PATHS,
} from "../domain/files";
import { ICON_RE, ICON_RULE } from "../domain/icons";
import { PREFIX, SLUG_RE, slugForSourcePath } from "../domain/protocol";
import { expiredLogDates, isExpired } from "../domain/retention";
import { declaredSchema, validateAnswers, validateQuestionsShape } from "../domain/schemas";
import {
  isStale,
  latestResponse,
  mergedIsland,
  nextResponse,
  nextVersion,
} from "../domain/versioning";
import {
  type CommentThread,
  type Diagnostic,
  type FileMap,
  type FileRecord,
  type FrameData,
  type Island,
  type Manifest,
  MAX_LABEL,
  MAX_TITLE,
  type PageEvent,
  type PageRespondBody,
  type PublishRequest,
  type PublishResponse,
  type SourceKind,
  type Validation,
} from "../domain/types";
import {
  type ArtifactStore,
  type FileContent,
  type Logger,
  PageTooLarge,
  type RenderedPage,
  type Renderer,
  silentLogger,
  type VersionFiles,
  type VersionInput,
} from "./ports";

export interface Outcome {
  status: number;
  body: Record<string, unknown>;
}

/** A publish as the core takes it: the request, its supporting files already decoded to bytes. */
export type PublishInput = Omit<PublishRequest, "files"> & {
  files?: Record<string, FileContent | null>;
};

/** One supporting file of a version, with its bytes. */
export interface StoredFile {
  path: string;
  record: FileRecord;
  bytes: Uint8Array;
}

/**
 * One entry of a page's files publish: content to store — `text` when the page
 * sent a string, which needs a text type — or a path to delete. `ifMatch` pins
 * the write to the sha256 of the copy it replaces; null when it creates the file.
 */
export type SelfFile =
  | (FileContent & { text: boolean; ifMatch?: string | null })
  | { delete: true; ifMatch?: string | null };

/** What a page hands its `artifact` capability: the version its view runs, and a whole page or the files that changed. */
export interface SelfPublishInput {
  baseVersion: number;
  html?: string;
  files?: Record<string, SelfFile>;
}

/** The version a page's publish makes, and what its result reports beside the version. */
interface SelfVersion {
  version: VersionInput;
  /** The paths the call wrote, when it pinned any: the result names their stored hashes. */
  pinnedWrites?: string[];
  changed?: ChangedFile[];
}

/**
 * One operation on an artifact's database, as its page or a session asks it.
 * The fields are whatever arrived: the rules decide what they may be.
 */
export type DbRequest =
  | { op: "get"; path: unknown }
  | { op: "query"; path: unknown; query: unknown }
  | { op: "write"; writes: DbWrite[]; batch: boolean }
  | { op: "acquire"; path: unknown; holder: unknown; ttlMs?: unknown; data?: unknown };

/** An outcome, and the documents it changed: what every open view is then told. */
export interface DbOutcome extends Outcome {
  changed: string[];
}

/** One call of a page's `assets` capability; an upload's fields are whatever arrived. */
export type AssetsRequest =
  | { op: "upload"; bytes: Uint8Array | null; contentType: unknown }
  | { op: "list" }
  | { op: "delete"; ref: unknown };

/** One stored asset, with its bytes. */
export interface StoredAsset {
  record: AssetRecord;
  bytes: Uint8Array;
}

const ARTIFACT = "artifact";
const ASSETS = "assets";
const ASSET_STATUS: Record<AssetRefusal["code"], number> = {
  invalid_request: 400,
  too_large: 413,
  unsupported_type: 415,
  quota_or_state: 507,
};
const DB = "db";
/** The page's own published path: the first of the paths an artifact made from a type keeps read-only. */
const PAGE_PATH = RESERVED_PATHS[0] as string;
const FILE_STATUS: Record<FileRefusal["code"], number> = {
  invalid_content: 400,
  too_large: 413,
  read_only_path: 403,
};
const DB_STATUS: Record<DbRefusal["code"], number> = {
  invalid_argument: 400,
  conflict: 409,
  quota_exceeded: 413,
};
/** Claude Code's rule for a page publishing itself: the whole document, doctype first. */
const DOCTYPE_RE = /^﻿?\s*<!doctype\s+html/i;

const refused = (status: number, code: string, message: string, detail = {}): Outcome => ({
  status,
  body: { code, message, ...detail },
});

/** Claude Code's `conflict`: someone published first, and `live` names what every view is moving to. */
const overtaken = (manifest: Manifest, detail = {}): Outcome =>
  refused(409, "conflict", `v${manifest.current} was published first; the view moves to it`, {
    live: String(manifest.current),
    ...detail,
  });

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

  /** One version's stored document. */
  page(slug: string, version: number): string | null {
    return this.store.readPage(slug, version);
  }

  /** The supporting files of one version; the current one when none is named. Null when there is no such version. */
  files(slug: string, version?: number): { version: number; files: FileMap } | null {
    const manifest = this.store.get(slug);
    const n = version ?? manifest?.current;
    if (!manifest || !manifest.versions.some((v) => v.n === n)) return null;
    return { version: n as number, files: this.store.readFiles(slug, n as number) };
  }

  /** One supporting file of a version, by its published path. */
  file(slug: string, version: number, path: string): StoredFile | null {
    const files = this.files(slug, version)?.files ?? {};
    const record = Object.hasOwn(files, path) ? (files[path] as FileRecord) : null;
    const bytes = record && this.store.readBlob(slug, record.sha256);
    return record && bytes ? { path, record, bytes } : null;
  }

  /** One asset the page uploaded, by its id: the artifact's, whatever the version. */
  asset(slug: string, id: string): StoredAsset | null {
    const record = this.store.listAssets(slug).find((a) => a.id === id);
    const bytes = record && this.store.readAsset(slug, id);
    return record && bytes ? { record, bytes } : null;
  }

  /** What the shell hands a frame showing `version`: its island with the newest reply over it, and its capabilities. */
  frameData(slug: string, version: number): FrameData | null {
    const manifest = this.store.get(slug);
    const record = manifest?.versions.find((v) => v.n === version);
    if (!manifest || !record) return null;
    const latest = latestResponse(manifest, version);
    const island = mergedIsland(
      this.store.readVersionIsland(slug, version),
      latest ? this.store.readResponseIsland(slug, version, latest.r) : null,
    );
    // A version is served what it declared itself, whatever the artifact declares by now.
    return {
      version,
      island,
      caps: servedCapabilities(record.capabilities ?? {}, island !== null),
    };
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

  /** What /api/status reports of the store: how long an idle page is kept, and what it holds. */
  status(): {
    retentionDays: number;
    artifacts: { total: number; pinned: number; pending: number };
  } {
    const all = this.store.list();
    return {
      retentionDays: this.retentionDays,
      artifacts: {
        total: all.length,
        pinned: all.filter((m) => m.pinned).length,
        pending: all.reduce((n, m) => n + m.pending.length, 0),
      },
    };
  }

  // ---- session-side operations ----------------------------------------------

  publish(input: PublishInput): PublishResponse {
    let existing = input.update ? this.store.get(input.update) : null;
    if (input.update && !existing)
      throw new PublishError(`no artifact "${input.update}" to update`, 404);
    // The artifact is its folder: a page authored inside the store names its slug.
    const folderSlug = input.sourcePath ? slugForSourcePath(input.sourcePath) : null;
    if (folderSlug && input.slug && input.slug.trim().toLowerCase() !== folderSlug) {
      throw new PublishError(
        `${input.sourcePath} is in the folder of "${folderSlug}", so it publishes there; drop slug "${input.slug}" or write the page in that slug's folder`,
      );
    }
    // Claude Code's rule: the same source file republishes to the same URL,
    // for a session that published or attached it; any other gets its own.
    if (!existing && input.sourcePath && (!input.slug || folderSlug)) {
      existing = this.store.findBySourcePath(input.sourcePath, input.session);
    }
    if (
      existing &&
      input.baseVersion !== undefined &&
      isStale(input.baseVersion, existing.current)
    ) {
      throw new PublishError(
        `v${existing.current} of "${existing.slug}" was published after v${input.baseVersion}, the version you have; read it again and merge your change onto it (force overwrites it, and only when the user said to discard v${existing.current})`,
        409,
        { current: existing.current },
      );
    }
    if (input.icon !== undefined && !ICON_RE.test(input.icon)) {
      throw new PublishError(`icon "${input.icon}" is refused: ${ICON_RULE}`);
    }
    const label = input.label?.trim() || undefined;
    if (label && label.length > MAX_LABEL) {
      throw new PublishError(
        `label is ${label.length} characters; a version label is a few words, at most ${MAX_LABEL}`,
      );
    }
    // Everything that can refuse the publish is decided before the first write.
    const undeclarable =
      input.capabilities === undefined ? null : declarationProblem(input.capabilities);
    if (undeclarable) throw new PublishError(undeclarable);
    const capabilities = nextDeclaration(existing?.capabilities, input.capabilities);
    if (input.type && existing) {
      throw new PublishError(
        `a type makes a new artifact; "${existing.slug}" exists — drop type, or drop url to make another`,
      );
    }
    const files = this.versionFiles(existing, input.files ?? {});
    if (isRefusal(files))
      throw new PublishError(files.message, FILE_STATUS[files.code], { code: files.code });
    const version = nextVersion(existing);
    const page = this.sessionPage(existing, input);
    // An artifact made from a type is named by the session, not by the type's own <title>.
    const named = input.type ? input.title?.replace(/\s+/g, " ").trim() : undefined;
    if (input.type && !named) throw new PublishError("an artifact made from a type needs a title");
    const title = input.type
      ? (named as string).slice(0, MAX_TITLE)
      : input.source === undefined
        ? undefined
        : this.titleFor({ ...input, source: page.source, kind: page.kind }, page.island, existing);
    const slug = existing
      ? existing.slug
      : this.newSlug(input.slug ?? folderSlug ?? undefined, title as string);
    const validation = this.check(page.island);
    if (validation && !validation.ok && validateQuestionsShape(page.island).length) {
      throw new PublishError(`the questions island is malformed: ${validation.errors.join("; ")}`);
    }
    let manifest: Manifest;
    if (existing) {
      this.store.addVersion(slug, {
        html: page.html,
        island: page.island,
        source: page.source,
        kind: page.kind,
        sourcePath: input.sourcePath,
        title,
        description: input.description,
        icon: input.icon,
        label,
        files,
        capabilities,
        session: input.session,
      });
      manifest = this.store.setWatched(slug, true, input.session);
    } else {
      manifest = this.store.create({
        slug,
        title: title as string,
        description: input.description,
        icon: input.icon,
        kind: page.kind,
        sourcePath: input.sourcePath,
        source: page.source,
        html: page.html,
        island: page.island,
        label,
        files,
        capabilities,
        type: input.type && { name: input.type.name, paths: [PAGE_PATH, ...input.type.paths] },
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
        files: Object.keys(files.kept).length + Object.keys(files.written).length,
      },
      existing ? "republished" : "published",
    );
    return {
      manifest,
      version,
      island: page.island,
      validation,
      created: !existing,
      files: this.store.readFiles(slug, version),
    };
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

  /** The user's rename from the viewer shell; a later publish keeps it. */
  rename(slug: string, title: string): Manifest {
    const clean = title.replace(/\s+/g, " ").trim();
    if (!clean) throw new PublishError("a title cannot be empty");
    if (clean.length > MAX_TITLE)
      throw new PublishError(`a title is at most ${MAX_TITLE} characters`);
    const m = this.store.rename(slug, clean);
    this.log.info({ action: "rename", slug }, "renamed");
    return m;
  }

  /**
   * A copy at a slug of its own: v1 is the source's current document, its
   * supporting files, and the island a reader sees now, and it starts with
   * the source's database and uploaded assets as they stand. It belongs to the
   * caller, or — copied from the viewer shell, where no session is acting — to
   * the source's owner.
   */
  duplicate(slug: string, session?: string): Manifest {
    const from = this.store.get(slug);
    const src = from && this.store.readSource(slug);
    const html = from && this.store.readPage(slug, from.current);
    if (!from || !src || html === null)
      throw new PublishError(`no artifact "${slug}" to duplicate`, 404);
    const title = `Copy of ${from.title}`.slice(0, MAX_TITLE);
    // Blobs are an artifact's own, so the copy stores the bytes again.
    const written: VersionFiles["written"] = {};
    for (const [path, record] of Object.entries(this.store.readFiles(slug, from.current))) {
      const bytes = this.store.readBlob(slug, record.sha256);
      if (bytes) written[path] = { bytes, contentType: record.contentType };
    }
    const copy = this.store.create({
      slug: this.store.freeSlug(title),
      title,
      description: from.description,
      icon: from.icon,
      kind: src.kind,
      source: src.source,
      html,
      island: this.store.readIsland(slug),
      files: { kept: {}, written },
      capabilities: from.capabilities,
      type: from.type,
      session: session ?? from.owner,
    });
    const database = this.store.readDb(slug);
    if (Object.keys(database).length) this.store.writeDb(copy.slug, database);
    // An asset keeps its id in the copy: the documents carried with it point at that id.
    for (const asset of this.store.listAssets(slug)) {
      const bytes = this.store.readAsset(slug, asset.id);
      if (bytes) this.store.addAsset(copy.slug, { ...asset, bytes });
    }
    this.log.info({ action: "duplicate", slug, copy: copy.slug }, "duplicated");
    return copy;
  }

  /** A session acknowledges events it delivered. Ownership does not move. */
  ack(slug: string, ids: string[]): number {
    const taken = this.store.takePending(slug, ids);
    if (taken.length) this.log.info({ action: "ack", slug, count: taken.length }, "acknowledged");
    return taken.length;
  }

  /** Reply and resolve are the agent's only on a thread the user sent to it. */
  private sentThread(threads: CommentThread[], slug: string, threadId: string, verb: string) {
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) throw new PublishError(`no thread ${threadId} on "${slug}"`, 404);
    if (!thread.toAgent) {
      throw new PublishError(
        `thread ${threadId} was not sent to the agent, so it stays open; ask the user to send it from the page before you ${verb}`,
      );
    }
    return thread;
  }

  reply(slug: string, threadId: string, text: string, acknowledgeDuplicate = false): CommentThread {
    const threads = this.store.comments(slug);
    const thread = this.sentThread(threads, slug, threadId, "reply");
    if (thread.messages.at(-1)?.author === "agent" && !acknowledgeDuplicate) {
      throw new PublishError(
        `your reply already stands last on thread ${threadId} and the user has said nothing since; pass acknowledge_duplicate only for a follow-up that adds something new`,
        409,
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
    const thread = this.sentThread(threads, slug, threadId, "resolve");
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
    const gesture = body.gesture === true;
    const record = this.store.addResponse(slug, { island, gesture });
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

  /**
   * The viewer's own publish, through the page's `artifact` capability: a
   * whole replacement page, or just the files that changed, as a new version
   * attributed to the viewer. It is compare-and-set against the version the
   * view runs; a files publish that pins every entry to the hash it replaces
   * is checked file by file instead, so two writers' saves to different files
   * both land. Refusals carry Claude Code's codes, and a refused publish
   * writes nothing. The session that owns the artifact keeps it: its next
   * republish meets the stale guard and reads what the viewer made.
   */
  selfPublish(slug: string, input: SelfPublishInput): Outcome {
    const manifest = this.store.get(slug);
    if (!manifest) return refused(404, "upstream_error", "no such artifact");
    if (!Object.hasOwn(manifest.capabilities ?? {}, ARTIFACT)) {
      return refused(403, "not_declared", `"${slug}" no longer declares the artifact capability`);
    }
    // A view can only run a version that exists; any other base has been overtaken.
    if (!manifest.versions.some((v) => v.n === input.baseVersion)) return overtaken(manifest);
    const made =
      input.html !== undefined
        ? this.pageVersion(manifest, input.baseVersion, input.html)
        : this.filesVersion(manifest, input.baseVersion, input.files ?? {});
    if ("status" in made) return made;
    const record = this.store.addVersion(slug, {
      ...made.version,
      capabilities: manifest.capabilities,
    });
    const stored = made.pinnedWrites && this.store.readFiles(slug, record.n);
    this.log.info(
      { action: "self-publish", slug, version: record.n, form: input.html ? "html" : "files" },
      "the viewer published",
    );
    return {
      status: 200,
      body: {
        ok: true,
        version: String(record.n),
        ...(stored
          ? {
              shas: Object.fromEntries(
                (made.pinnedWrites ?? []).map((path) => [path, stored[path]?.sha256]),
              ),
            }
          : {}),
        ...(made.changed ? { changed: made.changed } : {}),
      },
    };
  }

  /** The html form: the whole page replaced, every supporting file kept. */
  private pageVersion(manifest: Manifest, base: number, html: string): SelfVersion | Outcome {
    if (manifest.type) {
      return refused(
        403,
        "read_only_path",
        `this artifact was made from the type "${manifest.type.name}", whose page is read-only; publish its files instead`,
      );
    }
    if (isStale(base, manifest.current)) return overtaken(manifest);
    if (!DOCTYPE_RE.test(html)) {
      return refused(
        400,
        "invalid_content",
        "publish takes the complete page, beginning with <!doctype html>",
      );
    }
    let page: RenderedPage;
    try {
      page = this.renderer.build({ source: html, kind: "html" });
    } catch (e) {
      return e instanceof PageTooLarge
        ? refused(413, "too_large", e.message)
        : refused(400, "invalid_content", (e as Error).message);
    }
    const validation = this.check(page.island);
    if (validation && !validation.ok && validateQuestionsShape(page.island).length) {
      return refused(
        400,
        "invalid_content",
        `the questions island is malformed: ${validation.errors.join("; ")}`,
      );
    }
    return {
      version: {
        html: page.html,
        island: page.island,
        source: html,
        kind: "html",
        title: this.titleFor({ source: html, kind: "html" }, page.island, manifest),
        files: { kept: this.store.readFiles(manifest.slug, manifest.current), written: {} },
      },
    };
  }

  /**
   * The files form: the page carried over as it is, the named files laid over
   * the current ones. One entry without `ifMatch` keeps the whole-version
   * check; with one on every entry only the named files are compared, and the
   * result says what other writers changed since the view's version.
   */
  private filesVersion(
    manifest: Manifest,
    base: number,
    named: Record<string, SelfFile>,
  ): SelfVersion | Outcome {
    const { slug } = manifest;
    const entries = Object.entries(named);
    if (!entries.length) return refused(400, "invalid_content", "a files publish names a path");
    const files = this.versionFiles(
      manifest,
      Object.fromEntries(entries.map(([path, file]) => [path, "delete" in file ? null : file])),
    );
    if (isRefusal(files)) return refused(FILE_STATUS[files.code], files.code, files.message);
    const untyped = entries.find(
      ([path, file]) =>
        "text" in file && file.text && !isTextType(files.written[path]?.contentType ?? ""),
    );
    if (untyped) {
      return refused(
        400,
        "invalid_content",
        `${JSON.stringify(untyped[0])} is a string, which needs a text type; publish it as a Blob`,
      );
    }
    const pins = Object.fromEntries(
      entries.flatMap(([path, file]) =>
        file.ifMatch === undefined ? [] : [[path, file.ifMatch] as const],
      ),
    );
    const everyPinned = Object.keys(pins).length === entries.length;
    if (!everyPinned && isStale(base, manifest.current)) return overtaken(manifest);
    const current = this.store.readFiles(slug, manifest.current);
    const changed = everyPinned
      ? changedFiles(
          this.store.readFiles(slug, base),
          current,
          entries.map(([path]) => path),
        )
      : undefined;
    const paths = failedPreconditions(current, pins);
    if (paths.length) return overtaken(manifest, { paths, ...(changed ? { changed } : {}) });
    const html = this.store.readPage(slug, manifest.current);
    const src = this.store.readSource(slug);
    if (html === null || !src) return refused(500, "upstream_error", "the page is unreadable");
    return {
      version: {
        html,
        island: this.store.readVersionIsland(slug, manifest.current),
        source: src.source,
        kind: src.kind,
        files,
      },
      pinnedWrites: Object.keys(pins).length ? Object.keys(files.written) : undefined,
      changed,
    };
  }

  /** A view counts as activity for retention. */
  viewed(slug: string): void {
    this.store.touch(slug);
  }

  // ---- the database: the page's and a session's ---------------------------------

  /**
   * One operation on the artifact's database — the page's, made for it by the
   * shell, or a session's through `artifact_data`; both are the one viewer, so
   * every access level passes. A refusal carries the `db` capability's code
   * and writes nothing; `changed` names the documents a write moved, which
   * the route tells every open view.
   */
  db(slug: string, request: DbRequest): DbOutcome {
    const closed = (status: number, code: string, message: string): DbOutcome => ({
      ...refused(status, code, message),
      changed: [],
    });
    const manifest = this.store.get(slug);
    if (!manifest) return closed(404, "unavailable", "no such artifact");
    if (!Object.hasOwn(manifest.capabilities ?? {}, DB)) {
      return closed(
        403,
        "revoked",
        `"${slug}" does not declare the db capability; publish it with capabilities {"db": {}}`,
      );
    }
    const file = this.store.readDb(slug);
    // Only a batch has entries to tell apart; a single write's refusal names no index.
    const refusal = ({ entry, ...rest }: DbRefusal, batch = false): DbOutcome => ({
      status: DB_STATUS[rest.code],
      body: batch ? { ...rest, entry } : rest,
      changed: [],
    });
    if (request.op === "get") {
      const doc = readDocument(file, request.path);
      return isDbRefusal(doc)
        ? refusal(doc)
        : { status: 200, body: { ok: true, doc }, changed: [] };
    }
    if (request.op === "query") {
      const found = runQuery(file, request.path, request.query);
      return isDbRefusal(found)
        ? refusal(found)
        : { status: 200, body: { ok: true, ...found }, changed: [] };
    }
    const now = this.now();
    if (request.op === "acquire") {
      const leased = acquireLease(file, request.path, request, now);
      if (isDbRefusal(leased)) return refusal(leased);
      if (leased.result.acquired) this.store.writeDb(slug, leased.file);
      return { status: 200, body: { ok: true, ...leased.result }, changed: leased.changed };
    }
    const applied = applyWrites(file, request.writes, now.toISOString());
    if (isDbRefusal(applied)) return refusal(applied, request.batch);
    this.store.writeDb(slug, applied.file);
    this.store.touch(slug);
    this.log.info(
      { action: "db", slug, writes: applied.written.length, changed: applied.changed.length },
      "database written",
    );
    const first = applied.written[0];
    return {
      status: 200,
      body: request.batch ? { ok: true, written: applied.written } : { ok: true, ...first },
      changed: applied.changed,
    };
  }

  // ---- assets: what the page uploads ----------------------------------------------

  /**
   * One call of the page's `assets` capability, made for it by the shell: an
   * upload is stored under a fresh id and served from then on at its url, to
   * every version; a listing reports the budget beside the assets; a delete is
   * idempotent. Refusals carry the capability's own codes and store nothing.
   */
  assets(slug: string, request: AssetsRequest): Outcome {
    const manifest = this.store.get(slug);
    if (!manifest) return refused(404, "upstream_error", "no such artifact");
    if (!Object.hasOwn(manifest.capabilities ?? {}, ASSETS)) {
      return refused(403, "not_granted", `"${slug}" does not declare the assets capability`);
    }
    const held = this.store.listAssets(slug);
    const listed = (record: AssetRecord) => ({ ...record, url: assetUrl(record.id) });
    if (request.op === "list") {
      return {
        status: 200,
        body: { ok: true, assets: held.map(listed), usage: assetUsage(held) },
      };
    }
    if (request.op === "delete") {
      const id = assetIdOf(request.ref);
      if (!id) {
        return refused(400, "invalid_request", "delete takes an asset's id, or its url as given");
      }
      const deleted = this.store.removeAsset(slug, id);
      if (deleted) this.log.info({ action: "asset-delete", slug, id }, "asset deleted");
      return { status: 200, body: { ok: true, deleted } };
    }
    if (!request.bytes) return refused(400, "invalid_request", "upload takes the file's bytes");
    const accepted = acceptUpload(request.bytes, request.contentType, held);
    if (isAssetRefusal(accepted))
      return refused(ASSET_STATUS[accepted.code], accepted.code, accepted.message);
    const record = this.store.addAsset(slug, accepted);
    this.store.touch(slug);
    this.log.info(
      { action: "asset-upload", slug, id: record.id, bytes: record.sizeBytes },
      "asset stored",
    );
    const { id, contentType, sizeBytes } = record;
    return { status: 200, body: { ok: true, id, url: assetUrl(id), sizeBytes, contentType } };
  }

  // ---- helpers ---------------------------------------------------------------

  /**
   * The page a session's publish makes a version of: the one it sends — or, on
   * an artifact made from a type, whose page stays the type's, the one it has.
   */
  private sessionPage(
    existing: Manifest | null,
    input: PublishInput,
  ): RenderedPage & { source: string; kind: SourceKind } {
    if (input.source !== undefined) {
      if (existing?.type) {
        throw new PublishError(
          `"${existing.slug}" was made from the type "${existing.type.name}", whose page is read-only; leave file_path out and publish its files`,
          FILE_STATUS.read_only_path,
          { code: "read_only_path" },
        );
      }
      const kind = input.kind ?? "html";
      const built = this.renderer.build({ source: input.source, kind, island: input.island });
      return { ...built, source: input.source, kind };
    }
    const html = existing?.type ? this.store.readPage(existing.slug, existing.current) : null;
    const src = existing?.type ? this.store.readSource(existing.slug) : null;
    if (!existing || html === null || !src) {
      throw new PublishError(
        "a publish carries its page; only an artifact made from a type republishes without one, with files",
      );
    }
    const island =
      input.island === undefined
        ? this.store.readVersionIsland(existing.slug, existing.current)
        : input.island;
    return { html, island, source: src.source, kind: src.kind };
  }

  /**
   * The files of the version a publish makes: what it names laid over what the
   * artifact holds now. On an artifact made from a type, the type's paths are
   * not the publisher's to name.
   */
  private versionFiles(
    existing: Manifest | null,
    changes: Record<string, FileContent | null>,
  ): VersionFiles | FileRefusal {
    const current = existing ? this.store.readFiles(existing.slug, existing.current) : {};
    const plan = planFiles(
      current,
      Object.fromEntries(
        Object.entries(changes).map(([path, file]) => [
          path,
          file && { bytes: file.bytes.byteLength, contentType: file.contentType },
        ]),
      ),
      existing?.type?.paths,
    );
    if (isRefusal(plan)) return plan;
    const written = Object.fromEntries(
      Object.entries(plan.written).map(([path, contentType]) => [
        path,
        { bytes: (changes[path] as FileContent).bytes, contentType },
      ]),
    );
    return { kept: plan.kept, written };
  }

  /**
   * Claude Code's precedence: what the file says wins — an HTML page's
   * <title>, a Markdown file's own name — and the `title` parameter is only
   * the fallback. A republish that names nothing keeps the name it has; only
   * a new artifact falls back to its island's title or its first heading. A
   * page the user renamed keeps their title.
   */
  private titleFor(
    input: Pick<PublishInput, "sourcePath" | "title"> & { source: string; kind: SourceKind },
    island: Island | null,
    existing: Manifest | null,
  ): string {
    if (existing?.renamed) return existing.title;
    const found = this.renderer.title(input.source, input.kind);
    const fileName =
      input.kind === "md"
        ? input.sourcePath
            ?.split(/[\\/]/)
            .pop()
            ?.replace(/\.[^.]+$/, "")
        : undefined;
    const title =
      found.declared ||
      fileName ||
      input.title?.trim() ||
      existing?.title ||
      titleFrom(island) ||
      found.heading ||
      "artifact";
    return title.slice(0, MAX_TITLE);
  }

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
        `an artifact already lives at ${PREFIX}/${slug}; pass url "${slug}" to update it (the user can attach it from /artifacts), or choose another slug`,
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
