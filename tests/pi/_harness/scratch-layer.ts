// A throwaway project holding a minimal llm-wiki layer and its engine marker, so
// layerRoot() resolves and protectedPath() can walk real directories and symlinks.
// Never the repo's own llm-wiki/.

import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface ScratchLayer {
  root: string;
  /** Repo-relative path joined to the root. */
  at(rel: string): string;
}

export function scratchLayer(): ScratchLayer {
  const root = mkdtempSync(join(tmpdir(), "llm-wiki-test-"));
  for (const dir of [
    "llm-wiki/states/inbox",
    "llm-wiki/states/observations",
    "llm-wiki/wiki/concepts",
    "llm-wiki/raw/notes",
    "llm-wiki/raw/assets",
    "llm-wiki/schemas",
    "llm-wiki/evals",
    "scripts/llm-wiki",
    "docs/llm-wiki",
  ]) {
    mkdirSync(join(root, dir), { recursive: true });
  }
  writeFileSync(join(root, "llm-wiki", "states", "claims.jsonl"), "");
  writeFileSync(join(root, "llm-wiki", "governance.json"), "{}");
  writeFileSync(join(root, "llm-wiki", "wiki", "index.md"), "");
  writeFileSync(join(root, "llm-wiki", "wiki", "log.md"), "");
  writeFileSync(join(root, "scripts", "llm-wiki", "state.py"), "");
  return { root, at: (rel) => join(root, rel) };
}
