---
created: 2026-02-14T13:59:18-06:00
modified: 2026-02-14T14:50:00-06:00
---

# ADR 0001: Use @libsql/client for SQLite Persistence

- Status: Accepted
- Deciders: LoFi, Antigravity
- Tags: architecture database nodejs

## Context and Problem Statement

The initial implementation of the server storage engine used `better-sqlite3`. However, `better-sqlite3` is a native Node.js addon that requires local compilation (via `node-gyp`) or pre-built binaries matching the environment.

During implementation on Windows 11, we encountered persistent "Could not locate the bindings file" errors. Despite clean installations, forced rebuilds, and verifying Python/build tool availability, the native bindings failed to link correctly. This created a significant bottleneck for development and potential CI/CD fragility.

## Decision Drivers

- **Environment Compatibility**: The driver must work reliably across diverse development environments (Windows, macOS, Linux) without complex manual setup.
- **Maintainability**: Prefer drivers that minimize native compilation issues during `pnpm install`.
- **Modern API**: Preference for async/Promise-based APIs for clean repository patterns.

## Considered Options

- **better-sqlite3**: Highest performance, but problematic native bindings on some Windows environments.
- **sqlite3**: Also a native addon, prone to similar binding issues as `better-sqlite3`.
- **@libsql/client**: A modern SQLite driver that provides a more robust distribution model, including better pre-compiled binaries and WASM support, reducing native build failures.

## Decision Outcome

Chosen option: "@libsql/client", because it successfully initialized and bypassed the binding errors encountered with `better-sqlite3`. It provides a clean, async-first Promise API and a robust `batch()` method for handling transactions, aligning well with modern TypeScript and the server's repository patterns.

### Positive Consequences

- Resolved blocking "missing bindings" errors.
- Simplified environment setup for contributors.
- Standardized on an async repository pattern.
- **Native Transaction Support**: Utilized `db.batch()` for atomic multi-statement operations (e.g., Board/Column creation).
- Future-proofed for potential LibSQL/Turso integration.

### Negative Consequences

- Minor performance difference compared to `better-sqlite3`.
- Required updating repository, migrator, and test code to be `async`.
- **Lockfile Sensitivity**: Discovered that `@libsql/client` requires strict lockfile synchronization between local and CI environments to avoid `frozen-lockfile` errors.

## Architectural Context

- Referenced Architecture Document(s):
  - [.agent/docs/architecture/01-overview.md](file:///c:/ag-workspace/github-project-management/.agent/docs/architecture/01-overview.md)

- Impacted Components:
  - `apps/server` (Storage Engine)
