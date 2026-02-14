# Roadmap & Milestones

## Phase 1 — MVP

### 1.1 Server (`apps/server`)

**Storage**

- SQLite at `~/.kanban/db.sqlite` or project-local `.kanban/db.sqlite` (configurable)
- Plain SQL migrations, no ORM
- Tables: `boards`, `columns`, `cards`, `sync_log`

**REST API** (Fastify, all routes under `/api/v1/`)

```
GET    /boards                         list boards
POST   /boards                         create board
GET    /boards/:boardId                board + columns + cards
PUT    /boards/:boardId                update board metadata
DELETE /boards/:boardId                delete board

GET    /boards/:boardId/cards          list cards (filter: status, label, assignee, priority)
POST   /boards/:boardId/cards          create card
GET    /cards/:cardId                  get card
PUT    /cards/:cardId                  update card (partial ok)
DELETE /cards/:cardId                  delete card
PATCH  /cards/:cardId/move             { status, position }
```

**WebSocket** (`/ws`)

Server pushes to all connected clients on every mutation:

```
card:created    { card }
card:updated    { card }
card:deleted    { cardId }
card:moved      { cardId, status, position }
sync:status     { boardId, dirtyCount, conflictCount, lastSyncedAt }  // Phase 2
```

**Configuration**

- `~/.kanban/config.json` — global
- `.kanban/config.json` in CWD — project-local override
- Schema: `{ serverPort, githubToken, defaultRepo, syncIntervalMs, defaultBoardId }`

### 1.2 Web UI (`apps/web`)

**UI principles**

All UI is built with shadcn/ui components on Tailwind CSS. No custom component primitives are written from scratch if a shadcn/ui equivalent exists. Icons are exclusively from Lucide React — no emoji anywhere in the interface.

shadcn/ui is copy-owned: components live in `apps/web/src/components/ui/` and are committed to the repo. This means no runtime dependency on a shadcn package and full control over component internals.

**shadcn/ui components used**

| Component            | Usage                                                  |
| -------------------- | ------------------------------------------------------ |
| `Button`             | All actions — create card, sync, settings              |
| `Badge`              | Priority labels, column counts, sync status            |
| `Card`               | Kanban card shell                                      |
| `Dialog`             | Card create / edit modal                               |
| `Sheet`              | Card detail slide-in panel                             |
| `Select`             | Status, priority, assignee dropdowns                   |
| `Input`              | Card title, filter text input                          |
| `Textarea`           | Card description (markdown)                            |
| `Popover`            | Label picker, assignee picker                          |
| `Separator`          | Column dividers, section breaks                        |
| `Tooltip`            | Icon button labels                                     |
| `DropdownMenu`       | Board switcher, card context menu                      |
| `ScrollArea`         | Column scroll containers                               |
| `Alert`              | Conflict and error states                              |
| `Skeleton`           | Loading states                                         |
| `Toaster` / `Sonner` | Mutation feedback (card created, sync complete, error) |

**Lucide icons used**

| Icon             | Usage                          |
| ---------------- | ------------------------------ |
| `Plus`           | Add card, add column           |
| `Pencil`         | Edit card                      |
| `Trash2`         | Delete card                    |
| `ArrowRightLeft` | Move card                      |
| `RefreshCw`      | Sync / pull / push             |
| `AlertCircle`    | Conflict indicator             |
| `CircleDot`      | Dirty / pending sync indicator |
| `CheckCircle2`   | Synced indicator               |
| `Github`         | GitHub link on synced cards    |
| `Settings`       | Settings page                  |
| `ChevronDown`    | Board switcher dropdown        |
| `Filter`         | Filter bar toggle              |
| `X`              | Clear filter, close panel      |
| `GripVertical`   | Drag handle on cards           |

**Layout**

