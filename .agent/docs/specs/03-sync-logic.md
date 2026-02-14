# Sync Logic & Data Flow

This is the core design decision. Getting it right matters more than any feature.

## Sync Model

### Guiding principle

> **"GitHub Wins" on Clean Fields, "Local Wins" on Dirty Fields.**
> If a local field is clean (unchanged since last sync), GitHub changes are accepted automatically. If a local field is dirty (user modified it), the local change is preserved. A conflict is only flagged if _both_ sides changed the _same_ field relative to the last sync snapshot.

### Field-level merge algorithm

Implemented in `packages/core/src/merge.ts`.

```typescript
// Pseudo-code of actual implementation
function mergeCards(local, remote) {
  if (!local.dirtyFields) return remote; // Optimization: Clean local overrides

  const snapshot = local.syncSnapshot;
  const result = { ...local };

  for (const field of MUTABLE_CARD_FIELDS) {
    const remoteValue = remote[field];
    const snapshotValue = snapshot[field];

    // Remote changed if value differs from snapshot
    // (Treats null/undefined as equal to handle JSON serialization)
    const remoteChanged = !areValuesEqual(remoteValue, snapshotValue);
    const isDirty = local.dirtyFields.includes(field);

    if (!isDirty && remoteChanged) {
      // Clean local + Remote change → Accept Remote
      result[field] = remoteValue;
    } else if (isDirty && remoteChanged) {
      // Dirty local + Remote change → Conflict
      result.syncStatus = "conflict";
      // We keep local value but flag it
    }
    // Else: Keep local (either local dirty, or no remote change)
  }

  // Propagate latest updatedAt
  result.updatedAt = max(local.updatedAt, remote.updatedAt);

  return result;
}
```

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
  ├── pull(boardId)              # GitHub → local, runs mergeCards()
  ├── push(boardId)              # dirty local cards → GitHub
  ├── sync(boardId)              # pull then push
  ├── importIssues(opts)         # fetch GitHub issues → new local cards
  └── resolveConflict(cardId, field, keep: 'local' | 'remote')
```

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

### 3. Conflict Resolution

A conflict means at least one field in `dirtyFields` was also changed on GitHub since `syncSnapshot`. Non-conflicting fields have already merged cleanly.

Resolution (field-by-field, not card-level):

```
keep-local    Push local field value to GitHub on next push
keep-remote   Accept GitHub value, remove field from dirtyFields
```
