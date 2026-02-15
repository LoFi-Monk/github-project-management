import type { BoardId } from '@lofi-pm/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { buildApp } from '../../src/app';
import { closeDb, getDb } from '../../src/db/client';
import { runMigrations } from '../../src/db/migrator';

/**
 * Integration tests for WebSocket synchronization.
 */
describe('WebSockets', () => {
  let app: any;
  const boardId = 'ws-test-board' as BoardId;

  beforeEach(async () => {
    const db = await getDb({ path: ':memory:' });
    await runMigrations(db);
    app = await buildApp({ db });
    await app.listen({ port: 0 }); // Listen on a random free port

    // Seed board
    await app.inject({
      method: 'POST',
      url: '/boards',
      payload: { id: boardId, title: 'WS Test Board' },
    });
  });

  afterEach(async () => {
    if (app) await app.close();
    closeDb();
    // Clear event bus to prevent leaking clients between tests
    const { eventBus } = await import('../../src/ws/EventBus');
    eventBus.clear();
  });

  /**
   * @remarks
   * Clients should receive a 'card_created' event when a card is added to a board.
   */
  it('broadcasts event when a card is created', async () => {
    const address = app.server.address();
    const url = `ws://localhost:${address.port}/ws`;

    const ws = new WebSocket(url);

    const messagePromise = new Promise((resolve) => {
      ws.on('message', (data) => {
        resolve(JSON.parse(data.toString()));
      });
    });

    await new Promise((resolve) => ws.on('open', resolve));

    // Create a card via REST
    await app.inject({
      method: 'POST',
      url: `/boards/${boardId}/cards`,
      payload: { id: 'ws-card-1', title: 'WS Card', status: 'todo', priority: 'medium' },
    });

    const event: any = await messagePromise;
    expect(event.type).toBe('card_created');
    expect(event.payload.id).toBe('ws-card-1');

    ws.close();
  });
});
