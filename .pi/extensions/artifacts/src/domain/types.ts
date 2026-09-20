// The shapes every layer agrees on: what sits on disk under
// .pi/artifacts/<slug>/, what a page sends back, what the server tells a
// session, and the configuration. Nothing here touches the filesystem or the
// network, and nothing references a runtime: the Bun server process, the
// Node-hosted session side, and the tests all import it.

/** A JSON object the page and the session both read: the data island. */
export type Island = Record<string, unknown>;

export type SourceKind = "html" | "md";

/** One supporting file of a version, as the version's file map records it. */
export interface FileRecord {
  sha256: string;
  /** A bare media type: `text/css`, `image/png`. */
  contentType: string;
  bytes: number;
}

/** A version's supporting files, published path → record; complete for its version. */
export type FileMap = Record<string, FileRecord>;

/** One supporting file on the wire: its bytes in base64, and its media type when the path does not say. */
export interface FileUpload {
  base64: string;
  contentType?: string;
}

/** One publish: the agent's, or the viewer's through the page's own `artifact` capability. */
export interface VersionRecord {
  n: number;
  at: string;
  /** The session that published it, or VIEWER. */
  by: string;
  bytes: number;
  /** A few words naming this publish, at most MAX_LABEL characters. */
  label?: string;
  /** How many supporting files the version holds, and their bytes; absent when it has none. */
  files?: number;
  fileBytes?: number;
  /** What the version declared its page may use; absent when nothing. */
  capabilities?: Capabilities;
}

/** What an artifact declares its page may use at run time: capability name → config. */
export type Capabilities = Record<string, Record<string, unknown>>;

/**
 * The type an artifact was made from. The published paths it came with — its
 * page, `index.html`, among them — stay the type's: read-only, whoever publishes.
 */
export interface TypeRef {
  name: string;
  paths: string[];
}

/** Who a version is attributed to when the viewer published it from the page. */
export const VIEWER = "viewer";

/** One send from the page, bound to the version it answered. */
export interface ResponseRecord {
  /** Ordinal within the version: v2-r1, v2-r2 … */
  r: number;
  version: number;
  at: string;
  /** Whether the browser reported a user gesture behind the send. */
  gesture: boolean;
  bytes: number;
}

export type PendingKind = "response" | "comment";

/** An event the page produced that no session has acknowledged yet. */
export interface PendingEvent {
  id: string;
  at: string;
  kind: PendingKind;
  version: number;
  response?: number;
  threadId?: string;
}

export interface CommentMessage {
  id: string;
  at: string;
  author: "user" | "agent";
  text: string;
}

export interface CommentThread {
  id: string;
  createdAt: string;
  /** Free text naming what the thread is about, e.g. a heading or a question id. */
  anchor?: string;
  /** Whether the commenter sent the thread to the agent; plain threads never wake it. */
  toAgent: boolean;
  resolved: boolean;
  messages: CommentMessage[];
}

/** One line a viewer's browser captured: console output, an error, a failed load. */
export interface Diagnostic {
  at: string;
  version: number;
  level: "log" | "warn" | "error";
  message: string;
}

export interface Manifest {
  slug: string;
  title: string;
  description?: string;
  /** One generic word (`chart`, `camera`) the viewer shell maps to its tab icon. */
  icon?: string;
  /** Set once the user renamed the page in the viewer shell: a publish no longer retitles it. */
  renamed?: boolean;
  source: SourceKind;
  /** The project-relative file the agent published, when it came from a file. */
  sourcePath?: string;
  createdAt: string;
  updatedAt: string;
  /** The last publish, response, comment, or view: the retention clock. */
  lastActivityAt: string;
  /** The current version. */
  current: number;
  versions: VersionRecord[];
  responses: ResponseRecord[];
  /** Whether sends from the page should reach a session; sends are stored either way. */
  watched: boolean;
  /** The session a send wakes: the one that created, last published, or adopted it. */
  owner: string;
  /** Every session that published or watched it. */
  sessions: string[];
  /** Exempt from retention. */
  pinned: boolean;
  pending: PendingEvent[];
  /** The current declaration; a publish that names none carries it forward. Absent when nothing is declared. */
  capabilities?: Capabilities;
  /** Set when the artifact was made from a type: a publish then changes only the artifact's own files. */
  type?: TypeRef;
}

/** What the page posts to respond. */
export interface PageRespondBody {
  base_version: number;
  data: Island;
  gesture?: boolean;
}

/** Validation of a questions island, as the server computed it. */
export interface Validation {
  ok: boolean;
  errors: string[];
  /** Ids of required, visible questions with no answer. */
  unanswered: string[];
  answered: number;
  total: number;
}

/**
 * What the server tells a session about a page event, over the event stream
 * or the pending list. Everything the envelope needs travels with it, so the
 * session never re-reads the store to deliver.
 */
export interface PageEvent {
  pendingId: string;
  slug: string;
  title: string;
  owner: string;
  watched: boolean;
  kind: PendingKind;
  version: number;
  response?: number;
  gesture?: boolean;
  at: string;
  island: Island | null;
  validation: Validation | null;
  thread?: CommentThread;
}

