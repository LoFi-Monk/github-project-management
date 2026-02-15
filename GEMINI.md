# GitHub Project Management

# Current Focus

Ready for API & WebSocket implementation (Issue 4/6).

# Recent Decisions

- [ADR 0001: Use @libsql/client for SQLite Persistence](file:///c:/ag-workspace/github-project-management/.agent/docs/decisions/0001-adr-sqlite-libsql.md) - Pivoted to LibSQL/client for better performance and concurrency.
- **Tailwind Sorting**: Use Biome's `useSortedClasses` rule to avoid toolchain conflicts between Prettier and Biome.
- **Unified Toolchain**: Standardized on Biome for linting and formatting across the monorepo.
- **Strict Documentation**: Architecture documentation must strictly reflect the _current_ state of the code to avoid confusion.
- **Merge Strategy**: Adopted "clean/dirty" field-level sync logic for offline-first data, prioritizing local changes only when they are dirty.

# Backlog

- [ ] Implement Server API & WebSockets (Issue 4)
- [ ] Implement CLI Interface
- [ ] Implement MCP Server
- [ ] Implement GitHub Sync Engine

# In Progress

None.

# Blocked

None.

# Completed

- [x] Implement Server Storage Engine (Issue #3/6)
- [x] PR Review: Core Domain & Merge Logic (#5)
- [x] Issue #2: Core Domain & Merge Logic (PR #5)
- [x] Issue #1: Monorepo Foundation & CI Setup
- [x] Biome v2 Setup with CRLF normalization
- [x] Husky Hooks (pre-commit, commit-msg, pre-push)
- [x] CI Pipeline with dynamic pnpm versioning
- [x] Documentation Modernization (Modular specs, Architecture, Runbooks)
- [x] Documentation Update (Specs & Runbooks) - Added Server Storage Spec and DB Runbook.

# Artifacts

- [Implementation Plan](file:///C:/Users/lofim/.gemini/antigravity/brain/047b1943-383d-442b-97e9-73f35a79ea46/implementation_plan.md)
- [Task List](file:///C:/Users/lofim/.gemini/antigravity/brain/047b1943-383d-442b-97e9-73f35a79ea46/task.md)
- [Walkthrough](file:///C:/Users/lofim/.gemini/antigravity/brain/047b1943-383d-442b-97e9-73f35a79ea46/walkthrough.md)

# Notes to future self

Maintain the "Server as single writer" architecture pattern. Ensure `packages/core` remains the single source of truth for business logic. When documenting, never assume future implementations as current state.
Use the new `pre-review-check` skill before any commit.
