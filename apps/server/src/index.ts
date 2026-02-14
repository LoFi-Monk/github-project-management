import { Board, type BoardId, Card, type CardId, type ColumnId } from '@lofi-pm/core';
import { closeDb, getDb } from './db/client';
import { runMigrations } from './db/migrator';
import { BoardRepository } from './repositories/BoardRepository';
import { CardRepository } from './repositories/CardRepository';

async function main() {
  console.log('--- Starting Storage Engine Verification (@libsql/client) ---');

  const db = await getDb({ path: 'data/test.db' });

  console.log('Running migrations...');
  await runMigrations(db);

  const boardRepo = new BoardRepository(db);
  const cardRepo = new CardRepository(db);

  const boardId = 'board-manual' as BoardId;

  console.log('Checking for existing board...');
  let board = await boardRepo.findById(boardId);

  if (!board) {
    console.log('Creating new board...');
    board = Board.parse({
      id: boardId,
      title: 'Manual Test Board',
      columns: {
        todo: { id: 'todo' as ColumnId, title: 'To Do', cards: [] },
      },
      cards: {},
    });
    await boardRepo.create(board);
  } else {
    console.log('Found existing board:', board.title);
  }

  const cardId = 'card-manual' as CardId;
  console.log('Creating/Updating manual card...');
  const card = Card.parse({
    id: cardId,
    title: 'Manual Test Card',
    status: 'todo' as ColumnId,
    priority: 'medium',
    labels: ['manual'],
    assignees: ['lofi'],
    position: Date.now(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const existing = await cardRepo.findById(cardId);
  if (existing) {
    await cardRepo.update(card, boardId);
  } else {
    await cardRepo.create(card, boardId);
  }

  console.log('Retrieving card...');
  const retrieved = await cardRepo.findById(cardId);
  console.log('Retrieved Card:', JSON.stringify(retrieved, null, 2));

  console.log('--- Verification Complete ---');
  closeDb();
}

main().catch(console.error);
