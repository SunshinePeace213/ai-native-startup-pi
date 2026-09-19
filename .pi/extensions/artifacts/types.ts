// Shared shapes of the artifacts extension: what sits on disk under
// .pi/artifacts/<slug>/, what the page sends back, what the server tells the
// session, and the configuration. Nothing here touches the filesystem or the
// network, and nothing here references a runtime: both the Bun server process
// and the Node-hosted pi side import it.

/** A JSON object the page and the session both read: the data island. */
export type Island = Record<string, unknown>;

export type SourceKind = "html" | "md";

export interface VersionRecord {
  n: number;
  at: string;
  /** Who produced this version: the session's publish, or a send from the page. */
  by: "agent" | "page";
  bytes: number;
  note?: string;
}

export type PendingKind = "republish" | "comment";

/** An event the page produced that no session has acknowledged yet. */
export interface PendingEvent {
  id: string;
  at: string;
  kind: PendingKind;
  version: number;
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

export interface Manifest {
  slug: string;
  title: string;
  description?: string;
  /** A single emoji used for the browser-tab icon. */
  icon?: string;
  source: SourceKind;
  createdAt: string;
  updatedAt: string;
  current: number;
  versions: VersionRecord[];
  /** Whether sends from the page should reach a session; sends are stored either way. */
  watched: boolean;
  /** The session whose turn a send wakes: the one that published, watched, or last acknowledged. */
  owner?: string;
  pending: PendingEvent[];
}

/** What the page posts to republish itself. */
export interface PagePublishBody {
  base_version: number;
  data: Island;
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
  watched: boolean;
  kind: PendingKind;
  version: number;
  previousVersion: number;
  at: string;
  island: Island | null;
  validation: Validation | null;
  thread?: CommentThread;
}

export interface PublishRequest {
  kind: SourceKind;
  source: string;
  /** `undefined` reads the island from the source; `null` publishes without one. */
  island?: Island | null;
  title?: string;
  description?: string;
  icon?: string;
  /** Update this existing artifact instead of creating one. */
  update?: string;
  /** The path to create the new artifact at; default from the title. */
  slug?: string;
  note?: string;
  /** The session that owns wakes for this artifact from now on. */
  owner?: string;
}

export interface PublishResponse {
  manifest: Manifest;
  version: number;
  island: Island | null;
  validation: Validation | null;
  created: boolean;
}

/** What the server writes beside the store once it is listening. */
export interface ServerRecord {
  pid: number;
  port: number;
  requestedPort: number;
  origin: string;
  root: string;
  startedAt: string;
}

export type Delivery = "wake" | "notify";

export interface Config {
  /**
   * The port the server binds; when it is taken the server falls back to a
   * free one and the publish result says so. 0 derives a port from the path.
   */
  port: number;
  autoOpen: boolean;
  delivery: Delivery;
  askTimeoutSeconds: number;
  wakesPerHour: number;
  /** Leave the server running when the session ends, so links keep working. */
  keepAlive: boolean;
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
};

/** The published page may not exceed this once wrapped; Claude Code's limit. */
export const MAX_PAGE_BYTES = 16 * 1024 * 1024;
/** A request body larger than this is refused before parsing. */
export const MAX_POST_BYTES = 2 * 1024 * 1024;
/** An agent publish carries a whole source file; allow the page limit plus headroom. */
export const MAX_API_BYTES = MAX_PAGE_BYTES + 1024 * 1024;
