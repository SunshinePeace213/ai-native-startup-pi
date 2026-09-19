// The on-disk store under <root>/ (normally <project>/.pi/artifacts). The
// server process is its only writer; the session reads nothing here directly.
//
//   <slug>/manifest.json   title, versions, watch state, owner, pending events
//   <slug>/source.html|md  the agent's latest source, re-rendered on a page send
//   <slug>/data.json       the current island
//   <slug>/v<N>.html       every rendered version, append-only
//   <slug>/v<N>.json       the island of that version
//   <slug>/comments.json   comment threads
//   <slug>/events.jsonl    every page event, delivered or not
//
// The control files beside the slugs (.token, .server.json, .server.log) are
// shared/record.ts. Writes are atomic (tmp + rename). Deleting an artifact
// moves its folder into the trash directory the caller names; nothing here
// removes files.

import { randomBytes } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
} from "node:fs";
import { join } from "node:path";

import { SLUG_RE } from "../shared/protocol";
import { ensureToken, readJson, writeAtomic } from "../shared/record";
import type {
  CommentThread,
  Island,
  Manifest,
  PendingEvent,
  SourceKind,
  VersionRecord,
} from "../shared/types";

const SLUG_MAX = 48;

export function slugify(title: string): string {
  const base = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
  return base || "artifact";
}

export interface CreateInput {
  title: string;
  description?: string;
  icon?: string;
  kind: SourceKind;
  source: string;
  html: string;
  island: Island | null;
  slug?: string;
  owner?: string;
}

export interface VersionInput {
  html: string;
  island: Island | null;
  by: "agent" | "page";
  /** New source when the agent republished; absent on a page send. */
  source?: string;
  kind?: SourceKind;
  title?: string;
  description?: string;
  icon?: string;
  note?: string;
  owner?: string;
}

export class Store {
  constructor(
    readonly root: string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private dir(slug: string): string {
    return join(this.root, slug);
  }

  token(): string {
    return ensureToken(this.root);
  }

  list(): Manifest[] {
    if (!existsSync(this.root)) return [];
    return readdirSync(this.root, { withFileTypes: true })
      .filter((d) => d.isDirectory() && SLUG_RE.test(d.name))
      .map((d) => this.get(d.name))
      .filter((m): m is Manifest => m !== null)
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }

  get(slug: string): Manifest | null {
    if (!SLUG_RE.test(slug)) return null;
    const manifest = readJson<Manifest | null>(join(this.dir(slug), "manifest.json"), null);
    return manifest && manifest.slug === slug ? manifest : null;
  }

  exists(slug: string): boolean {
    return this.get(slug) !== null;
  }

  /** A slug for a new artifact: the title's, made unique. */
  freeSlug(title: string): string {
    const base = slugify(title);
    if (!this.exists(base)) return base;
    for (let n = 2; n < 1000; n += 1) {
      const candidate = `${base.slice(0, SLUG_MAX - 4)}-${n}`;
      if (!this.exists(candidate)) return candidate;
    }
    return `${base.slice(0, SLUG_MAX - 9)}-${randomBytes(4).toString("hex")}`;
  }

  create(input: CreateInput): Manifest {
    const slug = input.slug ?? this.freeSlug(input.title);
    if (!SLUG_RE.test(slug)) throw new Error(`invalid slug "${slug}"`);
    if (this.exists(slug)) throw new Error(`artifact "${slug}" already exists`);
    const at = this.now().toISOString();
    mkdirSync(this.dir(slug), { recursive: true });
    const manifest: Manifest = {
      slug,
      title: input.title,
      description: input.description,
      icon: input.icon,
      source: input.kind,
      createdAt: at,
      updatedAt: at,
      current: 0,
      versions: [],
      watched: true,
      owner: input.owner,
      pending: [],
    };
    this.save(manifest);
    this.addVersion(slug, {
      html: input.html,
      island: input.island,
      by: "agent",
      source: input.source,
      kind: input.kind,
    });
    return this.get(slug) as Manifest;
  }

  addVersion(slug: string, input: VersionInput): VersionRecord {
    const manifest = this.must(slug);
    const n = manifest.current + 1;
    const at = this.now().toISOString();
    const dir = this.dir(slug);
    if (input.source !== undefined) {
      const kind = input.kind ?? manifest.source;
      writeAtomic(join(dir, `source.${kind}`), input.source);
      manifest.source = kind;
    }
    const islandJson = input.island ? `${JSON.stringify(input.island, null, 2)}\n` : "null\n";
    writeAtomic(join(dir, `v${n}.html`), input.html);
    writeAtomic(join(dir, `v${n}.json`), islandJson);
    writeAtomic(join(dir, "data.json"), islandJson);
    const record: VersionRecord = {
      n,
      at,
      by: input.by,
      bytes: Buffer.byteLength(input.html, "utf8"),
      note: input.note,
    };
    manifest.versions.push(record);
    manifest.current = n;
    manifest.updatedAt = at;
    if (input.title) manifest.title = input.title;
    if (input.description !== undefined) manifest.description = input.description;
    if (input.icon !== undefined) manifest.icon = input.icon;
    if (input.owner !== undefined) manifest.owner = input.owner;
    this.save(manifest);
    return record;
  }

  readVersion(slug: string, n?: number): string | null {
    const manifest = this.get(slug);
    if (!manifest) return null;
    const v = n ?? manifest.current;
    const path = join(this.dir(slug), `v${v}.html`);
    return existsSync(path) ? readFileSync(path, "utf8") : null;
  }

  readSource(slug: string): { kind: SourceKind; source: string } | null {
    const manifest = this.get(slug);
    if (!manifest) return null;
    const path = join(this.dir(slug), `source.${manifest.source}`);
    if (!existsSync(path)) return null;
    return { kind: manifest.source, source: readFileSync(path, "utf8") };
  }

  /** The island of one version, or the current one. */
  readIsland(slug: string, n?: number): Island | null {
    const path =
      n === undefined ? join(this.dir(slug), "data.json") : join(this.dir(slug), `v${n}.json`);
    const value = readJson<unknown>(path, null);
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Island)
      : null;
  }

  setWatched(slug: string, watched: boolean, owner?: string): Manifest {
    const manifest = this.must(slug);
    manifest.watched = watched;
    if (owner !== undefined) manifest.owner = owner;
    this.save(manifest);
    return manifest;
  }

  setOwner(slug: string, owner: string): Manifest {
    const manifest = this.must(slug);
    manifest.owner = owner;
    this.save(manifest);
    return manifest;
  }

  pushPending(slug: string, event: PendingEvent): void {
    const manifest = this.must(slug);
    manifest.pending.push(event);
    this.save(manifest);
    appendFileSync(join(this.dir(slug), "events.jsonl"), `${JSON.stringify({ ...event, slug })}\n`);
  }

  /** Removes and returns the named pending events (all of them without ids). */
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

  /** Moves the artifact folder under `trashDir`; returns the destination. */
  remove(slug: string, trashDir: string): string {
    this.must(slug);
    mkdirSync(trashDir, { recursive: true });
    const stamp = this.now().toISOString().replace(/[:.]/g, "-");
    let dest = join(trashDir, `artifact-${slug}-${stamp}`);
    while (existsSync(dest)) dest = `${dest}-${randomBytes(2).toString("hex")}`;
    renameSync(this.dir(slug), dest);
    return dest;
  }

  sizeOf(slug: string): number {
    const dir = this.dir(slug);
    if (!existsSync(dir)) return 0;
    return readdirSync(dir).reduce((sum, f) => sum + statSync(join(dir, f)).size, 0);
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
