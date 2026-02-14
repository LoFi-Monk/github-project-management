import fs from 'node:fs';
import path from 'node:path';
import { type Client, createClient } from '@libsql/client';

/**
 * Database client management using @libsql/client.
 *
 * Intent: Provides a single point of access to the SQLite database instance for the server.
 *
 * Guarantees: Supports local file and in-memory databases. Ensures the data directory exists
 * before initialization.
 */
let dbInstance: Client | null = null;

export interface DbOptions {
  path?: string;
}

/**
 * Retrieve the singleton database instance.
 *
 * Intent: Ensure all database operations use a consistent, configured connection.
 *
 * Guarantees: Returns an initialized LibSQL Client. Defaults to local 'data/kanban.db' if no path provided.
 *
 * Constraints: Concurrent calls will return the same instance once initialized.
 */
export function getDb(options: DbOptions = {}): Client {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = options.path || process.env.DATABASE_URL || 'data/kanban.db';
  let url = '';

  if (dbPath === ':memory:') {
    url = 'file::memory:';
  } else {
    const absolutePath = path.resolve(dbPath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    url = `file:${absolutePath}`;
  }

  dbInstance = createClient({
    url,
  });

  return dbInstance;
}

/**
 * Close the singleton database instance.
 *
 * Intent: Safely release database resources during shutdown or tests.
 *
 * Guarantees: Idempotent. Sets the shared instance to null after closing.
 */
export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
