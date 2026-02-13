# Kanban Board — Project Specification

> Local-first kanban board with AI agent access (CLI/MCP) and GitHub Projects sync.

---

## 1. Vision & Goals

A developer-facing kanban board that acts as a **single source of truth** for task management. It is:

- **Local-first** — works without GitHub, fast, no latency
- **AI-native** — designed from day one for IDE agents to read/write via CLI or MCP
- **Flat by design** — the UI and agent interface present a simple card model; sync complexity is hidden
- **GitHub-aware** — bidirectional sync with GitHub Projects and Issues runs in the background, playing nice with GitHub automations

The user (human or AI agent) never deals with GitHub API complexity. They see cards. The app handles the rest.

---

## 2. Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| Runtime | Node.js (LTS) | Universal, tooling-rich |
| Language | TypeScript (strict) | Safety, IDE ergonomics |
| Linter/Formatter | Biome | Fast, single-tool, zero config drift |
| Test runner | Vitest | Native TS, fast, compatible with Vite |
| Git hooks | Husky + lint-staged | Enforce quality at commit time |
| Web server | Fastify | Typed, fast, plugin ecosystem |
| UI framework | React (Vite) | Component model suits kanban |
| UI components | shadcn/ui | Unstyled, composable, copy-owned components |
| UI styling | Tailwind CSS | Required by shadcn/ui; utility-first |
| Icons | Lucide React | Consistent, clean icon set; no emoji |
| Tailwind class sorting | Biome `useSortedClasses` | See note below |

**Tailwind class sorting — known trade-off**

`prettier-plugin-tailwindcss` is the industry standard for sorting Tailwind classes but is a Prettier plugin. Running Prettier alongside Biome for formatting creates toolchain conflicts in CI and pre-commit hooks — don't do it.

`eslint-plugin-tailwindcss` is compatible with Biome (ESLint for this concern only, Biome for everything else) but adds a second lint toolchain to configure and maintain.

**Decision: use Biome's `useSortedClasses` rule only.** It handles standard Tailwind utilities correctly. Its known limitation — it doesn't read `tailwind.config.ts` for custom classes or plugins — is not a practical problem for this project, which uses stock Tailwind utilities and shadcn/ui without heavy customisation. If that changes, the contained fix is to replace Biome's formatter with Prettier at that point, not to run two formatters now.
| State (server) | SQLite via `better-sqlite3` | Local-first, zero infra, fast |
| State (client) | Zustand or Jotai | Lightweight, TS-friendly |
| CLI | `commander` | Mature, typed |
| MCP server | `@modelcontextprotocol/sdk` | Official SDK |
| GitHub sync | `@octokit/rest` + `@octokit/graphql` | REST for issues, GraphQL for Projects v2 |
| Job queue | `p-queue` + interval | Background sync, no infra needed |

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

---

## 3. Domain Model

### Card

The universal unit. Flat and simple for agents and users. Sync metadata is present but never the agent's concern.

```ts
interface Card {
  id: string;                   // ulid — local, stable, never changes
  title: string;
  description?: string;         // markdown
  status: ColumnId;             // 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'critical';
  labels: string[];
  assignees: string[];          // GitHub usernames or local names
  position: number;             // float for cheap re-ordering (lexorank-style)
  createdAt: string;            // ISO 8601
  updatedAt: string;

  // GitHub sync metadata — read-only from agent/user perspective
  githubIssueNumber?: number;
  githubProjectItemId?: string;
  githubRepo?: string;          // "owner/repo"

  // Sync state
  syncStatus: 'local' | 'synced' | 'dirty' | 'conflict';
  syncedAt?: string;            // timestamp of last successful sync

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
  githubProjectId?: string;        // GitHub Projects v2 node ID
  githubProjectNumber?: number;
  githubRepo?: string;             // default repo for this board
  createdAt: string;
  updatedAt: string;
}

interface Column {
  id: ColumnId;
  name: string;
  order: number;
  githubFieldValue?: string;       // maps to GitHub Project "Status" field option ID
}

type ColumnId = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
```

