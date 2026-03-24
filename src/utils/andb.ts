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
   * Helper to get core settings from store
   */
  private static getCoreSettings() {
    try {
      const settingsStore = useSettingsStore()
      const projectsStore = useProjectsStore()

      const projectSettings = projectsStore.currentProject?.settings || {}
      const globalSettings = settingsStore.settings

      return {
        domainNormalization: projectSettings.domainNormalization || globalSettings.domainNormalization,
        isNotMigrateCondition: projectSettings.isNotMigrateCondition || globalSettings.isNotMigrateCondition,
        gitConfig: (projectSettings as any).gitConfig || null,
        projectBaseDir: projectSettings.projectBaseDir || null
      }
    } catch (e) {
      // Pinia might not be ready in some edge cases
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
   */
  static async generate(
    sourceConnection: DatabaseConnection,
    targetConnection: DatabaseConnection,
    options: any
  ): Promise<any> {
    if (!isElectron) throw new Error('Not in Electron environment')
    try {
      const result = await window.electronAPI.andbExecute(this.sanitize({
        sourceConnection,
        targetConnection,
        operation: 'generate',
        options: { ...options, ...this.getCoreSettings() }
      }))

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
}

export default Andb
