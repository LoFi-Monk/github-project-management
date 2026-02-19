import type { Client } from '@libsql/client';
import { Board, type BoardId, type ColumnId } from '@lofi-pm/core';
import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/client';
import { BoardRepository } from '../repositories/BoardRepository';

/**
 * Registers routes for the /boards resource.
 *
 * @param app - The Fastify instance
 * @param options - Plugin options containing the DB client
 */
export async function boardRoutes(app: FastifyInstance, options: { db?: Client }) {
  const db = options.db || (await getDb());
  const boardRepo = new BoardRepository(db);

  /**
   * GET /boards
   *
   * Returns a list of all boards.
   */
  app.get('/', async (_request, reply) => {
    try {
      const boards = await boardRepo.findAll();
      return boards;
    } catch (error) {
      app.log.error(error);
      return reply.internalServerError('Failed to fetch boards');
    }
  });

  /**
   * POST /boards
   *
   * Creates a new board with default structural columns.
   */
  app.post('/', async (request, reply) => {
    try {
      // Use core domain model for validation and default structure creation
      const board = Board.parse({
        ...(request.body as object),
        // Default columns if not provided
        columns: (request.body as { columns?: unknown }).columns || {
          backlog: { id: 'backlog' as ColumnId, title: 'Backlog', cards: [] },
          todo: { id: 'todo' as ColumnId, title: 'To Do', cards: [] },
          in_progress: { id: 'in_progress' as ColumnId, title: 'In Progress', cards: [] },
          review: { id: 'review' as ColumnId, title: 'Review', cards: [] },
          done: { id: 'done' as ColumnId, title: 'Done', cards: [] },
        },
        cards: (request.body as { cards?: unknown }).cards || {},
      });

      await boardRepo.create(board);
      return reply.status(201).send(board);
    } catch (error) {
      app.log.error(error);
      if (error instanceof Error && error.name === 'ZodError') {
        return reply.badRequest((error as { message: string }).message);
      }
      return reply.internalServerError('Failed to create board');
    }
  });

  /**
   * GET /boards/:id
   *
   * Returns a specific board by ID, including its columns and cards.
   */
  app.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const board = await boardRepo.findById(id as BoardId);

      if (!board) {
        return reply.notFound('Board not found');
      }

      return board;
    } catch (error) {
      app.log.error(error);
      return reply.internalServerError('Failed to fetch board');
    }
  });
}
