// The shapes every layer agrees on: what sits on disk under
// .pi/artifacts/<slug>/, what a page sends back, what the server tells a
// session, and the configuration. Nothing here touches the filesystem or the
// network, and nothing references a runtime: the Bun server process, the
// Node-hosted session side, and the tests all import it.

/** A JSON object the page and the session both read: the data island. */
export type Island = Record<string, unknown>;

export type SourceKind = "html" | "md";

/** One agent publish. Versions are agent publishes only. */
export interface VersionRecord {
  n: number;
  at: string;
  /** The session that published it. */
  by: string;
  bytes: number;
  note?: string;
}

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
  /** A single emoji used for the browser-tab icon. */
  icon?: string;
  source: SourceKind;
  /** The project-relative file the agent published, when it came from a file. */
  sourcePath?: string;
  createdAt: string;
  updatedAt: string;
  /** The last publish, response, comment, or view: the retention clock. */
  lastActivityAt: string;
  /** The current agent version. */
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

export type StreamMessage = PageEvent | HeldNotice;

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
  /** Refuse the update when the current version is not this one. */
  baseVersion?: number;
  /** The path to create the new artifact at; default from the title. */
  slug?: string;
  sourcePath?: string;
  note?: string;
  /** The session publishing; it owns wakes for this artifact from now on. */
  session: string;
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

export type Delivery = "wake" | "notify";

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
};

/** The published page may not exceed this once wrapped; Claude Code's limit. */
export const MAX_PAGE_BYTES = 16 * 1024 * 1024;
/** A request body larger than this is refused before parsing. */
export const MAX_POST_BYTES = 2 * 1024 * 1024;
/** An agent publish carries a whole source file; allow the page limit plus headroom. */
export const MAX_API_BYTES = MAX_PAGE_BYTES + 1024 * 1024;
/** Diagnostics kept per artifact. */
export const MAX_DIAGNOSTICS = 200;
