# Design Principles & Decisions

## Key Design Decisions

### Field-level merge, not last-write-wins

GitHub automations are legitimate signals. A card auto-moved by a Project automation updates the local card cleanly because the local `status` field is clean (unchanged since last sync). Conflicts only fire when the _same field_ diverged on both sides. This makes the tool a good citizen in team workflows with no automation changes required.

### Server is the single writer

CLI, MCP, and web UI all talk REST to the Fastify server. Nothing writes to SQLite directly except the server. This prevents concurrency bugs and keeps adding new clients trivial.

### MCP board resource as markdown

`kanban://boards/{boardId}` returns a markdown checklist. Agents reason over structured markdown significantly better than raw JSON as ambient context. The JSON variant at `kanban://boards/{boardId}/json` exists for programmatic access.

### SQLite over file store

A JSON/YAML file is tempting but breaks under concurrent writes (server + sync engine + future tools). SQLite handles concurrent reads and serialised writes correctly with zero infrastructure.

### Float positions (lexorank-style)

Card ordering uses floats. Moving a card gives it the midpoint between its neighbors. Rebalancing only needed when float precision runs out — rare at kanban scale.

### Import issues ≠ add to Project

Importing a GitHub Issue creates a local card linked to that issue but does not add it to the GitHub Project. The user grooms it locally first, then pushes. This avoids cluttering the shared Project board with ungroomed issues, which is the right model for backlog refinement.

### CLI-first, MCP-supported

CLI is the primary interface: easier to test, debug, and script. MCP wraps the same REST API for Cursor/Windsurf agent contexts. Both are thin clients. All logic lives in the server.
