/**
 * Drizzle ORM Database Connection — GUI Layer
 *
 * Opens a synchronous better-sqlite3 connection to the VAULT SQLite file.
 * Tables already created by TypeORM on first init — Drizzle reads/writes them
 * without managing migrations (schema is stable; TypeORM synchronize handles DDL).
 *
 * Usage: import { db } from './db'
 */

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null
let _dbPath: string | null = null

/**
 * Initialize Drizzle with the VAULT SQLite path.
 * Must be called after TypeORM DataSource is initialized (so tables exist).
 */
export function initDrizzle(dbPath: string): void {
  if (_db && _dbPath === dbPath) return // already connected to same file

  const sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  _db = drizzle(sqlite, { schema })
  _dbPath = dbPath
}

/**
 * Get the active Drizzle db instance.
 * Throws if initDrizzle() has not been called yet.
 */
export function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!_db) {
    throw new Error('[Drizzle] DB not initialized. Call initDrizzle(dbPath) first.')
  }
  return _db
}

export { schema }
