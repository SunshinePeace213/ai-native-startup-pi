// A small Markdown renderer for .md artifacts: headings, paragraphs, fenced
// code, lists, blockquotes, rules, pipe tables, and the inline set (code,
// strong, emphasis, links, images). A ```mermaid fence becomes the
// <pre class="mermaid"> the page runtime draws. Raw HTML in the source is
// escaped, never passed through — the page's only script is the runtime.
// Enough for plan documents and reports; anything richer is written as HTML.

/**
 * The Markdown look: one column on its own ground, light and dark (the
 * viewer's stamped data-theme first, the system otherwise). Every rule hangs
 * off `.md`, the element the rendered body sits in.
 */
export const MARKDOWN_STYLE = [
  ".md{--md-bg:#fff;--md-fg:#1b1f24;--md-muted:#5b6470;--md-line:#e3e6ea;--md-card:#f6f8fa;--md-accent:#3b5bdb;color-scheme:light;" +
    "box-sizing:border-box;min-height:100vh;padding:40px max(24px,calc((100% - 860px)/2)) 64px;background:var(--md-bg);color:var(--md-fg);" +
    'font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,Inter,sans-serif}',
  "@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .md{--md-bg:#0f1115;--md-fg:#e6e8eb;--md-muted:#9aa4b2;--md-line:#2a2f37;--md-card:#171a20;--md-accent:#7b93ff;color-scheme:dark}}",
  ":root[data-theme=dark] .md{--md-bg:#0f1115;--md-fg:#e6e8eb;--md-muted:#9aa4b2;--md-line:#2a2f37;--md-card:#171a20;--md-accent:#7b93ff;color-scheme:dark}",
  ".md h1{font-size:2rem;line-height:1.2;margin:0 0 .6em}",
  ".md h2{font-size:1.4rem;margin:1.6em 0 .5em}",
  ".md h3{font-size:1.15rem;margin:1.4em 0 .4em}",
  ".md p,.md ul,.md ol{margin:0 0 1em}",
  ".md a{color:var(--md-accent)}",
  ".md code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.9em;background:var(--md-card);padding:.1em .35em;border-radius:4px}",
  ".md pre{background:var(--md-card);border:1px solid var(--md-line);border-radius:8px;padding:14px 16px;overflow:auto}",
  ".md pre code{background:none;padding:0;font-size:.85em}",
  ".md pre.mermaid{background:none;border:0;padding:0;text-align:center}",
  ".md blockquote{margin:0 0 1em;padding:.2em 1em;border-left:3px solid var(--md-line);color:var(--md-muted)}",
  ".md table{border-collapse:collapse;margin:0 0 1em;width:100%}",
  ".md th,.md td{border:1px solid var(--md-line);padding:6px 10px;text-align:left}",
  ".md th{background:var(--md-card)}",
  ".md hr{border:0;border-top:1px solid var(--md-line);margin:2em 0}",
  ".md li.task{list-style:none;margin-left:-1.2em}",
].join("");

