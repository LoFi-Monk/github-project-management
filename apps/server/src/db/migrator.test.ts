import { type Client, createClient } from '@libsql/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runMigrations } from './migrator';

describe('Migrator', () => {
  let db: Client;

  beforeEach(async () => {
    // Use in-memory database for testing
    db = createClient({ url: 'file::memory:' });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should run migrations successfully', async () => {
    await runMigrations(db);

    const migrations = await db.execute('SELECT name FROM migrations');
    expect(migrations.rows).toHaveLength(1);
    expect(migrations.rows[0].name).toBe('001_init.sql');

    const tableCheck = await db.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='boards'",
    );
    expect(tableCheck.rows).toHaveLength(1);
  });

  it('should be idempotent (running twice does nothing)', async () => {
    await runMigrations(db);
    await runMigrations(db);

    const migrations = await db.execute('SELECT name FROM migrations');
    expect(migrations.rows).toHaveLength(1);
  });
});
