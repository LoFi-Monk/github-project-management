import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../../src/app';
import { closeDb, getDb } from '../../src/db/client';
import { runMigrations } from '../../src/db/migrator';

/**
 * Integration tests for Boards API.
 * 
 * Verifies that the server correctly handles requests for listing and creating boards.
 */
describe('Boards API', () => {
  let app: any;

  beforeEach(async () => {
    // Use in-memory DB for tests
    const db = await getDb({ path: ':memory:' });
    await runMigrations(db);
    app = await buildApp();
  });

  afterEach(async () => {
    await app.close();
    closeDb();
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
});
