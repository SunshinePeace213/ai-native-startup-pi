// Scratch Git repositories only: architecture tests never mutate the real checkout.
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

export const CONFIG = ".pi/extensions/architecture-sync/tree.config.json";
export const DOCUMENT =
  "# Architecture\n\nKeep this explanation.\n\n<!-- architecture-tree:start -->\n```text\nold/\n```\n<!-- architecture-tree:end -->\n\nKeep this ending.\n";

export function fixture() {
  const root = mkdtempSync(join(tmpdir(), "architecture-sync-test-"));
  const put = (path: string, text = "fixture\n") => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  const git = (...args: string[]) =>
    execFileSync("git", ["-C", root, ...args], { encoding: "utf8" });
  git("init", "--quiet");
  put(".gitignore", "node_modules/\n.venv/\n.env\n");
  put(
    CONFIG,
    JSON.stringify(
      {
        name: "fixture",
        depth: 3,
        collapsed: ["llm-wiki/raw"],
        files: ["AGENTS.md", "ARCHITECTURE.md"],
        descriptions: {
          ".pi": "Pi resources",
          ".pi/extensions": "Project extensions",
          ".pi/extensions/architecture-sync": "Architecture map maintenance",
          src: "Application source",
          "src/api": "API handlers",
          "src/api/routes": "HTTP routes",
          tests: "Verification",
          "llm-wiki": "Knowledge base",
          "llm-wiki/raw": "Source archives",
        },
      },
      null,
      2,
    ),
  );
  put("AGENTS.md", "# Instructions\n");
  put("ARCHITECTURE.md", DOCUMENT);
  put("src/api/handler.ts");
  git("add", ".");
  return {
    root,
    put,
    git,
    read: (path = "ARCHITECTURE.md") => readFileSync(join(root, path), "utf8"),
  };
}