```
┌──────────────────────────────────────────────────────────────────┐
│  [Board name <ChevronDown>]    [<Plus> Card]   [<Settings>]      │
│                                                [<RefreshCw>]     │
├───────────┬─────────────┬─────────────┬──────────┬──────────────┤
│  Backlog  │    Todo     │ In Progress │  Review  │     Done     │
│  <Badge>  │  <Badge>    │  <Badge>    │ <Badge>  │   <Badge>    │
├───────────┼─────────────┼─────────────┼──────────┼──────────────┤
│ <Card>    │ <Card>      │ <Card>      │ <Card>   │  <Card>      │
│ <Card>    │             │ <Card>      │          │              │
│ [<Plus>]  │  [<Plus>]   │  [<Plus>]   │ [<Plus>] │   [<Plus>]   │
└───────────┴─────────────┴─────────────┴──────────┴──────────────┘
│  <Sync status bar — Phase 2>                                      │
└──────────────────────────────────────────────────────────────────┘
```

**Card component**

- shadcn/ui `Card` shell with `CardHeader` / `CardContent`
- Title, priority `Badge`, label `Badge` list, assignee avatar initials
- `GripVertical` drag handle (visible on hover)
- Sync status shown as a small `CircleDot` / `CheckCircle2` / `AlertCircle` Lucide icon with `Tooltip` — never a raw coloured dot with no accessible label
- Click → shadcn/ui `Sheet` slide-in panel: markdown description, edit fields, `Github` icon link if synced

**Interactions**

- Drag-and-drop between columns (`@dnd-kit/core`)
- Inline edit via `Dialog` (not in-place contentEditable)
- Quick-add card at bottom of any column via `Button` with `Plus` icon
- Filter bar using `Input`, `Select`, and `Badge` toggles for label/priority/sync status

**Real-time**

- WebSocket connection to server
- Optimistic updates with rollback on error
- Feedback via `Sonner` toast on all mutations

### 1.3 CLI (`packages/cli`)

Talks to server REST API. Never touches SQLite directly.

```bash
# Boards
kanban boards list
kanban boards create "Sprint 42"
kanban boards use <boardId>           # sets defaultBoardId in local config

# Cards
kanban cards list
kanban cards list --status in_progress
kanban cards list --label bug --priority high
kanban cards add "Fix auth bug"
kanban cards add "Fix auth bug" --status todo --priority high --label bug
kanban cards show <cardId>
kanban cards update <cardId> --title "..." --status review
kanban cards delete <cardId>
kanban cards move <cardId> <status>

# Output formats
kanban cards list                     # table (default, human-readable)
kanban cards list --format json       # structured JSON (agent-preferred)
kanban cards list --format md         # markdown checklist
```

All commands accept `--board <boardId>` to override the default.

**Agent ergonomics**

- `--format json` returns stable, typed JSON — agents always use this flag
- Exit codes: `0` success, `1` error, `2` not found
- Data → stdout, errors → stderr

### 1.4 MCP Server (`packages/mcp`)

Long-lived process. Talks to the same REST API. Designed for Cursor / Windsurf.

**Tools** (agent-callable mutations)

```
kanban_list_cards       { boardId?, status?, label?, priority? }
kanban_create_card      { boardId?, title, description?, status?, priority?, labels? }
kanban_update_card      { cardId, title?, description?, status?, priority?, labels?, assignees? }
kanban_delete_card      { cardId }
kanban_move_card        { cardId, status, position? }
kanban_list_boards      {}
kanban_get_board        { boardId? }
```

**Resources** (ambient context the agent loads into its context window)

```
kanban://boards
  → JSON summary of all boards

kanban://boards/{boardId}
  → Full board as structured markdown (preferred for agent context)

    Format:
      # Board: {name}
      ## Backlog
      - [ ] Card title [priority:high] [label:bug] #cardId
      ## Todo
      - [ ] ...
      ## In Progress
      - [~] ...
      ## Review
      - [~] ...
      ## Done
      - [x] ...

kanban://boards/{boardId}/json
  → Full board as JSON (for programmatic access)

kanban://boards/{boardId}/cards/{status}
  → Cards filtered by status, as markdown list
```

The markdown resource is intentional. Agents reason over structured markdown significantly better than raw JSON as ambient context. The checkbox syntax gives immediate visual state at a glance.

**Prompts** (optional)

```
kanban_standup          → in-progress + recently done cards, formatted for standup
kanban_groom_backlog    → backlog cards with prompts for prioritisation decisions
```

