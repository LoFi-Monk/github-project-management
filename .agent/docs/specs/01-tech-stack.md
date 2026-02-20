# Technology Stack

## Core Technologies

| Concern                | Choice                   | Reason                                               |
| ---------------------- | ------------------------ | ---------------------------------------------------- |
| Runtime                | Node.js (LTS)            | Universal, tooling-rich                              |
| Language               | TypeScript (strict)      | Safety, IDE ergonomics                               |
| Linter/Formatter       | Biome                    | Fast, single-tool, zero config drift                 |
| Test runner            | Vitest + Custom Runner   | Native TS, fast; Custom runner for Windows stability |
| Git hooks              | Husky + lint-staged      | Enforce quality at commit time                       |
| Web server             | Fastify                  | Typed, fast, plugin ecosystem                        |
| UI framework           | React (Vite)             | Component model suits kanban                         |
| UI components          | shadcn/ui                | Unstyled, composable, copy-owned components          |
| UI styling             | Tailwind CSS             | Required by shadcn/ui; utility-first                 |
| Icons                  | Lucide React             | Consistent, clean icon set; no emoji                 |
| Tailwind class sorting | Manual                   | See note below                                       |

**Tailwind class sorting**

Biome's `useSortedClasses` nursery rule was initially chosen but proved unstable on Windows, causing false-positive "Duplicate property" errors during the commit flow.

**Decision: Revert to manual sorting.** We prioritize toolchain stability and developer experience on Windows over automated sorting. If automated sorting becomes a hard requirement, we will evaluate stable alternatives like Prettier once the project moves beyond its bootstrap phase.

| Concern        | Choice                               | Reason                                   |
| -------------- | ------------------------------------ | ---------------------------------------- |
| State (server) | SQLite via `@libsql/client`          | Local-first, zero infra, async-first     |
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
    "build": "pnpm -r build",
    "test": "node scripts/test-all.js",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "typecheck": "pnpm -r typecheck",
    "prepare": "husky"
  }
}
```

## Quality Gates (Husky)

```yaml
pre-commit:
  pnpm lint-staged             # biome check --write + vitest run --related

pre-push:
  pnpm test                    # full test suite via custom sequential runner
```
