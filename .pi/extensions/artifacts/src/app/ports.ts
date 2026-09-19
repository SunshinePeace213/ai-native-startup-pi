// What the use-cases need from the outside world, as interfaces. The store
// is implemented over the filesystem in infra/store, the renderer in
// infra/render; tests may implement either in memory. Nothing in app/
// imports a runtime API.

import type {
  CommentThread,
  Diagnostic,
  Island,
  Manifest,
  PendingEvent,
  ResponseRecord,
  SourceKind,
  VersionRecord,
} from "../domain/types";

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
  note?: string;
  session: string;
}

export interface ResponseInput {
  island: Island;
  /** The current page, re-rendered with the response laid over the version. */
  html: string;
  gesture: boolean;
}

export interface ArtifactStore {
  readonly root: string;
  list(): Manifest[];
  get(slug: string): Manifest | null;
  exists(slug: string): boolean;
  /** The artifact last published from this project-relative path, if any. */
  findBySourcePath(path: string): Manifest | null;
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
  /** The current page, or one pristine version. */
  readPage(slug: string, version?: number): string | null;
  setWatched(slug: string, watched: boolean, session?: string): Manifest;
  setOwner(slug: string, session: string): Manifest;
  setPinned(slug: string, pinned: boolean): Manifest;
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
  title?: string;
  icon?: string;
  slug: string;
  version: number;
  /** The path the runtime posts to, e.g. `/a/<slug>`. */
  endpoint: string;
}

export interface RenderedPage {
  html: string;
  title: string;
  island: Island | null;
}

export interface Renderer {
  /** Throws when the island in the source is malformed or the page is too large. */
  build(input: RenderInput): RenderedPage;
  /** The title a source carries, when it does. */
  title(source: string, kind: SourceKind): string | null;
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
