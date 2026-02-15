import type { BoardId } from '@lofi-pm/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app';
import { closeDb, getDb } from '../../src/db/client';
import { runMigrations } from '../../src/db/migrator';

/**
 * Integration tests for Cards API.
 */
describe('Cards API', () => {
  let app: any;
  const boardId = 'test-board' as BoardId;

  beforeEach(async () => {
    const db = await getDb({ path: ':memory:' });
    await runMigrations(db);
    app = await buildApp({ db });

    // Seed a board
    await app.inject({
      method: 'POST',
      url: '/boards',
      payload: { id: boardId, title: 'Test Board' },
    });
  });

  afterEach(async () => {
    if (app) await app.close();
    await closeDb();
  });

  /**
   * @remarks
   * Creating a valid card should return 201 Created and broadcast a websocket event (later).
   */
  it('POST /cards creates a new card', async () => {
    const payload = {
      id: 'card-1',
      title: 'New Card',
      status: 'todo',
      priority: 'high',
      position: 0,
      labels: [],
      assignees: [],
    };

    const response = await app.inject({
      method: 'POST',
      url: `/boards/${boardId}/cards`,
      payload,
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.id).toBe(payload.id);
    expect(body.title).toBe(payload.title);
  });

  /**
   * @remarks
   * Updating a card should return the updated object.
   */
  it('PUT /cards/:cardId updates a card', async () => {
    const cardId = 'card-to-update';
    // Create card first
    await app.inject({
      method: 'POST',
      url: `/boards/${boardId}/cards`,
      payload: { id: cardId, title: 'Old Title', status: 'todo', priority: 'low' },
    });

    const response = await app.inject({
      method: 'PUT',
      url: `/cards/${cardId}`,
      payload: { title: 'New Title' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().title).toBe('New Title');
  });

  /**
   * @remarks
   * Listing cards by board should return an array of cards.
   */
  it('GET /boards/:boardId/cards returns cards for a board', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/boards/${boardId}/cards`,
    });

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.json())).toBe(true);
  });

  /**
   * @remarks
   * Deleting a card should return 204 No Content.
   */
  it('DELETE /cards/:cardId deletes a card', async () => {
    const cardId = 'card-to-delete';
    await app.inject({
      method: 'POST',
      url: `/boards/${boardId}/cards`,
      payload: { id: cardId, title: 'Delete Me', status: 'todo', priority: 'low' },
    });

    const response = await app.inject({
      method: 'DELETE',
      url: `/cards/${cardId}`,
    });

    expect(response.statusCode).toBe(204);
  });

  /**
   * @remarks
   * Moving a card should update its status/position and broadcast 'card_moved'.
   */
  it('PATCH /cards/:cardId/move moves a card', async () => {
    const cardId = 'card-to-move';
    await app.inject({
      method: 'POST',
      url: `/boards/${boardId}/cards`,
      payload: { id: cardId, title: 'Move Me', status: 'todo', priority: 'low' },
    });

    const response = await app.inject({
      method: 'PATCH',
      url: `/cards/${cardId}/move`,
      payload: { status: 'in_progress', position: 5 },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe('in_progress');
  });
});
