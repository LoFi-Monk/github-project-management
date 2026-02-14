# Development Runbook

This document describes how to work with the project locally.

## Setup

1.  **Prerequisites:** Node.js v20+, `pnpm` v9+.
2.  **Installation:**
    ```bash
    pnpm install
    ```
3.  **Husky Setup:**
    ```bash
    pnpm prepare
    ```

## Development Workflow

### Scripts

All scripts should be run from the repository root using `pnpm`.

- `pnpm lint`: Run Biome check (linter + formatter).
- `pnpm lint:fix`: Run Biome and apply safe auto-fixes.
- `pnpm typecheck`: Run TypeScript type-checking across all packages.
- `pnpm test`: Run the full test suite using Vitest.
- `pnpm build`: Build all packages.

### Adding New Packages

When adding a new package to the `packages/` directory:

1. Initialize with `pnpm init`.
2. Ensure the `package.json` name is scoped: `@lofi-pm/<name>`.
3. Link to the root `tsconfig.json` by adding a `tsconfig.json` that extends it.
4. Add a `typecheck` script: `"typecheck": "tsc --noEmit"`.

## Quality Gates

We enforce several quality gates via Husky:

- **Pre-commit:** Runs `lint-staged` which performs Biome checks and runs tests related to the changed files.
- **Commit Message:** Enforces the [Conventional Commits](https://www.conventionalcommits.org/) specification.
- **Pre-push:** Runs a full suite of linting, type-checking, and tests.

## Continuous Integration

The GitHub Actions workflow (`ci.yml`) runs on every push and pull request to the `main` branch. It performs:

1. Dependency installation.
2. Full linting across the workspace.
3. Full type-checking.
4. Full test suite execution.
