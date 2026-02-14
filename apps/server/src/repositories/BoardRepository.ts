import type { Client } from '@libsql/client';
import { Board, type BoardId, Card, type Column, type ColumnId } from '@lofi-pm/core';

/**
 * Repository for Board entity using @libsql/client.
 *
 * Intent: Manages persistence and retrieval of boards and their associated columns in SQLite.
 *
 * Guarantees: Maps database rows to the `@lofi-pm/core` Board and Column Zod schemas.
 */
export class BoardRepository {
  constructor(private db: Client) {}

  /**
   * Create a new board and its default columns.
   *
   * Intent: Initialize a new Kanban board with its structural columns in a single transaction.
   *
   * Guarantees: Atomic operation. Either both board and columns are created, or neither.
   */
  async create(board: typeof Board._type): Promise<void> {
    // LibSQL batch for transaction
    const stmts = [
      {
        sql: 'INSERT INTO boards (id, title) VALUES (?, ?)',
        args: [board.id, board.title] as (string | number)[],
      },
    ];

    // Sort columns by position or use a deterministic order (e.g. enum order)
    const sortedColumns = Object.values(board.columns).sort((a, b) => {
      // If we had a position field in core, we'd use it.
      // For now, we'll use a reliable set order based on the ColumnId enum
      const order = ['backlog', 'todo', 'in_progress', 'review', 'done'];
      return order.indexOf(a.id) - order.indexOf(b.id);
    });

    sortedColumns.forEach((column, index) => {
      stmts.push({
        sql: 'INSERT INTO columns (id, board_id, title, position) VALUES (?, ?, ?, ?)',
        args: [column.id, board.id, column.title, index] as (string | number)[],
      });
    });

    await this.db.batch(stmts, 'write');
  }

  /**
   * Find a board by ID, including its columns.
   *
   * Intent: Retrieve the structural definition of a board.
   *
   * Guarantees: Returns a parsed Board object with its columns (but without cards) or null if not found.
   */
  async findById(id: BoardId): Promise<typeof Board._type | null> {
    const boardResult = await this.db.execute({
      sql: 'SELECT * FROM boards WHERE id = ?',
      args: [id],
    });
    const boardRow = boardResult.rows[0];
    if (!boardRow) return null;

    const columnResult = await this.db.execute({
      sql: 'SELECT * FROM columns WHERE board_id = ? ORDER BY position',
      args: [id],
    });

    const cardResult = await this.db.execute({
      sql: 'SELECT * FROM cards WHERE board_id = ? ORDER BY position',
      args: [id],
    });

    const columns: Record<string, Column> = {};
    columnResult.rows.forEach((row: any) => {
      columns[row.id as string] = {
        id: row.id as ColumnId,
        title: row.title as string,
        cards: [],
      };
    });

    const cards: Record<string, typeof Card._type> = {};
    cardResult.rows.forEach((row: any) => {
      const card = this.mapCardRow(row);
      cards[card.id] = card;
      if (columns[card.status as string]) {
        columns[card.status as string].cards.push(card.id);
      }
    });

    return Board.parse({
      id: boardRow.id,
      title: boardRow.title,
      columns,
      cards,
    });
  }

  private mapCardRow(row: any): typeof Card._type {
    return Card.parse({
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      status: row.status as ColumnId,
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

  /**
   * Update board title.
   *
   * Intent: Change the display name of an existing board.
   *
   * Guarantees: Updates the 'title' column for the matching Board ID.
   */
  async update(board: typeof Board._type): Promise<void> {
    const stmts = [
      {
        sql: 'UPDATE boards SET title = ? WHERE id = ?',
        args: [board.title, board.id],
      },
    ];

    // Note: This simple update only handles title for now, similar to previous version
    // but we accept full board for consistency. Future implementation can handle columns.
    await this.db.batch(stmts, 'write');
  }

  /**
   * Delete a board and all its associated columns/cards.
   *
   * Intent: Hard delete a board and its structure.
   *
   * Guarantees: Cascading deletes via foreign keys handle associated columns and cards.
   */
  async delete(id: BoardId): Promise<void> {
    await this.db.execute({
      sql: 'DELETE FROM boards WHERE id = ?',
      args: [id],
    });
  }
}
