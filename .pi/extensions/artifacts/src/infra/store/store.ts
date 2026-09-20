// The on-disk store under <root>/ (normally <project>/.pi/artifacts). The
// server process is its only writer; the session reads nothing here directly.
//
//   .server/                     control files (control.ts)
//   logs/<date>/*.jsonl          pino, one file per session and one for the server
//   <slug>/<file>.html|md        the page the agent authors, when it writes it here;
//                                the server never writes it
//   <slug>/.store/               everything below is the server's
//     manifest.json              title, owner, sessions, versions, responses, pin, pending
//     source.html|md             the source as last published (the authored page may move on)
//     versions/v<N>.html|json    every version's document and island, written once
//     versions/v<N>.files.json   the version's supporting files, published path →
//                                {sha256, contentType, bytes}; complete, so an old version
//                                keeps serving its own; absent when it has none
//     blobs/<sha256>             their bytes, stored once however many versions name them
//     responses/v<N>-r<K>.json   what the page sent back to version N; no document changes
//     db.json                    the page's database, collection path → document id →
//                                {data, version, updatedAt, lease?}; written on the first write
//     assets/<id>                what the page uploaded, under an opaque id, whatever the version
//     assets/index.json          [{id, contentType, sizeBytes, createdAt}], oldest first
//     comments.json · diagnostics.json · events.jsonl
//
// Writes are atomic (tmp + rename). Deleting an artifact moves its whole
// folder, authored page included, into the trash directory, and the bytes of
// an asset its page deleted go there too; only expired log folders are removed outright.

import { createHash, randomBytes } from "node:crypto";
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

import { ASSET_ID_RE, type AssetRecord } from "../../domain/assets";
import type { DbFile } from "../../domain/db";
import { SLUG_RE, STORE_SUBDIR } from "../../domain/protocol";
import { logDate } from "../../domain/retention";
import { SLUG_MAX, slugify } from "../../domain/text";
import type {
  CommentThread,
  Diagnostic,
  FileMap,
  Island,
  Manifest,
  PendingEvent,
  ResponseRecord,
  SourceKind,
  VersionRecord,
} from "../../domain/types";
import { latestResponse, mergedIsland, nextResponse, responseName } from "../../domain/versioning";
import { MAX_DIAGNOSTICS, VIEWER } from "../../domain/types";
import type {
  ArtifactStore,
  AssetInput,
  CreateInput,
  ResponseInput,
  VersionFiles,
  VersionInput,
} from "../../app/ports";
import { CONTROL_DIR, readJson, writeAtomic } from "./control";

export const LOGS_DIR = "logs";
/** Views touch the manifest at most this often. */
const TOUCH_MIN_MS = 60 * 60 * 1000;
/** A blob is named by its hash and by nothing else: no other name reaches the blobs folder. */
const SHA256_RE = /^[a-f0-9]{64}$/;

