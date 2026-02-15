# ADR 0004: Merge Strategy for Offline-First Sync

## Status

Accepted

## Context

The system type is "local-first," meaning clients can mutate state while offline. When syncing with a central server (GitHub), simple timestamp-based "last write wins" is insufficient as it can overwrite concurrent work on different fields of the same entity.

## Decision

Adopt a **"Clean/Dirty" Field-Level Merge Logic**:

- Record a `syncSnapshot` on every successful sync.
- Track `dirtyFields` on local mutation.
- When reconciling:
  - If a field is **clean** locally, accept the remote change.
  - If a field is **dirty** locally, preserve the local change.
  - Flag a **conflict** only if both sides changed the same field relative to the snapshot.

## Consequences

### Positive

- **Intelligent Merging**: Concurrent edits to different fields (e.g., title vs labels) merge automatically without human intervention.
- **Reliability**: Reduces data loss compared to entity-level concurrency control.

### Negative

- Increased state management complexity (tracking snapshots and dirty flags).
- Requires per-field implementation of merge logic in `@lofi-pm/core`.
