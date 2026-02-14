import fs from 'node:fs';
import path from 'node:path';
import type { Client } from '@libsql/client';

/**
 * Migration runner for SQLite using @libsql/client.
 *
 * Scans the migrations directory for SQL files and applies them in order.
 */
export async function runMigrations(db: Client): Promise<void> {
  // Ensure migrations table exists
  await db.execute(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const appliedResult = await db.execute('SELECT name FROM migrations');
  const appliedNames = new Set(appliedResult.rows.map((m) => m.name as string));

  for (const file of files) {
    if (appliedNames.has(file)) continue;

    console.log(`Applying migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

    // LibSQL doesn't support complex transaction blocks via .execute for multiple statements easily
    // We execute the migration SQL (which might contain multiple statements) and then record it.
    // Note: Most migrations should be wrapped in BEGIN/COMMIT if they contain multiple statements.
    await db.executeMultiple(sql);
    await db.execute({
      sql: 'INSERT INTO migrations (name) VALUES (?)',
      args: [file],
    });
  }
}