/** A manifest carries every field the code reads; anything less is not an artifact. */
function isManifest(value: unknown, slug: string): value is Manifest {
  if (typeof value !== "object" || value === null) return false;
  const m = value as Record<string, unknown>;
  return (
    m.slug === slug &&
    typeof m.title === "string" &&
    typeof m.owner === "string" &&
    typeof m.current === "number" &&
    typeof m.updatedAt === "string" &&
    [m.versions, m.responses, m.sessions, m.pending].every(Array.isArray)
  );
}

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

  private slugFolders(): string[] {
    if (!existsSync(this.root)) return [];
    return readdirSync(this.root, { withFileTypes: true })
      .filter((d) => d.isDirectory() && SLUG_RE.test(d.name) && d.name !== LOGS_DIR)
      .map((d) => d.name);
  }

  list(): Manifest[] {
    return this.slugFolders()
      .map((slug) => this.get(slug))
      .filter((m): m is Manifest => m !== null)
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }

  /** Folders that hold a manifest the code cannot read: never listed, named so the server can say so. */
  unreadable(): string[] {
    return this.slugFolders().filter(
      (slug) => existsSync(join(this.dir(slug), "manifest.json")) && this.get(slug) === null,
    );
  }

  get(slug: string): Manifest | null {
    if (!SLUG_RE.test(slug) || slug === LOGS_DIR || slug === CONTROL_DIR) return null;
    const manifest = readJson<unknown>(join(this.dir(slug), "manifest.json"), null);
    return isManifest(manifest, slug) ? manifest : null;
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
      type: input.type,
    };
    this.save(manifest);
    this.addVersion(slug, {
      html: input.html,
      island: input.island,
      source: input.source,
      kind: input.kind,
      sourcePath: input.sourcePath,
      label: input.label,
      files: input.files,
      capabilities: input.capabilities,
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
    const files = Object.values(this.writeFiles(slug, n, input.files));
    const declared = Object.keys(input.capabilities ?? {}).length ? input.capabilities : undefined;
    writeAtomic(join(dir, "versions", `v${n}.html`), input.html);
    writeAtomic(join(dir, "versions", `v${n}.json`), islandJson);
    const record: VersionRecord = {
      n,
      at,
      by: input.session ?? VIEWER,
      bytes: Buffer.byteLength(input.html, "utf8"),
      label: input.label,
      ...(files.length
        ? { files: files.length, fileBytes: files.reduce((sum, f) => sum + f.bytes, 0) }
        : {}),
      ...(declared ? { capabilities: declared } : {}),
    };
    manifest.capabilities = declared;
    manifest.versions.push(record);
    manifest.current = n;
    manifest.updatedAt = at;
    manifest.lastActivityAt = at;
    // The viewer's own publish leaves the artifact with the session that owns it.
    if (input.session !== undefined) {
      manifest.owner = input.session;
      if (!manifest.sessions.includes(input.session)) manifest.sessions.push(input.session);
    }
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

  readPage(slug: string, version: number): string | null {
    if (!this.get(slug)) return null;
    const path = join(this.dir(slug), "versions", `v${version}.html`);
    return existsSync(path) ? readFileSync(path, "utf8") : null;
  }

  readFiles(slug: string, version: number): FileMap {
    if (!this.get(slug)) return {};
    return readJson<FileMap>(join(this.dir(slug), "versions", `v${version}.files.json`), {});
  }

  readBlob(slug: string, sha256: string): Uint8Array | null {
    if (!SHA256_RE.test(sha256) || !this.get(slug)) return null;
    const path = join(this.dir(slug), "blobs", sha256);
    return existsSync(path) ? new Uint8Array(readFileSync(path)) : null;
  }

  readDb(slug: string): DbFile {
    if (!this.get(slug)) return {};
    const file = readJson<unknown>(join(this.dir(slug), "db.json"), {});
    return typeof file === "object" && file !== null && !Array.isArray(file)
      ? (file as DbFile)
      : {};
  }

  writeDb(slug: string, file: DbFile): void {
    this.must(slug);
    writeAtomic(join(this.dir(slug), "db.json"), `${JSON.stringify(file, null, 1)}\n`);
  }

  listAssets(slug: string): AssetRecord[] {
    if (!this.get(slug)) return [];
    const index = readJson<unknown>(join(this.dir(slug), "assets", "index.json"), []);
    return Array.isArray(index) ? (index as AssetRecord[]) : [];
  }

  readAsset(slug: string, id: string): Uint8Array | null {
    if (!ASSET_ID_RE.test(id) || !this.listAssets(slug).some((a) => a.id === id)) return null;
    const path = join(this.dir(slug), "assets", id);
    return existsSync(path) ? new Uint8Array(readFileSync(path)) : null;
  }

  addAsset(slug: string, input: AssetInput): AssetRecord {
    this.must(slug);
    const record: AssetRecord = {
      id: input.id ?? randomBytes(16).toString("hex"),
      contentType: input.contentType,
      sizeBytes: input.bytes.byteLength,
      createdAt: input.createdAt ?? this.now().toISOString(),
    };
    if (!ASSET_ID_RE.test(record.id)) throw new Error(`invalid asset id "${record.id}"`);
    const dir = join(this.dir(slug), "assets");
    mkdirSync(dir, { recursive: true });
    // The bytes first: an index never names an asset that is not there.
    writeAtomic(join(dir, record.id), input.bytes);
    this.saveAssets(slug, [...this.listAssets(slug).filter((a) => a.id !== record.id), record]);
    return record;
  }

  removeAsset(slug: string, id: string): boolean {
    const held = this.listAssets(slug);
    if (!held.some((a) => a.id === id)) return false;
    this.saveAssets(
      slug,
      held.filter((a) => a.id !== id),
    );
    const bytes = join(this.dir(slug), "assets", id);
    if (existsSync(bytes)) renameSync(bytes, this.trashPath(`${slug}-asset-${id}`));
    return true;
  }

  private saveAssets(slug: string, records: AssetRecord[]): void {
    writeAtomic(
      join(this.dir(slug), "assets", "index.json"),
      `${JSON.stringify(records, null, 2)}\n`,
    );
  }

  /** Stores a version's new content under its hash and writes the version's map; a version with no files writes nothing. */
  private writeFiles(slug: string, n: number, files: VersionFiles | undefined): FileMap {
    const map: FileMap = { ...files?.kept };
    const blobs = join(this.dir(slug), "blobs");
    for (const [path, file] of Object.entries(files?.written ?? {})) {
      const sha256 = createHash("sha256").update(file.bytes).digest("hex");
      mkdirSync(blobs, { recursive: true });
      if (!existsSync(join(blobs, sha256))) writeAtomic(join(blobs, sha256), file.bytes);
      map[path] = { sha256, contentType: file.contentType, bytes: file.bytes.byteLength };
    }
    const paths = Object.keys(map).sort();
    if (!paths.length) return map;
    const sorted = Object.fromEntries(paths.map((path) => [path, map[path]]));
    writeAtomic(
      join(this.dir(slug), "versions", `v${n}.files.json`),
      `${JSON.stringify(sorted, null, 2)}\n`,
    );
    return map;
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

  rename(slug: string, title: string): Manifest {
    const manifest = this.must(slug);
    manifest.title = title;
    manifest.renamed = true;
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
    const dest = this.trashPath(slug);
    renameSync(this.folder(slug), dest);
    return dest;
  }

  /** A free name under today's trash folder: nothing already there is ever overwritten. */
  private trashPath(name: string): string {
    const day = join(this.trashDir, "pi-artifacts", logDate(this.now()));
    mkdirSync(day, { recursive: true });
    let dest = join(day, name);
    while (existsSync(dest)) dest = `${join(day, name)}-${randomBytes(2).toString("hex")}`;
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
