# Database Management Runbook

This runbook describes how to manage the local SQLite database used by the `apps/server` component.

## 1. Environment Setup

The database file is located at `apps/server/data/kanban.db` by default.

- **Directory**: `apps/server/data/` (Must exist)
- **File**: `kanban.db` (Created automatically on startup)
- **Environment Variable**: `DATABASE_URL` (Defaults to local file, can override)

## 2. Managing Migrations

We use raw SQL migrations stored in `apps/server/src/db/migrations/`.

### 2.1 Adding a New Migration

1.  Create a new SQL file in `apps/server/src/db/migrations/`.
2.  Name it sequentially: `XXX_description.sql` (e.g., `002_add_user_id.sql`).
3.  Write standard SQLite-compatible SQL (DDL/DML).
    ```sql
    ALTER TABLE cards ADD COLUMN user_id TEXT;
    ```
4.  **Restart the server** (`pnpm run dev` in `apps/server` or root).
    - The `migrator.ts` utility runs automatically on startup.
    - It checks the `migrations` table and applies only new files.

### 2.2 Verifying Migrations

Check the server logs during startup:

```text
Applying migration: 002_add_user_id.sql
Migration 002_add_user_id.sql applied successfully.
```

## 3. Inspecting Data

Since the database is a standard SQLite file, you can inspect it using various tools.

### 3.1 Recommended Tools

- **VS Code Extension**: [SQLite Viewer](https://marketplace.visualstudio.com/items?itemName=qwtel.sqlite-viewer)
- **GUI Application**: [DB Browser for SQLite](https://sqlitebrowser.org/)
- **CLI**: `sqlite3` command line tool.

### 3.2 Common Queries

```sql
-- Check applied migrations
SELECT * FROM _migrations;

-- List all boards
SELECT * FROM boards;

-- Count cards per column
SELECT status, COUNT(*) FROM cards GROUP BY status;
```

## 4. Resetting the Database

If your local database state is corrupted or you want to start fresh:

1.  **Stop the server**.
2.  **Delete the database file**:
    ```bash
    rm apps/server/data/kanban.db
    # Also delete WAL/SHM files if present:
    # rm apps/server/data/kanban.db-wal
    # rm apps/server/data/kanban.db-shm
    ```
3.  **Start the server**.
    - The app will recreate the database file.
    - All migrations `001_...` to present will be re-applied automatically.
    - You will have a clean schema with no data.
