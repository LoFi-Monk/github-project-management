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
let initializedDbPath: string | null = null;

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
 * Constraints: Concurrent calls will return the same instance. Throws if re-initialization with different path is attempted.
 */
export async function createDbClient(options: DbOptions = {}): Promise<Client> {
  let dbPath = options.path || process.env.DATABASE_URL || 'data/kanban.db';
  if (dbPath.startsWith('file:')) {
    dbPath = dbPath.replace(/^file:/, '');
  }
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

  const client = createClient({
    url,
  });

  // Enable foreign keys and WAL mode for better concurrency and integrity
  await client.execute('PRAGMA foreign_keys = ON;');
  await client.execute('PRAGMA journal_mode = WAL;');

  return client;
}

/**
 * Get the singleton database client instance.
 * Initializes the client if it doesn't exist.
 *
 * Intent: Provide a single shared connection for the application runtime.
 *
 * Constraints: Concurrent calls will return the same instance. Throws if re-initialization with different path is attempted.
 */
export async function getDb(options: DbOptions = {}): Promise<Client> {
  const dbPath = options.path || process.env.DATABASE_URL || 'data/kanban.db';

  if (dbInstance) {
    if (initializedDbPath && initializedDbPath !== dbPath) {
      throw new Error(
        `Database already initialized with ${initializedDbPath}. Cannot change to ${dbPath}.`,
      );
    }
    return dbInstance;
  }

  dbInstance = await createDbClient(options);
  initializedDbPath = dbPath;

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
    initializedDbPath = null;
  }
}
