// binaries — how .pi/extensions/fast-search finds ripgrep and fd, seen through
// session_start, the tools, and /fast-search.
//
// B1  both on PATH → the footer stays empty and nothing is notified
// B2  one missing → the status names it and a warning carries the install hint
// B3  Pi's managed ~/.pi/agent/bin copy wins over PATH; Debian's `fdfind` is
//     found when `fd` is not; the report shows the path and version used
// B4  a probe that throws or prints no version counts as absent; nothing crashes
// B5  /fast-search re-probes and reports info when complete, warning otherwise
// B6  a tool missing at session start but installed before the call is found
//     by the call-time re-probe; a present tool is not probed again per call
// B7  no UI → session_start sets no status and notifies nothing

import { describe, expect, test } from "bun:test";
import { join } from "node:path";

import { BOTH, wire } from "../fixture";

describe("fast-search binaries", () => {
  test("B1 both present: nothing in the footer, nothing notified", async () => {
    const w = wire();
    await w.sessionStart();
    expect(w.ctx.status.get("fast-search")).toBe("");
    expect(w.ctx.notifications).toHaveLength(0);
  });

  test("B2 fd missing: named in the status, hinted in a warning", async () => {
    const w = wire({ versions: { rg: "ripgrep 15.1.0" } });
    await w.sessionStart();
    expect(w.ctx.status.get("fast-search")).toBe("🔍 fd missing");
    const warning = w.ctx.notifications.at(-1);
    expect(warning?.type).toBe("warning");
    expect(warning?.message).toMatch(/fd MISSING/);
    expect(warning?.message).toMatch(/sudo apt install fd-find/);
    expect(warning?.message).toMatch(/ripgrep 15\.1\.0 \(rg\)/);
  });

  test("B3 managed copy first, then PATH, fdfind included", async () => {
    const versions: Record<string, string> = { rg: "ripgrep 15.1.0", fdfind: "fd 10.2.0" };
    const w = wire({ versions });
    versions[join(w.managedBinDir, "rg")] = "ripgrep 15.2.0";
    await w.command();
    const message = w.ctx.notifications.at(-1)?.message ?? "";
    expect(message).toContain(`ripgrep 15.2.0 (${join(w.managedBinDir, "rg")})`);
    expect(message).toContain("fd 10.2.0 (fdfind)");
    await w.run("grep", { pattern: "x" });
    expect(w.requests.at(-1)?.bin).toBe(join(w.managedBinDir, "rg"));
    await w.run("find", { pattern: "x" });
    expect(w.requests.at(-1)?.bin).toBe("fdfind");
  });

  test("B4 a throwing or versionless probe is an absent tool", async () => {
    const w = wire({ versions: { rg: "throw", fd: "no version here" } });
    await w.sessionStart();
    expect(w.ctx.status.get("fast-search")).toBe("🔍 rg+fd missing");
  });

  test("B5 /fast-search reports and re-probes", async () => {
    const versions: Record<string, string | null> = { ...BOTH };
    const w = wire({ versions });
    await w.command();
    expect(w.ctx.notifications.at(-1)).toEqual({
      message: "fast-search · grep → ripgrep 15.1.0 (rg) · find → fd 10.5.0 (fd)",
      type: "info",
    });
    delete versions.rg;
    await w.command();
    expect(w.ctx.notifications.at(-1)?.type).toBe("warning");
    expect(w.ctx.status.get("fast-search")).toBe("🔍 rg missing");
    versions.rg = "ripgrep 15.1.0";
    await w.command();
    expect(w.ctx.status.get("fast-search")).toBe("");
  });

  test("B6 a later install is found at call time; a present tool is cached", async () => {
    const versions: Record<string, string | null> = { rg: "ripgrep 15.1.0" };
    const w = wire({ versions, run: { stdout: [] } });
    await w.sessionStart();
    const afterStart = w.probes();
    versions.fd = "fd 10.5.0";
    await w.run("find", { pattern: "*" });
    expect(w.requests.at(-1)?.bin).toBe("fd");
    expect(w.probes()).toBeGreaterThan(afterStart);
    const afterFind = w.probes();
    await w.run("grep", { pattern: "x" });
    await w.run("find", { pattern: "*" });
    expect(w.probes()).toBe(afterFind);
  });

  test("B7 without a UI session_start stays silent", async () => {
    const w = wire({ hasUI: false, versions: {} });
    await w.sessionStart();
    expect(w.ctx.status.size).toBe(0);
    expect(w.ctx.notifications).toHaveLength(0);
  });
});
