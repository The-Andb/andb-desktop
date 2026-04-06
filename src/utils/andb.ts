import type { DatabaseConnection } from '@/stores/app'
import { useSettingsStore } from '@/stores/settings'
import { useProjectsStore } from '@/stores/projects'
import type { Result } from '@the-andb/core'

/**
 * Andb Service - Programmatic API Wrapper
 * 
 * New approach: Direct integration with andb-core via IPC
 * No subprocess, no command injection risks
 */

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && window.electronAPI !== undefined

export interface ExportOptions {
  type: 'tables' | 'procedures' | 'functions' | 'triggers' | 'views'
  environment?: string
  env?: string
  outputPath?: string
  name?: string // Specific object name
}

export interface CompareOptions {
  type: 'tables' | 'procedures' | 'functions' | 'triggers' | 'views'
  sourceEnv: string
  targetEnv: string
  name?: string // Specific object name
}

export interface MigrateOptions {
  type: 'tables' | 'procedures' | 'functions' | 'triggers' | 'views'
  sourceEnv: string
  targetEnv: string
  name?: string
  status?: 'NEW' | 'UPDATED' | 'DEPRECATED'
  dryRun?: boolean
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
    if (!obj) return obj
    try {
      return JSON.parse(JSON.stringify(obj))
    } catch (e) {
      // Fallback to shallow clone if JSON fails (e.g. circular)
      return { ...obj }
    }
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

      const result = await window.electronAPI.andbExecute(this.sanitize({
        sourceConnection,
        targetConnection,
        operation: 'export',
        options: { ...options, ...this.getCoreSettings() }
      }))

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

      const result = await window.electronAPI.andbExecute(this.sanitize({
        sourceConnection,
        targetConnection,
        operation: 'compare',
        options: { ...options, ...this.getCoreSettings() }
      }))

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
      const result = await window.electronAPI.andbGetSavedComparisonResults(this.sanitize({
        sourceConnection,
        targetConnection,
        type
      }))

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

      const result = await window.electronAPI.andbExecute(this.sanitize({
        sourceConnection,
        targetConnection,
        operation: 'migrate',
        options: { ...options, ...this.getCoreSettings() }
      }))

      if (result.success) return result.data
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
      const result = await window.electronAPI.andbExecute(this.sanitize({
        sourceConnection,
        targetConnection,
        operation: 'generate',
        options: { ...options, ...coreSettings }
      }))

      if (result.success && result.data?.sql) {
        let sql = result.data.sql

        // INJECTION LOGIC: Replace placeholders with target environment values
        const projectsStore = useProjectsStore()
        const settingsStore = useSettingsStore()
        const reps = projectsStore.currentProject?.settings?.envReplacements || settingsStore.settings.envReplacements || []

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
   * Get all registered schemas from core
   */
  static async getSchemas(): Promise<Result<any[]>> {
    if (!isElectron) return { success: false, error: 'Not in Electron' }
    try {
      const result = await window.electronAPI.andbGetSchemas()
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
  static async clearConnectionData(connection: DatabaseConnection): Promise<any> {
    if (!isElectron) return false
    try {
      const result = await window.electronAPI.andbClearConnectionData(this.sanitize(connection))
      return (result as any).success ? (result as any).data : false
    } catch (error) {
      return false
    }
  }

  /**
   * Get snapshots for a table
   */
  static async getSnapshots(environment: string, database: string, type: string, name: string): Promise<Result<any[]>> {
    if (!isElectron) return { success: false, error: 'Not in Electron' }
    try {
      const result = await window.electronAPI.getSnapshots(environment, database, type, name)
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
  static async createSnapshot(connection: DatabaseConnection, type: string, name: string): Promise<any> {
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
      const msg = error.message.includes('Generation failed') ? error.message : `Generation failed: ${error.message}`
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
  static async probeRestrictedUser(args: {
    connection: any
    permissions: any
  }): Promise<any> {
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
      const result = await window.electronAPI.andbExecute(this.sanitize({
        sourceConnection: connection,
        operation: 'search',
        options: { query, flags }
      }))

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
      const result = await window.electronAPI.aiAsk({ question, context: this.sanitize(context) })
      if (result.success) return result.data
      throw new Error(result.error || 'AI Assistance failed')
    } catch (error: any) {
      throw new Error(`AI Assistance failed: ${error.message}`)
    }
  }
}

export default Andb
