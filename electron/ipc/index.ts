import { BrowserWindow, ipcMain } from 'electron'
import * as system from './system'
import * as updater from './updater'
import * as storage from './storage'
import * as andb from './andb'

/**
 * Register all IPC handlers
 * Following the Controller Pattern
 */
export function registerIpcHandlers() {
  console.log('--- REGISTERING IPC HANDLERS ---')
  // --- System & CLI ---
  ipcMain.handle('open-backup-folder', system.handleOpenBackupFolder)
  ipcMain.handle('pick-file', system.handlePickFile)
  ipcMain.handle('pick-directory', system.handlePickDirectory)
  ipcMain.handle('check-file-permissions', system.handleCheckFilePermissions)
  ipcMain.handle('save-dump-file', system.handleSaveDumpFile)
  ipcMain.handle('app-log', system.handleAppLog)
  ipcMain.handle('app-log-write', system.handleAppLogWrite)

  ipcMain.handle('cli-check-path', system.handleCliCheckPath)
  ipcMain.handle('cli-get-binary-path', system.handleCliGetBinaryPath)
  ipcMain.handle('mcp-get-path', system.handleMcpGetPath)
  ipcMain.handle('andb-check-cli-installed', system.handleCheckCliInstalled)
  ipcMain.handle('andb-install-cli', system.handleInstallCli)
  ipcMain.handle('execute-andb-command', system.handleExecuteAndbCommand)

  // --- Storage & Security ---
  ipcMain.handle('storage-get', storage.handleStorageGet)
  ipcMain.handle('storage-set', storage.handleStorageSet)
  ipcMain.handle('storage-delete', storage.handleStorageDelete)
  ipcMain.handle('storage-has', storage.handleStorageHas)
  ipcMain.handle('storage-clear', storage.handleStorageClear)
  ipcMain.handle('andb-clear-storage', storage.handleAndbClearStorage)
  ipcMain.handle('update-feature-flag', storage.handleUpdateFeatureFlag)
  ipcMain.handle('get-user-settings', storage.handleGetUserSettings)
  ipcMain.handle('save-user-setting', storage.handleSaveUserSetting)

  ipcMain.handle('security-get-public-key', storage.handleSecurityGetPublicKey)
  ipcMain.handle('security-encrypt-token', storage.handleSecurityEncryptToken)
  ipcMain.handle('security-decrypt-token', storage.handleSecurityDecryptToken)
  ipcMain.handle('security-regenerate-keys', storage.handleSecurityRegenerateKeys)
  ipcMain.handle('backup-encrypt', storage.handleBackupEncrypt)
  ipcMain.handle('backup-decrypt', storage.handleBackupDecrypt)

  // --- Auto Updater ---
  ipcMain.handle('check-for-updates', updater.handleCheckForUpdates)
  ipcMain.handle('download-update', updater.handleDownloadUpdate)
  ipcMain.handle('quit-and-install', updater.handleQuitAndInstall)
  ipcMain.handle('debug-test-update', updater.handleDebugTestUpdate)

  // --- Andb Core Engine ---
  ipcMain.handle('andb-execute', andb.handleAndbExecute)
  ipcMain.handle('andb-test', andb.handleAndbTest)
  ipcMain.handle('test-connection', andb.handleAndbTestConnection)
  ipcMain.handle('andb-get-saved-comparison-results', andb.handleAndbGetComparisons)
  ipcMain.handle('andb-get-schemas', andb.handleAndbGetSchemas)
  ipcMain.handle('andb-parse-table', andb.handleAndbParseTable)
  ipcMain.handle('andb-compare-arbitrary', andb.handleAndbCompareArbitrary)
  ipcMain.handle('andb-clear-connection-data', andb.handleAndbClearData)

  ipcMain.handle('get-snapshots', andb.handleAndbGetSnapshots)
  ipcMain.handle('get-all-snapshots', andb.handleAndbGetAllSnapshots)
  ipcMain.handle('andb-create-snapshot', andb.handleAndbCreateSnapshot)
  ipcMain.handle('andb-restore-snapshot', andb.handleAndbRestoreSnapshot)

  ipcMain.handle('get-migration-history', andb.handleAndbGetMigrationHistory)
  ipcMain.handle('add-migration', andb.handleAndbAddMigration)
  ipcMain.handle('update-migration-status', andb.handleAndbUpdateMigrationStatus)

  ipcMain.handle('get-comparison-history', andb.handleAndbGetComparisonHistory)
  ipcMain.handle('add-comparison', andb.handleAndbAddComparison)

  ipcMain.handle('get-export-logs', andb.handleAndbGetExportLogs)
  ipcMain.handle('add-export-log', andb.handleAndbAddExportLog)

  ipcMain.handle('get-audit-logs', andb.handleAndbGetAuditLogs)
  ipcMain.handle('add-audit-log', andb.handleAndbAddAuditLog)

  ipcMain.handle('database-cleanup', andb.handleAndbDatabaseCleanup)
  ipcMain.handle('get-database-stats', andb.handleAndbGetStats)

  ipcMain.handle('andb-get-report-list', andb.handleAndbGetReports)
  ipcMain.handle('andb-get-report-content', andb.handleAndbGetReportContent)
  ipcMain.handle('andb-delete-all-reports', andb.handleAndbDeleteReports)

  ipcMain.handle('get-migration-changelog', andb.handleGetMigrationChangelog)
  ipcMain.handle('dismiss-migration-changelog', andb.handleDismissMigrationChangelog)

  ipcMain.handle('load-mock-compare-data', andb.handleLoadMockData)
  ipcMain.handle('get-features-status', andb.handleAndbGetFeaturesStatus)

  // --- Specialized Handlers ---
  ipcMain.handle('setup-restricted-user', andb.handleAndbSetupRestrictedUser)
  ipcMain.handle('probe-restricted-user', andb.handleAndbProbeRestrictedUser)
  ipcMain.handle('generate-user-setup-script', andb.handleAndbGenerateUserSetupScript)

  ipcMain.handle('pick-and-move-sqlite-db', andb.handlePickAndMoveDb)
  ipcMain.handle('reset-db-path', andb.handleResetDbPath)
  ipcMain.handle('get-db-path', andb.handleAndbGetDbPath)

  ipcMain.handle('pick-project-dir', andb.handlePickProjectDir)
  ipcMain.handle('reset-project-dir', andb.handleResetProjectDir)
  ipcMain.handle('get-project-dir', andb.handleGetProjectDir)
}
