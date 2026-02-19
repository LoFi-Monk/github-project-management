# Kanban Board — Project Specifications

> Local-first kanban board with AI agent access (CLI/MCP) and GitHub Projects sync.

This directory contains the detailed specifications for the project, broken down by topic.

## Contents

- **[01-tech-stack.md](./01-tech-stack.md)**: Technology choices, rationale, and build scripts.
- **[02-domain-model.md](./02-domain-model.md)**: Core data structures (Card, Board) and file layout.
- **[03-sync-logic.md](./03-sync-logic.md)**: Sync engine, conflict resolution, and data flow.
- **[04-roadmap.md](./04-roadmap.md)**: Implementation phases and milestones.
- **[05-design-principles.md](./05-design-principles.md)**: Key architectural decisions and trade-offs.
- **[06-server-storage.md](./06-server-storage.md)**: Server storage engine, database schema, and repository layer.
- **[07-server-api.md](./07-server-api.md)**: REST API endpoints and WebSocket event specification.

---

## Vision & Goals

A developer-facing kanban board that acts as a **single source of truth** for task management. It is:

- **Local-first** — works without GitHub, fast, no latency
- **AI-native** — designed from day one for IDE agents to read/write via CLI or MCP
- **Flat by design** — the UI and agent interface present a simple card model; sync complexity is hidden
- **GitHub-aware** — bidirectional sync with GitHub Projects and Issues runs in the background, playing nice with GitHub automations

The user (human or AI agent) never deals with GitHub API complexity. They see cards. The app handles the rest.
