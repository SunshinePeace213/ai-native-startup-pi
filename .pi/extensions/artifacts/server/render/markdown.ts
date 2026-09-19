// A small Markdown renderer for .md artifacts: headings, paragraphs, fenced
// code, lists, blockquotes, rules, pipe tables, and the inline set (code,
// strong, emphasis, links, images). Raw HTML in the source is escaped, never
// passed through — the page's only script is the runtime the shell adds.
// Enough for plan documents and reports; anything richer is written as HTML.

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
const isTableRule = (line: string) =>
  /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(line);
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
      const cls = lang ? ` class="language-${escapeHtml(lang)}"` : "";
      out.push(`<pre><code${cls}>${escapeHtml(body.join("\n"))}</code></pre>`);
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
