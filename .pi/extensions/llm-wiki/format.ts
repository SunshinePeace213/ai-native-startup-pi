// The context blocks the extension rides into the session, and the prompt
// eligibility rule. Pure functions so the caps, truncation, and flagging are
// unit-testable without a Pi process.

export const MAX_QUEUE_LINES = 10;
export const MAX_GROUNDING_LEADS = 3;
export const LEAD_TEXT_CHARS = 220;
export const MIN_GROUNDING_WORDS = 4;

const SKIP_PREFIXES = ["/", "!", "#"];

const INGEST_SENTENCE =
  "Run /skill:llm-wiki-ingest --queue to file them on their channel lanes (--light files every one\n" +
  "light). Nothing has been written.";

const GROUNDING_TAIL =
  "How to use these leads:\n" +
  "- A lead whose pages bear on the task → read those pages before acting, and follow\n" +
  "  their sources: into llm-wiki/raw/ when the source's own words matter.\n" +
  "- Leads thin but the task needs stored project or world knowledge → launch the\n" +
  "  llm-wiki-librarian subagent for the full four-stream slice, or run\n" +
  '  `uv run scripts/llm-wiki/retrieve.py search "<question>"` (--intent structural for\n' +
  "  what-connects-to-what, historical for what-changed).\n" +
  "- Search llm-wiki/ only through the retriever or qmd, never ad-hoc grep/find; read of\n" +
  "  a page a lead names is always right.\n" +
  "- Nothing here bears on the task → proceed on your own knowledge; never stretch a\n" +
  "  lead into a citation.";

const NO_LEADS_BLOCK =
  "<llm-wiki>\n" +
  "The keyword and belief streams hold no leads for this prompt. If the task needs stored\n" +
  "project or world knowledge, the wiki may still hold it under other words — launch the\n" +
  'llm-wiki-librarian subagent or run `uv run scripts/llm-wiki/retrieve.py search "<question>"`\n' +
  "(the vec and graph streams). Otherwise proceed on your own knowledge.\n" +
  "</llm-wiki>";

export interface QueueRow {
  path: string;
  channel: string;
  lane: string;
}

export interface QueueResult {
  total: number;
  unregistered: QueueRow[];
  unextracted: QueueRow[];
}

/**
 * Whether a prompt is worth a retrieval pass. Conservative in the skip
 * direction: only shapes carrying no question at all are dropped — a slash
 * command (skills own their own grounding), a `!` shell escape, a `#` line,
 * and anything too short to retrieve on.
 */
export function groundable(prompt: unknown): boolean {
  if (typeof prompt !== "string") return false;
  const text = prompt.trim();
  if (!text || SKIP_PREFIXES.some((prefix) => text.startsWith(prefix))) return false;
  return text.split(/\s+/).length >= MIN_GROUNDING_WORDS;
}

/** The `<llm-wiki-queue>` block session_start sends, capped at MAX_QUEUE_LINES rows. */
export function formatQueue(result: QueueResult, inboxCount = 0): string {
  const { unregistered, unextracted, total } = result;
  const noun = total === 1 ? "archive" : "archives";
  const verb = total === 1 ? "waits" : "wait";
  const lines = [
    "<llm-wiki-queue>",
    `${total} ${noun} under llm-wiki/raw/ ${verb}: ${unregistered.length} unregistered · ` +
      `${unextracted.length} filed light and never extracted.`,
  ];
  if (inboxCount) {
    lines.push(`${inboxCount} proposals wait in states/inbox/ — apply --inbox drains them`);
  }
  const rows = [
    ...unregistered.map((row) => `  ${row.path} · ${row.channel} · ${row.lane} lane`),
    ...unextracted.map((row) => `  ${row.path} · ${row.channel} · ${row.lane} lane · filed light`),
  ];
  const shown = rows.slice(0, MAX_QUEUE_LINES);
  lines.push(...shown);
  if (rows.length > shown.length) lines.push(`  … and ${rows.length - shown.length} more`);
  lines.push(INGEST_SENTENCE, "</llm-wiki-queue>");
  return lines.join("\n");
}

/**
 * The `<llm-wiki>` block before_agent_start injects, or "" when the slice is
 * malformed. A valid slice with zero usable leads yields the no-leads cue, so
 * "nothing found" stays distinguishable from "the extension is broken".
 */
export function formatLeads(result: Record<string, unknown>): string {
  const claims = result.claims;
  if (!Array.isArray(claims)) return "";
  const leads: string[] = [];
  for (const claim of claims.slice(0, MAX_GROUNDING_LEADS)) {
    if (!claim || typeof claim !== "object") continue;
    const record = claim as Record<string, unknown>;
    let text = String(record.current_text ?? "").trim();
    if (!text) continue;
    if (text.length > LEAD_TEXT_CHARS) text = `${text.slice(0, LEAD_TEXT_CHARS - 1).trimEnd()}…`;
    let header = `  ${record.claim_key ?? record.claim_id ?? "?"}`;
    const probability = record.probability;
    if (typeof probability === "number") header += ` · p ${probability.toFixed(2)}`;
    header += ` · ${record.status ?? "unknown"}`;
    const flags = Array.isArray(record.flags) ? record.flags.map(String) : [];
    if (record.needs_review) flags.push("needs_review");
    if (flags.length) header += ` · ⚠ ${flags.join(", ")}`;
    const lead = [header, `    ${text}`];
    const pages = Array.isArray(record.pages) ? record.pages.map(String) : [];
    if (pages.length) lead.push(`    pages: ${pages.join(" · ")}`);
    leads.push(lead.join("\n"));
  }
  if (!leads.length) return NO_LEADS_BLOCK;
  const noun = leads.length === 1 ? "lead" : "leads";
  return [
    "<llm-wiki>",
    `${leads.length} ${noun} the knowledge base holds on this prompt — keyword and belief streams, ranked, unverified.`,
    ...leads,
    GROUNDING_TAIL,
    "</llm-wiki>",
  ].join("\n");
}

/** The one-line reminder appended to a write that landed an unregistered archive. */
export function formatUnregistered(path: string): string {
  return (
    `${path} is an archive no source registers — \`/skill:llm-wiki-ingest ${path}\` files it ` +
    "(`--light` for a bulk drop). Nothing has been written."
  );
}
