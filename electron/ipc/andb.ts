import { app, dialog } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { AndbBuilder } from '../services/andb-builder'
import { CoreBridge } from '@the-andb/core'
import { getDb, schema } from '../storage/drizzle/db'
import { eq } from 'drizzle-orm'

/**
 * Handle Execute andb-core operation
 */
export async function handleAndbExecute(_event: any, args: any) {
  const { sourceConnection, targetConnection, operation, options } = args || {}

  // Setup global progress listener once per worker lifecycle
  const { BackgroundWorker } = require('../services/background-worker')
  const worker = BackgroundWorker.getInstance()
  if (worker.listenerCount('progress') === 0) {
    worker.on('progress', (data: any) => {
      // Forward to all active renderer windows
      const { BrowserWindow } = require('electron')
      const windows = BrowserWindow.getAllWindows()
      windows.forEach(win => {
        try {
          if (!win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
            win.webContents.send('andb-progress', data)
          }
        } catch (e) {
          // Ignore errors from destroyed windows during broadcasting
        }
      })
    })
  }

  // Intercept executeQuery and apply lazy loading LIMIT/OFFSET
  if (operation === 'executeQuery' && options && typeof options.sql === 'string' && options.limit !== undefined) {
    const limit = Number(options.limit)
    const offset = Number(options.offset || 0)
    let sql = options.sql.trim()
    
    // Apply limit/offset dynamically to SELECT queries if they don't already have a LIMIT clause
    if (/^\s*SELECT\s/i.test(sql) && !/LIMIT\s+\d+/i.test(sql)) {
      if (sql.endsWith(';')) {
        sql = sql.slice(0, -1)
      }
      options.sql = `${sql} LIMIT ${limit} OFFSET ${offset};`
    }
  }

  return await AndbBuilder.execute(sourceConnection, targetConnection, operation, options, _event.sender)
}

/**
 * Handle Get saved comparison results
 */
