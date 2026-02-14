import { z } from 'zod';

export const CardId = z.string().brand('CardId');
export type CardId = z.infer<typeof CardId>;

export const ColumnId = z.union([
  z.literal('backlog'),
  z.literal('todo'),
  z.literal('in_progress'),
  z.literal('review'),
  z.literal('done'),
]);
export type ColumnId = z.infer<typeof ColumnId>;

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

export const MUTABLE_CARD_FIELDS = MutableCardField.options;

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

export const Column = z.object({
  id: ColumnId,
  title: z.string(),
  cards: z.array(CardId),
});
export type Column = z.infer<typeof Column>;

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
export function areValuesEqual(a: any, b: any): boolean {
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

  return false;
}