### Default columns

`Backlog` → `Todo` → `In Progress` → `Review` → `Done`

Configurable per board. The column-to-GitHub-status mapping is stored in the board config and set up during `kanban github link`.

---

## 4. Sync Model

This is the core design decision. Getting it right matters more than any feature.

### Guiding principle

> If a local field is clean (unchanged since last sync), GitHub always wins — including changes made by GitHub Project automations. If a local field is dirty (user or agent changed it), that field holds until explicitly pushed or resolved. A conflict only fires when the *same field* diverged on *both* sides.

GitHub automations (auto-close on PR merge, auto-move on label, etc.) are treated as legitimate signals, not interference. They change cards on GitHub cleanly, and since the corresponding local fields are clean, those changes flow in without friction. You do not need to disable automations for this tool to work well.

### Field-level merge algorithm

Run on every pull, for each synced card:

```
for each field in CardMutableFields:
  localDirty    = field is in card.dirtyFields
  githubChanged = github value !== card.syncSnapshot[field]

  !localDirty && !githubChanged  →  no-op
  !localDirty &&  githubChanged  →  accept GitHub value (automation or collaborator)
   localDirty && !githubChanged  →  keep local value (will push on next push)
   localDirty &&  githubChanged  →  CONFLICT on this field
```

A card is only marked `syncStatus: 'conflict'` if at least one field hits the last case. All non-conflicting fields still merge cleanly. The user or agent resolves only the specific fields that actually conflicted.

### Sync triggers

1. **On demand** — `kanban github sync / pull / push`
2. **On interval** — configurable, default 5 minutes when GitHub is configured
3. **Debounced on mutation** — 30s after any local card change, dirty cards are pushed

### Snapshot lifecycle

- `syncSnapshot` is written on every successful pull or push
- `dirtyFields` is updated on every local mutation: add field if value differs from snapshot, remove field if value returns to snapshot value
- After a successful push: clear `dirtyFields`, update `syncSnapshot` to new GitHub state, set `syncStatus: 'synced'`

---

## 5. Phase 1 — MVP

### 5.1 Server (`apps/server`)

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

### 5.2 Web UI (`apps/web`)

**UI principles**

All UI is built with shadcn/ui components on Tailwind CSS. No custom component primitives are written from scratch if a shadcn/ui equivalent exists. Icons are exclusively from Lucide React — no emoji anywhere in the interface.

shadcn/ui is copy-owned: components live in `apps/web/src/components/ui/` and are committed to the repo. This means no runtime dependency on a shadcn package and full control over component internals.

**shadcn/ui components used**

| Component | Usage |
|---|---|
| `Button` | All actions — create card, sync, settings |
| `Badge` | Priority labels, column counts, sync status |
| `Card` | Kanban card shell |
| `Dialog` | Card create / edit modal |
| `Sheet` | Card detail slide-in panel |
| `Select` | Status, priority, assignee dropdowns |
| `Input` | Card title, filter text input |
| `Textarea` | Card description (markdown) |
| `Popover` | Label picker, assignee picker |
| `Separator` | Column dividers, section breaks |
| `Tooltip` | Icon button labels |
| `DropdownMenu` | Board switcher, card context menu |
| `ScrollArea` | Column scroll containers |
| `Alert` | Conflict and error states |
| `Skeleton` | Loading states |
| `Toaster` / `Sonner` | Mutation feedback (card created, sync complete, error) |

**Lucide icons used**

| Icon | Usage |
|---|---|
| `Plus` | Add card, add column |
| `Pencil` | Edit card |
| `Trash2` | Delete card |
| `ArrowRightLeft` | Move card |
| `RefreshCw` | Sync / pull / push |
| `AlertCircle` | Conflict indicator |
| `CircleDot` | Dirty / pending sync indicator |
| `CheckCircle2` | Synced indicator |
| `Github` | GitHub link on synced cards |
| `Settings` | Settings page |
| `ChevronDown` | Board switcher dropdown |
| `Filter` | Filter bar toggle |
| `X` | Clear filter, close panel |
| `GripVertical` | Drag handle on cards |

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

