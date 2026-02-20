import dotenv from 'dotenv';
import { buildApp } from './app';
import { closeDb, getDb } from './db/client';
import { runMigrations } from './db/migrator';
import { GitHubAuthService } from './services/GitHubAuthService';
import { TokenStore } from './services/TokenStore';

dotenv.config();

/**
 * Starts the Kanban Server.
 *
 * Initializes the database connection, runs pending migrations,
 * and starts the Fastify listener.
 */
async function start() {
  const port = Number(process.env.PORT) || 3000;
  const dbPath = process.env.DATABASE_URL || 'data/kanban.db';
  const githubClientId = process.env.GITHUB_CLIENT_ID || '';

  try {
    const db = await getDb({ path: dbPath });

    console.log('Running migrations...');
    await runMigrations(db);

    if (!githubClientId) {
      console.warn(
        'WARNING: GITHUB_CLIENT_ID is not set. GitHub integration features will be disabled.',
      );
    }

    // Initialize Auth Services
    const tokenStore = new TokenStore();
    const githubAuthService = new GitHubAuthService(tokenStore, githubClientId);

    const app = await buildApp({ db, githubAuthService });

    await app.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on port ${port}`);

    // Graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down...');
      await app.close();
      await closeDb();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
