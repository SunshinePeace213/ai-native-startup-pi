import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import prettier from "eslint-config-prettier";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default defineConfig([
  { ignores: ["node_modules/**", ".venv/**", "dist/**", ".claude/worktrees/**"] },
  {
    // TypeScript is checked by `bun run typecheck` (tsc 7.0.2), not by ESLint.
    // TypeScript 7 dropped the programmatic compiler API that typescript-eslint
    // needs, and ESLint 9's own parser cannot read TS syntax, so `.ts`/`.tsx`
    // are deliberately outside this glob. See docs/setup.md.
    files: ["**/*.{js,jsx,mjs,cjs}"],
    extends: [
      js.configs.recommended,
      react.configs.flat.recommended,
      reactHooks.configs.flat.recommended,
    ],
    // Pinned: `detect` warns on every run while react is not yet installed.
    // Switch to `detect` once react lands as a dependency.
    settings: { react: { version: "19.0" } },
  },
  {
    // The artifact page runtime ships inside every published page and runs in
    // the browser: a classic script (an IIFE, no imports) against DOM globals.
    files: [".pi/extensions/artifacts/page/*.js"],
    languageOptions: {
      sourceType: "script",
      globals: {
        window: "readonly",
        document: "readonly",
        location: "readonly",
        console: "readonly",
        fetch: "readonly",
        EventSource: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
      },
    },
  },
  prettier,
]);
