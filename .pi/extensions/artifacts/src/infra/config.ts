// Reads .pi/artifacts.json from the project, if present; the parse is the
// domain's. A missing or malformed file is the defaults.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { CONFIG_FILE, parseConfig } from "../domain/config";
import type { Config } from "../domain/types";

export function readConfig(cwd: string): Config {
  const path = join(cwd, CONFIG_FILE);
  if (!existsSync(path)) return parseConfig(undefined);
  try {
    return parseConfig(JSON.parse(readFileSync(path, "utf8")));
  } catch {
    return parseConfig(undefined);
  }
}
