# GitHub Project Management

# Current Focus

Preparation for Issue 2 (Core Logic Implementation). The monorepo foundation and CI/CD pipeline are fully established and merged.

# Recent Decisions

- **Tailwind Sorting**: Use Biome's `useSortedClasses` rule to avoid toolchain conflicts between Prettier and Biome.
- **Unified Toolchain**: Standardized on Biome for linting and formatting across the monorepo.
- **Strict Documentation**: Architecture documentation must strictly reflect the _current_ state of the code to avoid confusion. Planned features are reserved for the roadmap.

# Backlog

- [/] Implement Core Domain Logic (Issue 2)
- [ ] Implement CLI Interface
- [ ] Implement MCP Server
- [ ] Implement GitHub Sync Engine

# In Progress

None.

# Blocked

None.

# Completed

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
