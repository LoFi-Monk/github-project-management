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

### Board Module (Planned)

The core feature of the app.

- **Layout**: `BoardLayout` manages the column structure.
- **Columns**: `BoardColumn` handles list rendering.
- **Cards**: `BoardCard` displays individual task data.

## Server Integration

- **HTTP**: Fetch initial state via REST endpoints adjacent to `apps/server`.
- **WebSocket**: Listen for `card:updated` events to trigger optimistic UI updates.

## File Structure

```text
apps/web/src/
├── components/         # Component library
│   ├── ui/          # Generic design system components
│   └── board/       # Feature-specific board components
├── lib/
│   └── utils.ts     # Tailwind merge helpers (cn)
└── App.tsx          # Root component
```

### Planned (Not Yet Implemented)

- `lib/api.ts` — HTTP client for server communication
- `lib/socket.ts` — WebSocket client for real-time updates
- `hooks/` — Custom React hooks
