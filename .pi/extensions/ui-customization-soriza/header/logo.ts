// The S/Z monogram: two figlet "ANSI Shadow" letters, Z tucked under S so S's
// shadow cuts into it. Composition is a cell grid with an owner per cell; S is
// painted over Z wherever both have a glyph. The painters receive runs of
// same-owner text so the theme colours them without per-character escapes.

const S = ["███████╗", "██╔════╝", "███████╗", "╚════██║", "███████║", "╚══════╝"];
const Z = ["███████╗", "╚══███╔╝", "  ███╔╝ ", " ███╔╝  ", "███████╗", "╚══════╝"];
const Z_ROW = 2;
const Z_COL = 6;

type Owner = "s" | "z" | " ";

export interface LogoPainters {
  s: (text: string) => string;
  z: (text: string) => string;
}

export function monogramWidth(): number {
  return Math.max(S[0]!.length, Z_COL + Z[0]!.length);
}

/** Lines of equal visible width; every glyph painted by its letter's painter. */
export function monogram(paint: LogoPainters): string[] {
  const height = Math.max(S.length, Z_ROW + Z.length);
  const width = monogramWidth();
  const cells: { owner: Owner; ch: string }[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ owner: " ", ch: " " })),
  );
  const place = (glyph: string[], row0: number, col0: number, owner: Owner) => {
    glyph.forEach((line, r) => {
      [...line].forEach((ch, c) => {
        if (ch === " ") return;
        const cell = cells[row0 + r]![col0 + c]!;
        if (cell.owner === "s") return; // S is on top
        cell.owner = owner;
        cell.ch = ch;
      });
    });
  };
  place(S, 0, 0, "s");
  place(Z, Z_ROW, Z_COL, "z");

  return cells.map((row) => {
    let out = "";
    let run = "";
    let owner: Owner = " ";
    const flush = () => {
      if (!run) return;
      out += owner === "s" ? paint.s(run) : owner === "z" ? paint.z(run) : run;
      run = "";
    };
    for (const cell of row) {
      if (cell.owner !== owner) {
        flush();
        owner = cell.owner;
      }
      run += cell.ch;
    }
    flush();
    return out;
  });
}