const escapeHtml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const SAFE_URL = /^(https?:|mailto:|#|\/|\.\/|\.\.\/|data:image\/)/i;

function safeUrl(url: string): string {
  const trimmed = url.trim();
  return SAFE_URL.test(trimmed) ? escapeHtml(trimmed) : "#";
}

export function renderInline(text: string): string {
  // Code spans first so their contents are never re-parsed.
  const parts = text.split(/(`[^`]*`)/);
  return parts
    .map((part) => {
      if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
        return `<code>${escapeHtml(part.slice(1, -1))}</code>`;
      }
      let out = escapeHtml(part);
      out = out.replace(
        /!\[([^\]]*)\]\(([^)\s]+)\)/g,
        (_m, alt: string, url: string) => `<img alt="${alt}" src="${safeUrl(url)}">`,
      );
      out = out.replace(
        /\[([^\]]+)\]\(([^)\s]+)\)/g,
        (_m, label: string, url: string) => `<a href="${safeUrl(url)}">${label}</a>`,
      );
      out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      out = out.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, "$1<em>$2</em>");
      out = out.replace(/(^|[^_\w])_([^_\n]+)_(?!\w)/g, "$1<em>$2</em>");
      return out;
    })
    .join("");
}

const isTableRow = (line: string) => /^\s*\|.*\|\s*$/.test(line);
const isTableRule = (line: string) => /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(line);
const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

/** Renders a Markdown document body to HTML. Front matter (--- … ---) is dropped. */
export function renderMarkdown(source: string): string {
  let lines = source.replace(/\r\n?/g, "\n").split("\n");
  if (lines[0]?.trim() === "---") {
    const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
    if (end > 0) lines = lines.slice(end + 1);
  }

  const out: string[] = [];
  let i = 0;
  const paragraph: string[] = [];
  const flushParagraph = () => {
    if (paragraph.length) {
      out.push(`<p>${renderInline(paragraph.join(" ").trim())}</p>`);
      paragraph.length = 0;
    }
  };

  while (i < lines.length) {
    const line = lines[i] ?? "";
    const fence = /^\s*(```|~~~)\s*([\w-]*)\s*$/.exec(line);
    if (fence) {
      flushParagraph();
      const marker = fence[1] ?? "```";
      const lang = fence[2] ?? "";
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !(lines[i] ?? "").trim().startsWith(marker)) {
        body.push(lines[i] ?? "");
        i += 1;
      }
      i += 1;
      const code = escapeHtml(body.join("\n"));
      const cls = lang ? ` class="language-${escapeHtml(lang)}"` : "";
      out.push(
        lang === "mermaid"
          ? `<pre class="mermaid">${code}</pre>`
          : `<pre><code${cls}>${code}</code></pre>`,
      );
      continue;
    }
    const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (heading) {
      flushParagraph();
      const level = (heading[1] ?? "#").length;
      const text = heading[2] ?? "";
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      out.push(`<h${level} id="${escapeHtml(id)}">${renderInline(text)}</h${level}>`);
      i += 1;
      continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      flushParagraph();
      out.push("<hr>");
      i += 1;
      continue;
    }
    if (/^\s*>/.test(line)) {
      flushParagraph();
      const quote: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i] ?? "")) {
        quote.push((lines[i] ?? "").replace(/^\s*>\s?/, ""));
        i += 1;
      }
      out.push(`<blockquote>${renderMarkdown(quote.join("\n"))}</blockquote>`);
      continue;
    }
    const listItem = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line);
    if (listItem) {
      flushParagraph();
      const ordered = /\d/.test(listItem[2] ?? "");
      const tag = ordered ? "ol" : "ul";
      const items: string[] = [];
      while (i < lines.length) {
        const m = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(lines[i] ?? "");
        if (!m || /\d/.test(m[2] ?? "") !== ordered) break;
        let text = m[3] ?? "";
        i += 1;
        // Continuation lines indented under the item join it.
        while (
          i < lines.length &&
          /^\s{2,}\S/.test(lines[i] ?? "") &&
          !/^\s*([-*+]|\d+[.)])\s+/.test(lines[i] ?? "")
        ) {
          text += ` ${(lines[i] ?? "").trim()}`;
          i += 1;
        }
        const task = /^\[([ xX])\]\s+(.*)$/.exec(text);
        if (task) {
          const checked = task[1] !== " " ? " checked" : "";
          items.push(
            `<li class="task"><input type="checkbox" disabled${checked}> ${renderInline(task[2] ?? "")}</li>`,
          );
        } else {
          items.push(`<li>${renderInline(text)}</li>`);
        }
      }
      out.push(`<${tag}>${items.join("")}</${tag}>`);
      continue;
    }
    if (isTableRow(line) && isTableRule(lines[i + 1] ?? "")) {
      flushParagraph();
      const header = splitRow(line);
      const aligns = splitRow(lines[i + 1] ?? "").map((c) =>
        c.startsWith(":") && c.endsWith(":") ? "center" : c.endsWith(":") ? "right" : "left",
      );
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i] ?? "")) {
        rows.push(splitRow(lines[i] ?? ""));
        i += 1;
      }
      const cell = (tag: string, text: string, k: number) =>
        `<${tag} style="text-align:${aligns[k] ?? "left"}">${renderInline(text)}</${tag}>`;
      out.push(
        `<table><thead><tr>${header.map((h, k) => cell("th", h, k)).join("")}</tr></thead>` +
          `<tbody>${rows.map((r) => `<tr>${r.map((c, k) => cell("td", c, k)).join("")}</tr>`).join("")}</tbody></table>`,
      );
      continue;
    }
    if (line.trim() === "") {
      flushParagraph();
      i += 1;
      continue;
    }
    paragraph.push(line);
    i += 1;
  }
  flushParagraph();
  return out.join("\n");
}

/** The first level-one heading of a Markdown document, or null. */
export function markdownTitle(source: string): string | null {
  const m = /^#\s+(.+?)\s*#*\s*$/m.exec(source);
  return m?.[1]?.trim() || null;
}
