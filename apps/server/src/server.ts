import dotenv from 'dotenv';
import { buildApp } from './app';
import { closeDb, getDb } from './db/client';
import { runMigrations } from './db/migrator';

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

  try {
    const db = await getDb({ path: dbPath });

    console.log('Running migrations...');
    await runMigrations(db);

    const app = await buildApp({ db });

    await app.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on port ${port}`);

    // Graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down...');
      await app.close();
      closeDb();
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
