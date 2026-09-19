// Reads .pi/artifacts.json from the project, if present, over the defaults.
// A malformed file or a bad value falls back to the default for that key; the
// extension never refuses to start over configuration.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { type Config, DEFAULT_CONFIG } from "./types";

export const CONFIG_FILE = ".pi/artifacts.json";

export function readConfig(cwd: string): Config {
  const path = join(cwd, CONFIG_FILE);
  if (!existsSync(path)) return { ...DEFAULT_CONFIG };
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return { ...DEFAULT_CONFIG };
  }
  return parseConfig(raw);
}

export function parseConfig(raw: unknown): Config {
  const out = { ...DEFAULT_CONFIG };
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return out;
  const r = raw as Record<string, unknown>;
  if (typeof r.port === "number" && Number.isInteger(r.port) && r.port >= 0 && r.port <= 65535) {
    out.port = r.port;
  }
  if (typeof r.autoOpen === "boolean") out.autoOpen = r.autoOpen;
  if (r.delivery === "wake" || r.delivery === "notify") out.delivery = r.delivery;
  if (typeof r.askTimeoutSeconds === "number" && r.askTimeoutSeconds > 0) {
    out.askTimeoutSeconds = r.askTimeoutSeconds;
  }
  if (typeof r.wakesPerHour === "number" && r.wakesPerHour >= 1) {
    out.wakesPerHour = Math.floor(r.wakesPerHour);
  }
  if (typeof r.keepAlive === "boolean") out.keepAlive = r.keepAlive;
  if (typeof r.bun === "string" && r.bun.trim()) out.bun = r.bun.trim();
  return out;
}
