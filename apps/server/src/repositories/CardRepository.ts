import type { Client } from '@libsql/client';
import type { CardId, ColumnId } from '@lofi-pm/core';
import { mapCardRow } from './utils';

/**
 * Repository for Card entity using @libsql/client.
 *
 * Intent: Provides persistence and retrieval logic for Kanban cards in SQLite.
 *
 * Guarantees: Maps database rows to the `@lofi-pm/core` Card Zod schema. Handles JSON serialization
 * for labels and assignees.
 */
export class CardRepository {
  constructor(private db: Client) {}

  /**
   * Create a new card in the database.
   *
   * Intent: Persist a new card object to the SQLite storage.
   *
   * Guarantees: Inserts a row into the 'cards' table. Serializes complex objects to JSON strings.
   */
  async create(card: typeof Card._type, boardId: string): Promise<void> {
    await this.db.execute({
      sql: `
        INSERT INTO cards (
          id, board_id, title, description, status, priority, labels, assignees, position, created_at, updated_at,
          dirty_fields, sync_snapshot, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        card.id,
        boardId,
        card.title,
        card.description ?? null,
        card.status,
        card.priority,
        JSON.stringify(card.labels),
        JSON.stringify(card.assignees),
        card.position,
        card.createdAt,
        card.updatedAt,
        card.dirtyFields ? JSON.stringify(card.dirtyFields) : null,
        card.syncSnapshot ? JSON.stringify(card.syncSnapshot) : null,
        card.syncStatus || null,
      ],
    });
  }

  /**
   * Find a card by ID.
   *
   * Intent: Retrieve a single card from the database by its unique identifier.
   *
   * Guarantees: Returns a parsed Card object or null if not found.
   */
  async findById(id: CardId): Promise<typeof Card._type | null> {
    const result = await this.db.execute({
      sql: 'SELECT * FROM cards WHERE id = ?',
      args: [id],
    });

    const row = result.rows[0];
    if (!row) return null;

    return mapCardRow(row as unknown as Record<string, unknown>);
  }

  /**
   * Find all cards in a specific column.
   *
   * Intent: List all cards associated with a column, ordered by their board position.
   *
   * Guarantees: Returns an array of parsed Card objects, sorted by 'position' ascending.
   */
  async findByColumn(columnId: ColumnId, boardId: string): Promise<(typeof Card._type)[]> {
    const result = await this.db.execute({
      sql: 'SELECT * FROM cards WHERE status = ? AND board_id = ? ORDER BY position',
      args: [columnId, boardId],
    });
    return result.rows.map((row) => mapCardRow(row as unknown as Record<string, unknown>));
  }

  /**
   * Update an existing card.
   *
   * Intent: Synchronize changes to a card object back to the database.
   *
   * Guarantees: Replaces existing row values with current object state based on Card ID.
   */
  async update(card: typeof Card._type, boardId: string): Promise<void> {
    await this.db.execute({
      sql: `
        UPDATE cards SET
          title = ?, description = ?, status = ?, priority = ?, labels = ?, assignees = ?, 
          position = ?, updated_at = ?, dirty_fields = ?, sync_snapshot = ?, sync_status = ?
        WHERE id = ? AND board_id = ?
      `,
      args: [
        card.title,
        card.description ?? null,
        card.status,
        card.priority,
        JSON.stringify(card.labels),
        JSON.stringify(card.assignees),
        card.position,
        card.updatedAt,
        card.dirtyFields ? JSON.stringify(card.dirtyFields) : null,
        card.syncSnapshot ? JSON.stringify(card.syncSnapshot) : null,
        card.syncStatus || null,
        card.id,
        boardId,
      ],
    });
  }

  /**
   * Delete a card by ID.
   *
   * Intent: Remove a card from the database.
   *
   * Guarantees: Deletes the row matching the provided Card ID. Idempotent.
   */
  async delete(id: CardId): Promise<void> {
    await this.db.execute({
      sql: 'DELETE FROM cards WHERE id = ?',
      args: [id],
    });
  }
}
