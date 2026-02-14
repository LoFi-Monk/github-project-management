-- Initial schema for Kanban system

CREATE TABLE IF NOT EXISTS migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS boards (
  id TEXT PRIMARY KEY, -- Branded string from core
  title TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS columns (
  id TEXT NOT NULL,
  board_id TEXT NOT NULL,
  title TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id, board_id),
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL, -- ColumnId
  priority TEXT NOT NULL, -- low, medium, high, critical
  labels TEXT NOT NULL, -- JSON array
  assignees TEXT NOT NULL, -- JSON array
  position INTEGER NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  
  -- Sync Logic Fields
  dirty_fields TEXT, -- JSON array
  sync_snapshot TEXT, -- JSON object
  sync_status TEXT, -- synced, dirty, conflict, local
  
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
  FOREIGN KEY (status, board_id) REFERENCES columns(id, board_id) ON DELETE CASCADE
);
