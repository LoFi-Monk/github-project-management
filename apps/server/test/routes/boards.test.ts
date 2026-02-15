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
});
