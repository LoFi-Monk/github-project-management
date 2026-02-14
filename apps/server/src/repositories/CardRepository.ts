import type { Client } from '@libsql/client';
import { Card, type CardId, type ColumnId } from '@lofi-pm/core';

/**
 * Repository for Card entity using @libsql/client.
 *
 * Handles persistence and retrieval of cards from SQLite.
 */
export class CardRepository {
  constructor(private db: Client) {}

  /**
   * Create a new card in the database.
   */
  async create(card: typeof Card._type): Promise<void> {
    await this.db.execute({
      sql: `
        INSERT INTO cards (
          id, title, description, status, priority, labels, assignees, position, created_at, updated_at,
          dirty_fields, sync_snapshot, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        card.id,
        card.title,
        card.description || null,
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
   */
  async findById(id: CardId): Promise<typeof Card._type | null> {
    const result = await this.db.execute({
      sql: 'SELECT * FROM cards WHERE id = ?',
      args: [id],
    });

    const row = result.rows[0];
    if (!row) return null;

    return this.mapRow(row);
  }

  /**
   * Find all cards in a specific column.
   */
  async findByColumn(columnId: ColumnId): Promise<(typeof Card._type)[]> {
    const result = await this.db.execute({
      sql: 'SELECT * FROM cards WHERE status = ? ORDER BY position',
      args: [columnId],
    });
    return result.rows.map((row) => this.mapRow(row));
  }

  /**
   * Update an existing card.
   */
  async update(card: typeof Card._type): Promise<void> {
    await this.db.execute({
      sql: `
        UPDATE cards SET
          title = ?, description = ?, status = ?, priority = ?, labels = ?, assignees = ?, 
          position = ?, updated_at = ?, dirty_fields = ?, sync_snapshot = ?, sync_status = ?
        WHERE id = ?
      `,
      args: [
        card.title,
        card.description || null,
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
      ],
    });
  }

  /**
   * Delete a card by ID.
   */
  async delete(id: CardId): Promise<void> {
    await this.db.execute({
      sql: 'DELETE FROM cards WHERE id = ?',
      args: [id],
    });
  }

  private mapRow(row: any): typeof Card._type {
    return Card.parse({
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      status: row.status,
      priority: row.priority,
      labels: JSON.parse(row.labels),
      assignees: JSON.parse(row.assignees),
      position: Number(row.position),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      dirtyFields: row.dirty_fields ? JSON.parse(row.dirty_fields) : undefined,
      syncSnapshot: row.sync_snapshot ? JSON.parse(row.sync_snapshot) : undefined,
      syncStatus: row.sync_status || undefined,
    });
  }
}
