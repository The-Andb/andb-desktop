import { app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import * as crypto from 'crypto'
import { eq, sql } from 'drizzle-orm'
import { SecurityService } from '../services/security'
import { desktopStorageStrategy } from '../bootstrap'
import { getDb, schema } from '../storage/drizzle/db'

const {
  projectConnections,
  globalConnections,
  guiPreferences,
  workspaceTabs,
  instantCompares,
} = schema

/** Deserialize a raw Drizzle connection row into a frontend-friendly object */
function deserializeConn(item: any): any {
  const conn = { ...item }
  const security = SecurityService.getInstance()
  if (conn.password) { try { conn.password = security.decrypt(conn.password) } catch { } }
  if (conn.sshConfigJson)       { conn.ssh = JSON.parse(conn.sshConfigJson); delete conn.sshConfigJson }
  if (conn.permissionsJson)     { conn.permissions = JSON.parse(conn.permissionsJson); delete conn.permissionsJson }
  if (conn.domainMappingJson)   { conn.domainMapping = JSON.parse(conn.domainMappingJson); delete conn.domainMappingJson }
  if (conn.productSettingsJson) { conn.productSettings = JSON.parse(conn.productSettingsJson); delete conn.productSettingsJson }
  return conn
}

/** Serialize a frontend connection object into Drizzle insert values */
function serializeConn(conn: any): any {
  const security = SecurityService.getInstance()
  return {
    id: conn.id,
    name: conn.name,
    environment: conn.environment || null,
    type: conn.type || 'mysql',
    host: conn.host || null,
    port: conn.port || null,
    database: conn.database || null,
    username: conn.username || null,
    password: conn.password ? security.encrypt(conn.password) : null,
    sshConfigJson: conn.ssh ? JSON.stringify(conn.ssh) : null,
    permissionsJson: conn.permissions ? JSON.stringify(conn.permissions) : null,
    templateId: conn.templateId || null,
    domainMappingJson: conn.domainMapping ? JSON.stringify(conn.domainMapping) : null,
    productSettingsJson: conn.productSettings ? JSON.stringify(conn.productSettings) : null,
    projectId: conn.projectId || null, // Map projectId to the project_id column
    updatedAt: new Date().toISOString(),
  }
}


/**
 * Handle Generic Storage Get
 */
export async function handleStorageGet(_event: any, key: string, opts?: any) {
  try {
    const db = getDb()

    // ── Connections ───────────────────────────────────────────────────────────
    if (key === 'connections' || key === 'connectionTemplates') {
      const table = key === 'connections' ? projectConnections : globalConnections
      
      let rows;
      if (key === 'connections' && opts?.projectId) {
        // Enforce project isolation at query level
        rows = db.select()
          .from(projectConnections)
          .where(eq(projectConnections.projectId, opts.projectId))
          .orderBy(projectConnections.name)
          .all()
      } else {
        rows = db.select().from(table).orderBy(table.name).all()
      }
      
      return { success: true, data: rows.map(deserializeConn) }
    }

    // ── Projects: gui_preferences blob → fallback: core SQLite ────────────────
    if (key === 'projects') {
      const row = db.select().from(guiPreferences).where(eq(guiPreferences.key, 'projects')).get()
      if (row?.value) {
        try {
          const parsed = JSON.parse(row.value)
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Merge projectBaseDir from core SQLite (authoritative source) into the blob
            try {
              const { BackgroundWorker } = require('../services/background-worker')
              const coreProjects: any[] = await BackgroundWorker.getInstance().getProjects()
              if (coreProjects && coreProjects.length > 0) {
                const coreMap = new Map(coreProjects.map((p: any) => [p.id, p]))
                for (const p of parsed) {
                  const core = coreMap.get(p.id)
                  if (core?.projectBaseDir) {
                    p.projectBaseDir = core.projectBaseDir
                  }
                }
              }
            } catch { /* non-fatal */ }
            return { success: true, data: parsed }
          }
        } catch { }
      }
      // Fallback: core table (first boot / vault reset)
      try {
        const { BackgroundWorker } = require('../services/background-worker')
        const projects = await BackgroundWorker.getInstance().getProjects()
        if (projects && projects.length > 0) {
          db.insert(guiPreferences)
            .values({ key: 'projects', value: JSON.stringify(projects) })
            .onConflictDoUpdate({ target: guiPreferences.key, set: { value: JSON.stringify(projects), updatedAt: new Date().toISOString() } })
            .run()
          return { success: true, data: projects }
        }
      } catch { }
      return { success: true, data: [] }
    }

    // ── Generic key-value preference ──────────────────────────────────────────
    const row = db.select().from(guiPreferences).where(eq(guiPreferences.key, key)).get()
    let result: any = row?.value ?? undefined
    try {
      if (result && (result.startsWith('{') || result.startsWith('['))) result = JSON.parse(result)
    } catch { }
    if (key === 'andb-ui-settings' && typeof result === 'object' && result !== null) {
      const security = SecurityService.getInstance()
      if (result.aiApiKey?.startsWith('ENC:')) result.aiApiKey = security.decrypt(result.aiApiKey)
    }
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}


/**
 * Handle Generic Storage Set
 */
export async function handleStorageSet(_event: any, key: string, value: any, opts?: any) {
  try {
    const db = getDb()

    // ── Connections ───────────────────────────────────────────────────────────
    if ((key === 'connections' || key === 'connectionTemplates') && Array.isArray(value)) {
      const table = key === 'connections' ? projectConnections : globalConnections
      const providedIds = value.map((c: any) => c.id).filter(Boolean)

      // 1. Delete rows no longer in the list for this specific project (or globally if no projectId is passed)
      let existing;
      if (key === 'connections' && opts?.projectId) {
        existing = db.select({ id: projectConnections.id }).from(projectConnections).where(eq(projectConnections.projectId, opts.projectId)).all()
      } else {
        existing = db.select({ id: table.id }).from(table).all()
      }

      for (const row of existing.filter((e: any) => !providedIds.includes(e.id))) {
        db.delete(table).where(eq(table.id, row.id)).run()
      }

      // 2. Upsert provided connections (attach projectId if scoped)
      for (const conn of value) {
        const row = serializeConn(conn)
        if (key === 'connections' && opts?.projectId) {
          row.projectId = opts.projectId
        }
        db.insert(table).values(row).onConflictDoUpdate({ target: table.id, set: row }).run()
      }
      return { success: true }
    }


    // ── Projects: gui_preferences + async-sync to core SQLite ─────────────────
    if (key === 'projects' && Array.isArray(value)) {
      // Strip redundant connectionIds to remove double source of truth in DB
      const strippedValue = value.map(p => {
        const { connectionIds, ...rest } = p
        return rest
      })
      const serialized = JSON.stringify(strippedValue)
      db.insert(guiPreferences)
        .values({ key: 'projects', value: serialized })
        .onConflictDoUpdate({ target: guiPreferences.key, set: { value: serialized, updatedAt: new Date().toISOString() } })
        .run()

      setImmediate(async () => {
        try {
          const { BackgroundWorker } = require('../services/background-worker')
          const worker = BackgroundWorker.getInstance()
          for (const project of value) {
            if (project.id) await worker.saveProject(project)
          }
          const existingProjects = (await worker.getProjects()) || []
          const incomingIds = new Set(value.map((p: any) => p.id).filter(Boolean))
          for (const p of existingProjects.filter((p: any) => p.id && !incomingIds.has(p.id))) {
            await worker.deleteProject(p.id)
          }
        } catch { }
      })
      return { success: true }
    }

    // ── Generic key-value preference ──────────────────────────────────────────
    let dataToSave = value
    if (key === 'andb-ui-settings' && typeof value === 'object' && value !== null) {
      dataToSave = { ...value }
      if (dataToSave.aiApiKey) dataToSave.aiApiKey = SecurityService.getInstance().encrypt(dataToSave.aiApiKey)
    }
    const serialized = typeof dataToSave === 'object' ? JSON.stringify(dataToSave) : String(dataToSave)
    db.insert(guiPreferences)
      .values({ key, value: serialized })
      .onConflictDoUpdate({ target: guiPreferences.key, set: { value: serialized, updatedAt: new Date().toISOString() } })
      .run()
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}


/**
 * Handle Generic Storage Delete
 */
export async function handleStorageDelete(_event: any, key: string) {
  try {
    getDb().delete(guiPreferences).where(eq(guiPreferences.key, key)).run()
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Generic Storage Has
 */
export async function handleStorageHas(_event: any, key: string) {
  try {
    const row = getDb().select({ key: guiPreferences.key }).from(guiPreferences).where(eq(guiPreferences.key, key)).get()
    return { success: true, data: !!row }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Generic Storage Clear
 * Clears ALL user data — used by "RESET ALL DATA" in Project Settings.
 */
export async function handleStorageClear() {
  try {
    const db = getDb()
    db.delete(guiPreferences).run()
    db.delete(globalConnections).run()
    db.delete(projectConnections).run()
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Security - Get Public Key
 */
export async function handleSecurityGetPublicKey() {
  try {
    return { success: true, data: SecurityService.getInstance().getPublicKey() }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

/**
 * Handle Security - Encrypt Token
 */
export async function handleSecurityEncryptToken(_event: any, token: string) {
  try {
    return { success: true, data: SecurityService.getInstance().secureEncrypt(token) }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

/**
 * Handle Security - Decrypt Token
 */
export async function handleSecurityDecryptToken(_event: any, encryptedToken: string) {
  try {
    return { success: true, data: SecurityService.getInstance().secureDecrypt(encryptedToken) }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

/**
 * Handle Security - Regenerate Keys
 */
export async function handleSecurityRegenerateKeys() {
  try {
    SecurityService.getInstance().generateKeys()
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

/**
 * Handle Backup Encryption
 */
export async function handleBackupEncrypt(_event: any, data: string, password: string) {
  try {
    const algorithm = 'aes-256-cbc'
    const key = crypto.scryptSync(password, 'salt-andb', 32)
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(algorithm, key, iv)
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return { success: true, data: iv.toString('hex') + ':' + encrypted }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Backup Decryption
 */
export async function handleBackupDecrypt(_event: any, encryptedData: string, password: string) {
  try {
    const algorithm = 'aes-256-cbc'
    const parts = encryptedData.split(':')
    if (parts.length < 2) throw new Error('Invalid backup format')
    const iv = Buffer.from(parts.shift() || '', 'hex')
    const encryptedText = parts.join(':')
    const key = crypto.scryptSync(password, 'salt-andb', 32)
    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return { success: true, data: decrypted }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Clear All Andb Storage (FS)
 */
export async function handleAndbClearStorage() {
  try {
    const userDataPath = app.getPath('userData')
    
    // 1. Clear Electron Store (Connection Templates)
    try {
      const Store = require('electron-store')
      const store = new Store()
      store.clear()
    } catch (e) {
      console.warn('Failed to clear electron-store', e)
    }

    // 2. Clear SQL Storage Folder (DDLs/Comparisons/Snapshots)
    const storageDir = path.join(userDataPath, 'storage')
    if (fs.existsSync(storageDir)) {
      try { fs.rmSync(storageDir, { recursive: true, force: true }) } catch (e) {}
    }

    // 3. Raw SQL Purge via Drizzle db (all tables)
    try {
      const db = getDb()
      const tables = [
        'projects', 'project_environments', 'project_settings',
        'comparisons', 'ddl_exports', 'ddl_snapshots', 'migration_history',
        'cli_settings', 'global_connections', 'project_connections',
        'gui_preferences', 'workspace_tabs'
      ]
      db.run('PRAGMA foreign_keys = OFF')
      for (const table of tables) {
        try { db.run(`DELETE FROM ${table}`) } catch { }
      }
      db.run('PRAGMA foreign_keys = ON')
    } catch (e) {
      console.warn('Failed raw SQL purge', e)
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Clear Project-Scoped Storage
 * Wipes only the active project's cached data, comparisons, snapshots, migration history,
 * instant comparisons, and physical database directories, while preserving connection
 * templates and credentials.
 */
export async function handleAndbClearProjectStorage(_event: any, { projectId }: { projectId: string }) {
  try {
    if (!projectId) {
      throw new Error('Project ID is required to clear project storage')
    }

    const db = getDb()

    // 1. Get all project connections to find environments and databases to clean
    const connectionsList = db.select()
      .from(projectConnections)
      .where(eq(projectConnections.projectId, projectId))
      .all()

    // 2. Clear instant comparisons (files and DB records)
    const { BackgroundWorker } = require('../services/background-worker')
    const worker = BackgroundWorker.getInstance()
    const baseDir = worker.getActiveProjectBaseDir() || app.getPath('userData')

    const instantComparesList = db.select()
      .from(instantCompares)
      .where(eq(instantCompares.projectId, projectId))
      .all()

    for (const record of instantComparesList) {
      if (record.sourcePath) {
        const sourceFileFullPath = path.isAbsolute(record.sourcePath) ? record.sourcePath : path.join(baseDir, record.sourcePath)
        try { if (fs.existsSync(sourceFileFullPath)) fs.unlinkSync(sourceFileFullPath) } catch (e) {}
      }
      if (record.targetPath) {
        const targetFileFullPath = path.isAbsolute(record.targetPath) ? record.targetPath : path.join(baseDir, record.targetPath)
        try { if (fs.existsSync(targetFileFullPath)) fs.unlinkSync(targetFileFullPath) } catch (e) {}
      }
    }

    db.delete(instantCompares)
      .where(eq(instantCompares.projectId, projectId))
      .run()

    // 3. Delete from core tables: ddl_exports, ddl_snapshots, comparisons, migration_history
    // based on the connections associated with this project
    db.run('PRAGMA foreign_keys = OFF')
    for (const conn of connectionsList) {
      const env = conn.environment || conn.name || conn.id || 'DEFAULT'
      const dbName = conn.database || conn.name || ''
      if (env && dbName) {
        const envUpper = env.toUpperCase()

        // Ddl Exports
        try {
          db.run(
            sql`DELETE FROM ddl_exports WHERE UPPER(environment) = ${envUpper} AND UPPER(database_name) = ${dbName}`
          )
        } catch (e) {
          console.warn('Failed to delete from ddl_exports', e)
        }

        // Ddl Snapshots
        try {
          db.run(
            sql`DELETE FROM ddl_snapshots WHERE UPPER(environment) = ${envUpper} AND UPPER(database_name) = ${dbName}`
          )
        } catch (e) {
          console.warn('Failed to delete from ddl_snapshots', e)
        }

        // Comparisons
        try {
          db.run(
            sql`DELETE FROM comparisons WHERE (UPPER(source_env) = ${envUpper} OR UPPER(target_env) = ${envUpper}) AND database_name = ${dbName}`
          )
        } catch (e) {
          console.warn('Failed to delete from comparisons', e)
        }

        // Migration History
        try {
          db.run(
            sql`DELETE FROM migration_history WHERE UPPER(environment) = ${envUpper} AND UPPER(database_name) = ${dbName}`
          )
        } catch (e) {
          console.warn('Failed to delete from migration_history', e)
        }
      }
    }
    db.run('PRAGMA foreign_keys = ON')

    // 4. Physical purge of the active project's database folder
    try {
      await worker.purgeActiveProject()
    } catch (e) {
      console.warn('Failed to physically purge active project database files', e)
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}


/**
 * Handle Update Feature Flag
 */
export async function handleUpdateFeatureFlag(_event: any, args: any) {
  try {
    const { key, enabled } = args || {}
    const { BackgroundWorker } = require('../services/background-worker')
    return await BackgroundWorker.getInstance().updateFeatureFlag(key, enabled)
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

/**
 * Handle SQLite User Settings Get
 */
export async function handleGetUserSettings() {
  try {
    const settings = await desktopStorageStrategy.getUserSettings()
    return { success: true, data: settings }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle SQLite User Settings Save
 */
export async function handleSaveUserSetting(_event: any, key: string, value: any) {
  try {
    await desktopStorageStrategy.saveUserSetting(key, value)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
