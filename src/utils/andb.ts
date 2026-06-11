import type { DatabaseConnection } from '@/stores/app'
import { useSettingsStore } from '@/stores/settings'
import { useProjectsStore } from '@/stores/projects'
import type { Result } from '@the-andb/core'

export type DDL_TYPE = 'tables' | 'procedures' | 'functions' | 'triggers' | 'views';
export type DDL_STATUS = 'NEW' | 'UPDATED' | 'DEPRECATED';
/**
 * Andb Service - Programmatic API Wrapper
 *
 * New approach: Direct integration with andb-core via IPC
 * No subprocess, no command injection risks
 */

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined


export interface ExportOptions {
  type: DDL_TYPE
  environment?: string
  env?: string
  outputPath?: string
  name?: string // Specific object name
}

export interface CompareOptions {
  type: DDL_TYPE
  sourceEnv: string
  targetEnv: string
  name?: string // Specific object name
}

export interface MigrateOptions {
  type: DDL_TYPE
  sourceEnv: string
  targetEnv: string
  name?: string
  status?: DDL_STATUS
  dryRun?: boolean
  objects?: any[]
  force?: boolean
}

export interface ConnectionTestResult {
  success: boolean
  message?: string
  version?: string
}

export class Andb {
  /**
   * Helper to sanitize objects for IPC (removes Proxies, functions, etc)
   */
  private static sanitize<T>(obj: T): T {
    if (obj === null || obj === undefined) return obj
    if (typeof obj !== 'object') return obj

    // Handle Array
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitize(item)) as any
    }

    // Handle Date
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as any
    }

    // Handle RegExp
    if (obj instanceof RegExp) {
      return new RegExp(obj.source, obj.flags) as any
    }

    // Recursively copy keys of the object to strip Vue 3 reactive proxies
    const sanitized: any = {}
    for (const key of Object.keys(obj as any)) {
      if (key.startsWith('__v_') || key.startsWith('_$')) {
        continue
      }
      const val = (obj as any)[key]
      if (typeof val === 'function' || typeof val === 'symbol') {
        continue
      }
      sanitized[key] = this.sanitize(val)
    }
    return sanitized as T
  }

  /**
   * Helper to compile simple wildcard tags to regex
   * * -> .*
   */
  private static compileExcludeRegex(tags?: string[], existingRegex?: string): string {
    const rules: string[] = []
    if (existingRegex) rules.push(existingRegex)
    if (tags && tags.length > 0) {
      tags.forEach(tag => {
        // Escape regex special chars except *
        const escaped = tag.replace(/[.+^${}()|[\]\\]/g, '\\$&')
        const withWildcards = escaped.replace(/\*/g, '.*')
        rules.push(`^${withWildcards}$`)
      })
    }
    return rules.join('|')
  }

  /**
   * Helper to compile environment replacements into an array of rules for comparison.
   */
  private static compileNormalization(reps?: any[], existing?: any): any[] {
    const rules: any[] = []

    // Add legacy rule if it exists (for compatibility)
    if (existing) rules.push(existing)

    if (reps) {
      reps.forEach(r => {
        if (!r.key) return
        const values = Object.values(r.values)
          .filter(v => !!v)
          .map((v: any) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
          .sort((a: any, b: any) => b.length - a.length)

        if (values.length > 0) {
          rules.push({
            pattern: `(${values.join('|')})`,
            replacement: `__VAR_${r.key}__`
          })
        }
      })
    }

    return rules
  }

  /**
   * Helper to get core settings from store
   */
  private static getCoreSettings() {
    try {
      const settingsStore = useSettingsStore()
      const projectsStore = useProjectsStore()

      const projectSettings = projectsStore.currentProject?.settings || {}
      const globalSettings = settingsStore.settings

      // Compile new structures into legacy regex
      const isNotMigrateCondition = this.compileExcludeRegex(
        projectSettings.excludeTags || globalSettings.excludeTags,
        projectSettings.isNotMigrateCondition || globalSettings.isNotMigrateCondition
      )

      const domainNormalization = this.compileNormalization(
        projectSettings.envReplacements || globalSettings.envReplacements,
        projectSettings.domainNormalization || globalSettings.domainNormalization
      )

      return {
        domainNormalization,
        isNotMigrateCondition,
        gitConfig: (projectSettings as any).gitConfig || null,
        projectBaseDir: projectSettings.projectBaseDir || null
      }
    } catch (e) {
      return {}
    }
  }

  /**
   * Test if andb-core is available
   */
  static async test(): Promise<boolean> {
    if (!isElectron) return false
    try {
      const result = await window.electronAPI.andbTest()
      return result.success && result.available === true
    } catch (error) {
      return false
    }
  }

  /**
   * Export database objects
   */
  static async export(
    sourceConnection: DatabaseConnection,
    targetConnection: DatabaseConnection,
    options: ExportOptions
  ): Promise<any> {
    if (!isElectron) throw new Error('Not in Electron environment')
    try {
      const result = await window.electronAPI.andbExecute(
        this.sanitize({
          sourceConnection,
          targetConnection,
          operation: 'export',
          options: { ...options, ...this.getCoreSettings() }
        })
      )

      if (result.success) return result.data
      throw new Error(result.error || 'Export failed')
    } catch (error: any) {
      throw new Error(`Export failed: ${error.message}`)
    }
  }

  /**
   * Compare database objects between environments
   */
  static async compare(
    sourceConnection: DatabaseConnection,
    targetConnection: DatabaseConnection,
    options: CompareOptions
  ): Promise<any> {
    if (!isElectron) throw new Error('Not in Electron environment')
    try {
      const result = await window.electronAPI.andbExecute(
        this.sanitize({
          sourceConnection,
          targetConnection,
          operation: 'compare',
          options: { ...options, ...this.getCoreSettings() }
        })
      )

      if (result.success) return result.data
      throw new Error(result.error || 'Compare failed')
    } catch (error: any) {
      throw new Error(`Compare failed: ${error.message}`)
    }
  }

  /**
   * Fetch saved comparison results without re-running
   */
  static async getSavedComparisonResults(
    sourceConnection: DatabaseConnection,
    targetConnection: DatabaseConnection,
    type: string
  ): Promise<any> {
    if (!isElectron) throw new Error('Not in Electron environment')
    try {
      const result = await window.electronAPI.andbGetSavedComparisonResults(
        this.sanitize({
          sourceConnection,
          targetConnection,
          type
        })
      )

      if (result.success) return result.data
      throw new Error(result.error || 'Failed to fetch saved results')
    } catch (error: any) {
      throw new Error(`Failed to fetch saved results: ${error.message}`)
    }
  }

  /**
   * Execute migration
   */
  static async migrate(
    sourceConnection: DatabaseConnection,
    targetConnection: DatabaseConnection,
    options: MigrateOptions
  ): Promise<any> {
    if (!isElectron) throw new Error('Not in Electron environment')
    try {
      const forceVal = options.dryRun === false ? true : (options as any).force === true
      const result = await window.electronAPI.andbExecute(
        this.sanitize({
          sourceConnection,
          targetConnection,
          operation: 'migrate',
          options: { ...options, force: forceVal, ...this.getCoreSettings() }
        })
      )

      if (result.success) return result.data !== undefined ? result.data : result
      throw new Error(result.error || 'Migration failed')
    } catch (error: any) {
      throw new Error(`Migration failed: ${error.message}`)
    }
  }

  /**
   * Generate Migration Script (SQL)
   * Intercepts and injects environment values
   */
  static async generate(
    sourceConnection: DatabaseConnection,
    targetConnection: DatabaseConnection,
    options: any
  ): Promise<any> {
    if (!isElectron) throw new Error('Not in Electron environment')
    try {
      const coreSettings = this.getCoreSettings() as any
      const result = await window.electronAPI.andbExecute(
        this.sanitize({
          sourceConnection,
          targetConnection,
          operation: 'generate',
          options: { ...options, ...coreSettings }
        })
      )

      if (result.success && result.data?.sql) {
        let sql = result.data.sql

        // INJECTION LOGIC: Replace placeholders with target environment values
        const projectsStore = useProjectsStore()
        const settingsStore = useSettingsStore()
        const reps =
          projectsStore.currentProject?.settings?.envReplacements ||
          settingsStore.settings.envReplacements ||
          []

        if (reps.length > 0) {
          reps.forEach(r => {
            if (!r.key) return
            const targetValue = r.values[targetConnection.environment]
            if (targetValue) {
              // Replace variable-specific marker
              sql = sql.split(`<<${r.key}>>`).join(targetValue)
            }
          })
        }

        result.data.sql = sql
        return result.data
      }

      if (result.success) return result.data
      throw new Error(result.error || 'Generation failed')
    } catch (error: any) {
      throw new Error(`Generation failed: ${error.message}`)
    }
  }

  /**
   * Test a single database connection
   */
  static async testConnection(connection: DatabaseConnection): Promise<ConnectionTestResult> {
    if (!isElectron) return { success: false, message: 'Not in Electron' }
    try {
      const result = await window.electronAPI.testConnection(this.sanitize(connection))
      if (!result.message && (result as any).error) {
        result.message = (result as any).error
      }
      return result
    } catch (error: any) {
      return { success: false, message: error.message }
    }
  }

  /**
   * Get all registered schemas from core.
   * Pass `connections` (resolved connections from app store) so the backend
   * can attach connectionId to each database entry for reliable matching.
   */
  static async getSchemas(connections?: any[]): Promise<Result<any[]>> {
    if (!isElectron) return { success: false, error: 'Not in Electron' }
    try {
      const result = await window.electronAPI.andbGetSchemas(
        connections ? { connections } : undefined
      )
      if (result.success) return { success: true, data: result.data }

      // FATAL error if core returns success: false
      throw new Error(result.error || 'Failed to fetch schemas')
    } catch (error: any) {
      // Propagation
      throw new Error(`Failed to fetch schemas: ${error.message}`)
    }
  }

  /**
   * Clear connection data (force reload)
   */
  static async clearConnectionData(connection: DatabaseConnection, purgeFiles: boolean = false): Promise<any> {
    if (!isElectron) return false
    try {
      const result = await window.electronAPI.andbClearConnectionData({
        connection: this.sanitize(connection),
        purgeFiles
      })
      return (result as any).success ? (result as any).data : false
    } catch (error) {
      return false
    }
  }

  /**
   * Physically purge the active project's stored schema cache folders
   */
  static async purgeActiveProject(): Promise<any> {
    if (!isElectron) return false
    try {
      const result = await (window as any).electronAPI.andbPurgeActiveProject()
      return (result as any).success
    } catch (error) {
      return false
    }
  }

  /**
   * Get snapshots for a table
   */
  static async getSnapshots(
    environment: string,
    database: string,
    type: string,
    name: string,
    databaseType: string = 'mysql'
  ): Promise<Result<any[]>> {
    if (!isElectron) return { success: false, error: 'Not in Electron' }
    try {
      const result = await window.electronAPI.getSnapshots({
        environment,
        database,
        type,
        name,
        databaseType
      })
      if (result.success) return { success: true, data: result.data }
      throw new Error(result.error || 'Failed to fetch snapshots')
    } catch (error: any) {
      throw new Error(`Failed to fetch snapshots: ${error.message}`)
    }
  }

  /**
   * Get global snapshots list
   */
  static async getAllSnapshots(limit: number = 50): Promise<Result<any[]>> {
    if (!isElectron) return { success: false, error: 'Not in Electron' }
    try {
      const result = await window.electronAPI.getAllSnapshots(limit)
      if (result.success) return { success: true, data: result.data }
      throw new Error(result.error || 'Failed to fetch all snapshots')
    } catch (error: any) {
      throw new Error(`Failed to fetch all snapshots: ${error.message}`)
    }
  }

  /**
   * Create a new snapshot for an object
   */
  static async createSnapshot(
    connection: DatabaseConnection,
    type: string,
    name: string
  ): Promise<any> {
    if (!isElectron) throw new Error('Not in Electron')
    try {
      const result = await window.electronAPI.andbCreateSnapshot({
        connection: this.sanitize(connection),
        type,
        name
      })
      if (result.success) return result.data
      throw new Error(result.error || 'Failed to create snapshot')
    } catch (error: any) {
      throw new Error(`Snapshot failed: ${error.message}`)
    }
  }

  /**
   * Restore a snapshot to a connection
   */
  static async restoreSnapshot(connection: DatabaseConnection, snapshot: any): Promise<any> {
    if (!isElectron) throw new Error('Not in Electron')
    try {
      const result = await window.electronAPI.andbRestoreSnapshot({
        connection: this.sanitize(connection),
        snapshot
      })
      if (result.success) return result.data
      throw new Error(result.error || 'Failed to restore snapshot')
    } catch (error: any) {
      throw new Error(`Restore failed: ${error.message}`)
    }
  }

  /**
   * Setup restricted user automatically (Admin operation)
   */
  static async setupRestrictedUser(args: {
    adminConnection: any
    restrictedUser: any
    permissions: any
    script?: string | string[]
  }): Promise<any> {
    if (!isElectron) throw new Error('Not in Electron')
    try {
      const result = await (window as any).electronAPI.setupRestrictedUser(this.sanitize(args))
      if (result.success) return result.data
      throw new Error(result.error || 'Setup failed')
    } catch (error: any) {
      throw new Error(`Setup failed: ${error.message}`)
    }
  }

  static async generateUserSetupScript(args: {
    adminConnection: any
    restrictedUser: any
    permissions: any
    isReconfigure?: boolean
  }): Promise<string> {
    if (!isElectron) throw new Error('Not in Electron')
    try {
      const result = await (window as any).electronAPI.generateUserSetupScript(this.sanitize(args))
      if (result.success) return result.data
      throw new Error(result.error || 'The backend returned a failure without an error message.')
    } catch (error: any) {
      // Re-throw with more context to avoid "Generation failed: Generation failed"
      const msg = error.message.includes('Generation failed')
        ? error.message
        : `Generation failed: ${error.message}`
      throw new Error(msg)
    }
  }

  /**
   * Open backup folder in system explorer
   */
  static async openBackupFolder(): Promise<boolean> {
    if (!isElectron) return false
    try {
      const result = await window.electronAPI.openBackupFolder()
      return result.success
    } catch (error) {
      return false
    }
  }
  /**
   * Probes the restricted user permissions
   */
  static async probeRestrictedUser(args: { connection: any; permissions: any }): Promise<any> {
    if (!isElectron) throw new Error('Not in Electron')
    try {
      const result = await (window as any).electronAPI.probeRestrictedUser(this.sanitize(args))
      if (result.success) return result.data
      throw new Error(result.error || 'Probing failed')
    } catch (error: any) {
      throw new Error(`Probing failed: ${error.message}`)
    }
  }

  /**
   * Search for dependencies/content
   */
  static async search(
    connection: DatabaseConnection,
    query: string,
    flags: { caseSensitive: boolean; wholeWord: boolean; regex: boolean }
  ): Promise<any> {
    if (!isElectron) throw new Error('Not in Electron')
    try {
      const result = await window.electronAPI.andbExecute(
        this.sanitize({
          sourceConnection: connection,
          operation: 'search',
          options: { query, flags }
        })
      )

      if (result.success) return result.data
      throw new Error(result.error || 'Search failed')
    } catch (error: any) {
      throw new Error(`Search failed: ${error.message}`)
    }
  }

  /**
   * Install andb CLI globally
   */
  static async installCli(): Promise<Result<void>> {
    if (!isElectron) return { success: false, message: 'Not in Electron' }
    try {
      return await window.electronAPI.invoke('andb-install-cli')
    } catch (error: any) {
      return { success: false, message: error.message }
    }
  }

  /**
   * Check if andb CLI is installed globally
   */
  static async isCliInstalled(): Promise<boolean> {
    if (!isElectron) return false
    try {
      return await window.electronAPI.invoke('andb-check-cli-installed')
    } catch (error) {
      return false
    }
  }

  /**
   * Parse DDL string into structural components
   */
  static async parseTable(ddl: string): Promise<any> {
    if (!isElectron) return null
    try {
      const result = await window.electronAPI.andbParseTable(ddl)
      if (result.success) return result.data
      return null
    } catch (error) {
      return null
    }
  }

  /**
   * Extract column names from a table's CREATE TABLE DDL statement synchronously using regex.
   * Useful for frontend filtering without IPC overhead.
   */
  static parseColumnNamesFromDdl(ddl: string): string[] {
    if (!ddl || !ddl.toUpperCase().includes('CREATE TABLE')) return []
    try {
      const firstParen = ddl.indexOf('(')
      const lastParen = ddl.lastIndexOf(')')
      if (firstParen === -1 || lastParen === -1) return []
      const body = ddl.substring(firstParen + 1, lastParen)

      const lines: string[] = []
      let current = ''
      let parenLevel = 0
      let inQuote = false
      let quoteChar = ''

      for (let i = 0; i < body.length; i++) {
        const char = body[i]
        if (inQuote) {
          current += char
          if (char === quoteChar && body[i - 1] !== '\\') inQuote = false
        } else {
          if (char === "'" || char === '"' || char === '`') {
            inQuote = true
            quoteChar = char
            current += char
          } else if (char === '(') {
            parenLevel++
            current += char
          } else if (char === ')') {
            parenLevel--
            current += char
          } else if (char === ',' && parenLevel === 0) {
            lines.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
      }
      if (current.trim()) lines.push(current.trim())

      const colNames: string[] = []
      for (const line of lines) {
        if (!line) continue
        const up = line.toUpperCase().trim()
        if (
          up.startsWith('PRIMARY KEY') ||
          up.startsWith('CONSTRAINT') ||
          up.startsWith('KEY') ||
          up.startsWith('INDEX') ||
          up.startsWith('UNIQUE KEY') ||
          up.startsWith('UNIQUE') ||
          up.startsWith('FOREIGN KEY')
        ) {
          continue
        }
        // Column name match: handle optional quotes/brackets and capture the name
        const colNameMatch = line.match(/^(?:[`"\[])?([^`"\]\s]+)(?:[`"\]])?\s+/i)
        if (colNameMatch) {
          colNames.push(colNameMatch[1])
        }
      }
      return colNames
    } catch (e) {
      console.warn('Failed to parse columns from DDL:', e)
      return []
    }
  }

  // --- Table Inspector (AI DBA Super Mode) ---

  /**
   * Fetch table stats (row count, data size, index size) for all tables in a database
   */
  static async getTableStats(connection: DatabaseConnection): Promise<any[]> {
    if (!isElectron) return []
    try {
      const result = await window.electronAPI.andbGetTableStats({
        connection: this.sanitize(connection)
      })
      if (result.success) return result.data || []
      console.warn('[Andb] getTableStats failed:', result.error)
      return []
    } catch (error) {
      console.warn('[Andb] getTableStats error:', error)
      return []
    }
  }

  /**
   * Fetch MySQL server info (version, DDL capabilities)
   */
  static async getServerInfo(connection: DatabaseConnection): Promise<any> {
    if (!isElectron) return null
    try {
      const result = await window.electronAPI.andbGetServerInfo({
        connection: this.sanitize(connection)
      })
      if (result.success) return result.data
      return null
    } catch (error) {
      return null
    }
  }

  /**
   * Fetch foreign key dependency graph for a database
   */
  static async getFKGraph(connection: DatabaseConnection): Promise<any[]> {
    if (!isElectron) return []
    try {
      const result = await window.electronAPI.andbGetFKGraph({
        connection: this.sanitize(connection)
      })
      if (result.success) return result.data || []
      return []
    } catch (error) {
      return []
    }
  }

  // AI Assistant (The "Brain")

  /**
   * Configure AI Provider (set API key)
   */
  static async aiConfigure(apiKey: string, provider: string = 'gemini'): Promise<boolean> {
    if (!isElectron) return false
    try {
      const result = await window.electronAPI.aiConfigure(apiKey, provider)
      return !!result.success
    } catch (error) {
      return false
    }
  }

  /**
   * Request an AI review for a schema diff
   */
  static async aiReview(context: any): Promise<any> {
    if (!isElectron) return null
    try {
      const result = await window.electronAPI.aiReview(this.sanitize(context))
      if (result.success) return result.data
      throw new Error(result.error || 'AI Review failed')
    } catch (error: any) {
      throw new Error(`AI Review failed: ${error.message}`)
    }
  }

  /**
   * Ask the AI DBA expert a question
   */
  static async aiAsk(question: string, context?: any): Promise<any> {
    if (!isElectron) return null
    try {
      const result = await window.electronAPI.aiAsk(question, this.sanitize(context))
      if (result.success) return result.data
      throw new Error(result.error || 'AI Assistance failed')
    } catch (error: any) {
      throw new Error(`AI Assistance failed: ${error.message}`)
    }
  }

  /**
   * Execute raw SQL query against a connection
   */
  static async executeQuery(
    connection: DatabaseConnection,
    sql: string,
    params: any[] = [],
    sessionId?: string,
    autocommit?: boolean,
    limit?: number,
    offset?: number
  ): Promise<any[]> {
    if (!isElectron) throw new Error('Not in Electron environment')
    try {
      const result = await window.electronAPI.andbExecute(
        this.sanitize({
          sourceConnection: connection,
          operation: 'executeQuery',
          options: { sql, params, sessionId, autocommit, limit, offset }
        } as any)
      )

      if (result.success) return result.data
      throw new Error(result.error || 'Query failed')
    } catch (error: any) {
      throw new Error(`Query failed: ${error.message}`)
    }
  }

  static async closeQuerySession(sessionId: string): Promise<void> {
    if (!isElectron) return
    try {
      await window.electronAPI.andbExecute({
        operation: 'closeQuerySession',
        options: { sessionId }
      })
    } catch (error) {
      console.warn('Failed to close query session:', error)
    }
  }

  /**
   * Cancel a running query session connection
   */
  static async cancelQuery(connection: DatabaseConnection, sessionId: string): Promise<void> {
    if (!isElectron) return
    try {
      await window.electronAPI.andbExecute(
        this.sanitize({
          sourceConnection: connection,
          operation: 'cancelQuery',
          options: { sessionId, connection }
        } as any)
      )
    } catch (error) {
      console.warn('Failed to cancel query:', error)
    }
  }

  /**
   * Execute deep global code search for procedures, functions, triggers, and views
   */
  static async deepSearch(connection: DatabaseConnection, keyword: string): Promise<any[]> {
    if (!isElectron) throw new Error('Not in Electron environment')
    try {
      const result = await window.electronAPI.andbDeepSearch(
        this.sanitize({
          sourceConnection: connection,
          keyword
        })
      )
      if (result.success) return result.data || []
      throw new Error(result.error || 'Deep search failed')
    } catch (error: any) {
      throw new Error(`Deep search failed: ${error.message}`)
    }
  }
}

export default Andb
