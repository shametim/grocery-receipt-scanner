CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT
);

CREATE TABLE sessions (
  sid TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_name TEXT,
  address TEXT,
  transaction_date TEXT,
  total_amount REAL,
  items TEXT,
  user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);