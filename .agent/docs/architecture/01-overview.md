# Architecture Overview

This project is a **pnpm monorepo** established to support the development of a local-first kanban system. Currently, it consists of the foundational workspace configuration and the first shared logic package.

## Current Directory Structure

```text
.
├── apps/                 # Application runtimes
│   └── server/           # Fastify server + SQLite storage engine
├── packages/             # Shared libraries and internal tools
│   └── core/             # Core domain logic and models
├── .agent/               # Agent-specific documentation and rules
├── .github/              # CI/CD workflows (GitHub Actions)
└── .husky/               # Git hooks for quality gates
```

## Tooling Strategy

We use a unified toolchain to ensure consistency across the monorepo:

- **Package Management:** `pnpm` for workspace management.
- **Linting & Formatting:** `Biome` (v2.3.15) for unified linting and formatting.
- **TypeScript:** Strict-mode configuration for all packages.
- **Testing:** `Vitest` for unit and integration testing.

## Current Data Flow

The project currently consists of the **Core** package.

- **`packages/core`**: Contains the Zod schemas for `Card`, `Board`, and `Column`, as well as the offline-first **Merge Logic**.
- **`apps/server`**: The local-first backend.
  - **Storage**: SQLite via `@libsql/client`.
  - **API**: Fastify-based REST endpoints for CRUD operations.
  - **Real-time**: WebSocket integration via `EventBus` for multi-client synchronization.
  - **Pattern**: Repository pattern (`CardRepository`, `BoardRepository`) using raw SQL.
  - **Migrations**: Automated SQL migrations on startup.

- **Future Runtimes**: CLI and MCP will import `packages/core` to ensure identical validation and conflict resolution across all interfaces.

```mermaid
graph TD
    Core[Packages: Core] --> Schema[Zod Schemas]
    Core --> Merge[Merge Logic]
    Server[Apps: Server] --> Core
    Server --> Repo[Repositories]
    Server --> WS[WebSockets - EventBus]
    CLI --> Core
    MCP --> Core

    WS -.-> Clients((WebSocket Clients))
    Repo <--> DB[(SQLite)]
```

## Quality Management

1. **Local Enforcement:** Husky hooks run `lint-staged` on staged files.
2. **CI Validation:** GitHub Actions runs `lint`, `typecheck`, and `test` on every pull request.
3. **Branch Protection:** Merges to `main` require linear history and successful status checks.
