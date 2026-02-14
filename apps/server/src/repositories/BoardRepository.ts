import type { Client } from '@libsql/client';
import { Board, type BoardId, type Column, type ColumnId } from '@lofi-pm/core';

/**
 * Repository for Board entity using @libsql/client.
 *
 * Manages boards and their associated columns.
 */
export class BoardRepository {
  constructor(private db: Client) {}

  /**
   * Create a new board and its default columns.
   */
  async create(board: typeof Board._type): Promise<void> {
    // LibSQL batch for transaction
    const stmts = [
      {
        sql: 'INSERT INTO boards (id, title) VALUES (?, ?)',
        args: [board.id, board.title],
      },
    ];

    Object.values(board.columns).forEach((column, index) => {
      stmts.push({
        sql: 'INSERT INTO columns (id, board_id, title, position) VALUES (?, ?, ?, ?)',
        args: [column.id, board.id, column.title, index],
      });
    });

    await this.db.batch(stmts, 'write');
  }

  /**
   * Find a board by ID, including its columns.
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

    const columns: Record<string, Column> = {};
    columnResult.rows.forEach((row) => {
      columns[row.id as string] = {
        id: row.id as ColumnId,
        title: row.title as string,
        cards: [],
      };
    });

    return Board.parse({
      id: boardRow.id,
      title: boardRow.title,
      columns,
      cards: {},
    });
  }

  /**
   * Update board title.
   */
  async update(board: typeof Board._type): Promise<void> {
    await this.db.execute({
      sql: 'UPDATE boards SET title = ? WHERE id = ?',
      args: [board.title, board.id],
    });
  }

  /**
   * Delete a board and all its associated columns/cards.
   */
  async delete(id: BoardId): Promise<void> {
    await this.db.execute({
      sql: 'DELETE FROM boards WHERE id = ?',
      args: [id],
    });
  }
}
