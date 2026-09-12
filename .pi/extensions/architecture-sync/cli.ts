// Bun entry point; importing the generator from Pi never runs this CLI.
import { parseArgs } from "node:util";
import { architecture } from "./tree";

if (import.meta.main) {
  try {
    const { values } = parseArgs({
      args: process.argv.slice(2),
      options: {
        print: { type: "boolean" },
        check: { type: "boolean" },
        write: { type: "boolean" },
        root: { type: "string" },
        help: { type: "boolean", short: "h" },
      },
      strict: true,
      allowPositionals: false,
    });
    if (values.help) {
      console.log(
        "Usage: bun .pi/extensions/architecture-sync/cli.ts (--print | --check | --write) [--root PATH]",
      );
    } else {
      const modes = (["print", "check", "write"] as const).filter((mode) => values[mode]);
      if (modes.length !== 1) throw new Error("Choose exactly one of --print, --check, --write");
      const mode = modes[0]!;
      const result = await architecture(values.root ?? process.cwd(), mode);
      if (mode === "print") console.log(result.tree);
      else if (mode === "check" && result.changed) {
        console.error(
          "FAIL ARCHITECTURE.md: generated tree is stale; run bun run architecture:sync",
        );
        process.exitCode = 1;
      } else console.log(`ARCHITECTURE.md: ${result.changed ? "updated" : "current"}`);
      if (result.missingDescriptions.length)
        console.error(
          `Descriptions needed in tree.config.json: ${result.missingDescriptions.join(", ")}`,
        );
    }
  } catch (error) {
    console.error(`Architecture sync: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  }
}
