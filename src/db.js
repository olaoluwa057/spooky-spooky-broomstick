const path = require('path');
const Database = require('better-sqlite3');

const DEFAULT_DB_PATH = process.env.LEDGER_DB || path.join(__dirname, '..', 'ledger.db');

// Opens the ledger database and makes sure the tables exist.
// Amounts are stored in minor units (kobo) as integers to avoid rounding errors.
function openDb(file = DEFAULT_DB_PATH) {
  const db = new Database(file);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      balance_minor INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS ledger (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id     TEXT NOT NULL,
      user_id      TEXT NOT NULL REFERENCES users(id),
      amount_minor INTEGER NOT NULL,
      currency     TEXT NOT NULL,
      type         TEXT NOT NULL,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return db;
}

module.exports = { openDb, DEFAULT_DB_PATH };
