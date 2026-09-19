// The on-disk store under <root>/ (normally <project>/.pi/artifacts). The
// server process is its only writer; the session reads nothing here directly.
//
//   .server/                     control files (control.ts)
//   logs/<date>/*.jsonl          pino, one file per session and one for the server
//   <slug>/<file>.html|md        the page the agent authors, when it writes it here;
//                                the server never writes it
//   <slug>/.store/               everything below is the server's
//     manifest.json              title, owner, sessions, versions, responses, pin, pending
//     index.html                 the current page: the version with the newest reply over it
//     source.html|md             the source as last published (the authored page may move on)
//     versions/v<N>.html|json    every agent version as published, and its island; append-only
//     responses/v<N>-r<K>.json   what the page sent back to version N
//     comments.json · diagnostics.json · events.jsonl
//
// Writes are atomic (tmp + rename). Deleting an artifact moves its whole
// folder, authored page included, into the trash directory; only expired log folders are removed outright.

import { randomBytes } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";

import { SLUG_RE, STORE_SUBDIR } from "../../domain/protocol";
import { logDate } from "../../domain/retention";
import { SLUG_MAX, slugify } from "../../domain/text";
import type {
  CommentThread,
  Diagnostic,
  Island,
  Manifest,
  PendingEvent,
  ResponseRecord,
  SourceKind,
  VersionRecord,
} from "../../domain/types";
import { latestResponse, mergedIsland, nextResponse, responseName } from "../../domain/versioning";
import { MAX_DIAGNOSTICS } from "../../domain/types";
import type { ArtifactStore, CreateInput, ResponseInput, VersionInput } from "../../app/ports";
import { CONTROL_DIR, readJson, writeAtomic } from "./control";

export const LOGS_DIR = "logs";
/** What the server wrote at the top of an artifact's folder before `.store`. */
const FLAT_LAYOUT =
  /^(manifest\.json|index\.html|source\.(html|md)|versions|responses|comments\.json|diagnostics\.json|events\.jsonl)$/;
/** Views touch the manifest at most this often. */
const TOUCH_MIN_MS = 60 * 60 * 1000;