/** What every connected session hears when an event has no session to wake. */
export interface HeldNotice {
  kind: "held";
  slug: string;
  title: string;
  owner: string;
  pending: number;
}

/** What every connected session hears when an artifact is deleted: its badge goes with it. */
export interface RemovedNotice {
  kind: "removed";
  slug: string;
}

export type StreamMessage = PageEvent | HeldNotice | RemovedNotice;

export interface PublishRequest {
  /** The page. Left out only when republishing an artifact made from a type, whose page is carried as it stands. */
  kind?: SourceKind;
  source?: string;
  /** New artifacts only: the type this one is made from, and which of the files it brings are the type's. */
  type?: TypeRef;
  /** `undefined` reads the island from the source; `null` publishes without one. */
  island?: Island | null;
  title?: string;
  description?: string;
  icon?: string;
  /** Update this existing artifact instead of creating one. */
  update?: string;
  /** Refuse the update when the current version is not this one. */
  baseVersion?: number;
  /** The path to create the new artifact at; default from the title. */
  slug?: string;
  sourcePath?: string;
  label?: string;
  /** Supporting files, by published path: content adds or replaces one, `null` removes one, a path left out is kept. */
  files?: Record<string, FileUpload | null>;
  /** The declaration: omitted keeps the stored one, `{}` clears it, anything else replaces it whole. */
  capabilities?: Capabilities;
  /** The session publishing; it owns wakes for this artifact from now on. */
  session: string;
}

export interface PublishResponse {
  manifest: Manifest;
  version: number;
  island: Island | null;
  validation: Validation | null;
  created: boolean;
  /** The supporting files the new version holds. */
  files: FileMap;
}

/** What the server writes beside the store once it is listening. */
export interface ServerRecord {
  pid: number;
  port: number;
  origin: string;
  root: string;
  startedAt: string;
}

/** What /api/health answers, to anyone: enough to tell whose server this is. */
export interface Health {
  ok: true;
  pid: number;
  port: number;
  root: string;
  startedAt: string;
  /** A short digest of the session token, so a rotation is visible without the token. */
  tokenId: string;
  subscribers: number;
}

/** What /api/status answers a session: what /artifacts shows of the server, never a secret. */
export interface ServerStatus {
  origin: string;
  pid: number;
  port: number;
  root: string;
  startedAt: string;
  isolation: Isolation;
  retentionDays: number;
  /** Connected session ids, longest-connected first. */
  sessions: string[];
  /** How many artifacts the store holds, how many are pinned, and how many replies wait on them. */
  artifacts: { total: number; pinned: number; pending: number };
}

/** What the viewer shell draws its header from: GET /a/<slug>/state. */
export interface ViewerState {
  slug: string;
  title: string;
  icon?: string;
  current: number;
  versions: Array<Pick<VersionRecord, "n" | "at" | "label">>;
  pinned: boolean;
  /** Whether the session that owns the page is connected: a send reaches it now. */
  connected: boolean;
}

/** What the shell hands a frame in its `init`: GET /a/<slug>/data?v=<n>. */
export interface FrameData {
  version: number;
  /** The version's island with the newest reply to it laid over. */
  island: Island | null;
  /** The capabilities served to this page: what it declared that this host runs, and what every page gets. */
  caps: Capabilities;
}

export type Delivery = "wake" | "notify";

/**
 * How a page is kept apart from the shell and from other pages: an origin of
 * its own (`<slug>.localhost`), or — where that name does not resolve — the
 * shell host with a sandbox that gives the frame an opaque origin.
 */
export type Isolation = "origin" | "sandbox";

export interface Config {
  /** The only port the server binds; taken means the publish fails and says why. */
  port: number;
  autoOpen: boolean;
  delivery: Delivery;
  askTimeoutSeconds: number;
  wakesPerHour: number;
  /** Leave the server running when the session ends, so links keep working. */
  keepAlive: boolean;
  /** Artifacts and logs idle for longer than this are swept. */
  retentionDays: number;
  isolation: Isolation;
  /** The bun binary to launch the server with; default: found on PATH or ~/.bun. */
  bun?: string;
}

export const DEFAULT_PORT = 5834;

export const DEFAULT_CONFIG: Config = {
  port: DEFAULT_PORT,
  autoOpen: true,
  delivery: "wake",
  askTimeoutSeconds: 600,
  wakesPerHour: 60,
  keepAlive: true,
  retentionDays: 14,
  isolation: "origin",
};

/** The published page may not exceed this once wrapped; Claude Code's limit. */
export const MAX_PAGE_BYTES = 16 * 1024 * 1024;
/** A request body larger than this is refused before parsing. */
export const MAX_POST_BYTES = 2 * 1024 * 1024;
/** A publish carries a whole page and up to 64 MiB of supporting files in base64; allow both plus headroom. */
export const MAX_API_BYTES = MAX_PAGE_BYTES + 88 * 1024 * 1024;
/** Diagnostics kept per artifact. */
export const MAX_DIAGNOSTICS = 200;
/** A version label is a few words; Claude Code's limit. */
export const MAX_LABEL = 60;
export const MAX_TITLE = 200;
