// What the use-cases need from the outside world, as interfaces. The store
// is implemented over the filesystem in infra/store, the renderer in
// infra/render; tests may implement either in memory. Nothing in app/
// imports a runtime API.

import type { AssetRecord } from "../domain/assets";
import type { DbFile } from "../domain/db";
import type {
  Capabilities,
  CommentThread,
  Diagnostic,
  FileMap,
  Island,
  Manifest,
  PendingEvent,
  ResponseRecord,
  SourceKind,
  TypeRef,
  VersionRecord,
} from "../domain/types";

/** One supporting file as a publish hands it over: its bytes, and its media type when the path does not say. */
export interface FileContent {
  bytes: Uint8Array;
  contentType?: string;
}

/** A version's supporting files: the records it keeps from the version before, and the content it stores anew. */
export interface VersionFiles {
  kept: FileMap;
  written: Record<string, { bytes: Uint8Array; contentType: string }>;
}

export interface CreateInput {
  slug: string;
  title: string;
  description?: string;
  icon?: string;
  kind: SourceKind;
  sourcePath?: string;
  source: string;
  html: string;
  island: Island | null;
  label?: string;
  files?: VersionFiles;
  /** The whole declaration the artifact carries from this version on; absent or empty when it declares nothing. */
  capabilities?: Capabilities;
  /** The type the artifact is made from, with the paths that stay the type's. */
  type?: TypeRef;
  session: string;
}

export interface VersionInput {
  html: string;
  island: Island | null;
  source: string;
  kind: SourceKind;
  sourcePath?: string;
  title?: string;
  description?: string;
  icon?: string;
  label?: string;
  files?: VersionFiles;
  /** The whole declaration the artifact carries from this version on; absent or empty when it declares nothing. */
  capabilities?: Capabilities;
  /**
   * The session publishing, which owns the artifact from now on. Absent when
   * the viewer published from the page: the version is attributed to VIEWER
   * and nobody's ownership moves.
   */
  session?: string;
}

export interface ResponseInput {
  island: Island;
  gesture: boolean;
}

/** An asset to store: its bytes and type, and — for a copy of another artifact's — the record it keeps. */
export interface AssetInput {
  bytes: Uint8Array;
  contentType: string;
  id?: string;
  createdAt?: string;
}

export interface ArtifactStore {
  readonly root: string;
  list(): Manifest[];
  get(slug: string): Manifest | null;
  exists(slug: string): boolean;
  /** The artifact this session published or attached from this project-relative path, if any. */
  findBySourcePath(path: string, session: string): Manifest | null;
  freeSlug(title: string): string;
  create(input: CreateInput): Manifest;
  addVersion(slug: string, input: VersionInput): VersionRecord;
  addResponse(slug: string, input: ResponseInput): ResponseRecord;
  /** The island of one version as the agent published it. */
  readVersionIsland(slug: string, n: number): Island | null;
  /** The island a reader sees now: the version with the newest response over it. */
  readIsland(slug: string): Island | null;
  readResponseIsland(slug: string, version: number, r: number): Island | null;
  readSource(slug: string): { kind: SourceKind; source: string } | null;
  /** One version's document, exactly as it was published. */
  readPage(slug: string, version: number): string | null;
  /** One version's supporting files; empty when it has none. */
  readFiles(slug: string, version: number): FileMap;
  /** The bytes a file record names, or null when the store does not hold them. */
  readBlob(slug: string, sha256: string): Uint8Array | null;
  /** The artifact's database, whole; empty until something was written. */
  readDb(slug: string): DbFile;
  writeDb(slug: string, file: DbFile): void;
  /** What the page uploaded, oldest first. */
  listAssets(slug: string): AssetRecord[];
  readAsset(slug: string, id: string): Uint8Array | null;
  /** Stores an asset and indexes it; it gets a fresh id unless it brings one, as a copy does. */
  addAsset(slug: string, input: AssetInput): AssetRecord;
  /** False when nothing was stored under that id. */
  removeAsset(slug: string, id: string): boolean;
  setWatched(slug: string, watched: boolean, session?: string): Manifest;
  setOwner(slug: string, session: string): Manifest;
  setPinned(slug: string, pinned: boolean): Manifest;
  /** The user's rename: the title stays theirs across later publishes. */
  rename(slug: string, title: string): Manifest;
  touch(slug: string): void;
  pushPending(slug: string, event: PendingEvent): void;
  takePending(slug: string, ids?: string[]): PendingEvent[];
  comments(slug: string): CommentThread[];
  saveComments(slug: string, threads: CommentThread[]): void;
  diagnostics(slug: string): Diagnostic[];
  addDiagnostics(slug: string, rows: Diagnostic[]): void;
  /** Moves the artifact folder under the trash; returns the destination. */
  remove(slug: string): string;
  /** Log folder names under the store, and removal of one. */
  logDates(): string[];
  removeLogDate(name: string): void;
}

export interface RenderInput {
  source: string;
  kind: SourceKind;
  /** Overrides whatever the island in the source says. */
  island?: Island | null;
}

export interface RenderedPage {
  /** The stored document. */
  html: string;
  island: Island | null;
}

/** What a source offers for a title: the one it declares, and its first heading. */
export interface SourceTitle {
  declared: string | null;
  heading: string | null;
}

/** What `build` throws for a page over the size limit; anything else it throws is content it cannot store. */
export class PageTooLarge extends Error {}

export interface Renderer {
  /** Throws PageTooLarge when the page is too large, and an Error when the island in the source is malformed. */
  build(input: RenderInput): RenderedPage;
  title(source: string, kind: SourceKind): SourceTitle;
}

export interface Logger {
  info(obj: Record<string, unknown>, msg?: string): void;
  warn(obj: Record<string, unknown>, msg?: string): void;
  error(obj: Record<string, unknown>, msg?: string): void;
  child(bindings: Record<string, unknown>): Logger;
}

export const silentLogger: Logger = {
  info() {},
  warn() {},
  error() {},
  child: () => silentLogger,
};
