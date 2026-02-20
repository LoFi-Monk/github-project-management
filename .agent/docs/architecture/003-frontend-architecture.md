# Frontend Architecture

## Purpose

The `apps/web` application serves as the primary user interface for the GitHub Project Management system. It provides a visual, interactive Kanban board that syncs in real-time with the server.

## Tech Stack

- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Hooks (local), TanStack Query / WebSocket (remote)
- **Testing**: Vitest + React Testing Library

## Key Components

### Design System

We use a customized version of `shadcn/ui` based on Radix UI primitives.

- **Theme**: CSS variables defined in `index.css` map to Tailwind utility classes.
- **Components**: Located in `src/components/ui`. owned by the project, not a dependency.

### Board Module

The core feature of the app.

- **Layout**: `BoardLayout` manages the column structure.
- **Columns**: `BoardColumn` handles list rendering.
- **Cards**: `BoardCard` displays individual task data.

## Server Integration

- **HTTP**: `lib/api.ts` provides a Fetch-based client to communicate with `apps/server`.
- **Hooks**: `hooks/useBoard` manages the board data fetching lifecycle (loading, error, success).
- **WebSocket (Planned)**: Listen for `card:updated` events to trigger optimistic UI updates.

## File Structure

```text
apps/web/src/
├── components/         # Component library
│   ├── ui/          # Generic design system components (shadcn)
│   └── board/       # Feature-specific board components
├── hooks/              # Custom React hooks (useBoard)
├── lib/
│   ├── api.ts       # HTTP client
│   └── utils.ts     # Tailwind merge helpers (cn)
└── App.tsx          # Root component
```

### Planned (Not Yet Implemented)

- `lib/socket.ts` — WebSocket client for real-time updates
