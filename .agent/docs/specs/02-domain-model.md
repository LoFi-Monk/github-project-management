# Domain Model & File Structure

## Domain Model

### Card

The universal unit. Flat and simple for agents and users. Sync metadata is present but never the agent's concern.

```ts
interface Card {
  id: string; // ulid — local, stable, never changes
  title: string;
  description?: string; // markdown
  status: ColumnId; // 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
  priority: "low" | "medium" | "high" | "critical";
  labels: string[];
  assignees: string[]; // GitHub usernames or local names
  position: number; // float for cheap re-ordering (lexorank-style)
  createdAt: string; // ISO 8601
  updatedAt: string;

  // GitHub sync metadata — read-only from agent/user perspective
  githubIssueNumber?: number;
  githubProjectItemId?: string;
  githubRepo?: string; // "owner/repo"

  // Sync state
  syncStatus: "local" | "synced" | "dirty" | "conflict";
  syncedAt?: string; // timestamp of last successful sync

  // Field-level dirty tracking — which fields have changed since last sync.
  // Not exposed in default API responses.
  dirtyFields?: (keyof CardMutableFields)[];

  // Snapshot of card state at last sync — used to distinguish automation-driven
  // GitHub changes from genuine conflicts.
  // Not exposed in default API responses.
  syncSnapshot?: CardMutableFields;
}

// Fields that can change on either side after creation
interface CardMutableFields {
  title: string;
  description?: string;
  status: ColumnId;
  priority: string;
  labels: string[];
  assignees: string[];
}
```

### Board

```ts
interface Board {
  id: string;
  name: string;
  columns: Column[];
  githubProjectId?: string; // GitHub Projects v2 node ID
  githubProjectNumber?: number;
  githubRepo?: string; // default repo for this board
  createdAt: string;
  updatedAt: string;
}

interface Column {
  id: ColumnId;
  name: string;
  order: number;
  githubFieldValue?: string; // maps to GitHub Project "Status" field option ID
}

type ColumnId = "backlog" | "todo" | "in_progress" | "review" | "done";
```

### Default columns

`Backlog` → `Todo` → `In Progress` → `Review` → `Done`

Configurable per board. The column-to-GitHub-status mapping is stored in the board config and set up during `kanban github link`.

## File Structure

### Monorepo layout (pnpm workspaces)

```
/
├── apps/
│   ├── server/          # Fastify API + SQLite + sync engine
│   └── web/             # React UI (Vite)
├── packages/
│   ├── core/            # Shared types, schemas (Zod), domain logic
│   ├── cli/             # Commander CLI
│   └── mcp/             # MCP server
├── biome.json
├── vitest.config.ts
├── .husky/
└── pnpm-workspace.yaml
```

### Detailed Structure

```
apps/
  server/
    src/
      index.ts
      config.ts
      db/
        schema.sql
        migrations/
          001_initial.sql
          002_sync_fields.sql
        client.ts                   # better-sqlite3 singleton
      routes/
        boards.ts
        cards.ts
        ws.ts
        github.ts                   # Phase 2 — sync trigger endpoints
      services/
        board.service.ts
        card.service.ts
      sync/                         # Phase 2
        engine.ts
        pull.ts
        push.ts
        merge.ts                    # field-level merge (pure, also in core)
        conflict.ts
      github/                       # Phase 2
        auth.ts
        issues.ts
        projects.ts                 # GraphQL queries + mutations
        mapper.ts                   # GitHub ↔ CardMutableFields
    package.json
    tsconfig.json

  web/
    src/
      App.tsx
      components/
        Board.tsx
        Column.tsx
        Card.tsx
        CardDetail.tsx
        FilterBar.tsx
        SyncStatusBar.tsx           # Phase 2
        ConflictResolver.tsx        # Phase 2
        ImportPanel.tsx             # Phase 2
      hooks/
        useBoard.ts
        useWebSocket.ts
        useSync.ts                  # Phase 2
      store/
        board.store.ts
      api/
        client.ts                   # typed fetch wrapper
    package.json
    tsconfig.json
    vite.config.ts

packages/
  core/
    src/
      types.ts                      # Card, Board, Column, CardMutableFields
      schemas.ts                    # Zod schemas
      constants.ts                  # default columns, priorities, ColumnId values
      merge.ts                      # pure field-level merge algorithm + types
    package.json
    tsconfig.json

  cli/
    src/
      index.ts
      commands/
        boards.ts
        cards.ts
        github.ts                   # Phase 2
      lib/
        api-client.ts
        output.ts                   # table / json / md formatters
        config.ts
    package.json
    tsconfig.json

  mcp/
    src/
      index.ts
      tools/
        cards.ts
        boards.ts
      resources/
        boards.ts                   # markdown + JSON resources
      prompts/
        standup.ts
        groom.ts
    package.json
    tsconfig.json
```
