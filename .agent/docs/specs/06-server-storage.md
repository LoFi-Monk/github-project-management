# Server Storage Engine Specification

## 1. Overview

The Server Storage Engine provides the persistence layer for the `apps/server` component. It uses **SQLite** accessed via **@libsql/client** to store Kanban boards, columns, and cards. This ensures a local-first, zero-latency experience that is easy to backup and transport.

## 2. Technology Stack

- **Database**: SQLite (via LibSQL)
- **Driver**: `@libsql/client`
- **Schema Management**: Raw SQL Migrations
- **ORM**: None (Repository Pattern with raw SQL)

## 3. Database Schema

### 3.1 Tables

#### `boards`

Represents a Kanban board.

| Column       | Type     | Constraints | Description                      |
| :----------- | :------- | :---------- | :------------------------------- |
| `id`         | TEXT     | PK          | Unique Board ID (branded string) |
| `title`      | TEXT     | NOT NULL    | Display title                    |
| `created_at` | DATETIME | DEFAULT NOW | Creation timestamp               |
| `updated_at` | DATETIME | DEFAULT NOW | Update timestamp                 |

#### `columns`

Represents a column within a board.

| Column       | Type     | Constraints | Description                 |
| :----------- | :------- | :---------- | :-------------------------- |
| `id`         | TEXT     | NOT NULL    | Unique Column ID            |
| `board_id`   | TEXT     | NOT NULL    | FK -> `boards.id` (CASCADE) |
| `title`      | TEXT     | NOT NULL    | Display title               |
| `position`   | INTEGER  | NOT NULL    | Ordering index (0-based)    |
| `created_at` | DATETIME | DEFAULT NOW | Creation timestamp          |
| `updated_at` | DATETIME | DEFAULT NOW | Update timestamp            |

**Primary Key**: Composite `(id, board_id)`

#### `cards`

Represents a task card.

| Column          | Type     | Constraints | Description                  |
| :-------------- | :------- | :---------- | :--------------------------- |
| `id`            | TEXT     | PK          | Unique Card ID               |
| `board_id`      | TEXT     | NOT NULL    | FK -> `boards.id` (CASCADE)  |
| `title`         | TEXT     | NOT NULL    | Card title                   |
| `description`   | TEXT     | NULLABLE    | Markdown description         |
| `status`        | TEXT     | NOT NULL    | FK -> `columns.id` (CASCADE) |
| `priority`      | TEXT     | NOT NULL    | 'low' \| 'medium' \| 'high'  |
| `labels`        | TEXT     | NOT NULL    | JSON Array of strings        |
| `assignees`     | TEXT     | NOT NULL    | JSON Array of strings        |
| `position`      | INTEGER  | NOT NULL    | Ordering index               |
| `created_at`    | DATETIME | NOT NULL    | Creation timestamp           |
| `updated_at`    | DATETIME | NOT NULL    | Update timestamp             |
| `dirty_fields`  | TEXT     | NULLABLE    | JSON Array (Sync Logic)      |
| `sync_snapshot` | TEXT     | NULLABLE    | JSON Object (Sync Logic)     |
| `sync_status`   | TEXT     | NULLABLE    | 'synced' \| 'dirty' \| etc.  |

**Constraints**:

- `FOREIGN KEY (status, board_id) REFERENCES columns(id, board_id) ON DELETE CASCADE`
  - Ensures cards are deleted if their column is deleted.

### 3.2 Migrations

Migrations are raw SQL files located in `src/db/migrations/`.

- Format: `XXX_name.sql` (e.g., `001_init.sql`)
- Execution: Automatically run on server startup via `migrator.ts`.
- Tracking: `migrations` table tracks applied files to prevent re-execution.
- **Atomicity**: All migrations run inside a transaction.

## 4. Repository Layer

Data access is abstracted through Repositories, which handle SQL execution and mapping to Domain Models (`@lofi-pm/core`).

### 4.1 BoardRepository

- **Responsibility**: Manage `Board` and `Column` entities.
- **Key Methods**:
  - `create(board)`: Persists board and its columns transactionally.
  - `findById(id)`: Returns fully hydrated Board with Columns and Cards.
  - `update(board)`: Updates board metadata.
  - `delete(id)`: Cascades delete to columns and cards.

### 4.2 CardRepository

- **Responsibility**: Manage `Card` entities.
- **Key Methods**:
  - `create(card)`: Serializes arrays/objects to JSON before insert.
  - `findById(id)`: deserializes JSON fields (`labels`, `assignees`) back to arrays.
  - `findByColumn(columnId)`: Returns cards sorted by `position`.
  - `update(card)`: Full update of card fields.
  - `delete(id)`: Removes single card.

### 4.3 Utils

Shared mapping logic resides in `utils.ts` to ensure consistency between repositories and prevent code duplication.

- `mapCardRow`: Maps SQL row -> `Card` (handles JSON parsing and nulls).
- `mapColumnRow`: Maps SQL row -> `Column` structure.

## 5. Configuration

- **Environment**:
  - `DATABASE_URL`: Path to SQLite file (e.g., `file:./data/kanban.db` or `file::memory:`).
- **Pragmas**:
  - `foreign_keys = ON`: Enforced on every connection.
  - `journal_mode = WAL`: Enabled for performance and concurrency.
