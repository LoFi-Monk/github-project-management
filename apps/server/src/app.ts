import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import websocket from '@fastify/websocket';
import type { Client } from '@libsql/client';
import fastify from 'fastify';
import { authRoutes } from './routes/auth';
import { boardRoutes } from './routes/boards';
import { cardRoutes } from './routes/cards';
import type { GitHubAuthService } from './services/GitHubAuthService';

import { eventBus } from './ws/EventBus';

/**
 * Options for building the Fastify application.
 */
export interface AppOptions {
  /** Optional database client instance to use (useful for testing) */
  db?: Client;
  /** Optional GitHubAuthService instance (useful for testing) */
  githubAuthService?: GitHubAuthService;
}

/**
 * Builds the Fastify application instance.
 *
 * This factory function handles plugin registration and route setup,
 * allowing the app to be tested independently of the network listener.
 *
 * @param options - Application configuration options
 * @returns The configured Fastify instance
 */
export async function buildApp(options: AppOptions = {}) {
  const app = fastify({
    logger: process.env.NODE_ENV !== 'test', // Disable logger in tests for cleaner output
  });

  // Register plugins
  await app.register(cors);
  await app.register(sensible);
  await app.register(websocket);

  // WebSocket route
  app.get('/ws', { websocket: true }, (socket, _request) => {
    eventBus.addClient(socket);
  });

  // Register routes
  await app.register(boardRoutes, { prefix: '/boards', db: options.db });
  await app.register(cardRoutes, { db: options.db });
  await app.register(authRoutes, {
    prefix: '/auth/github',
    githubAuthService: options.githubAuthService,
  });

  // Health check
  app.get('/health', async () => {
    return { status: 'ok' };
  });

  return app;
}