### 5.3 CLI (`packages/cli`)

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

### 5.4 MCP Server (`packages/mcp`)

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

### 5.5 Quality Gates (Husky)

```
pre-commit:
  biome check --apply          # format + lint, auto-fix staged files
  vitest run --changed         # tests for changed files only

commit-msg:
  conventional commits lint    # enforces feat/fix/chore/docs/etc. prefix

pre-push:
  vitest run                   # full suite
  tsc -b --noEmit              # type check all packages
```

---

## 6. Phase 2 — GitHub Sync

### 6.1 Sync Engine

Lives in `apps/server/src/sync/`. Runs as a background service within the server process.

```
SyncEngine
  ├── pull(boardId)              # GitHub → local, runs field-level merge
  ├── push(boardId)              # dirty local cards → GitHub
  ├── sync(boardId)              # pull then push
  ├── importIssues(opts)         # fetch GitHub issues → new local cards
  └── resolveConflict(cardId, field, keep: 'local' | 'remote')
```

Not exposed directly to clients. Clients trigger it via REST endpoints. Status flows back via WebSocket `sync:status` events.

### 6.2 GitHub Data Mapping

| Local | GitHub |
|---|---|
| Board | Projects v2 project |
| Card | Issue + Project item |
| `status` | Project "Status" SingleSelectField value |
| `labels` | Issue labels |
| `assignees` | Issue assignees |
| `priority` | Issue label (`priority:high`) or custom Project field |
| `description` | Issue body (markdown) |
| `title` | Issue title |
| `githubIssueNumber` | Issue number |
| `githubProjectItemId` | Project item node ID |

**GitHub Projects v2 specifics**

- Issues and Project items are separate objects. Creating an issue does not add it to the project — requires a separate `addProjectV2ItemById` GraphQL mutation.
- The Status field is a `SingleSelectField` with option IDs, not free-text. The board config stores `ColumnId → GitHub option ID` mapping, set during `kanban github link`.
- Automations mutate Project items, not Issues. The pull must read Project item state via GraphQL, not just Issue state via REST.
- Projects v2 read/write requires GraphQL. The REST API does not support Projects v2.
- GraphQL rate limit: 5,000 points/hour. A full board pull costs ~1 point per item — not a concern at kanban scale.

### 6.3 Sync Operations

**Pull** (`GitHub → local`)

```
1. Fetch all Project items via GraphQL (projectV2Items, paginated)
2. For each item, fetch linked Issue data
3. For each item:
   a. No local card with this githubProjectItemId → create local card, syncStatus: 'synced'
   b. Local card exists → run field-level merge algorithm (§4)
4. Write syncSnapshot, syncedAt on all touched cards
5. Emit sync:status via WebSocket
```

**Push** (`local → GitHub`)

```
1. Query cards where syncStatus = 'dirty' or 'local'
2. For each card:
   a. githubIssueNumber exists:
      - PATCH issue (title, body, labels, assignees)
      - Update Project item status via GraphQL mutation
   b. No githubIssueNumber:
      - POST /repos/{owner}/{repo}/issues → store githubIssueNumber
      - addProjectV2ItemById → store githubProjectItemId
3. Set syncStatus: 'synced', update syncSnapshot, clear dirtyFields
4. Emit sync:status via WebSocket
```

**Import Issues**

```
1. Fetch Issues from GitHub REST with user-supplied filters (label, state, milestone)
2. Skip issues already linked to a local card (by githubIssueNumber)
3. Create local cards: syncStatus: 'local', githubIssueNumber set, githubProjectItemId empty
4. Cards are NOT yet added to the GitHub Project
5. User grooms locally, then pushes → creates Project items at that point
```

The two-step import→push model lets you refine issues before they appear on the shared GitHub Project board. This is the right UX for backlog grooming in a team context.

### 6.4 Conflict Resolution

A conflict means at least one field in `dirtyFields` was also changed on GitHub since `syncSnapshot`. Non-conflicting fields have already merged cleanly.

