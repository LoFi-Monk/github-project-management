import fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import websocket from '@fastify/websocket';

/**
 * Builds the Fastify application instance.
 * 
 * This factory function handles plugin registration and route setup,
 * allowing the app to be tested independently of the network listener.
 * 
 * @returns The configured Fastify instance
 */
export async function buildApp() {
  const app = fastify({
    logger: true,
  });

  // Register plugins
  await app.register(cors);
  await app.register(sensible);
  await app.register(websocket);

  // Health check
  app.get('/health', async () => {
    return { status: 'ok' };
  });

  return app;
}
