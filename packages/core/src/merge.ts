import type { Card } from './schema';

/**
 * Merges a local card with a remote card based on the "offline-first" sync strategy.
 *
 * Strategy:
 * - If local field is CLEAN (not in dirtyFields), accept REMOTE change.
 * - If local field is DIRTY (in dirtyFields), keep LOCAL change.
 * - If both LOCAL and REMOTE changed the same field (relative to snapshot), mark as CONFLICT.
 */
export function mergeCards(local: Card, remote: Card): Card {
  // Optimization: If local has no changes, we can safely overwrite with remote.
  if (!local.dirtyFields || local.dirtyFields.length === 0) {
    return remote;
  }

  // We need the snapshot to determine if the remote value has changed since the last sync.
  const snapshot = local.syncSnapshot as Partial<Card> | undefined;

  const result = { ...local };

  // Fields that are synchronized and subject to merge logic.
  const mutableFields = [
    'title',
    'description',
    'status',
    'priority',
    'labels',
    'assignees',
    'position',
  ] as const;

  let hasConflict = false;

  for (const field of mutableFields) {
    const remoteValue = remote[field];
    const snapshotValue = snapshot ? snapshot[field] : undefined;

    const isDirty = local.dirtyFields?.includes(field);

    // Remote changed if it differs from the snapshot we took last time.
    // If we have no snapshot, we assume remote is different (safe default).
    const remoteChanged = !isEqual(remoteValue, snapshotValue);

    if (!isDirty && remoteChanged) {
      // CASE: Local is clean, Remote changed.
      // Action: Accept GitHub value (Automation or other user).
      (result as any)[field] = remoteValue;
    } else if (isDirty && remoteChanged) {
      // CASE: Local is dirty, Remote changed.
      // Action: Conflict. We keep the local value to preserve user work,
      // but mark the card as conflicting so the UI can flag it.
      hasConflict = true;
    }
    // CASE: !isDirty && !remoteChanged -> Both same, keep local (which matches remote).
    // CASE: isDirty && !remoteChanged  -> Local changed, Remote same. Keep local (pending push).
  }

  if (hasConflict) {
    result.syncStatus = 'conflict';
  }

  return result;
}

/**
 * Helper to compare field values.
 * specific handling for arrays (labels, assignees) to ensure content equality.
 */
function isEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  return false;
}
