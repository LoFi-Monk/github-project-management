import fs from 'node:fs';
import path from 'node:path';
import type { Client } from '@libsql/client';

/**
 * Migration runner for SQLite using @libsql/client.
 *
 * Intent: Scans the migrations directory for SQL files and applies them in order to ensure the
 * database schema is up-to-date and consistent.
 *
 * Guarantees: Idempotent. Tracks applied migrations in a 'migrations' table and skips those
 * already applied.
 *
 * Constraints: Migrations are applied in alphabetical order based on filename.
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

    // Wrap migration execution and recording in a transaction for atomicity
    // We split the SQL by semicolons to execute as individual statements in a batch
    const statements: { sql: string; args: any[] }[] = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => ({ sql: s, args: [] }));

    statements.push({
      sql: 'INSERT INTO migrations (name) VALUES (?)',
      args: [file],
    });

    await db.batch(statements, 'write');
  }
}
