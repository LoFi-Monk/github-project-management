---
created: 2026-02-13T17:36:00-06:00
modified: 2026-02-13T17:36:00-06:00
---

# 0001: Tailwind Class Sorting

- Status: Disabled (Replaced by manual sorting)
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

Chosen option: **Manual Sorting**, because the Biome `useSortedClasses` nursery rule proved unstable on Windows, causing false-positive "Duplicate property" errors and blocking commits.

### Positive Consequences

- Prevents blocking commits due to experimental linter bugs.
- Eliminates "Duplicate property" false positives on Windows.

### Negative Consequences

- Requires manual discipline/IDE plugins for class sorting.
- Potential drift in class ordering between components.

## Architectural Context

- Referenced Architecture Document(s):
  - [01-tech-stack.md](file:///c:/ag-workspace/github-project-management/.agent/docs/specs/01-tech-stack.md)

- Impacted Components:
  - `apps/web` (Main UI implementation)
