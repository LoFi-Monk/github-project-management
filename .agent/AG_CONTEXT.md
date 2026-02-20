# GitHub Project Management

# Current Focus

Ready to start **Issue 16: Basic Drag & Drop**. The roadmap has been updated with detailed requirements for Phase 2 (GitHub Integration).

# Recent Decisions

- **GitHub Auth (OAuth Device Flow)**: Decided to use the Device Flow (pairing code) for a better CLI/Local UX, similar to `gh auth login`.
- **Token Storage**: Use the **OS Keychain** (via `keytar`) for secure, native token persistence on Windows, macOS, and Linux.
- **GitHub Projects Terminology**: Clarified that the product is called "Projects" (legacy "Classic" is sunset). The GraphQL API uses `ProjectV2` objects. No "Projects v3" exists.
- [ADR 0009: Biome Toolchain Normalization](file:///c:/ag-workspace/github-project-management/.agent/docs/decisions/0009-adr-biome-windows-normalization.md) - Enforced LF line endings and disabled unstable rules.
- **Tailwind Sorting**: Manual sorting enforced for Windows stability (ADR 0001 Disabled).

# Backlog

- [ ] Issue 16: Basic Drag & Drop
- [ ] Issue 17: Dynamic Columns
- [ ] Issue 18: Real-time Sync
- [ ] GitHub Auth (OAuth Device Flow)
- [ ] GitHub Project Selection & Creation
- [ ] GitHub Sync Engine

# In Progress

- None (Session ending)

# Blocked

- None

# Completed

- [x] **Issue 15**: Board Layout & Read-Only View.
- [x] **Roadmap Sync**: Updated `.agent/docs` to align with the current codebase and future GitHub integration intent.
- [x] **Milestone 1 & 2**: Monorepo foundation, Server storage, and API.

# Artifacts

- [Roadmap](file:///c:/ag-workspace/github-project-management/.agent/docs/plans/roadmap.md) - Contains the new EARS requirements for GitHub integration.
- [Task Log](file:///C:/Users/lofim/.gemini/antigravity/brain/50d83f8b-5dd9-47e7-ae3d-000a683a3da3/task.md)

# Notes to future self

- **GitHub Integration**: Use **GraphQL** (`ProjectV2` queries) as the primary way to interact with Projects. The new REST API (Sept 2025) is an alternative for item management.
- **Column Mapping**: Implementation should auto-map columns by name (case-insensitive) but allow a settings override.
- **Windows Parity**: Keep using `scripts/test-all.js` for testing to avoid resource contention on Windows.
- **Biome**: Never touch Tailwind sorting rules in `biome.json` without re-evaluating Windows stability.
- **Environment Variables**: Next priority for `apps/web` is moving `API_BASE` to a `.env` file.
