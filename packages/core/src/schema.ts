import { z } from 'zod';

/**
 * Branded type for Card IDs to prevent accidental string usage.
 *
 * Intent: Type safety for ID references.
 */
export const CardId = z.string().brand('CardId');
export type CardId = z.infer<typeof CardId>;

/**
 * Defined states for a column in the Kanban board.
 *
 * Intent: Restricted set of allowed column states.
 */
export const ColumnId = z.union([
  z.literal('backlog'),
  z.literal('todo'),
  z.literal('in_progress'),
  z.literal('review'),
  z.literal('done'),
]);
export type ColumnId = z.infer<typeof ColumnId>;

/**
 * Branded type for Board IDs.
 *
 * Intent: Type safety for Board ID references.
 */
export const BoardId = z.string().brand('BoardId');
export type BoardId = z.infer<typeof BoardId>;

/**
 * Fields that are subject to field-level conflict resolution.
 */
export const MutableCardField = z.enum([
  'title',
  'description',
  'status',
  'priority',
  'labels',
  'assignees',
  'position',
]);
export type MutableCardField = z.infer<typeof MutableCardField>;

/**
 * Array of field names that can be modified by users and synced.
 *
 * Guarantees: Matches the keys allowed in `MutableCardField` schema.
 */
export const MUTABLE_CARD_FIELDS = MutableCardField.options;

/**
 * Zod schema for a Card entity.
 *
 * Intent: Validate card data structure and constraints.
 *
 * Guarantees:
 * - `id` is a valid CardId.
 * - `title` is non-empty.
 * - `status` is a valid ColumnId.
 * - `createdAt` and `updatedAt` are ISO 8601 strings.
 */
export const Card = z.object({
  id: CardId,
  title: z.string().min(1),
  description: z.string().optional(),
  status: ColumnId,
  priority: z.union([
    z.literal('low'),
    z.literal('medium'),
    z.literal('high'),
    z.literal('critical'),
  ]),
  labels: z.array(z.string()),
  assignees: z.array(z.string()),
  position: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  // Sync fields

  // Tracks which fields have been modified locally since the last sync.
  // Used to determine "Local Wins" vs "GitHub Wins" on a field-by-field basis.
  dirtyFields: z.array(MutableCardField).optional(),

  // A copy of the card state as it was during the last successful sync.
  // Used to detect if the remote (GitHub) value has changed since then.
  syncSnapshot: z.record(z.unknown()).optional(),

  // The current synchronization state of the card.
  syncStatus: z.enum(['synced', 'dirty', 'conflict', 'local']).optional(),
});
export type Card = z.infer<typeof Card>;

/**
 * Zod schema for a Column entity.
 *
 * Intent: Group cards under a specific status.
 *
 * Guarantees:
 * - `id` matches a valid `ColumnId`.
 * - `cards` is an array of `CardId` references (normalized).
 */
export const Column = z.object({
  id: ColumnId,
  title: z.string(),
  cards: z.array(CardId),
});
export type Column = z.infer<typeof Column>;

/**
 * Zod schema for a Board entity.
 *
 * Intent: Root aggregate for a Kanban project.
 *
 * Guarantees:
 * - `columns` and `cards` are normalized maps indexed by ID.
 */
export const Board = z.object({
  id: BoardId,
  title: z.string(),
  columns: z.record(ColumnId, Column),
  cards: z.record(CardId, Card),
});
export type Board = z.infer<typeof Board>;

/**
 * Deep equality check tailored for offline-first sync.
 * Treats null and undefined as equivalent for comparison purposes
 * (handling JSON serialization artifacts).
 */
export function areValuesEqual(a: unknown, b: unknown): boolean {
  // Treat null and undefined as equal
  if ((a === null || a === undefined) && (b === null || b === undefined)) {
    return true;
  }

  if (a === b) return true;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!areValuesEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // Added object comparison
  if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) =>
      areValuesEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
    );
  }

  return false;
}

/**
 * Zod schema for GitHub authentication status.
 *
 * Intent: State monitoring for the user's connection to GitHub.
 */
export const GitHubAuthStatus = z.object({
  authenticated: z.boolean(),
  username: z.string().optional(),
});
export type GitHubAuthStatus = z.infer<typeof GitHubAuthStatus>;

/**
 * Zod schema for GitHub Device Flow verification details.
 *
 * Intent: Carry details for the user to complete GitHub authentication on another device.
 */
export const DeviceCodeResponse = z.object({
  userCode: z.string(),
  verificationUri: z.string(),
  expiresIn: z.number(),
  interval: z.number(),
});
export type DeviceCodeResponse = z.infer<typeof DeviceCodeResponse>;
