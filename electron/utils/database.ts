/**
 * SQLite Database Manager for Main Process
 * Handles history, logs, and audit trails
 */

import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

class DatabaseManager {
  private db: any | null = null
  private dbPath: string = ''

  /**
   * Initialize database
   */
  initialize(): void {
    if (this.db) return

    try {
      // Database location: ~/Library/Application Support/Andb/history.db
      const userDataPath = app.getPath('userData')
      this.dbPath = join(userDataPath, 'history.db')

      this.db = new Database(this.dbPath)
      this.db.pragma('journal_mode = WAL') // Better performance

      this.createTables()
      if ((global as any).logger) (global as any).logger.info(`📊 SQLite database initialized: ${this.dbPath}`)
    } catch (error: any) {
      if ((global as any).logger) (global as any).logger.error('Failed to initialize database:', error)
    }
  }

  /**
   * Create all tables
   */
  private createTables(): void {
    // Migrations table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        source_env TEXT NOT NULL,
        target_env TEXT NOT NULL,
        ddl_type TEXT NOT NULL,
        status TEXT NOT NULL,
        changes TEXT,
        error TEXT,
        duration INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Comparison history table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS comparisons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        pair_id TEXT NOT NULL,
        source_env TEXT NOT NULL,
        target_env TEXT NOT NULL,
        ddl_type TEXT NOT NULL,
        diff_summary TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Export logs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS export_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        connection_id TEXT NOT NULL,
        environment TEXT NOT NULL,
        export_type TEXT NOT NULL,
        file_path TEXT,
        status TEXT NOT NULL,
        error TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Audit logs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        action TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT NOT NULL,
        details TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // AI Chats table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS ai_chats (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        messages TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `)

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_migrations_timestamp ON migrations(timestamp);
      CREATE INDEX IF NOT EXISTS idx_comparisons_timestamp ON comparisons(timestamp);
      CREATE INDEX IF NOT EXISTS idx_export_logs_timestamp ON export_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_ai_chats_updated_at ON ai_chats(updated_at);
    `)
  }

  /**
   * Add migration record
   */
  addMigration(migration: any): number {
    const stmt = this.db.prepare(`
      INSERT INTO migrations (timestamp, source_env, target_env, ddl_type, status, changes, error, duration)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      migration.timestamp,
      migration.source_env,
      migration.target_env,
      migration.ddl_type,
      migration.status,
      JSON.stringify(migration.changes),
      migration.error,
      migration.duration
    )
    return result.lastInsertRowid as number
  }

  /**
   * Update migration status
   */
  updateMigrationStatus(id: number, status: string, error?: string): void {
    const stmt = this.db.prepare(`
      UPDATE migrations SET status = ?, error = ? WHERE id = ?
    `)
    stmt.run(status, error, id)
  }

  /**
   * Get migrations
   */
  getMigrations(limit: number = 50): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM migrations ORDER BY timestamp DESC LIMIT ?
    `)
    return stmt.all(limit)
  }

  /**
   * Add comparison record
   */
  addComparison(comparison: any): number {
    const stmt = this.db.prepare(`
      INSERT INTO comparisons (timestamp, pair_id, source_env, target_env, ddl_type, diff_summary)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      comparison.timestamp,
      comparison.pair_id,
      comparison.source_env,
      comparison.target_env,
      comparison.ddl_type,
      JSON.stringify(comparison.diff_summary)
    )
    return result.lastInsertRowid as number
  }

  /**
   * Get comparisons
   */
  getComparisons(limit: number = 50): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM comparisons ORDER BY timestamp DESC LIMIT ?
    `)
    return stmt.all(limit)
  }

  /**
   * Add export log
   */
  addExportLog(log: any): number {
    const stmt = this.db.prepare(`
      INSERT INTO export_logs (timestamp, connection_id, environment, export_type, file_path, status, error)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      log.timestamp,
      log.connection_id,
      log.environment,
      log.export_type,
      log.file_path,
      log.status,
      log.error
    )
    return result.lastInsertRowid as number
  }

  /**
   * Get export logs
   */
  getExportLogs(limit: number = 50): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM export_logs ORDER BY timestamp DESC LIMIT ?
    `)
    return stmt.all(limit)
  }

  /**
   * Add audit log
   */
  addAuditLog(log: any): number {
    const stmt = this.db.prepare(`
      INSERT INTO audit_logs (timestamp, action, resource_type, resource_id, details)
      VALUES (?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      log.timestamp,
      log.action,
      log.resource_type,
      log.resource_id,
      JSON.stringify(log.details)
    )
    return result.lastInsertRowid as number
  }

  /**
   * Get audit logs
   */
  getAuditLogs(limit: number = 100): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?
    `)
    return stmt.all(limit)
  }

  // --- AI Chat Methods ---

  saveAiChat(chat: any): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO ai_chats (id, title, messages, updated_at)
      VALUES (?, ?, ?, ?)
    `)
    stmt.run(chat.id, chat.title, JSON.stringify(chat.messages), chat.updated_at)
  }

  getAiChats(): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM ai_chats ORDER BY updated_at DESC
    `)
    const rows = stmt.all()
    return rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      messages: JSON.parse(row.messages),
      updatedAt: row.updated_at // normalize casing for frontend
    }))
  }

  deleteAiChat(id: string): void {
    const stmt = this.db.prepare(`
      DELETE FROM ai_chats WHERE id = ?
    `)
    stmt.run(id)
  }

  clearAiChats(): void {
    this.db.exec(`DELETE FROM ai_chats`)
  }

  /**
   * Get database stats
   */
  getStats(): any {
    const migrations = this.db.prepare('SELECT COUNT(*) as count FROM migrations').get()
    const comparisons = this.db.prepare('SELECT COUNT(*) as count FROM comparisons').get()
    const exports = this.db.prepare('SELECT COUNT(*) as count FROM export_logs').get()
    const audits = this.db.prepare('SELECT COUNT(*) as count FROM audit_logs').get()

    return {
      migrations: migrations.count,
      comparisons: comparisons.count,
      exports: exports.count,
      audits: audits.count,
      dbPath: this.dbPath
    }
  }

  /**
   * Cleanup old records
   */
  cleanup(daysToKeep: number = 90): void {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    const cutoff = cutoffDate.toISOString()

    this.db.prepare('DELETE FROM migrations WHERE timestamp < ?').run(cutoff)
    this.db.prepare('DELETE FROM comparisons WHERE timestamp < ?').run(cutoff)
    this.db.prepare('DELETE FROM export_logs WHERE timestamp < ?').run(cutoff)
    this.db.prepare('DELETE FROM audit_logs WHERE timestamp < ?').run(cutoff)

    if ((global as any).logger) (global as any).logger.info(`🧹 Cleaned up records older than ${daysToKeep} days`)
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
      if ((global as any).logger) (global as any).logger.info('📊 Database connection closed')
    }
  }
}

// Export singleton instance
export const database = new DatabaseManager()

