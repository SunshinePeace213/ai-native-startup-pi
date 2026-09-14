# TypeScript and lint toolchain

Read this when a typecheck or lint failure looks like a dependency or config
problem rather than a code error. Do not change `package.json` or
`tsconfig.json` on a hunch — the current shape is deliberate.

## What is installed

- One `typescript`: the latest stable **TypeScript 7** line, the Go-native
  compiler. Read the exact pin out of `package.json`; never state a version from
  memory and never downgrade it to make a plugin fit.
- `@types/bun` supplies typing for every Bun built-in. It is a required
  dependency of this repo, not a convenience.
- `tsconfig.json` follows Bun's recommended baseline
  (<https://bun.com/docs/typescript>).

```bash
bun run typecheck   # tsc --noEmit  — covers .ts/.tsx
bun run lint        # eslint        — covers .js/.jsx/.mjs/.cjs only
```

## `"types": ["bun"]` is load-bearing

From TypeScript 6 on, `types` defaults to `[]` rather than pulling in every
`@types/*` package on disk. Removing that line, or missing `@types/bun`, makes
`Bun`, `bun:test`, and `Request` all stop resolving at once
(<https://bun.com/docs/typescript-6>).

| Symptom | Cause | Fix |
| --- | --- | --- |
| `Cannot find name 'Bun'` | `@types/bun` not installed | `bun add -d @types/bun` |
| `Cannot find module 'bun:test'` | same | same |
| `Request`/`fetch` unresolved | `types` array edited | restore `"types": ["bun"]` |
| `tsc: not found` | `bun install` never ran | `bun install` |

## ESLint covers JavaScript only

There is no TypeScript parser in the ESLint setup, and `.ts`/`.tsx` are outside
its globs on purpose: `tsc` is the checker for those files. If a new source path
should be linted or typechecked, add it to `eslint.config.mjs` or
`tsconfig.json` rather than widening a command.

Do not add a TypeScript ESLint plugin to this repo. Doing so would require
pinning `typescript` back to an older major, which is a project-level decision,
not a setup step — report the wish and stop.

## Verifying without the expensive suite

Setup only needs to know the toolchain resolves:

```bash
bun --version
bun run typecheck
```

`bun run check` (typecheck · lint · format · architecture · bun test · pytest)
and `bun run eval:retrieval` belong to a code change. See
`docs/testing.md`.
