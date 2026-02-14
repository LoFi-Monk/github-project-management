import { areValuesEqual, type Card, MUTABLE_CARD_FIELDS } from './schema';

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
  const mutableFields = MUTABLE_CARD_FIELDS;

  let hasConflict = false;
  let remoteChangedAny = false;

  for (const field of mutableFields) {
    const remoteValue = remote[field];
    const snapshotValue = snapshot ? snapshot[field] : undefined;

    const isDirty = local.dirtyFields?.includes(field);

    // Remote changed if it differs from the snapshot we took last time.
    // BUG FIX: If we have no snapshot, we cannot determine if remote changed relative to our last sync.
    // In this case, we treat remoteChanged as false to avoid false conflicts.
    // The clean local fields will still take remote values if we didn't have dirtyFields,
    // but since we have dirtyFields here, we prioritize local work unless we PROVE a conflict.
    const remoteChanged = snapshot !== undefined && !areValuesEqual(remoteValue, snapshotValue);

    if (!isDirty && remoteChanged) {
      // CASE: Local is clean, Remote changed.
      // Action: Accept GitHub value (Automation or other user).
      (result as Record<string, unknown>)[field] = remoteValue;
      remoteChangedAny = true;
    } else if (isDirty && remoteChanged) {
      // CASE: Local is dirty, Remote changed.
      // Action: Conflict. We keep the local value to preserve user work,
      // but mark the card as conflicting so the UI can flag it.
      hasConflict = true;
    }
  }

  // Handle updatedAt propagation for merged result
  const localDate = new Date(local.updatedAt);
  const remoteDate = new Date(remote.updatedAt);

  if (remoteChangedAny || remoteDate > localDate) {
    result.updatedAt = remote.updatedAt;
  }

  if (hasConflict) {
    result.syncStatus = 'conflict';
  }

  return result;
}
