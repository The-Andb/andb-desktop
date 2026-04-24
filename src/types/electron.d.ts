// TypeScript type definitions for Electron IPC APIs

export interface DatabaseConnection {
  host: string
  port: number
  database: string
  username: string
  password?: string
}

export interface CommandResult {
  success: boolean
  data?: string
  error?: string
}

export interface ConnectionTestResult {
  success: boolean
  message?: string
  stdout?: string
  stderr?: string
  error?: string
  version?: string
}

declare global {
  interface Window {
    electronAPI: {
      platform: string

      // andb-core CLI
      executeAndbCommand: (command: string, args: string[]) => Promise<CommandResult>
      testConnection: (connection: DatabaseConnection) => Promise<ConnectionTestResult>

      // Database/Storage operations
      getMigrationHistory: (limit?: number) => Promise<{ success: boolean; data?: any[]; error?: string }>
      addMigration: (migration: any) => Promise<{ success: boolean; id?: number; error?: string }>
      updateMigrationStatus: (id: number, status: string, error?: string) => Promise<{ success: boolean; error?: string }>

      getComparisonHistory: (limit?: number) => Promise<{ success: boolean; data?: any[]; error?: string }>
      addComparison: (comparison: any) => Promise<{ success: boolean; id?: number; error?: string }>

      getExportLogs: (limit?: number) => Promise<{ success: boolean; data?: any[]; error?: string }>
      addExportLog: (log: any) => Promise<{ success: boolean; id?: number; error?: string }>

      getAuditLogs: (limit?: number) => Promise<{ success: boolean; data?: any[]; error?: string }>
      addAuditLog: (log: any) => Promise<{ success: boolean; id?: number; error?: string }>

      getDatabaseStats: () => Promise<{ success: boolean; data?: any; error?: string }>
      databaseCleanup: (daysToKeep?: number) => Promise<{ success: boolean; error?: string }>

      // andb-core operations (new programmatic approach)
      andbExecute: (args: {
        sourceConnection: DatabaseConnection
        targetConnection?: DatabaseConnection
        operation: 'export' | 'compare' | 'migrate' | 'generate' | 'search'
        options: any
      }) => Promise<{ success: boolean; data?: any; error?: string }>

      andbTest: () => Promise<{ success: boolean; available?: boolean; error?: string }>

      onAndbProgress: (callback: (event: any, data: any) => void) => void

      andbGetSchemas: (args?: any) => Promise<{ success: boolean; data?: any; error?: string }>
      andbParseTable: (ddl: string) => Promise<{ success: boolean; data?: any; error?: string }>

      // Table Inspector (AI DBA Super Mode)
      andbGetTableStats: (args: { connection: any }) => Promise<{ success: boolean; data?: any; error?: string }>
      andbGetServerInfo: (args: { connection: any }) => Promise<{ success: boolean; data?: any; error?: string }>
      andbGetFKGraph: (args: { connection: any }) => Promise<{ success: boolean; data?: any; error?: string }>
      andbGetSavedComparisonResults: (args: {
        sourceConnection: any
        targetConnection: any
        type: string
      }) => Promise<{ success: boolean; data?: any; error?: string }>
      andbClearConnectionData: (connection: any) => Promise<{ success: boolean; error?: string }>
      getSnapshots: (args: { environment: string, database: string, type: string, name: string, databaseType?: string }) => Promise<{ success: boolean; data?: any; error?: string }>
      getAllSnapshots: (limit?: number) => Promise<{ success: boolean; data?: any; error?: string }>
      andbCreateSnapshot: (args: { connection: any; type: string; name: string }) => Promise<{ success: boolean; data?: any; error?: string }>
      andbRestoreSnapshot: (args: { connection: any; snapshot: any }) => Promise<{ success: boolean; data?: any; error?: string }>
      
      // AI Assistant
      aiConfigure: (apiKey: string, provider: string) => Promise<{ success: boolean; error?: string }>
      aiReview: (args: { context: any }) => Promise<{ success: boolean; data: any; error?: string }>
      aiAsk: (args: { question: string, context?: any }) => Promise<{ success: boolean; data: any; error?: string }>
      onAiControlEvent: (callback: (payload: any) => void) => void

      openBackupFolder: () => Promise<{ success: boolean; error?: string }>
      getReportList: () => Promise<{ success: boolean; data?: any[]; error?: string }>
      getReportContent: (filename: string) => Promise<{ success: boolean; data?: string; error?: string }>

      // Migration Changelog
      getMigrationChangelog: () => Promise<{ success: boolean; data?: any; error?: string }>
      dismissMigrationChangelog: () => Promise<{ success: boolean; error?: string }>

      getAppChangelog: () => Promise<{ success: boolean; data?: any; error?: string }>
      dismissAppChangelog: () => Promise<{ success: boolean; error?: string }>
      checkForUpdates: () => Promise<{ success: boolean; result?: any; error?: string }>
      downloadUpdate: () => Promise<{ success: boolean; result?: any; error?: string }>
      quitAndInstall: () => Promise<void>
      debugTestUpdate: (status: string) => Promise<void>

      loadMockCompareData: () => Promise<{ success: boolean; message?: string; error?: string }>

      storage: {
        get: (key: string) => Promise<{ success: boolean; data?: any; error?: string }>
        set: (key: string, value: any) => Promise<{ success: boolean; error?: string }>
        delete: (key: string) => Promise<{ success: boolean; error?: string }>
        has: (key: string) => Promise<{ success: boolean; data?: boolean; error?: string }>
        clear: () => Promise<{ success: boolean; error?: string }>
      }

      log: {
        send: (level: 'info' | 'warn' | 'error', message: string, data?: any) => Promise<void>
        write: (content: string) => Promise<void>
      }

      updater: {
        checkForUpdates: () => Promise<{ success: boolean; result?: any; error?: string }>
        downloadUpdate: () => Promise<{ success: boolean; result?: any; error?: string }>
        quitAndInstall: () => Promise<void>
        debugTestUpdate: (status: string) => Promise<void>
        onUpdateStatus: (callback: (response: any) => void) => void
        offUpdateStatus: () => void
      }

      cli: {
        checkPath: () => Promise<boolean>
        getBinaryPath: () => Promise<string>
      }

      mcp: {
        getMcpPath: () => Promise<string>
      }

      pickWorkspaceDir: () => Promise<{ success: boolean; path?: string; action?: string; error?: string }>
      resetWorkspaceDir: () => Promise<{ success: boolean; error?: string }>
      getWorkspaceStatus: () => Promise<{ success: boolean; path: string; dbPath: string }>

      security: {
        encryptToken: (token: string) => Promise<{ success: boolean; data?: string; error?: string }>
        decryptToken: (encryptedToken: string) => Promise<{ success: boolean; data?: string; error?: string }>
      }

      // Generic invoke for dynamic calls
      invoke: (channel: string, ...args: any[]) => Promise<any>
    }
  }
}

export { }

