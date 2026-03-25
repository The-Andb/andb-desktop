import { app, dialog } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { AndbBuilder } from '../services/andb-builder'
import { CoreBridge } from '@the-andb/core'

/**
 * Handle Execute andb-core operation
 */
export async function handleAndbExecute(_event: any, args: any) {
  const { sourceConnection, targetConnection, operation, options } = args || {}
  return await AndbBuilder.execute(sourceConnection, targetConnection, operation, options, _event.sender)
}

/**
 * Handle Get saved comparison results
 */
export async function handleAndbGetComparisons(_event: any, args: any) {
  try {
    const { sourceConn, targetConn, type } = args || {}
    const results = await AndbBuilder.getSavedComparisonResults(sourceConn, targetConn, type)
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
    const { environment, database, type, name } = args || {}
    const snapshots = await AndbBuilder.getSnapshots(environment, database, type, name)
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
    const { connection } = args || {}
    await AndbBuilder.clearConnectionData(connection)
    return { success: true }
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

    // No connection provided means the UI wants ALL cached schemas from SQLite
    const { BackgroundWorker } = require('../services/background-worker')
    const worker = BackgroundWorker.getInstance()
    
    const envs = await worker.getEnvironments() || []
    const result: any[] = []

    for (const env of envs) {
      const dbs = await worker.getDatabases(env) || []
      if (dbs.length === 0) continue // Skip if no schemas cached for this env

      const envData: any = { name: env, databases: [] }
      for (const db of dbs) {
        const dbData = {
          name: db,
          tables: await worker.getDDLObjects(env, db, 'TABLES') || [],
          views: await worker.getDDLObjects(env, db, 'VIEWS') || [],
          procedures: await worker.getDDLObjects(env, db, 'PROCEDURES') || [],
          functions: await worker.getDDLObjects(env, db, 'FUNCTIONS') || [],
          triggers: await worker.getDDLObjects(env, db, 'TRIGGERS') || [],
          lastUpdated: new Date().toISOString()
        }
        envData.databases.push(dbData)
      }
      result.push(envData)
    }

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
export async function handlePickWorkspaceDir() {
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
    try { config = yaml.load(fs.readFileSync(dbConfigPath, 'utf8')) || {} } catch (e) {}
  }

  let oldProjectDir = config.projectBaseDir || process.cwd()

  try {
    let action = 'moved'
    
    // Check if target directory already has a workspace
    const hasDb = fs.existsSync(targetDbPath)
    const hasProjectDb = fs.existsSync(path.join(targetDir, 'db'))
    
    if (hasDb || hasProjectDb) {
      const { response } = await dialog.showMessageBox({
        type: 'warning',
        title: 'Existing Workspace Detected',
        message: 'A workspace already exists in this folder.',
        detail: 'Do you want to Link to this existing Workspace, or Overwrite it with your current data? (Overwriting will permanently delete previous data in that folder).',
        buttons: ['Link to Workspace', 'Overwrite with Current Data', 'Cancel'],
        defaultId: 0,
        cancelId: 2
      })

      if (response === 2) {
        return { success: false, canceled: true }
      } else if (response === 1) {
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
    } else {
      // Clean slate - move current data there
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
    try { config = yaml.load(fs.readFileSync(dbConfigPath, 'utf8')) || {} } catch (e) {}
    delete config.dbPath
    delete config.projectBaseDir
    config.lastUpdated = new Date().toISOString()
    fs.writeFileSync(dbConfigPath, yaml.dump(config), 'utf8')
  }
  return { success: true }
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
  return { success: true, path: pathVal, dbPath: CoreBridge.getDbPath() }
}

// Internal Mock Helper (Keep it here as Utility if needed)
export async function compareArbitrary(srcDDL: string, destDDL: string, type?: string) {
  return await AndbBuilder.compareArbitrary(srcDDL, destDDL, type);
}
