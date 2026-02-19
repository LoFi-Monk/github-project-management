import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app';
import { closeDb, getDb } from '../../src/db/client';
import { runMigrations } from '../../src/db/migrator';

/**
 * Integration tests for Boards API.
 *
 * Verifies that the server correctly handles requests for listing and creating boards.
 */
describe('Boards API', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    // Use in-memory DB for tests
    const db = await getDb({ path: ':memory:' });
    await runMigrations(db);
    app = await buildApp({ db });
  });

  afterEach(async () => {
    if (app) await app.close();
    await closeDb();
  });

  /**
   * @remarks
   * When no boards exist, it should return an empty array.
   */
  it('GET /boards returns an empty array when no boards exist', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/boards',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });

  /**
   * @remarks
   * Creating a valid board should return 201 Created and the board object.
   */
  it('POST /boards creates a new board', async () => {
    const payload = {
      id: 'board-new',
      title: 'New Integration Board',
    };

    const response = await app.inject({
      method: 'POST',
      url: '/boards',
      payload,
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.id).toBe(payload.id);
    expect(body.title).toBe(payload.title);
    expect(body.columns).toBeDefined();
  });

  /**
   * @remarks
   * Fetching an existing board by ID should return 200 OK and the board object.
   */
  it('GET /boards/:id returns the specified board', async () => {
    // First, create a board
    const payload = {
      id: 'board-1',
      title: 'Fetch Me',
    };
    await app.inject({
      method: 'POST',
      url: '/boards',
      payload,
    });

    // Then, try to fetch it
    const response = await app.inject({
      method: 'GET',
      url: `/boards/${payload.id}`,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.id).toBe(payload.id);
    expect(body.title).toBe(payload.title);
    expect(body.columns).toBeDefined();
  });

  /**
   * @remarks
   * Fetching a non-existent board ID should return 404 Not Found.
   */
  it('GET /boards/:id returns 404 for non-existent board', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/boards/non-existent-id',
    });

    expect(response.statusCode).toBe(404);
  });
});
