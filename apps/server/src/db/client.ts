import fs from 'node:fs';
import path from 'node:path';
import { type Client, createClient } from '@libsql/client';

/**
 * Database client management using @libsql/client.
 *
 * Provides a single point of access to the SQLite database instance.
 * Supports local file and in-memory databases.
 */
let dbInstance: Client | null = null;

export interface DbOptions {
  path?: string;
}

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

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
