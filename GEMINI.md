# GitHub Project Management

# Current Focus

Server Implementation (Issue 3). The Core Domain Logic has been implemented and is in PR Review.

# Recent Decisions

- **Tailwind Sorting**: Use Biome's `useSortedClasses` rule to avoid toolchain conflicts between Prettier and Biome.
- **Unified Toolchain**: Standardized on Biome for linting and formatting across the monorepo.
- **Strict Documentation**: Architecture documentation must strictly reflect the _current_ state of the code to avoid confusion. Planned features are reserved for the roadmap.
- **Merge Strategy**: Adopted "clean/dirty" field-level sync logic for offline-first data, prioritizing local changes only when they are dirty.

# Backlog

- [ ] Implement Server Storage Engine (Issue 3)
- [ ] Implement Server API & WebSockets (Issue 4)
- [ ] Implement CLI Interface
- [ ] Implement MCP Server
- [ ] Implement GitHub Sync Engine

# In Progress

- [/] PR Review: Core Domain & Merge Logic (#5)

# Blocked

None.

# Completed

- [x] Issue #2: Core Domain & Merge Logic (PR #5)
- [x] Issue #1: Monorepo Foundation & CI Setup
- [x] Biome v2 Setup with CRLF normalization
- [x] Husky Hooks (pre-commit, commit-msg, pre-push)
- [x] CI Pipeline with dynamic pnpm versioning
- [x] Documentation Modernization (Modular specs, Architecture, Runbooks)

# Artifacts

- [Implementation Plan](file:///C:/Users/lofim/.gemini/antigravity/brain/a4fa5c8d-05a3-4cca-b784-0060f04c8544/implementation_plan.md)
- [Task List](file:///C:/Users/lofim/.gemini/antigravity/brain/a4fa5c8d-05a3-4cca-b784-0060f04c8544/task.md)
- [Walkthrough](file:///C:/Users/lofim/.gemini/antigravity/brain/a4fa5c8d-05a3-4cca-b784-0060f04c8544/walkthrough.md)

# Notes to future self

Maintain the "Server as single writer" architecture pattern. Ensure `packages/core` remains the single source of truth for business logic. When documenting, never assume future implementations as current state.
