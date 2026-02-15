# 7. Monorepo Testing Strategy for Windows

Date: 2026-02-14

## Status

Accepted

## Context

We encountered severe stability issues when running our Vitest test suite in the monorepo on Windows. The problems included:

- **Hangs**: Tests would run indefinitely, likely due to deadlock in `libsql` native bindings when accessed concurrently by multiple Vitest forks.
- **Shell Issues**: `pnpm -r test` failed to correctly orchestrate commands on Windows shells, leading to parsing errors.
- **Resource Contention**: Parallel execution caused file locking issues with SQLite databases (WAL mode).

## Decision

We adopt a **Sequential, Custom-Runner Strategy** for executing tests in the monorepo.

1.  **Custom Runner**: We use `node scripts/test-all.js` instead of `pnpm -r test`. This script dynamically discovers packages using `pnpm ls -r --json` and executes `vitest run` for each package sequentially.
2.  **Sequential Execution**: We explicitly trade execution speed for stability. By running one package's suite at a time, we eliminate cross-process resource contention.
3.  **Strict Teardown**: Code must strictly `await` all asynchronous resource cleanup (Database connections, WebSockets) in `afterEach` hooks to prevent zombie handles.
4.  **Process Isolation**: `apps/server` (which uses native bindings) runs with the default `forks` pool but effectively isolated by the sequential runner.

## Consequences

### Positive

- **Stability**: The test suite is now reliable on Windows, eliminating CI hangs.
- **Control**: The custom runner gives us precise control over execution order and error reporting.
- **Standardization**: Bypassing `pnpm`'s shell idiosyncrasies makes the command consistent across OSs.

### Negative

- **Speed**: Running tests sequentially is slower than parallel execution. As the repo grows, we may need to revisit this or optimize specific packages.
- **Maintenance**: We maintain a custom runner script `scripts/test-all.js`.
