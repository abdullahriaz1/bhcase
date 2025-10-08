// db.ts
import Database from 'better-sqlite3';
import type { Database as BetterSqlite3Database } from 'better-sqlite3';
import { join } from 'node:path';

const db: BetterSqlite3Database = new Database(join(process.cwd(), 'prices.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site TEXT NOT NULL,
    price REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export function recordPrice(site: string, price: number, currency = 'USD') {
  const stmt = db.prepare(`
    INSERT INTO price_history (site, price, currency)
    VALUES (?, ?, ?)
  `);
  stmt.run(site, price, currency);
}

export function getAllPrices(limit = 50) {
  const stmt = db.prepare(`
    SELECT * FROM price_history
    ORDER BY timestamp DESC
    LIMIT ?
  `);
  return stmt.all(limit);
}

export function getPrices(site: string, limit = 50) {
  const stmt = db.prepare(`
    SELECT * FROM price_history
    WHERE site = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `);
  return stmt.all(site, limit);
}

export function getPricesPaginated(site: string, offset = 0, limit = 50) {
  const stmt = db.prepare(`
    SELECT * FROM price_history
    WHERE site = ?
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?
  `);
  const results = stmt.all(site, limit, offset);
  
  // Get total count for pagination metadata
  const countStmt = db.prepare(`
    SELECT COUNT(*) as total FROM price_history
    WHERE site = ?
  `);
  const { total } = countStmt.get(site) as { total: number };
  
  return {
    data: results,
    total,
    offset,
    limit,
    hasMore: offset + limit < total
  };
}

// 👇 Fix: explicitly export as type-only to avoid TS4023 warning
export type DB = BetterSqlite3Database;
const database: DB = db;
export default database;
