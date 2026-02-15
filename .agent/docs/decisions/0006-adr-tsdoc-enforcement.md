# 6. TSDoc Enforcement

Date: 2026-02-14

## Status

Accepted

## Context

As the codebase grows, undocumented exported members (classes, functions, interfaces) lead to confusion and increased onboarding time. We need a way to ensure that all public APIs are documented without slowing down development significantly. Standard linters (ESLint/Biome) often have "all or nothing" rules that can be too noisy or hard to configure for specific project needs (e.g., ignoring specific directories or patterns).

## Decision

We will enforce TSDoc documentation for all exported members using a custom script (`scripts/verify-docs.ts`) powered by `ts-morph`.

- **Scope**: All exported classes, functions, interfaces, types, and enums in `packages/core` and `apps/server`.
- **Standard**: Every export must have a JSDoc block `/** ... */`.
- **CI Integration**: The `check:docs` script will run in CI and fail the build if any exports are missing documentation.
- **Exceptions**:
  - Type aliases that share a name with a documented Zod schema (e.g., `export type BoardId = ...` and `export const BoardId = ...`).
  - Specific exclusions defined in the script (e.g., temporary opt-outs).

## Consequences

### Positive

- **Guaranteed Coverage**: No public API can slip through without at least a minimal description.
- **Flexibility**: The custom script allows us to handle edge cases (like the Zod type/const pattern) that standard linters might flag incorrectly.
- **Performance**: `ts-morph` is fast enough for our current monorepo size.

### Negative

- **Maintenance**: We own the verification script and must maintain it as TypeScript evolves.
- **Friction**: Developers _must_ write docs for everything, which can feel burdensome for trivial utilities.
