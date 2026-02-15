# ADR 0002: Unified Toolchain with Biome

## Status

Accepted

## Context

The monorepo initially lacked a unified linting and formatting strategy. We experimented with Prettier and ESLint, but encountered conflicts with Tailwind class sorting and configuration complexity across multiple packages.

## Decision

Adopt **Biome** as the single, unified toolchain for:

- Linting
- Formatting
- Import Sorting
- Tailwind Class Sorting (using `useSortedClasses`)

## Consequences

### Positive

- **Performance**: Significant reduction in CI/CD linting time compared to ESLint/Prettier.
- **Simplicity**: Single `biome.json` at the root covers the entire monorepo.
- **Consistency**: Unified import and class sorting rules across all packages.

### Negative

- Developers must install the Biome VS Code extension or running it via CLI.
- Migration cost from existing ESLint/Prettier configs.
