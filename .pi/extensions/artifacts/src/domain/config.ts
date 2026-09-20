// The configuration rule: .pi/artifacts.json over the defaults, one key at a
// time. A malformed file or a bad value falls back to the default for that
// key; the extension never refuses to start over configuration. Reading the
// file is the caller's job (infra); this is the parse.

import { type Config, DEFAULT_CONFIG } from "./types";

export const CONFIG_FILE = ".pi/artifacts.json";

export function parseConfig(raw: unknown): Config {
  const out = { ...DEFAULT_CONFIG };
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return out;
  const r = raw as Record<string, unknown>;
  if (typeof r.port === "number" && Number.isInteger(r.port) && r.port >= 1 && r.port <= 65535) {
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
  if (typeof r.retentionDays === "number" && r.retentionDays >= 1) {
    out.retentionDays = Math.floor(r.retentionDays);
  }
  if (r.isolation === "origin" || r.isolation === "sandbox") out.isolation = r.isolation;
  if (typeof r.bun === "string" && r.bun.trim()) out.bun = r.bun.trim();
  return out;
}
