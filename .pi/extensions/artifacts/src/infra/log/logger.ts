// Structured logs with pino, one JSON line per action, timed in the local
// zone with its offset (`2026-09-20T07:22:36.062+08:00`):
//
//   <root>/logs/<YYYY-MM-DD>/<session-id>.jsonl   the pi side of one session
//   <root>/logs/<YYYY-MM-DD>/server.jsonl          the server, `session` on each line
//
// The destination is a plain synchronous appender that reopens under the
// day's folder when the local date changes, so a session that crosses
// midnight keeps writing to the right file and neither runtime needs pino's
// worker transports. Secrets are redacted by key; a token never lands here.

import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import pino from "pino";

import type { Logger } from "../../app/ports";
import { localIso, logDate } from "../../domain/retention";

export const LOG_DIR = "logs";

export interface LoggerOptions {
  /** The store root; logs go under <root>/logs. */
  root: string;
  /** The file name inside the day's folder, without extension. */
  name: string;
  /** Fields on every line. */
  base: Record<string, unknown>;
  level?: string;
  now?: () => Date;
}

/** A pino destination that appends to today's file, whichever day it is. */
export function dailyFile(root: string, name: string, now: () => Date = () => new Date()) {
  const file = `${name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 120) || "log"}.jsonl`;
  let day = "";
  let path = "";
  return {
    write(line: string) {
      const today = logDate(now());
      if (today !== day) {
        day = today;
        const dir = join(root, LOG_DIR, day);
        mkdirSync(dir, { recursive: true });
        path = join(dir, file);
      }
      try {
        appendFileSync(path, line);
      } catch {
        // a log that cannot be written never takes the feature down
      }
    },
  };
}

export function createLogger(options: LoggerOptions): Logger {
  const instance = pino(
    {
      level: options.level ?? process.env.ARTIFACTS_LOG_LEVEL ?? "info",
      base: options.base,
      // Local wall clock with its offset: the line reads like the day folder it is in.
      timestamp: () => `,"time":"${localIso((options.now ?? (() => new Date()))())}"`,
      redact: {
        paths: [
          "token",
          "viewer",
          "cookie",
          "headers.cookie",
          "headers.authorization",
          "*.token",
          "*.viewer",
        ],
        censor: "[redacted]",
      },
    },
    dailyFile(options.root, options.name, options.now),
  );
  return wrap(instance);
}

function wrap(instance: pino.Logger): Logger {
  return {
    info: (obj, msg) => instance.info(obj, msg),
    warn: (obj, msg) => instance.warn(obj, msg),
    error: (obj, msg) => instance.error(obj, msg),
    child: (bindings) => wrap(instance.child(bindings)),
  };
}