export async function handleAndbGetComparisons(_event: any, args: any) {
  try {
    const { sourceConnection, targetConnection, type } = args || {}
    const results = await AndbBuilder.getSavedComparisonResults(sourceConnection, targetConnection, type)
    return { success: true, data: results }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Get Migration History
 */
export async function handleAndbGetMigrationHistory(_event: any, args: any) {
  try {
    const { limit } = args || {}
    const history = await AndbBuilder.getMigrationHistory(limit)
    return { success: true, data: history }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Get All Snapshots
 */
export async function handleAndbGetAllSnapshots(_event: any, args: any) {
  try {
    const { limit } = args || {}
    const snapshots = await AndbBuilder.getAllSnapshots(limit)
    return { success: true, data: snapshots }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Get Specific Snapshots
 */
export async function handleAndbGetSnapshots(_event: any, args: any) {
  try {
    const { environment, database, type, name, databaseType } = args || {}
    const snapshots = await AndbBuilder.getSnapshots(environment, database, type, name, databaseType)
    return { success: true, data: snapshots }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Restore Snapshot
 */
export async function handleAndbRestoreSnapshot(_event: any, args: any) {
  const { connection, snapshot } = args || {}
  return await AndbBuilder.restoreSnapshot(connection, snapshot)
}

/**
 * Handle Get Database Stats
 */
export async function handleAndbGetStats() {
  try {
    const stats = await AndbBuilder.getDatabaseStats()
    return { success: true, data: stats }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Clear Connection Data
 */
export async function handleAndbClearData(_event: any, args: any) {
  try {
    // Support BOTH modern object wrapper AND legacy direct connection passing styles robustly
    const connection = args?.connection || args
    const purgeFiles = args?.purgeFiles === true

    if (!connection) {
      throw new Error('Missing database connection parameter');
    }

    await AndbBuilder.clearConnectionData(connection, purgeFiles)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Physical Purge of the Active Project
 */
export async function handleAndbPurgeActiveProject(_event: any) {
  try {
    const { BackgroundWorker } = require('../services/background-worker')
    const result = await BackgroundWorker.getInstance().purgeActiveProject()
    return { success: true, result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Get DB Path
 */
export async function handleAndbGetDbPath() {
  return CoreBridge.getDbPath()
}

/**
 * Handle Get Report List
 */
export async function handleAndbGetReports() {
  return await AndbBuilder.getReportList()
}

/**
 * Handle Get Report Content
 */
export async function handleAndbGetReportContent(_event: any, filename: string) {
  return await AndbBuilder.getReportContent(filename)
}

/**
 * Handle Delete All Reports
 */
export async function handleAndbDeleteReports() {
  await AndbBuilder.deleteAllReports()
}

/**
 * Handle Setup Restricted User
 */
export async function handleAndbSetupRestrictedUser(_event: any, args: any) {
  try {
    const result = await AndbBuilder.setupRestrictedUser(args)
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Probe Restricted User
 */
export async function handleAndbProbeRestrictedUser(_event: any, args: any) {
  try {
    const result = await AndbBuilder.probeRestrictedUser(args)
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Generate User Setup Script
 */
export async function handleAndbGenerateUserSetupScript(_event: any, args: any) {
  try {
    const result = await AndbBuilder.generateUserSetupScript(args)
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Get Schemas
 */
export async function handleAndbGetSchemas(_event: any, args: any) {
  try {
    const connection = args?.connection
    if (connection) {
      // Live fetch schema objects using CLI OrchestrationService
      const result = await AndbBuilder.execute(connection, null, 'getSchemaObjects', {})
      return { success: true, data: result }
    }

    // ISOLATION: Only return schemas for the current project's connections.
    // The caller MUST pass `connections` (the active project's resolved connections).
    // Without connections, we cannot determine which project owns which data — return empty.
    const knownConnections: any[] = args?.connections || []
    // console.log('[handleAndbGetSchemas] Received knownConnections count:', knownConnections.length)
    if (knownConnections.length > 0) {
      // console.log('[handleAndbGetSchemas] knownConnections details:', knownConnections.map(c => ({ id: c.id, name: c.name, env: c.environment, db: c.database })))
    }
    if (knownConnections.length === 0) {
      return { success: true, data: [] }
    }

    // Group the active project's connections by environment to construct the structure
    const envGroups = new Map<string, any[]>()
    for (const c of knownConnections) {
      if (!c.environment || !c.database) continue
      const envKey = c.environment.toLowerCase()
      if (!envGroups.has(envKey)) {
        envGroups.set(envKey, [])
      }
      envGroups.get(envKey)!.push(c)
    }

    const { BackgroundWorker } = require('../services/background-worker')
    const worker = BackgroundWorker.getInstance()
    const result: any[] = []

    for (const [envKey, conns] of envGroups.entries()) {
      const envName = conns[0].environment
      const envData: any = { name: envName, databases: [] }

      for (const conn of conns) {
        const dbName = conn.database
        const dbType = conn.source_type || conn.type || 'mysql'

        // console.log(`[handleAndbGetSchemas] Fetching DDL objects for project connection: ${envName} / ${dbName} (${dbType})`)

        const tables = await worker.getDDLObjects(envName, dbName, 'TABLES', dbType) || []
        const views = await worker.getDDLObjects(envName, dbName, 'VIEWS', dbType) || []
        const procedures = await worker.getDDLObjects(envName, dbName, 'PROCEDURES', dbType) || []
        const functions = await worker.getDDLObjects(envName, dbName, 'FUNCTIONS', dbType) || []
        const triggers = await worker.getDDLObjects(envName, dbName, 'TRIGGERS', dbType) || []

        // console.log(`[handleAndbGetSchemas] DDL counts for ${envName} / ${dbName}:`, {
        //   tables: tables.length,
        //     views: views.length,
        //       procedures: procedures.length,
        //         functions: functions.length,
        //           triggers: triggers.length
        // })

        const dbData = {
          name: dbName,
          type: dbType,
          connectionId: conn.id || null,
          tables,
          views,
          procedures,
          functions,
          triggers,
          lastUpdated: new Date().toISOString()
        }
        envData.databases.push(dbData)
      }

      if (envData.databases.length > 0) {
        result.push(envData)
      }
    }

    // console.log('[handleAndbGetSchemas] Final schemas returned count:', result.length)
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}


/**
 * Handle Add Migration
 */
export async function handleAndbAddMigration(_event: any, migration: any) {
  try {
    const result = await AndbBuilder.addMigration(migration)
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Update Migration Status
 */
export async function handleAndbUpdateMigrationStatus(_event: any, args: any) {
  try {
    const { id, status, error } = args || {}
    const result = await AndbBuilder.updateMigrationStatus(id, status, error)
    return { success: true, data: result }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Handle Add Comparison
 */
export async function handleAndbAddComparison(_event: any, comparison: any) {
  try {
    const result = await AndbBuilder.addComparison(comparison)
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Get Comparison History
 */
export async function handleAndbGetComparisonHistory(_event: any, args: any) {
  try {
    const { limit } = args || {}
    const history = await AndbBuilder.getComparisonHistory(limit)
    return { success: true, data: history }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Add Export Log
 */
export async function handleAndbAddExportLog(_event: any, log: any) {
  try {
    const result = await AndbBuilder.addExportLog(log)
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Get Export Logs
 */
export async function handleAndbGetExportLogs(_event: any, args: any) {
  try {
    const { limit } = args || {}
    const logs = await AndbBuilder.getExportLogs(limit)
    return { success: true, data: logs }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Add Audit Log
 */
export async function handleAndbAddAuditLog(_event: any, log: any) {
  try {
    const result = await AndbBuilder.addAuditLog(log)
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Get Audit Logs
 */
export async function handleAndbGetAuditLogs(_event: any, args: any) {
  try {
    const { limit } = args || {}
    const logs = await AndbBuilder.getAuditLogs(limit)
    return { success: true, data: logs }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Database Cleanup
 */
export async function handleAndbDatabaseCleanup(_event: any, args: any) {
  try {
    const { daysToKeep } = args || {}
    const result = await AndbBuilder.databaseCleanup(daysToKeep)
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Arbitrary DDL Comparison
 */
export async function handleAndbCompareArbitrary(_event: any, args: any) {
  try {
    const { BackgroundWorker } = require('../services/background-worker')
    const worker = BackgroundWorker.getInstance()
    const result = await worker.execute('compare-arbitrary', args)
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Parse Table
 */
export async function handleAndbParseTable(_event: any, ddl: string) {
  try {
    const result = await AndbBuilder.parseTable(ddl)
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Create Snapshot
 */
export async function handleAndbCreateSnapshot(_event: any, args: any) {
  try {
    const { connection, type, name, db } = args || {}
    const result = await AndbBuilder.execute(connection, null, 'create-snapshot', { type, name, db })
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Andb Test
 */
export async function handleAndbTest() {
  try {
    const available = await AndbBuilder.test()
    return { success: true, available }
  } catch (error: any) {
    return { success: false, available: false, error: error.message }
  }
}

/**
 * Handle Test Connection
 */
export async function handleAndbTestConnection(_event: any, args: any) {
  try {
    const connection = args
    const result = await AndbBuilder.execute(connection, null, 'test-connection', {})
    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function handleAndbDetectDatabases(_event: any, args: any) {
  try {
    const connection = args
    const result = await AndbBuilder.execute(connection, null, 'detect-databases', {})
    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Get Migration Changelog
 */
export async function handleGetMigrationChangelog() {
  try {
    return await CoreBridge.execute('getLastMigrationReport', {})
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

/**
 * Handle Dismiss Migration Changelog
 */
export async function handleDismissMigrationChangelog() {
  try {
    return await CoreBridge.execute('dismissMigrationReport', {})
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

/**
 * Handle Load Mock Data
 */
export async function handleLoadMockData() {
  // Logic from old main.ts (if needed) or just return success
  return { success: true }
}

/**
 * Handle Get Features Status
 */
export async function handleAndbGetFeaturesStatus() {
  return {
    snapshots: true,
    migration: true,
    restrictedUser: true,
    dockerSeeding: true
  }
}

/**
 * Handle Pick Unified Workspace Directory
 */
export async function handlePickWorkspaceDir(_event?: any, args?: { isFirstStart?: boolean }) {
  const result = await dialog.showOpenDialog({
    title: 'Select Workspace Directory',
    properties: ['openDirectory', 'createDirectory']
  })

  if (result.canceled || result.filePaths.length === 0) return null

  const targetDir = result.filePaths[0]
  const targetDbPath = path.join(targetDir, 'andb-storage.db')
  const currentDbPath = CoreBridge.getDbPath()

  const userDataPath = app.getPath('userData')
  const yaml = require('js-yaml')
  const dbConfigPath = path.join(userDataPath, 'db-config.yaml')
  let config: any = {}
  if (fs.existsSync(dbConfigPath)) {
    try { config = yaml.load(fs.readFileSync(dbConfigPath, 'utf8')) || {} } catch (e) { }
  }

  let oldProjectDir = config.projectBaseDir || process.cwd()

  try {
    let action = 'moved'

    const files = fs.readdirSync(targetDir)
    const isEmpty = files.length === 0 || (files.length === 1 && files[0] === '.DS_Store')
    const hasDb = fs.existsSync(targetDbPath)
    const hasProjectDb = fs.existsSync(path.join(targetDir, 'db'))

    const isFirstStart = args?.isFirstStart || false

    if (hasDb || hasProjectDb) {
      const buttons = isFirstStart
        ? ['Link to Workspace', 'Cancel']
        : ['Link to Workspace', 'Overwrite with Current Data', 'Cancel']

      const { response } = await dialog.showMessageBox({
        type: 'warning',
        title: 'Existing Workspace Detected',
        message: 'A workspace already exists in this folder.',
        detail: isFirstStart
          ? 'Do you want to Link to this existing Workspace?'
          : 'Do you want to Link to this existing Workspace, or Overwrite it with your current data? (Overwriting will permanently delete previous data in that folder).',
        buttons,
        defaultId: 0,
        cancelId: isFirstStart ? 1 : 2
      })

      let finalResponse = response
      if (isFirstStart) {
        if (response === 1) {
          finalResponse = 2 // Cancel
        } else if (response === 0) {
          finalResponse = 0 // Link
        }
      }

      if (finalResponse === 2) {
        return { success: false, canceled: true }
      } else if (finalResponse === 1) {
        // Overwrite
        if (fs.existsSync(currentDbPath)) {
          fs.copyFileSync(currentDbPath, targetDbPath)
          try {
            const oldKeyDir = path.join(path.dirname(currentDbPath), 'security')
            const newKeyDir = path.join(targetDir, 'security')
            if (fs.existsSync(oldKeyDir)) {
              const fsPromises = require('fs/promises')
              await fsPromises.cp(oldKeyDir, newKeyDir, { recursive: true, force: true })
            }
          } catch (e) {
            console.warn('Failed to relocate security keys', e)
          }
        }

        // Copy project DDLs
        const fsPromises = require('fs/promises');
        if (oldProjectDir && oldProjectDir !== targetDir) {
          if (fs.existsSync(path.join(oldProjectDir, 'db'))) {
            await fsPromises.cp(path.join(oldProjectDir, 'db'), path.join(targetDir, 'db'), { recursive: true, force: true });
          }
          if (fs.existsSync(path.join(oldProjectDir, 'map-migrate'))) {
            await fsPromises.cp(path.join(oldProjectDir, 'map-migrate'), path.join(targetDir, 'map-migrate'), { recursive: true, force: true });
          }
        }

        action = 'overwrote'
      } else {
        // Link
        if ((global as any).logger) (global as any).logger.info(`Linking to existing Workspace at ${targetDir}`);
        action = 'linked'
      }
    } else if (!isEmpty) {
      // NOT empty and NO database. Invalid selection.
      await dialog.showMessageBox({
        type: 'error',
        title: 'Invalid Directory',
        message: 'This folder is not an empty folder nor a valid Andb workspace.',
        detail: 'Please pick an empty folder or a folder that already contains an Andb workspace (andb-storage.db).\n\nIf you want to use this folder, please empty it first to avoid any data conflicts.'
      })
      return { success: false, error: 'Directory is not empty and contains no valid workspace.' }
    } else {
      // Clean slate (Empty) - move current data there
      if (fs.existsSync(currentDbPath)) {
        fs.copyFileSync(currentDbPath, targetDbPath)
        try {
          const oldKeyDir = path.join(path.dirname(currentDbPath), 'security')
          const newKeyDir = path.join(targetDir, 'security')
          if (fs.existsSync(oldKeyDir)) {
            const fsPromises = require('fs/promises')
            await fsPromises.cp(oldKeyDir, newKeyDir, { recursive: true, force: true })
          }
        } catch (e) {
          console.warn('Failed to relocate security keys', e)
        }
      }

      const fsPromises = require('fs/promises');
      if (oldProjectDir && oldProjectDir !== targetDir) {
        if (fs.existsSync(path.join(oldProjectDir, 'db'))) {
          await fsPromises.cp(path.join(oldProjectDir, 'db'), path.join(targetDir, 'db'), { recursive: true, force: true });
        }
        if (fs.existsSync(path.join(oldProjectDir, 'map-migrate'))) {
          await fsPromises.cp(path.join(oldProjectDir, 'map-migrate'), path.join(targetDir, 'map-migrate'), { recursive: true, force: true });
        }
      }
    }

    // Update config
    config.dbPath = targetDbPath
    config.projectBaseDir = targetDir
    config.lastUpdated = new Date().toISOString()
    fs.writeFileSync(dbConfigPath, yaml.dump(config), 'utf8')

    // Ensure backup directory exists
    const backupDir = path.join(targetDir, 'backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    // Prompt user for immediate relaunch to hot-load the new vault DB
    try {
      const { response } = await dialog.showMessageBox({
        type: 'question',
        title: 'Workspace Updated',
        message: 'Workspace linked successfully!',
        detail: 'A relaunch is required to initialize the new workspace databases, connections, and security credentials. Would you like to relaunch the application now?',
        buttons: ['Relaunch Now', 'Relaunch Later'],
        defaultId: 0,
        cancelId: 1
      })
      if (response === 0) {
        const { handleRelaunchApp } = require('./system')
        await handleRelaunchApp()
      }
    } catch (relaunchErr) {
      if ((global as any).logger) (global as any).logger.warn('Relaunch prompt failed', relaunchErr)
    }

    return { success: true, path: targetDir, action }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

/**
 * Handle Reset Workspace
 */
export async function handleResetWorkspace() {
  const userDataPath = app.getPath('userData')
  const dbConfigPath = path.join(userDataPath, 'db-config.yaml')
  if (fs.existsSync(dbConfigPath)) {
    const yaml = require('js-yaml')
    let config: any = {}
    try { config = yaml.load(fs.readFileSync(dbConfigPath, 'utf8')) || {} } catch (e) { }
    delete config.dbPath
    delete config.projectBaseDir
    config.lastUpdated = new Date().toISOString()
    fs.writeFileSync(dbConfigPath, yaml.dump(config), 'utf8')

    // Prompt for relaunch to switch back to local storage
    try {
      const { response } = await dialog.showMessageBox({
        type: 'question',
        title: 'Workspace Reset',
        message: 'Workspace reset to local default storage.',
        detail: 'A relaunch is required to revert to local database stores. Would you like to relaunch now?',
        buttons: ['Relaunch Now', 'Relaunch Later'],
        defaultId: 0,
        cancelId: 1
      })
      if (response === 0) {
        const { handleRelaunchApp } = require('./system')
        await handleRelaunchApp()
      }
    } catch (relaunchErr) {
      if ((global as any).logger) (global as any).logger.warn('Reset relaunch prompt failed', relaunchErr)
    }
  }
  return { success: true }
}

/**
 * Internal helper to scan vault directories recursively and return a flat array for visual rendering
 */
function getFlatDirectoryTree(dirPath: string, depth = 0, results: any[] = []) {
  if (depth > 3) return results;
  try {
    if (!fs.existsSync(dirPath)) return results;
    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) return results;

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const sorted = entries
      .filter(e => !e.name.startsWith('.') || e.name === '.snapshots')
      .filter(e => !['node_modules', 'dist', '.git'].includes(e.name))
      .sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });

    for (const entry of sorted) {
      const full = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        results.push({
          name: entry.name,
          type: 'directory',
          depth: depth
        });
        getFlatDirectoryTree(full, depth + 1, results);
      } else {
        const st = fs.statSync(full);
        results.push({
          name: entry.name,
          type: 'file',
          depth: depth,
          size: st.size
        });
      }
    }
  } catch (e) { }
  return results;
}

/**
 * Handle Get Workspace Status
 */
export async function handleGetWorkspaceStatus() {
  const userDataPath = app.getPath('userData')
  const dbConfigPath = path.join(userDataPath, 'db-config.yaml')
  let pathVal = ''
  if (fs.existsSync(dbConfigPath)) {
    const yaml = require('js-yaml')
    try {
      const config: any = yaml.load(fs.readFileSync(dbConfigPath, 'utf8')) || {}
      pathVal = config.projectBaseDir || ''
    } catch (e: any) {
      console.warn('Failed to parse db-config', e)
    }
  }

  // Determine actual resolved path to prevent silent fallbacks
  let actualPath = pathVal;
  let isFallback = false;
  let fallbackReason = '';

  if (!actualPath) {
    actualPath = path.join(userDataPath, 'db');
    isFallback = true;
    fallbackReason = 'No custom workspace configured. Standard application cache fallback in effect.';
  } else if (!fs.existsSync(actualPath)) {
    // Critical: Path configured but does not exist on disk! Fallback to active process.cwd()
    actualPath = process.cwd();
    isFallback = true;
    fallbackReason = 'Configured Workspace location not found! Emergency fallback to Current Working Directory (CWD) is ACTIVE.';
  }

  // Generate flat directory tree map
  const tree = getFlatDirectoryTree(actualPath);

  return {
    success: true,
    path: pathVal,
    actualPath: actualPath,
    isFallback: isFallback,
    fallbackReason: fallbackReason,
    dbPath: CoreBridge.getDbPath(),
    tree: tree
  }
}

export async function handleMigrateVaultData(_event: any, args: { projectId: string, projectName?: string, projectSlug: string }) {
  const { projectId, projectName, projectSlug } = args || {}
  if (!projectId) {
    return { success: false, error: 'Project ID is required' }
  }

  const userDataPath = app.getPath('userData')
  const dbConfigPath = path.join(userDataPath, 'db-config.yaml')
  let vaultPath = ''

  if (fs.existsSync(dbConfigPath)) {
    const yaml = require('js-yaml')
    try {
      const config: any = yaml.load(fs.readFileSync(dbConfigPath, 'utf8')) || {}
      vaultPath = config.projectBaseDir || ''
    } catch (e: any) {
      console.warn('Failed to parse db-config', e)
    }
  }

  if (!vaultPath) {
    // Default system fallback
    vaultPath = path.join(userDataPath, 'db')
  }

  try {
    const fsPromises = require('fs/promises')

    // Unified standardization strategy: matches @the-andb/core logic 100%
    const rawName = projectName || projectSlug || 'default'
    const sanitizedName = rawName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase().replace(/-+/g, '_')

    // Align both Vault Migration AND Strategy to same output directory structure: projects/<name>
    const targetDir = path.join(vaultPath, 'projects', sanitizedName)

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    const foldersToMove = ['db', 'map-migrate']
    let movedAny = false

    for (const folder of foldersToMove) {
      const sourcePath = path.join(vaultPath, folder)
      const destPath = path.join(targetDir, folder)

      if (fs.existsSync(sourcePath) && sourcePath !== destPath) {
        // Copy to project subfolder recursively
        await fsPromises.cp(sourcePath, destPath, { recursive: true, force: true })
        // Mark that we moved something
        movedAny = true
      }
    }

    return { success: true, moved: movedAny, targetDir }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function handleRollbackVaultData(_event: any, args: { projectId: string, projectName?: string, projectSlug: string }) {
  const { projectId, projectName, projectSlug } = args || {}
  if (!projectId) {
    return { success: false, error: 'Project ID is required' }
  }

  const userDataPath = app.getPath('userData')
  const dbConfigPath = path.join(userDataPath, 'db-config.yaml')
  let vaultPath = ''

  if (fs.existsSync(dbConfigPath)) {
    const yaml = require('js-yaml')
    try {
      const config: any = yaml.load(fs.readFileSync(dbConfigPath, 'utf8')) || {}
      vaultPath = config.projectBaseDir || ''
    } catch (e: any) {
      console.warn('Failed to parse db-config', e)
    }
  }

  if (!vaultPath) {
    vaultPath = path.join(userDataPath, 'db')
  }

  try {
    // Unified standardization strategy
    const rawName = projectName || projectSlug || 'default'
    const sanitizedName = rawName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase().replace(/-+/g, '_')

    const targetDir = path.join(vaultPath, 'projects', sanitizedName)

    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true })
    }

    return { success: true, rolledBack: true, targetDir }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// Internal Mock Helper (Keep it here as Utility if needed)
export async function compareArbitrary(srcDDL: string, destDDL: string, type?: string) {
  return await AndbBuilder.compareArbitrary(srcDDL, destDDL, type);
}

/**
 * Handle Get Table Stats (AI DBA Super Mode)
 * Fetches table metadata (row count, data size, index size, engine, etc.)
 */
export async function handleAndbGetTableStats(_event: any, args: any) {
  const { connection } = args || {}
  return await AndbBuilder.execute(connection, null, 'getTableStats', {})
}

/**
 * Handle Get Server Info (AI DBA Super Mode)
 * Fetches MySQL version and DDL capability flags
 */
export async function handleAndbGetServerInfo(_event: any, args: any) {
  const { connection } = args || {}
  return await AndbBuilder.execute(connection, null, 'getServerInfo', {})
}

/**
 * Handle Get FK Graph (AI DBA Super Mode)
 * Fetches foreign key dependency graph
 */
export async function handleAndbGetFKGraph(_event: any, args: any) {
  const { connection } = args || {}
  return await AndbBuilder.execute(connection, null, 'getFKGraph', {})
}
/**
 * Handle AI Configuration
 */
export async function handleAndbAIConfigure(_event: any, args: any) {
  try {
    const { apiKey, provider } = args || {}
    await AndbBuilder.configureAI(apiKey, provider)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle AI Schema Review
 */
export async function handleAndbAIReview(_event: any, args: any) {
  try {
    const { context, locale } = args || {}
    const result = await AndbBuilder.reviewSchema(context, locale)
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle AI Ask DBA
 */
export async function handleAndbAIAsk(_event: any, args: any) {
  try {
    const { question, context, locale } = args || {}
    const result = await AndbBuilder.askDBA(question, context, locale)
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// --- AI Chat Storage Handlers ---

import { database } from '../utils/database'

export async function handleSaveAiChat(_event: any, chat: any) {
  try {
    database.saveAiChat(chat)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function handleGetAiChats(_event: any) {
  try {
    const chats = database.getAiChats()
    return { success: true, data: chats }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function handleDeleteAiChat(_event: any, id: string) {
  try {
    database.deleteAiChat(id)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function handleClearAiChats(_event: any) {
  try {
    database.clearAiChats()
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Test AI Connection
 */
export async function handleAndbTestAIConnection(_event: any, args: any) {
  return await AndbBuilder.testAIConnection(args)
}

/**
 * Handle Sync Secret Repo
 */
export async function handleAndbSyncSecretRepo(_event: any, url: string) {
  return await AndbBuilder.syncSecretRepo(url)
}

/**
 * Update the global active project directory for continuous container isolation
 */
export async function handleSetActiveProjectDir(_event: any, args: { projectBaseDir: string, projectId?: string, projectName?: string }) {
  try {
    const { BackgroundWorker } = require('../services/background-worker')
    const worker = BackgroundWorker.getInstance()
    worker.setActiveProjectContext(args.projectBaseDir || '', args.projectId || '', args.projectName || '')

    // Persist projectBaseDir to the projects table so it survives restarts
    if (args.projectId && args.projectBaseDir) {
      try {
        await worker.saveProject({
          id: args.projectId,
          name: args.projectName || '',
          description: '',
          projectBaseDir: args.projectBaseDir
        })
      } catch (persistErr: any) {
        // Non-fatal — in-memory context is already set above
        console.warn('[handleSetActiveProjectDir] Could not persist projectBaseDir to DB:', persistErr.message)
      }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Save Instant Compare Session
 */
export async function handleSaveInstantCompare(_event: any, args: any) {
  try {
    const { id, name, srcDDL, destDDL, status, type } = args || {}
    if (!name) {
      throw new Error('Name is required to save instant comparison')
    }

    const { BackgroundWorker } = require('../services/background-worker')
    const worker = BackgroundWorker.getInstance()

    // Resolve project details
    const projectId = worker.getActiveProjectId() || 'default'
    const baseDir = worker.getActiveProjectBaseDir() || app.getPath('userData')
    const rawProjectName = worker.getActiveProjectName() || 'default'
    const projectName = rawProjectName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase()

    // Determine the directory in the vault to save files
    const instantCompareDir = path.join(baseDir, 'projects', projectName, 'instant_compare')
    if (!fs.existsSync(instantCompareDir)) {
      fs.mkdirSync(instantCompareDir, { recursive: true })
    }

    // Generate custom unique ID if not provided
    const recordId = id || 'ic-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9)

    // Save actual DDL files inside vault
    const sourceRelativePath = `projects/${projectName}/instant_compare/${recordId}_source.sql`
    const targetRelativePath = `projects/${projectName}/instant_compare/${recordId}_target.sql`

    const sourceFileFullPath = path.join(baseDir, sourceRelativePath)
    const targetFileFullPath = path.join(baseDir, targetRelativePath)

    fs.writeFileSync(sourceFileFullPath, srcDDL || '', 'utf8')
    fs.writeFileSync(targetFileFullPath, destDDL || '', 'utf8')

    // Save or update SQLite record using Drizzle
    const db = getDb()
    db.insert(schema.instantCompares)
      .values({
        id: recordId,
        projectId,
        name,
        sourcePath: sourceRelativePath,
        targetPath: targetRelativePath,
        status: status || null,
        type: type || 'SQL',
        updatedAt: new Date().toISOString()
      })
      .onConflictDoUpdate({
        target: schema.instantCompares.id,
        set: {
          name,
          sourcePath: sourceRelativePath,
          targetPath: targetRelativePath,
          status: status || null,
          type: type || 'SQL',
          updatedAt: new Date().toISOString()
        }
      })
      .run()

    return { success: true, data: { id: recordId } }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Get Instant Compare History
 */
export async function handleGetInstantCompareHistory(_event: any, args: any) {
  try {
    const { BackgroundWorker } = require('../services/background-worker')
    const worker = BackgroundWorker.getInstance()
    const projectId = worker.getActiveProjectId() || 'default'

    const db = getDb()
    const rows = db.select()
      .from(schema.instantCompares)
      .where(eq(schema.instantCompares.projectId, projectId))
      .orderBy(schema.instantCompares.createdAt)
      .all()

    return { success: true, data: rows }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Load Instant Compare Detail
 */
export async function handleLoadInstantCompareDetail(_event: any, args: any) {
  try {
    const { id } = args || {}
    if (!id) {
      throw new Error('ID is required to load instant comparison details')
    }

    const db = getDb()
    const record = db.select()
      .from(schema.instantCompares)
      .where(eq(schema.instantCompares.id, id))
      .get()

    if (!record) {
      throw new Error(`Comparison history record not found for ID: ${id}`)
    }

    const { BackgroundWorker } = require('../services/background-worker')
    const worker = BackgroundWorker.getInstance()
    const baseDir = worker.getActiveProjectBaseDir() || app.getPath('userData')

    let srcDDL = ''
    let destDDL = ''

    if (record.sourcePath) {
      const sourceFileFullPath = path.join(baseDir, record.sourcePath)
      if (fs.existsSync(sourceFileFullPath)) {
        srcDDL = fs.readFileSync(sourceFileFullPath, 'utf8')
      }
    }

    if (record.targetPath) {
      const targetFileFullPath = path.join(baseDir, record.targetPath)
      if (fs.existsSync(targetFileFullPath)) {
        destDDL = fs.readFileSync(targetFileFullPath, 'utf8')
      }
    }

    return {
      success: true,
      data: {
        ...record,
        srcDDL,
        destDDL
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Delete Instant Compare Session
 */
export async function handleDeleteInstantCompare(_event: any, args: any) {
  try {
    const { id } = args || {}
    if (!id) {
      throw new Error('ID is required to delete comparison history')
    }

    const db = getDb()
    const record = db.select()
      .from(schema.instantCompares)
      .where(eq(schema.instantCompares.id, id))
      .get()

    if (record) {
      const { BackgroundWorker } = require('../services/background-worker')
      const worker = BackgroundWorker.getInstance()
      const baseDir = worker.getActiveProjectBaseDir() || app.getPath('userData')

      // Wipe physical files from vault
      if (record.sourcePath) {
        const sourceFileFullPath = path.join(baseDir, record.sourcePath)
        if (fs.existsSync(sourceFileFullPath)) {
          try {
            fs.unlinkSync(sourceFileFullPath)
          } catch (e) {
            // Ignore missing files
          }
        }
      }

      if (record.targetPath) {
        const targetFileFullPath = path.join(baseDir, record.targetPath)
        if (fs.existsSync(targetFileFullPath)) {
          try {
            fs.unlinkSync(targetFileFullPath)
          } catch (e) {
            // Ignore missing files
          }
        }
      }

      // Delete SQLite record
      db.delete(schema.instantCompares)
        .where(eq(schema.instantCompares.id, id))
        .run()
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Reading a migration SQL file from the vault
 */
export async function handleAndbReadMigrationFile(_event: any, filePath: string) {
  try {
    const { BackgroundWorker } = require('../services/background-worker')
    const worker = BackgroundWorker.getInstance()
    const baseDir = worker.getActiveProjectBaseDir() || app.getPath('userData')
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(baseDir, filePath)

    if (!fs.existsSync(fullPath)) {
      return { success: false, error: `File not found: ${filePath}` }
    }

    const content = fs.readFileSync(fullPath, 'utf8')
    return { success: true, data: content }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Monitor Pulse operation
 */
export async function handleAndbMonitorPulse(_event: any, args: any) {
  try {
    const { connection } = args || {}
    const result = await AndbBuilder.execute(connection, null, 'monitor-pulse', {})
    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Monitor Deep Snapshot operation
 */
export async function handleAndbMonitorSnapshot(_event: any, args: any) {
  try {
    const { connection } = args || {}
    const result = await AndbBuilder.execute(connection, null, 'monitor-snapshot', {})
    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Monitor Kill Thread operation
 */
export async function handleAndbMonitorKill(_event: any, args: any) {
  try {
    const { connection, threadId } = args || {}
    const result = await AndbBuilder.execute(connection, null, 'monitor-kill', { threadId })
    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Local Database Discovery operation
 */
export async function handleAndbDiscoverLocal(_event: any, args: any) {
  try {
    const { workspacePath } = args || {}
    const { BackgroundWorker } = require('../services/background-worker')
    const worker = BackgroundWorker.getInstance()
    const pathVal = workspacePath || worker.getActiveProjectBaseDir() || app.getPath('userData')

    const result = await worker.execute('discovery-scan', { workspacePath: pathVal })
    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}


/**
 * Handle Auto Save Query operation
 */
export async function handleAndbSaveQuery(_event: any, args: { sql: string, projectBaseDir: string, filename: string }) {
  try {
    const { sql, projectBaseDir, filename } = args || {}
    if (!projectBaseDir) throw new Error('projectBaseDir is required')

    const queryDir = path.join(projectBaseDir, 'vault', 'temp', 'query')
    if (!fs.existsSync(queryDir)) {
      fs.mkdirSync(queryDir, { recursive: true })
    }

    const filePath = path.join(queryDir, filename)
    fs.writeFileSync(filePath, sql || '', 'utf8')
    return { success: true, filePath }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Load Query operation
 */
export async function handleAndbLoadQuery(_event: any, args: { projectBaseDir: string, filename: string }) {
  try {
    const { projectBaseDir, filename } = args || {}
    if (!projectBaseDir) throw new Error('projectBaseDir is required')

    const filePath = path.join(projectBaseDir, 'vault', 'temp', 'query', filename)
    if (fs.existsSync(filePath)) {
      const sql = fs.readFileSync(filePath, 'utf8')
      return { success: true, sql }
    }
    return { success: true, sql: '' }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Deep Search (Global Code Search)
 */
export async function handleAndbDeepSearch(_event: any, args: any) {
  try {
    const { sourceConnection, keyword } = args || {}
    if (!sourceConnection) {
      throw new Error('Connection details are required')
    }
    if (!keyword) {
      return { success: true, data: [] }
    }

    const sql = `
      SELECT ROUTINE_TYPE AS object_type, ROUTINE_NAME AS object_name, 'ROUTINES' AS source_meta 
      FROM information_schema.ROUTINES 
      WHERE ROUTINE_SCHEMA = DATABASE() AND ROUTINE_DEFINITION LIKE CONCAT('%', ?, '%')
      UNION ALL
      SELECT 'TRIGGER' AS object_type, TRIGGER_NAME AS object_name, 'TRIGGERS' AS source_meta 
      FROM information_schema.TRIGGERS 
      WHERE TRIGGER_SCHEMA = DATABASE() AND ACTION_STATEMENT LIKE CONCAT('%', ?, '%')
      UNION ALL
      SELECT 'VIEW' AS object_type, TABLE_NAME AS object_name, 'VIEWS' AS source_meta 
      FROM information_schema.VIEWS 
      WHERE TABLE_SCHEMA = DATABASE() AND VIEW_DEFINITION LIKE CONCAT('%', ?, '%')
      ORDER BY object_type, object_name;
    `.trim()

    const result = await AndbBuilder.execute(sourceConnection, null, 'executeQuery', {
      sql,
      params: [keyword, keyword, keyword]
    })

    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

