# Technology Stack

## Core Technologies

| Concern                | Choice                   | Reason                                      |
| ---------------------- | ------------------------ | ------------------------------------------- |
| Runtime                | Node.js (LTS)            | Universal, tooling-rich                     |
| Language               | TypeScript (strict)      | Safety, IDE ergonomics                      |
| Linter/Formatter       | Biome                    | Fast, single-tool, zero config drift        |
| Test runner            | Vitest                   | Native TS, fast, compatible with Vite       |
| Git hooks              | Husky + lint-staged      | Enforce quality at commit time              |
| Web server             | Fastify                  | Typed, fast, plugin ecosystem               |
| UI framework           | React (Vite)             | Component model suits kanban                |
| UI components          | shadcn/ui                | Unstyled, composable, copy-owned components |
| UI styling             | Tailwind CSS             | Required by shadcn/ui; utility-first        |
| Icons                  | Lucide React             | Consistent, clean icon set; no emoji        |
| Tailwind class sorting | Biome `useSortedClasses` | See note below                              |

**Tailwind class sorting — known trade-off**

`prettier-plugin-tailwindcss` is the industry standard for sorting Tailwind classes but is a Prettier plugin. Running Prettier alongside Biome for formatting creates toolchain conflicts in CI and pre-commit hooks — don't do it.

`eslint-plugin-tailwindcss` is compatible with Biome (ESLint for this concern only, Biome for everything else) but adds a second lint toolchain to configure and maintain.

**Decision: use Biome's `useSortedClasses` rule only.** It handles standard Tailwind utilities correctly. Its known limitation — it doesn't read `tailwind.config.ts` for custom classes or plugins — is not a practical problem for this project, which uses stock Tailwind utilities and shadcn/ui without heavy customisation. If that changes, the contained fix is to replace Biome's formatter with Prettier at that point, not to run two formatters now.

| Concern        | Choice                               | Reason                                   |
| -------------- | ------------------------------------ | ---------------------------------------- |
| State (server) | SQLite via `better-sqlite3`          | Local-first, zero infra, fast            |
| State (client) | Zustand or Jotai                     | Lightweight, TS-friendly                 |
| CLI            | `commander`                          | Mature, typed                            |
| MCP server     | `@modelcontextprotocol/sdk`          | Official SDK                             |
| GitHub sync    | `@octokit/rest` + `@octokit/graphql` | REST for issues, GraphQL for Projects v2 |
| Job queue      | `p-queue` + interval                 | Background sync, no infra needed         |

## Environment Consistency

| File             | Purpose                                                                                                                                         |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `.npmrc`         | Enforce `pnpm` strictness, node-linker=hoisted (if needed by React Native/Electron/etc, otherwise defaulted), and prevent phantom dependencies. |
| `packageManager` | Lock `pnpm` version in `package.json` to ensure deterministic builds across all environments.                                                   |

## Build Scripts

```json
{
  "scripts": {
    "dev": "concurrently 'pnpm --filter server dev' 'pnpm --filter web dev'",
    "dev:server": "pnpm --filter server dev",
    "dev:web": "pnpm --filter web dev",
    "dev:cli": "pnpm --filter cli dev",
    "dev:mcp": "pnpm --filter mcp dev",
    "build": "pnpm -r build",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "biome check .",
    "lint:fix": "biome check --apply .",
    "typecheck": "tsc -b --noEmit",
    "prepare": "husky"
  }
}
```

## Quality Gates (Husky)

```yaml
pre-commit:
  biome check --apply          # format + lint, auto-fix staged files
  vitest run --changed         # tests for changed files only

commit-msg:
  conventional commits lint    # enforces feat/fix/chore/docs/etc. prefix

pre-push:
  vitest run                   # full suite
  tsc -b --noEmit              # type check all packages
```
