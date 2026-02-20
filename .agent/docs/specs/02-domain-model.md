# Domain Model & File Structure

## Domain Model

The following structures are implemented in `packages/core` and serve as the Source of Truth for the application.

### Card

The universal unit for tracking work. Defined in `packages/core/src/schema.ts`.

```ts
// packages/core/src/schema.ts

export const Card = z.object({
  id: CardId, // Branded string
  title: z.string().min(1),
  description: z.string().optional(), // Markdown
  status: ColumnId, // 'todo' | 'in_progress' | 'done' ...
  priority: z.enum(["low", "medium", "high", "critical"]),
  labels: z.array(z.string()),
  assignees: z.array(z.string()), // GitHub usernames
  position: z.number(), // Sort order
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),

  // Sync Logic Fields
  dirtyFields: z.array(MutableCardField).optional(), // Fields modified locally
  syncSnapshot: z.record(z.unknown()).optional(), // State at last sync
  syncStatus: z.enum(["synced", "dirty", "conflict", "local"]).optional(),
});
```

### Board & Column

```ts
export const Column = z.object({
  id: ColumnId,
  title: z.string(),
  cards: z.array(CardId), // Ordered list of card IDs
});

export const Board = z.object({
  id: BoardId,
  title: z.string(),
  columns: z.record(ColumnId, Column),
  cards: z.record(CardId, Card), // Normalized state
});
```

## Current File Structure

```text
/
├── packages/
│   └── core/            # Shared types, Zod schemas, & Merge Logic
│       ├── src/
│       │   ├── schema.ts      # Zod definitions (Card, Board)
│       │   ├── merge.ts       # Field-level conflict resolution
│       │   ├── types.ts       # Inferred TypeScript types
│       │   └── index.ts       # Public API
│       └── vitest.config.ts
├── apps/
│   ├── server/          # Fastify server + SQLite
│   └── web/             # React 19 + Vite Kanban frontend
├── biome.json           # Shared linting/formatting config
├── package.json
└── pnpm-workspace.yaml
```