export class Store implements ArtifactStore {
  constructor(
    readonly root: string,
    readonly trashDir: string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** The artifact's folder: the authored page and the store beside it. */
  private folder(slug: string): string {
    return join(this.root, slug);
  }

  /** Where the server's files for an artifact live. */
  private dir(slug: string): string {
    return join(this.root, slug, STORE_SUBDIR);
  }

  /** Moves artifacts written before `.store` existed under it; returns their slugs. */
  migrate(): string[] {
    if (!existsSync(this.root)) return [];
    const moved: string[] = [];
    for (const d of readdirSync(this.root, { withFileTypes: true })) {
      if (!d.isDirectory() || !SLUG_RE.test(d.name) || d.name === LOGS_DIR) continue;
      const folder = this.folder(d.name);
      if (!existsSync(join(folder, "manifest.json")) || existsSync(this.dir(d.name))) continue;
      const names = readdirSync(folder).filter((name) => FLAT_LAYOUT.test(name));
      mkdirSync(this.dir(d.name));
      for (const name of names) renameSync(join(folder, name), join(this.dir(d.name), name));
      moved.push(d.name);
    }
    return moved;
  }

  list(): Manifest[] {
    if (!existsSync(this.root)) return [];
    return readdirSync(this.root, { withFileTypes: true })
      .filter((d) => d.isDirectory() && SLUG_RE.test(d.name) && d.name !== LOGS_DIR)
      .map((d) => this.get(d.name))
      .filter((m): m is Manifest => m !== null)
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }

  get(slug: string): Manifest | null {
    if (!SLUG_RE.test(slug) || slug === LOGS_DIR || slug === CONTROL_DIR) return null;
    const manifest = readJson<Manifest | null>(join(this.dir(slug), "manifest.json"), null);
    return manifest && manifest.slug === slug ? manifest : null;
  }

  exists(slug: string): boolean {
    return this.get(slug) !== null;
  }

  findBySourcePath(path: string, session: string): Manifest | null {
    return this.list().find((m) => m.sourcePath === path && m.sessions.includes(session)) ?? null;
  }

  /** A slug for a new artifact: the title's, made unique. */
  freeSlug(title: string): string {
    const base = slugify(title);
    if (!this.exists(base) && base !== LOGS_DIR) return base;
    for (let n = 2; n < 1000; n += 1) {
      const candidate = `${base.slice(0, SLUG_MAX - 4)}-${n}`;
      if (!this.exists(candidate)) return candidate;
    }
    return `${base.slice(0, SLUG_MAX - 9)}-${randomBytes(4).toString("hex")}`;
  }

  create(input: CreateInput): Manifest {
    const slug = input.slug;
    if (!SLUG_RE.test(slug)) throw new Error(`invalid slug "${slug}"`);
    if (this.exists(slug)) throw new Error(`artifact "${slug}" already exists`);
    const at = this.now().toISOString();
    mkdirSync(join(this.dir(slug), "versions"), { recursive: true });
    mkdirSync(join(this.dir(slug), "responses"), { recursive: true });
    const manifest: Manifest = {
      slug,
      title: input.title,
      description: input.description,
      icon: input.icon,
      source: input.kind,
      sourcePath: input.sourcePath,
      createdAt: at,
      updatedAt: at,
      lastActivityAt: at,
      current: 0,
      versions: [],
      responses: [],
      watched: true,
      owner: input.session,
      sessions: [input.session],
      pinned: false,
      pending: [],
    };
    this.save(manifest);
    this.addVersion(slug, {
      html: input.html,
      island: input.island,
      source: input.source,
      kind: input.kind,
      sourcePath: input.sourcePath,
      session: input.session,
    });
    return this.get(slug) as Manifest;
  }

  addVersion(slug: string, input: VersionInput): VersionRecord {
    const manifest = this.must(slug);
    const n = manifest.current + 1;
    const at = this.now().toISOString();
    const dir = this.dir(slug);
    mkdirSync(join(dir, "versions"), { recursive: true });
    writeAtomic(join(dir, `source.${input.kind}`), input.source);
    manifest.source = input.kind;
    const islandJson = input.island ? `${JSON.stringify(input.island, null, 2)}\n` : "null\n";
    writeAtomic(join(dir, "versions", `v${n}.html`), input.html);
    writeAtomic(join(dir, "versions", `v${n}.json`), islandJson);
    writeAtomic(join(dir, "index.html"), input.html);
    const record: VersionRecord = {
      n,
      at,
      by: input.session,
      bytes: Buffer.byteLength(input.html, "utf8"),
      note: input.note,
    };
    manifest.versions.push(record);
    manifest.current = n;
    manifest.updatedAt = at;
    manifest.lastActivityAt = at;
    manifest.owner = input.session;
    if (!manifest.sessions.includes(input.session)) manifest.sessions.push(input.session);
    if (input.title) manifest.title = input.title;
    if (input.description !== undefined) manifest.description = input.description;
    if (input.icon !== undefined) manifest.icon = input.icon;
    if (input.sourcePath !== undefined) manifest.sourcePath = input.sourcePath;
    this.save(manifest);
    return record;
  }

  addResponse(slug: string, input: ResponseInput): ResponseRecord {
    const manifest = this.must(slug);
    const version = manifest.current;
    const r = nextResponse(manifest, version);
    const at = this.now().toISOString();
    const dir = this.dir(slug);
    mkdirSync(join(dir, "responses"), { recursive: true });
    const json = `${JSON.stringify(input.island, null, 2)}\n`;
    writeAtomic(join(dir, "responses", `${responseName(version, r)}.json`), json);
    writeAtomic(join(dir, "index.html"), input.html);
    const record: ResponseRecord = {
      r,
      version,
      at,
      gesture: input.gesture,
      bytes: Buffer.byteLength(json, "utf8"),
    };
    manifest.responses.push(record);
    manifest.lastActivityAt = at;
    this.save(manifest);
    return record;
  }

  readVersionIsland(slug: string, n: number): Island | null {
    return asIsland(readJson<unknown>(join(this.dir(slug), "versions", `v${n}.json`), null));
  }

  readResponseIsland(slug: string, version: number, r: number): Island | null {
    return asIsland(
      readJson<unknown>(
        join(this.dir(slug), "responses", `${responseName(version, r)}.json`),
        null,
      ),
    );
  }

  readIsland(slug: string): Island | null {
    const manifest = this.get(slug);
    if (!manifest) return null;
    const latest = latestResponse(manifest);
    return mergedIsland(
      this.readVersionIsland(slug, manifest.current),
      latest ? this.readResponseIsland(slug, latest.version, latest.r) : null,
    );
  }

  readSource(slug: string): { kind: SourceKind; source: string } | null {
    const manifest = this.get(slug);
    if (!manifest) return null;
    const path = join(this.dir(slug), `source.${manifest.source}`);
    if (!existsSync(path)) return null;
    return { kind: manifest.source, source: readFileSync(path, "utf8") };
  }

  readPage(slug: string, version?: number): string | null {
    if (!this.get(slug)) return null;
    const path =
      version === undefined
        ? join(this.dir(slug), "index.html")
        : join(this.dir(slug), "versions", `v${version}.html`);
    return existsSync(path) ? readFileSync(path, "utf8") : null;
  }

  setWatched(slug: string, watched: boolean, session?: string): Manifest {
    const manifest = this.must(slug);
    manifest.watched = watched;
    if (session !== undefined) {
      manifest.owner = session;
      if (!manifest.sessions.includes(session)) manifest.sessions.push(session);
    }
    this.save(manifest);
    return manifest;
  }

  setOwner(slug: string, session: string): Manifest {
    return this.setWatched(slug, this.must(slug).watched, session);
  }

  setPinned(slug: string, pinned: boolean): Manifest {
    const manifest = this.must(slug);
    manifest.pinned = pinned;
    this.save(manifest);
    return manifest;
  }

  touch(slug: string): void {
    const manifest = this.get(slug);
    if (!manifest) return;
    const now = this.now();
    const last = Date.parse(manifest.lastActivityAt);
    if (Number.isFinite(last) && now.getTime() - last < TOUCH_MIN_MS) return;
    manifest.lastActivityAt = now.toISOString();
    this.save(manifest);
  }

  pushPending(slug: string, event: PendingEvent): void {
    const manifest = this.must(slug);
    manifest.pending.push(event);
    this.save(manifest);
    appendFileSync(join(this.dir(slug), "events.jsonl"), `${JSON.stringify({ ...event, slug })}\n`);
  }

  takePending(slug: string, ids?: string[]): PendingEvent[] {
    const manifest = this.must(slug);
    const taken = ids
      ? manifest.pending.filter((p) => ids.includes(p.id))
      : manifest.pending.slice();
    manifest.pending = ids ? manifest.pending.filter((p) => !ids.includes(p.id)) : [];
    this.save(manifest);
    return taken;
  }

  comments(slug: string): CommentThread[] {
    return readJson<CommentThread[]>(join(this.dir(slug), "comments.json"), []);
  }

  saveComments(slug: string, threads: CommentThread[]): void {
    this.must(slug);
    writeAtomic(join(this.dir(slug), "comments.json"), `${JSON.stringify(threads, null, 2)}\n`);
  }

  diagnostics(slug: string): Diagnostic[] {
    return readJson<Diagnostic[]>(join(this.dir(slug), "diagnostics.json"), []);
  }

  addDiagnostics(slug: string, rows: Diagnostic[]): void {
    this.must(slug);
    const all = [...this.diagnostics(slug), ...rows].slice(-MAX_DIAGNOSTICS);
    writeAtomic(join(this.dir(slug), "diagnostics.json"), `${JSON.stringify(all, null, 2)}\n`);
  }

  remove(slug: string): string {
    this.must(slug);
    const day = join(this.trashDir, "pi-artifacts", logDate(this.now()));
    mkdirSync(day, { recursive: true });
    let dest = join(day, slug);
    while (existsSync(dest)) dest = `${join(day, slug)}-${randomBytes(2).toString("hex")}`;
    renameSync(this.folder(slug), dest);
    return dest;
  }

  logDates(): string[] {
    const dir = join(this.root, LOGS_DIR);
    if (!existsSync(dir)) return [];
    return readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  }

  removeLogDate(name: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(name)) return;
    rmSync(join(this.root, LOGS_DIR, name), { recursive: true, force: true });
  }

  private must(slug: string): Manifest {
    const manifest = this.get(slug);
    if (!manifest) throw new Error(`no artifact "${slug}"`);
    return manifest;
  }

  private save(manifest: Manifest): void {
    mkdirSync(this.dir(manifest.slug), { recursive: true });
    writeAtomic(
      join(this.dir(manifest.slug), "manifest.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
  }
}

const asIsland = (value: unknown): Island | null =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Island) : null;
