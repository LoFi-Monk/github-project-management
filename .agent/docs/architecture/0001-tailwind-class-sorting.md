---
created: 2026-02-13T17:36:00-06:00
modified: 2026-02-13T17:36:00-06:00
---

# 0001: Tailwind Class Sorting

- Status: Accepted
- Deciders: Antigravity, LoFi Monk
- Tags: architecture frontend styling tooling

## Context and Problem Statement

To maintain code readability and consistency, Tailwind CSS classes should be sorted. Standard tools like `prettier-plugin-tailwindcss` exist but require Prettier, which conflicts with the project's choice of Biome for formatting and linting.

## Decision Drivers

- Maintain a unified, fast toolchain (Biome).
- Avoid conflicts between multiple formatters in CI and pre-commit hooks.
- Ensure consistent Tailwind class order without adding heavy maintenance overhead.

## Considered Options

- **`prettier-plugin-tailwindcss`**: Industry standard, but requires Prettier and conflicts with Biome.
- **`eslint-plugin-tailwindcss`**: Compatible with Biome but adds a second lint toolchain to maintain.
- **Biome `useSortedClasses`**: Built-in, zero-config, fast, but doesn't read `tailwind.config.ts`.

## Decision Outcome

Chosen option: **Biome `useSortedClasses`**, because it provides the best balance of speed and integration within the chosen toolchain. Its limitation of not reading custom Tailwind configurations is currently not a problem for the project’s stock utility usage.

### Positive Consequences

- Single toolchain for formatting, linting, and sorting.
- Zero-drift between local development and CI environments.
- High performance.

### Negative Consequences

- Limited support for custom Tailwind plugins or theme extensions in sorting logic.
- If heavy customization is needed later, the toolset may need to be re-evaluated (potentially moving to Prettier).

## Architectural Context

- Referenced Architecture Document(s):
  - [01-tech-stack.md](file:///c:/ag-workspace/github-project-management/.agent/docs/specs/01-tech-stack.md)

- Impacted Components:
  - `apps/web` (Main UI implementation)
