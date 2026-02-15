import type { Client } from '@libsql/client';
import { type BoardId, Card, type CardId } from '@lofi-pm/core';
import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/client';
import { CardRepository } from '../repositories/CardRepository';
import { mapCardRow } from '../repositories/utils';
import { eventBus } from '../ws/EventBus';

/**
 * Registers routes for the /cards and board-nested card resources.
 *
 * @param app - The Fastify instance
 * @param options - Plugin options containing the DB client
 */
export async function cardRoutes(app: FastifyInstance, options: { db?: Client }) {
  const db = options.db || (await getDb());
  const cardRepo = new CardRepository(db);

  /**
   * POST /boards/:boardId/cards
   *
   * Creates a new card on the specified board.
   */
  app.post('/boards/:boardId/cards', async (request, reply) => {
    const { boardId } = request.params as { boardId: BoardId };
    try {
      const card = Card.parse({
        labels: [],
        assignees: [],
        position: 0,
        ...(request.body as object),
        boardId, // Ensure it's correctly set from URL
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await cardRepo.create(card, boardId);

      // Broadcast event
      eventBus.broadcast('card_created', { ...card, boardId });

      return reply.status(201).send({ ...card, boardId });
    } catch (error) {
      app.log.error(error);
      if (error instanceof Error && error.name === 'ZodError') {
        return reply.badRequest((error as { message: string }).message);
      }
      return reply.internalServerError('Failed to create card');
    }
  });

  /**
   * GET /boards/:boardId/cards
   *
   * Lists all cards for a specific board, organized by column (implicit via repository).
   */
  app.get('/boards/:boardId/cards', async (request, reply) => {
    const { boardId } = request.params as { boardId: BoardId };
    try {
      // We'll need a way to get all cards for a board.
      // CardRepository.findByColumn exists, but not findByBoard.
      // Let's use a raw query or add findByBoard to Repository.
      const result = await db.execute({
        sql: 'SELECT * FROM cards WHERE board_id = ? ORDER BY position',
        args: [boardId],
      });
      const cards = result.rows.map((row) => mapCardRow(row as unknown as Record<string, unknown>));
      return cards;
    } catch (error) {
      app.log.error(error);
      return reply.internalServerError('Failed to fetch cards');
    }
  });

  /**
   * PUT /cards/:cardId
   *
   * Updates an existing card.
   */
  app.put('/cards/:cardId', async (request, reply) => {
    const { cardId } = request.params as { cardId: CardId };
    try {
      const existing = await cardRepo.findById(cardId);
      if (!existing) {
        return reply.notFound('Card not found');
      }

      const boardId = existing.boardId; // Prevent moving boards via PUT

      const card = Card.parse({
        ...existing,
        ...(request.body as object),
        id: cardId, // Protect ID
        createdAt: existing.createdAt, // Protect creation timestamp
        updatedAt: new Date().toISOString(),
      });

      await cardRepo.update(card, boardId);

      // Broadcast event
      eventBus.broadcast('card_updated', { ...card, boardId });

      return { ...card, boardId };
    } catch (error) {
      app.log.error(error);
      if (error instanceof Error && error.name === 'ZodError') {
        return reply.badRequest((error as { message: string }).message);
      }
      return reply.internalServerError('Failed to update card');
    }
  });

  /**
   * PATCH /cards/:cardId/move
   *
   * Moves a card to a different status or position.
   */
  app.patch('/cards/:cardId/move', async (request, reply) => {
    const { cardId } = request.params as { cardId: CardId };
    const { status, position } = request.body as { status?: string; position?: number };

    try {
      const existing = await cardRepo.findById(cardId);
      if (!existing) {
        return reply.notFound('Card not found');
      }

      const card = Card.parse({
        ...existing,
        status: status || existing.status,
        position: position !== undefined ? position : existing.position,
        updatedAt: new Date().toISOString(),
      });

      await cardRepo.update(card, existing.boardId);

      // Broadcast move event
      eventBus.broadcast('card_moved', {
        id: cardId,
        boardId: existing.boardId,
        fromStatus: existing.status,
        toStatus: card.status,
        fromPosition: existing.position,
        toPosition: card.position,
      });

      return { ...card, boardId: existing.boardId };
    } catch (error) {
      app.log.error(error);
      return reply.internalServerError('Failed to move card');
    }
  });

  /**
   * DELETE /cards/:cardId
   *
   * Deletes a card.
   */
  app.delete('/cards/:cardId', async (request, reply) => {
    const { cardId } = request.params as { cardId: CardId };
    try {
      const existing = await cardRepo.findById(cardId);
      if (!existing) {
        return reply.notFound('Card not found');
      }

      await cardRepo.delete(cardId);

      // Broadcast event
      eventBus.broadcast('card_deleted', { id: cardId });

      return reply.status(204).send();
    } catch (error) {
      app.log.error(error);
      return reply.internalServerError('Failed to delete card');
    }
  });
}
