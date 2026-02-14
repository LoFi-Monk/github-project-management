import { type Client, createClient } from '@libsql/client';
import { Board, type BoardId, Card, type CardId, type ColumnId } from '@lofi-pm/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runMigrations } from '../db/migrator';
import { BoardRepository } from './BoardRepository';
import { CardRepository } from './CardRepository';

describe('Repositories', () => {
  let db: Client;
  let cardRepo: CardRepository;
  let boardRepo: BoardRepository;

  beforeEach(async () => {
    // Use in-memory database for testing
    db = createClient({ url: 'file::memory:' });
    cardRepo = new CardRepository(db);
    boardRepo = new BoardRepository(db);
    await runMigrations(db);
  });

  afterEach(() => {
    db.close();
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
