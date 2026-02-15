import type { Client } from '@libsql/client';
import { Board, type BoardId, Card, type CardId, type ColumnId } from '@lofi-pm/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDbClient } from '../db/client';
import { runMigrations } from '../db/migrator';
import { BoardRepository } from './BoardRepository';
import { CardRepository } from './CardRepository';

describe('Repositories', () => {
  let db: Client;
  let cardRepo: CardRepository;
  let boardRepo: BoardRepository;

  beforeEach(async () => {
    // Use fresh in-memory database per test via createDbClient
    db = await createDbClient({ path: ':memory:' });
    cardRepo = new CardRepository(db);
    boardRepo = new BoardRepository(db);
    await runMigrations(db);
  });

  afterEach(async () => {
    await db.close();
  });

  describe('BoardRepository', () => {
    it('should create and find a board', async () => {
      const board = Board.parse({
        id: 'board-1' as BoardId,
        title: 'Project Alpha',
        columns: {
          todo: { id: 'todo' as ColumnId, title: 'To Do', cards: [] },
        },
        cards: {},
      });

      await boardRepo.create(board);
      const found = await boardRepo.findById(board.id);

      expect(found).toBeDefined();
      expect(found?.title).toBe('Project Alpha');
      expect(found?.columns.todo).toBeDefined();
    });

    it('should cascade delete columns and cards when board is deleted', async () => {
      const board = Board.parse({
        id: 'board-delete' as BoardId,
        title: 'To Be Deleted',
        columns: {
          todo: { id: 'todo' as ColumnId, title: 'To Do', cards: [] },
        },
        cards: {},
      });
      await boardRepo.create(board);

      const card = Card.parse({
        id: 'card-delete' as CardId,
        title: 'Delete Me',
        status: 'todo' as ColumnId,
        priority: 'low',
        labels: [],
        assignees: [],
        position: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await cardRepo.create(card, board.id);

      // Verify existence
      expect(await boardRepo.findById(board.id)).toBeDefined();
      expect(await cardRepo.findById(card.id)).toBeDefined();

      // Delete board
      await boardRepo.delete(board.id);

      // Verify cascade
      expect(await boardRepo.findById(board.id)).toBeNull();
      expect(await cardRepo.findById(card.id)).toBeNull();
    });
  });

  describe('CardRepository', () => {
    it('should create and find a card', async () => {
      const board = Board.parse({
        id: 'board-1' as BoardId,
        title: 'Project Alpha',
        columns: {
          todo: { id: 'todo' as ColumnId, title: 'To Do', cards: [] },
        },
        cards: {},
      });
      await boardRepo.create(board);

      const card = Card.parse({
        id: 'card-1' as CardId,
        title: 'Implement Auth',
        status: 'todo' as ColumnId,
        priority: 'high',
        labels: ['feat'],
        assignees: ['lofi'],
        position: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await cardRepo.create(card, board.id);
      const found = await cardRepo.findById(card.id);

      expect(found).toBeDefined();
      expect(found?.title).toBe('Implement Auth');
      expect(found?.labels).toContain('feat');
    });
  });
});
