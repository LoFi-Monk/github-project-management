# Domain Model & File Structure

## Domain Model

The following structures are planned for the core logic layer.

### Card

The universal unit for tracking work.

```ts
interface Card {
  id: string; // ulid — local, stable, never changes
  title: string;
  description?: string; // markdown
  status: ColumnId;
  priority: "low" | "medium" | "high" | "critical";
  labels: string[];
  assignees: string[];
  position: number;
  createdAt: string;
  updatedAt: string;
}

type ColumnId = "backlog" | "todo" | "in_progress" | "review" | "done";
```

## Current File Structure

```text
/
├── packages/
│   └── core/            # Shared types, schemas (Zod), domain logic
├── biome.json
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── vitest.config.ts
└── .husky/
```

### packages/core

Currently contains the base TypeScript configuration and placeholder tests. Future implementation will include Zod schemas, constants, and the merge algorithm.