---

## Phase 2 — GitHub Sync

### 2.1 CLI additions (Phase 2)

```bash
# Config
kanban github auth --token <pat>
kanban github link --project <projectNumber> --repo <owner/repo>
kanban github status                      # dirty/conflict counts, last sync time

# Sync
kanban github sync                        # pull then push
kanban github pull
kanban github push

# Issue management
kanban github issues list                 # browse without importing
kanban github issues list --label bug --state open
kanban github issues import               # import matching current filters
kanban github issues import <number>      # import single issue

# Conflict resolution
kanban github conflicts list
kanban github conflicts resolve <cardId> --field status --keep local
kanban github conflicts resolve <cardId> --field status --keep remote
```

### 2.2 UI additions (Phase 2)

- **Sync status bar** (bottom): "Last synced 2m ago · 3 dirty · 1 conflict · [Sync now]"
- **Conflict indicator** on card — red dot, click to open field-level diff + resolve
- **Import panel** — searchable GitHub Issues not yet on board, bulk or single import
- **Settings page** — GitHub token, project link, sync interval, column → status field mapping

---

## Build Milestones

### Milestone 1 — Foundation

- [ ] pnpm workspaces, Biome, Husky, Vitest, root tsconfig
- [ ] **CI**: GitHub Actions workflow (`.github/workflows/ci.yml`) for lint/test/typecheck
- [ ] `packages/core` — types, Zod schemas, constants
- [ ] Pure field-level merge function in `core/merge.ts`
- [ ] Unit tests: all four merge cases, conflict detection

### Milestone 2 — Server

- [ ] SQLite schema + migrations
- [ ] Fastify server, config loading
- [ ] CRUD routes for boards and cards
- [ ] WebSocket event emission on mutation
- [ ] Route integration tests

### Milestone 3 — Web UI

- [ ] Vite + React, Tailwind CSS config
- [ ] shadcn/ui init, component installs (`Button`, `Card`, `Dialog`, `Sheet`, `Badge`, `Select`, `Input`, `Textarea`, `Popover`, `Tooltip`, `DropdownMenu`, `ScrollArea`, `Alert`, `Skeleton`, `Sonner`)
- [ ] Lucide React installed, icon usage conventions documented
- [ ] Kanban board layout with shadcn/ui `ScrollArea` columns
- [ ] Drag-and-drop (`@dnd-kit/core`)
- [ ] WebSocket real-time updates
- [ ] Card create / edit via shadcn/ui `Dialog`
- [ ] Card detail via shadcn/ui `Sheet`
- [ ] Card delete with confirmation `Dialog`
- [ ] Filter bar using `Input`, `Select`, `Badge` toggles
- [ ] Toast feedback via `Sonner`

### Milestone 4 — CLI

- [ ] Commander, all board + card commands
- [ ] JSON, table, markdown output formatters
- [ ] Config file read/write

### Milestone 5 — MCP

- [ ] MCP server, all tools wired to REST
- [ ] Markdown board resource
- [ ] JSON board resource
- [ ] Round-trip integration test: create → read resource → update → delete

> ✅ **MVP complete**

### Milestone 6 — GitHub Auth + Issue Import

- [ ] PAT auth, stored in config
- [ ] `kanban github issues list`
- [ ] `kanban github issues import`

### Milestone 7 — GitHub Push

- [ ] `kanban github link` — store project + column → status option ID mapping
- [ ] Push cards → create/update Issues and Project items
- [ ] `syncSnapshot` and `dirtyFields` lifecycle wired in

### Milestone 8 — GitHub Pull + Automation Awareness

- [ ] Pull Project items via GraphQL
- [ ] Field-level merge algorithm wired into pull
- [ ] Clean local fields always accept remote (automation-safe)
- [ ] Conflict detection, `syncStatus: 'conflict'` marking

### Milestone 9 — Conflict Resolution + Polish

- [ ] Field-level conflict resolution in CLI and UI
- [ ] Background sync on interval
- [ ] Sync status bar in UI
- [ ] Import panel in UI
- [ ] Settings page
