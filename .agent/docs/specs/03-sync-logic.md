# Sync Logic & Data Flow

This is the core design decision. Getting it right matters more than any feature.

## Sync Model

### Guiding principle

> If a local field is clean (unchanged since last sync), GitHub always wins — including changes made by GitHub Project automations. If a local field is dirty (user or agent changed it), that field holds until explicitly pushed or resolved. A conflict only fires when the _same field_ diverged on _both_ sides.

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

## Sync Operations (Phase 2)

### 1. Sync Engine

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

### 2. GitHub Data Mapping

| Local                 | GitHub                                                |
| --------------------- | ----------------------------------------------------- |
| Board                 | Projects v2 project                                   |
| Card                  | Issue + Project item                                  |
| `status`              | Project "Status" SingleSelectField value              |
| `labels`              | Issue labels                                          |
| `assignees`           | Issue assignees                                       |
| `priority`            | Issue label (`priority:high`) or custom Project field |
| `description`         | Issue body (markdown)                                 |
| `title`               | Issue title                                           |
| `githubIssueNumber`   | Issue number                                          |
| `githubProjectItemId` | Project item node ID                                  |

**GitHub Projects v2 specifics**

- Issues and Project items are separate objects. Creating an issue does not add it to the project — requires a separate `addProjectV2ItemById` GraphQL mutation.
- The Status field is a `SingleSelectField` with option IDs, not free-text. The board config stores `ColumnId → GitHub option ID` mapping, set during `kanban github link`.
- Automations mutate Project items, not Issues. The pull must read Project item state via GraphQL, not just Issue state via REST.
- Projects v2 read/write requires GraphQL. The REST API does not support Projects v2.
- GraphQL rate limit: 5,000 points/hour. A full board pull costs ~1 point per item — not a concern at kanban scale.

### 3. Sync Operations Details

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
   c. Set syncStatus: 'synced', update syncSnapshot, clear dirtyFields
3. Emit sync:status via WebSocket
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

### 4. Conflict Resolution

A conflict means at least one field in `dirtyFields` was also changed on GitHub since `syncSnapshot`. Non-conflicting fields have already merged cleanly.

Resolution (field-by-field, not card-level):

```
keep-local    Push local field value to GitHub on next push
keep-remote   Accept GitHub value, remove field from dirtyFields
```

No automatic value merging in v1. In practice, conflicts are rare because the field-level model means most concurrent edits don't touch the same field.

## Data Flow

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
