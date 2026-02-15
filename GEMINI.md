# GitHub Project Management

# Current Focus

Ready for Board Layout & Read-Only View (Issue 13).

# Recent Decisions

- [ADR 0007: Monorepo Testing Strategy](file:///c:/ag-workspace/github-project-management/.agent/docs/decisions/0007-adr-monorepo-testing-strategy.md) - Adopted sequential execution with custom runner for Windows stability.
- [ADR 0006: TSDoc Enforcement](file:///c:/ag-workspace/github-project-management/.agent/docs/decisions/0006-adr-tsdoc-enforcement.md) - Mandated JSDoc for all exported members.
- [ADR 0001: Use @libsql/client for SQLite Persistence](file:///c:/ag-workspace/github-project-management/.agent/docs/decisions/0001-adr-sqlite-libsql.md) - Pivoted to LibSQL/client for better performance and concurrency.
- **Tailwind Sorting**: Use Biome's `useSortedClasses` rule to avoid toolchain conflicts between Prettier and Biome.
- **Unified Toolchain**: Standardized on Biome for linting and formatting across the monorepo.
- **Strict Documentation**: Architecture documentation must strictly reflect the _current_ state of the code to avoid confusion.
- **Merge Strategy**: Adopted "clean/dirty" field-level sync logic for offline-first data, prioritizing local changes only when they are dirty.

# Backlog

- [ ] Board Layout & Read-Only View (Issue 13)
- [ ] Interactions & Real-time Sync (Issue 14)
- [ ] Implement CLI Interface
- [ ] Implement MCP Server
- [ ] Implement GitHub Sync Engine

# In Progress

None.

# Blocked

None.

# Completed

- [x] Monorepo Stabilization (Windows Test Runner)
- [x] Implement Server API & WebSockets (Issue 4)
- [x] Implement Server Storage Engine (Issue #3/6)
- [x] PR Review: Core Domain & Merge Logic (#5)
- [x] Issue #2: Core Domain & Merge Logic (PR #5)
- [x] Issue #1: Monorepo Foundation & CI Setup
- [x] Biome v2 Setup with CRLF normalization
- [x] Husky Hooks (pre-commit, commit-msg, pre-push)
- [x] CI Pipeline with dynamic pnpm versioning
- [x] Documentation Modernization (Modular specs, Architecture, Runbooks)
- [x] Documentation Update (Specs & Runbooks) - Added Server Storage Spec and DB Runbook.
- [x] Enforce TSDoc Documentation Standards (Issue #10)
- [x] UI Scaffold & Design System (Issue 12)

# Artifacts

- [Implementation Plan](file:///C:/Users/lofim/.gemini/antigravity/brain/9ab5ac5b-0039-43cf-98ad-845d375029bf/implementation_plan.md)
- [Task List](file:///C:/Users/lofim/.gemini/antigravity/brain/9ab5ac5b-0039-43cf-98ad-845d375029bf/task.md)
- [Walkthrough](file:///C:/Users/lofim/.gemini/antigravity/brain/9ab5ac5b-0039-43cf-98ad-845d375029bf/walkthrough.md)

# Notes to future self

Maintain the "Server as single writer" architecture pattern. Ensure `packages/core` remains the single source of truth for business logic. When documenting, never assume future implementations as current state.
Use the new `pre-review-check` skill before any commit.
CRITICAL: When scaffolding new projects, ensure no nested `.git` directories remain to prevent tracking issues.
Do not commit files that are excluded by .gitignore patterns (e.g., node_modules, .env, .idea, .devin).
Always respect the user's manual edits in .gitignore.
If a frontend build or test appears stuck, PROVIDE IMMEDIATE FEEDBACK rather than letting the session run indefinitely.
Visual and functional feedback is MANDATORY for UI tasks.
Follow the formal Post-Mortem in `.idea/FUCK.md` for recovery directives.
