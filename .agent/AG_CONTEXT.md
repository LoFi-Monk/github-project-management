# GitHub Project Management

# Current Focus

Ready for **Issue 6: Board Layout & Read-Only View (#15)**.

# Recent Decisions

- [ADR 0008: Frontend Architecture](file:///c:/ag-workspace/github-project-management/.agent/docs/architecture/003-frontend-architecture.md) - Defined React + Vite + Tailwind stack for `apps/web`.
- [ADR 0007: Monorepo Testing Strategy](file:///c:/ag-workspace/github-project-management/.agent/docs/decisions/0007-adr-monorepo-testing-strategy.md) - Adopted sequential execution for Windows stability.
- [ADR 0006: TSDoc Enforcement](file:///c:/ag-workspace/github-project-management/.agent/docs/decisions/0006-adr-tsdoc-enforcement.md) - Mandated JSDoc for all exported members.
- [ADR 0001: Use @libsql/client for SQLite Persistence](file:///c:/ag-workspace/github-project-management/.agent/docs/decisions/0001-adr-sqlite-libsql.md) - Pivoted to LibSQL/client.
- **Biome Config Safety**: Added [.agent/rules/config/biome-tailwind.md](file:///c:/ag-workspace/github-project-management/.agent/rules/config/biome-tailwind.md) to forbid removing Tailwind ignore rules from `biome.json`.
- **Tailwind Sorting**: Use Biome's `useSortedClasses` rule to avoid conflicts.
- **Merge Strategy**: Clean/dirty field-level sync logic for offline-first data.

# Backlog

- [ ] Issue 6: Board Layout & Read-Only View (#15)
- [ ] Issue 7: Interactions & Real-time Sync
- [ ] Implement CLI Interface
- [ ] Implement MCP Server
- [ ] Implement GitHub Sync Engine

# In Progress

- [/] Issue 6: Board Layout & Read-Only View (Implementing `BoardCard`)

# Blocked

None.

# Completed

- [x] **Milestone 1**: Monorepo Foundation & CI Setup (Issues 1-2).
- [x] **Milestone 2**: Server Implementation (Storage & API - Issues 3-4).
- [x] **Issue 5**: UI Scaffold & Design System (PR #13, Recovery PR #14).
- [x] Monorepo Stabilization (Sequential Test Runner).
- [x] Biome v2 & Husky Setup.

# Artifacts

- [Implementation Plan](file:///C:/Users/lofim/.gemini/antigravity/brain/50d83f8b-5dd9-47e7-ae3d-000a683a3da3/implementation_plan.md)
- [Task List](file:///C:/Users/lofim/.gemini/antigravity/brain/50d83f8b-5dd9-47e7-ae3d-000a683a3da3/task.md)

# Notes to future self

- **DO NOT TOUCH `biome.json` TAILWIND RULES.**
- Maintain "Server as single writer" pattern.
- Visual and functional feedback is MANDATORY for UI tasks.
- Use `pre-review-check` skill before any commit.
