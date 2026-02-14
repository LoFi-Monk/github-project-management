# LoFi's Project Management

> **Local-first kanban board with AI agent access (CLI/MCP) and GitHub Projects sync.**

This tool is designed to be a developer-facing kanban board that acts as a single source of truth for task management. It prioritizes speed (local-first), agent ergonomics (CLI/MCP interfaces), and seamless background synchronization with GitHub Projects.

## Vision

- **Local-first**: Zero latency, works offline, data lives in SQLite.
- **AI-native**: Built for agents to read/write without friction.
- **GitHub-aware**: Syncs bi-directionally with GitHub Issues and Projects v2.

## Technology Stack

- **Runtime**: Node.js (LTS)
- **Language**: TypeScript
- **UI**: React, Vite, Tailwind CSS, shadcn/ui
- **Server**: Fastify, SQLite (better-sqlite3)
- **Monorepo**: pnpm workspaces

## Documentation

- [Project Specifications](.agent/docs/specs/README.md)
- [Architecture Decisions](.agent/docs/architecture/README.md)
- [Contributing Guide](CONTRIBUTING.md) (Coming soon)

## License

AGPL-3.0
