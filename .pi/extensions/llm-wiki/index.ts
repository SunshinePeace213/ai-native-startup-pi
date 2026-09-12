// The llm-wiki extension: the knowledge base's presence in every Pi turn.
//
//   session_start        → the ingest queue and inbox, delivered with the next prompt
//   before_agent_start   → the top leads for the prompt, as a persistent context message
//   tool_call            → a write or bash command aimed at an engine- or renderer-owned
//                          file is blocked, naming the verb to run instead
//   tool_result (write)  → a new archive under llm-wiki/raw/ that no source registers
//                          gets the ingest reminder appended
//
// It shells out to scripts/llm-wiki/ through pi.exec, calls no model, writes
// nothing, and fails open everywhere except a confirmed protected path.

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { relative } from "node:path";

import { type ExecFn, inboxCount, layerRoot, queue, search } from "./engine";
import {
  formatLeads,
  formatQueue,
  formatUnregistered,
  groundable,
  MAX_GROUNDING_LEADS,
} from "./format";
import { bashTargets, protectedPath, realpathLenient } from "./guard";

const QUEUE_TIMEOUT_MS = 25_000;
const SEARCH_TIMEOUT_MS = 15_000;
const STATUS_KEY = "llm-wiki";

function rawArchive(path: unknown, root: string, cwd: string): string | null {
  if (typeof path !== "string" || !path.trim()) return null;
  const absolute = realpathLenient(path.startsWith("/") ? path : `${cwd}/${path}`);
  const rel = relative(realpathLenient(root), absolute);
  if (!rel.startsWith("llm-wiki/raw/") || rel.startsWith("llm-wiki/raw/assets/")) return null;
  return rel.endsWith(".md") ? rel : null;
}

export default function (pi: ExtensionAPI) {
  const exec: ExecFn = (command, args, options) => pi.exec(command, args, options);
  let skipGrounding = false;

  pi.on("session_start", async (_event, ctx) => {
    const root = layerRoot(ctx.cwd);
    if (!root) return;
    const result = await queue(exec, root, QUEUE_TIMEOUT_MS);
    if (!result) return;
    const inbox = inboxCount(root);
    if (ctx.hasUI) {
      ctx.ui.setStatus(
        STATUS_KEY,
        result.total || inbox ? `wiki queue ${result.total} · inbox ${inbox}` : "",
      );
    }
    if (result.total === 0 && inbox === 0) return;
    pi.sendMessage(
      { customType: "llm-wiki-queue", content: formatQueue(result, inbox), display: true },
      { deliverAs: "nextTurn" },
    );
  });

  // A `/skill:` or `/template` turn reaches before_agent_start already expanded,
  // so the decision is taken here on the raw text.
  pi.on("input", async (event) => {
    skipGrounding = !groundable(event.text);
  });

  pi.on("before_agent_start", async (event, ctx) => {
    const skip = skipGrounding;
    skipGrounding = false;
    if (skip) return;
    const root = layerRoot(ctx.cwd);
    if (!root || !groundable(event.prompt)) return;
    const result = await search(
      exec,
      root,
      event.prompt.trim(),
      MAX_GROUNDING_LEADS,
      SEARCH_TIMEOUT_MS,
    );
    if (!result) return;
    const block = formatLeads(result);
    if (!block) return;
    return { message: { customType: "llm-wiki-leads", content: block, display: false } };
  });

  pi.on("tool_call", async (event, ctx) => {
    const root = layerRoot(ctx.cwd);
    if (!root) return;
    const input = event.input as Record<string, unknown>;
    if (event.toolName === "write" || event.toolName === "edit") {
      if (typeof input.path !== "string") return;
      const denial = protectedPath(input.path, root, ctx.cwd);
      if (denial) return { block: true, reason: denial };
      return;
    }
    if (event.toolName === "bash" && typeof input.command === "string") {
      for (const target of bashTargets(input.command)) {
        const denial = protectedPath(target, root, ctx.cwd);
        if (denial) return { block: true, reason: denial };
      }
    }
  });

  pi.on("tool_result", async (event, ctx) => {
    if (event.toolName !== "write" || event.isError) return;
    const root = layerRoot(ctx.cwd);
    if (!root) return;
    const rel = rawArchive((event.input as Record<string, unknown>).path, root, ctx.cwd);
    if (!rel) return;
    const result = await queue(exec, root, QUEUE_TIMEOUT_MS);
    if (!result || !result.unregistered.some((row) => row.path === rel)) return;
    return { content: [...event.content, { type: "text", text: formatUnregistered(rel) }] };
  });
}
