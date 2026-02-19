---
created: 2026-02-19T13:45:00-06:00
modified: 2026-02-19T13:45:00-06:00
---

# ADR 0008: Avoid `script-shell` in `.npmrc` on Windows

- Status: Accepted
- Deciders: LoFi Monk, Antigravity
- Tags: tooling environment pnpm windows

## Context and Problem Statement

During development and documentation verification, we encountered persistent "hangs" when running `pnpm` scripts (specifically `pnpm check:docs` and `pnpm test`). The processes would initialize but never execute the script logic, effectively blocking CI-like checks in the local environment.

Investigation revealed that the presence of `script-shell=C:\\Windows\\System32\\cmd.exe` in the user's global `~/.npmrc` caused `pnpm` (v9.1.1) to spawn an interactive `cmd.exe` prompt instead of executing the intended command. This required a manual `exit` input to proceed, which is not feasible for automated scripts.

## Decision Drivers

- **Developer Velocity**: Scripts must run non-interactively and predictably across all environments.
- **Tooling Consistency**: The monorepo relies on `pnpm` workspace orchestration, which must remain stable.
- **Cross-Platform Compatibility**: Decision should ensure Windows 11 stability without breaking Unix-like environments.

## Considered Options

- **Option 1: Explicitly unset `script-shell` in the project-local `.npmrc`.** (Not directly possible in `.npmrc` to "unset" a global without setting it to a new value).
- **Option 2: Require users to remove `script-shell` from global `~/.npmrc`.**
- **Option 3: Use a more resilient shell or executable path.**

## Decision Outcome

Chosen option: **Option 2: Require users to remove or comment out `script-shell` in `~/.npmrc`.**

This was the only reliable way to prevent `pnpm` from interpreting the shell configuration as a request for an interactive session. Standard `pnpm` / `npm` behavior defaults to the system shell correctly without this explicit (and often problematic) manual override.

### Positive Consequences

- `pnpm` scripts now execute instantly (< 5 seconds for `check:docs`).
- Consistent behavior between `pnpm` and `npm` runtimes.
- Avoids spawning interactive prompts in background terminal tasks.

### Negative Consequences

- Requires manual developer environment configuration (one-time fix).

## Architectural Context

- Referenced Architecture Document(s):
  - [01-tech-stack.md](file:///c:/ag-workspace/github-project-management/.agent/docs/specs/01-tech-stack.md)
  - [03-testing.md](file:///c:/ag-workspace/github-project-management/.agent/docs/runbooks/03-testing.md)

- Impacted Components:
  - Developer Toolchain (All packages)
  - CI Quality Gates (Local execution)
