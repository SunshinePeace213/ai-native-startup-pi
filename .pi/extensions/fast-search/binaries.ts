// Which ripgrep and fd this machine has. The same order Pi's own tools use:
// the binary Pi manages under ~/.pi/agent/bin first, then the shell's PATH,
// where Debian and Ubuntu ship fd as `fdfind`. A probe is `<path> --version`;
// anything that fails, times out, or prints no version counts as absent.

import { join } from "node:path";

export type Tool = "rg" | "fd";

export interface Binary {
  /** The command as it is spawned: an absolute managed path or a PATH name. */
  path: string;
  version: string;
}

export type Binaries = Partial<Record<Tool, Binary>>;

/** Stdout of `<path> --version`, or null when it cannot run. */
export type Probe = (path: string) => Promise<string | null>;

const PATH_NAMES: Record<Tool, string[]> = { rg: ["rg"], fd: ["fd", "fdfind"] };
const MANAGED_NAME: Record<Tool, string> = { rg: "rg", fd: "fd" };
const LABEL: Record<Tool, string> = { rg: "ripgrep", fd: "fd" };

function parseVersion(output: string): string | null {
  return /\b(\d+\.\d+(?:\.\d+)?)\b/.exec(output.split("\n")[0] ?? "")?.[1] ?? null;
}

async function probeOne(probe: Probe, path: string): Promise<Binary | null> {
  let output: string | null;
  try {
    output = await probe(path);
  } catch {
    return null;
  }
  if (output === null) return null;
  const version = parseVersion(output);
  return version === null ? null : { path, version };
}

/** Resolve both tools; a tool that resolves nowhere is simply absent from the result. */
export async function resolveBinaries(probe: Probe, managedBinDir: string): Promise<Binaries> {
  const found: Binaries = {};
  for (const tool of ["rg", "fd"] as const) {
    const candidates = [join(managedBinDir, MANAGED_NAME[tool]), ...PATH_NAMES[tool]];
    for (const candidate of candidates) {
      const binary = await probeOne(probe, candidate);
      if (binary) {
        found[tool] = binary;
        break;
      }
    }
  }
  return found;
}

/** How to get a missing tool onto this machine. */
export function installHint(tool: Tool): string {
  return tool === "rg"
    ? "install ripgrep: `sudo apt install ripgrep` · `brew install ripgrep` · `cargo install ripgrep`"
    : "install fd: `sudo apt install fd-find` (installs as `fdfind`, which is found) · `brew install fd` · `cargo install fd-find`";
}

/** The footer status: names what is missing, and is empty when nothing is. */
export function statusText(binaries: Binaries): string {
  const missing = (["rg", "fd"] as const).filter((tool) => !binaries[tool]);
  return missing.length ? `🔍 ${missing.join("+")} missing` : "";
}

/** The `/fast-search` report: paths, versions, and install hints for the gaps. */
export function report(binaries: Binaries): string {
  const rows = (["rg", "fd"] as const).map((tool) => {
    const binary = binaries[tool];
    return binary
      ? `${LABEL[tool]} ${binary.version} (${binary.path})`
      : `${LABEL[tool]} MISSING — ${installHint(tool)}`;
  });
  return `fast-search · grep → ${rows[0]} · find → ${rows[1]}`;
}
