import { Card, type CardId, type ColumnId } from '@lofi-pm/core';

/**
 * Maps a raw database row to a Card domain object.
 * Handles type casting and defaults.
 *
 * Note: boardId is added to the domain object for repository/server usage
 * even though it's not in the base Zod schema.
 */
export function mapCardRow(row: Record<string, unknown>): typeof Card._type & { boardId: string } {
  const card = Card.parse({
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? undefined,
    status: row.status as string,
    priority: row.priority as string,
    labels: JSON.parse(row.labels as string),
    assignees: JSON.parse(row.assignees as string),
    // Defense against LibSQL returning bigints for INTEGER columns
    position: Number(row.position),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    dirtyFields: row.dirty_fields ? JSON.parse(row.dirty_fields as string) : undefined,
    syncSnapshot: row.sync_snapshot ? JSON.parse(row.sync_snapshot as string) : undefined,
    syncStatus: (row.sync_status as string) || undefined,
  });

  return {
    ...card,
    boardId: row.board_id as string,
  };
}

/**
 * Maps a raw database row to a Column domain object.
 */
export function mapColumnRow(row: Record<string, unknown>): {
  id: ColumnId;
  title: string;
  cards: CardId[];
} {
  return {
    id: row.id as ColumnId,
    title: row.title as string,
    cards: [] as CardId[], // Cards are populated separately
  };
}