Resolution (field-by-field, not card-level):

```
keep-local    Push local field value to GitHub on next push
keep-remote   Accept GitHub value, remove field from dirtyFields
```

No automatic value merging in v1. In practice, conflicts are rare because the field-level model means most concurrent edits don't touch the same field.

### 6.5 CLI additions (Phase 2)

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

### 6.6 UI additions (Phase 2)

- **Sync status bar** (bottom): "Last synced 2m ago · 3 dirty · 1 conflict · [Sync now]"
- **Conflict indicator** on card — red dot, click to open field-level diff + resolve
- **Import panel** — searchable GitHub Issues not yet on board, bulk or single import
- **Settings page** — GitHub token, project link, sync interval, column → status field mapping

---

## 7. Data Flow

```
┌─────────┐     REST/WS      ┌────────────────────────────────────┐
│  Web UI │ ◄──────────────► │           Fastify Server            │
└─────────┘                  │                                     │
                              │  ┌──────────┐  ┌────────────────┐  │
┌─────────┐     REST          │  │  SQLite  │  │  Sync Engine   │  │
│   CLI   │ ──────────────►  │  │    DB    │  │  (background)  │  │
└─────────┘                  │  └──────────┘  └───────┬────────┘  │
                              │                         │           │
┌─────────┐     REST          │               ┌─────────▼────────┐  │
│   MCP   │ ──────────────►  │               │   GitHub API     │  │
└─────────┘                  │               │ REST + GraphQL   │  │
                              │               └──────────────────┘  │
                              └────────────────────────────────────┘
```

---

## 8. File Structure

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

---

## 9. Build Scripts

```json
{
  "scripts": {
    "dev": "concurrently 'pnpm --filter server dev' 'pnpm --filter web dev'",
    "dev:server": "pnpm --filter server dev",
    "dev:web": "pnpm --filter web dev",
    "dev:cli": "pnpm --filter cli dev",
    "dev:mcp": "pnpm --filter mcp dev",
    "build": "pnpm -r build",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "biome check .",
    "lint:fix": "biome check --apply .",
    "typecheck": "tsc -b --noEmit",
    "prepare": "husky"
  }
}
```

---

## 10. Build Milestones

### Milestone 1 — Foundation
- [ ] pnpm workspaces, Biome, Husky, Vitest, root tsconfig
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

---

## 11. Key Design Decisions

**Field-level merge, not last-write-wins**
GitHub automations are legitimate signals. A card auto-moved by a Project automation updates the local card cleanly because the local `status` field is clean (unchanged since last sync). Conflicts only fire when the *same field* diverged on both sides. This makes the tool a good citizen in team workflows with no automation changes required.

**Server is the single writer**
CLI, MCP, and web UI all talk REST to the Fastify server. Nothing writes to SQLite directly except the server. This prevents concurrency bugs and keeps adding new clients trivial.

**MCP board resource as markdown**
`kanban://boards/{boardId}` returns a markdown checklist. Agents reason over structured markdown significantly better than raw JSON as ambient context. The JSON variant at `kanban://boards/{boardId}/json` exists for programmatic access.

**SQLite over file store**
A JSON/YAML file is tempting but breaks under concurrent writes (server + sync engine + future tools). SQLite handles concurrent reads and serialised writes correctly with zero infrastructure.

**Float positions (lexorank-style)**
Card ordering uses floats. Moving a card gives it the midpoint between its neighbors. Rebalancing only needed when float precision runs out — rare at kanban scale.

**Import issues ≠ add to Project**
Importing a GitHub Issue creates a local card linked to that issue but does not add it to the GitHub Project. The user grooms it locally first, then pushes. This avoids cluttering the shared Project board with ungroomed issues, which is the right model for backlog refinement.

**CLI-first, MCP-supported**
CLI is the primary interface: easier to test, debug, and script. MCP wraps the same REST API for Cursor/Windsurf agent contexts. Both are thin clients. All logic lives in the server.
