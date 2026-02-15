# Phase 1: MVP - Granular Issue Breakdown

We are breaking down Milestones 1-5 into atomic, manageable units of work.

---

## 📦 Milestone 1: Foundation

- [x] completed

### Issue 1: Monorepo Setup & CI Pipeline

**Context**: Establish the build system, workspace structure, and quality gates before writing feature code.
**Scope**: Root config, basic package structure, and automated checking.

**Task List**:

- [x] Initialize `pnpm` workspaces (`apps/*`, `packages/*`).
- [x] Configure `biome` for linting/formatting.
- [x] Configure `vitest` in root and `custom-test-env`.
- [x] Set up `husky` (pre-commit: lint, pre-push: test).
- [x] Create GitHub Actions workflow (`ci.yml`) for PR validation.

**Acceptance Criteria (EARS)**:

- **Normal Operation**: When `pnpm install` is executed, then all dependencies for sub-packages shall be linked correctly.
- [ ] **Unwanted Behavior**: If code with lint errors is pushed, then the GitHub Action shall fail the build.
- **Normal Operation**: When a Pull Request is opened, then the CI system shall run the full test suite.

### Issue 2: Core Domain & Merge Logic (#4)

- [x] completed

**Context**: The heart of the "offline-first" system. Types and conflict resolution logic shared by Client, Server, and CLI.
**Scope**: `packages/core`

**Task List (TDD)**:

- [x] Define Zod schemas for `Card`, `Column`, `Board`.
- [x] **(Red)** Write failing unit tests for `mergeCards` (Clean/Remote, Dirty/Remote, Dirty/NoConflict, Dirty/Conflict).
- [x] **(Green)** Implement pure `mergeCards(local, remote)` function to pass tests.
- [x] **(Refactor)** Optimize merge logic for readability and edge cases.
- [x] **(Refactor)** Configure Vitest coverage thresholds (90% global).
- [x] Export inferred TypeScript types.

**Acceptance Criteria (EARS)**:

- **Normal Operation**: When `mergeCards` compares a dirty local card with a clean remote card, the system shall prefer local changes.
- **Unwanted Behavior**: If the same field is changed in both local and remote versions, then `mergeCards` shall mark the field as conflicting.
- **Normal Operation**: When `pnpm test` is run, the system shall enforce 90% code coverage.

---

## 🔌 Milestone 2: Server Implementation

### Issue 3: Server Storage Engine (SQLite)

- [x] completed

**Context**: The persistence layer. Needs to be robust and migration-capable.
**Scope**: `apps/server` (Database Layer)

**Task List (TDD)**:

- [x] Set up `better-sqlite3`.
- [x] **(Red)** Write failing test: Ensure database file is created and tables exist on startup.
- [x] **(Green)** Implement migration runner and apply `boards/cards` schema.
- [x] **(Red)** Write failing integration tests for Repository classes (Create/Read/Update/Delete).
- [x] **(Green)** Implement Repository classes.
- [x] **(Refactor)** Extract SQL queries to constant files or builder patterns.

**Acceptance Criteria (EARS)**:

- **Normal Operation**: When the server application creates a connection, it shall automatically run pending migrations.

### Issue 4: Server API & WebSockets

- [x] completed

**Context**: The interface for clients. HTTP for CRUD, WS for live updates.
**Scope**: `apps/server` (Transport Layer)

**Task List (TDD)**:

- [x] Configure Fastify with Zod validation.
- [x] **(Red)** Write failing requests for `GET /boards` and `POST /cards`.
- [x] **(Green)** Implement REST endpoints.
- [x] **(Red)** Write failing test for WebSocket subscription (connect client, trigger mutation, expect event).
- [x] **(Green)** Implement WebSocket server and event broadcasting.
- [x] **(Refactor)** Standardize error response formats.

**Acceptance Criteria (EARS)**:

- **Normal Operation**: When a generic `POST /cards` request receives valid JSON, the system shall persist the card and return 201 Created.
- **Event Driven**: When a card is updated via REST, the system shall broadcast a `card:updated` event to all connected WebSocket clients.

---

## 🎨 Milestone 3: Web UI Construction

### Issue 5: UI Scaffold & Design System

**Context**: Setting up the visual environment.
**Scope**: `apps/web` (Setup)
_(Note: Visual setup is less strictly TDD, more Verified via Storybook/Preview)_

**Task List**:

- [ ] Initialize Vite + React.
- [ ] Configure Tailwind CSS.
- [ ] Install `shadcn/ui` base and standard components.
- [ ] **(Verify)** Ensure development server starts and renders Landing Page.

### Issue 6: Board Layout & Read-Only View

**Context**: Displaying data. Getting columns and cards on the screen.
**Scope**: `apps/web` (Read Features)

**Task List (TDD)**:

- [ ] **(Red)** Write component test: `BoardLayout` renders column headers from props.
- [ ] **(Green)** Implement `BoardLayout` component.
- [ ] **(Red)** Write component test: `Card` renders title and badges.
- [ ] **(Green)** Implement `Card` component.
- [ ] Connect to `GET /boards/:id` API.

**Acceptance Criteria (EARS)**:

- **Normal Operation**: When the board loads, the system shall display all columns and cards.

### Issue 7: Interactions & Real-time Sync

**Context**: Making it interactive. Dragging, editing, and live updates.
**Scope**: `apps/web` (Write/Interactive Features)

**Task List (TDD)**:

- [ ] **(Red)** Write hook test: `useKanban` updates local state immediately on move.
- [ ] **(Green)** Implement `useKanban` with optimistic updates.
- [ ] Integrate `@dnd-kit` for drag-and-drop.
- [ ] **(Red)** Write WebSocket test: Dispatching mock event updates store.
- [ ] **(Green)** Connect WebSocket client listener.

**Acceptance Criteria (EARS)**:

- **Event Driven**: When a user drops a card in a new column, the system shall immediately update the UI (optimistic).

---

## 💻 Milestone 4: CLI

### Issue 8: CLI Commands

**Context**: Terminal-based access to the board.
**Scope**: `packages/cli`

**Task List (TDD)**:

- [ ] Set up `commander`.
- [ ] **(Red)** Write test: `cli list --format json` returns valid JSON to stdout.
- [ ] **(Green)** Implement `list` command and JSON formatter.
- [ ] **(Red)** Write test: `cli move <id> <status>` calls API endpoint.
- [ ] **(Green)** Implement `move` command.

**Acceptance Criteria (EARS)**:

- **Normal Operation**: When the user runs `kanban list --format json`, the system shall output valid, parsable JSON.

---

## 🤖 Milestone 5: MCP Server

### Issue 9: MCP Tool Exposure

**Context**: The bridge for AI agents.
**Scope**: `packages/mcp`

**Task List (TDD)**:

- [ ] Set up MCP SDK.
- [ ] **(Red)** Write test: Call `list_cards` tool, expect list from internal API.
- [ ] **(Green)** wiring `list_cards` tool to API.
- [ ] **(Red)** Write test: Read `kanban://board` resource, expect Markdown.
- [ ] **(Green)** Implement Markdown formatter and resource handler.

**Acceptance Criteria (EARS)**:

- **Normal Operation**: When an AI client requests the `kanban://board` resource, the system shall return a simplified Markdown representation.
