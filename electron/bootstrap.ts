import * as path from 'path'
import * as fs from 'fs'
import { app } from 'electron'
import { init as sentryInit } from '@sentry/electron/main'
import { CoreBridge } from '@the-andb/core'
import { AndbBuilder } from './services/andb-builder'
import * as yaml from 'js-yaml'
import { StorageMigrator } from './services/storage-migrator'
import { ApplicationUpdater } from './services/application-updater'
import { DesktopStorageStrategy } from './storage/strategy/desktop-storage.strategy'
import { SafeLogger } from './utils/logger'

// Singleton instance to be used by IPC handlers
export const desktopStorageStrategy = new DesktopStorageStrategy();

export const isDev = process.env.NODE_ENV === 'development'
export const isTest = process.env.NODE_ENV === 'test'

/**
 * Initialize Sentry
 */
export function initSentry() {
  sentryInit({
    dsn: "https://d6ce3613be4249e82f6d9ed3f74dd98b@o4510990022344704.ingest.us.sentry.io/4510990029553664",
  })
}

/**
 * Configure Application Paths (UserData isolation)
 */
export function configureAppPaths() {
  if (isTest) {
    if (process.env.ANDB_USER_DATA_PATH) {
      app.setPath('userData', process.env.ANDB_USER_DATA_PATH)
    } else {
      app.name = 'TheAndb Test'
      const userDataPath = app.getPath('userData')
      if (!userDataPath.endsWith('_v3_test')) {
        app.setPath('userData', userDataPath + '_v3_test')
      }
    }
  } else if (isDev) {
    app.name = 'TheAndb Dev'
    const userDataPath = app.getPath('userData')
    if (!userDataPath.endsWith('_v3_dev')) {
      app.setPath('userData', userDataPath + '_v3_dev')
    }
  } else {
    app.name = 'TheAndb'
    const userDataPath = app.getPath('userData')
    if (!userDataPath.endsWith('_v3')) {
      app.setPath('userData', userDataPath + '_v3')
    }
  }
}

/**
 * Initialize Logger
 */
export function initLogger() {
  const Logger = require('andb-logger')
  try {
    let loggerInstance
    const logConfig = {
      mode: isTest ? 'TEST' : (isDev ? 'DEV' : 'PROD'),
      dirpath: app.getPath('userData'),
      logName: 'ANDB-UI'
    }

    if (typeof Logger.getInstance === 'function') {
      loggerInstance = Logger.getInstance(logConfig)
    } else if (typeof Logger === 'function') {
      loggerInstance = new Logger(logConfig)
    }

    if (loggerInstance) {
      ; (global as any).logger = loggerInstance
      // Compatibility shim: andb-logger uses .dev() instead of .debug()
      if (typeof (global as any).logger.debug !== 'function') {
        ; (global as any).logger.debug = (...args: any[]) => {
          if (typeof (global as any).logger.dev === 'function') {
            ; (global as any).logger.dev(...args)
          } else {
            SafeLogger.debug(...args)
          }
        }
      }
    }
    return loggerInstance
  } catch (e) {
    SafeLogger.error('Failed to init logger', e)
    return null
  }
}

/**
 * Initialize Auto Updater
 */
export function initAutoUpdater() {
  return ApplicationUpdater.getInstance().init()
}

/**
 * Initialize Core Engine & Builder
 */
export async function initCoreServices() {
  const userDataPath = app.getPath('userData')
  const dbConfigPath = path.join(userDataPath, 'db-config.yaml')

  let customDbPath = undefined
  let projectBaseDir = undefined
  if (fs.existsSync(dbConfigPath)) {
    try {
      const dbConfig: any = yaml.load(fs.readFileSync(dbConfigPath, 'utf8'))
      if (dbConfig?.dbPath) {
        customDbPath = dbConfig.dbPath
      }
      if (dbConfig?.projectBaseDir) {
        projectBaseDir = dbConfig.projectBaseDir
      }
    } catch (e) {
      if ((global as any).logger) (global as any).logger.warn('Failed to read db-config.yaml', e)
    }
  }

  try {
    if ((global as any).logger) (global as any).logger.info(`Booting CoreEngine against SQLite: ${customDbPath}, BaseDir: ${projectBaseDir}`)
    await CoreBridge.init(userDataPath, customDbPath, desktopStorageStrategy, projectBaseDir)
    if ((global as any).logger) (global as any).logger.info(`Core Engine Initialized successfully. DB: ${CoreBridge.getDbPath()}`)

    // Sync RSA Keychain directory to DB path to ensure password decryptions survive cross-device syncing
    if (customDbPath && customDbPath !== 'default') {
      const { SecurityService } = require('./services/security')
      SecurityService.getInstance().reinitialize(customDbPath)
    }

    AndbBuilder.initialize(userDataPath, app.getAppPath(), CoreBridge.getDbPath())

    // Migration Changelog Capture
    await syncAppVersionAndChangelog(CoreBridge)

    // Run legacy settings migration to SQLite TypeORM
    await StorageMigrator.runMigration()

    // Seed Docker Connections in Dev Mode
    if (isDev) {
      await seedDockerConnections(CoreBridge)
    }
  } catch (e) {
    if ((global as any).logger) (global as any).logger.error('Failed to initialize Core Engine', e)
    throw e
  }
}

async function syncAppVersionAndChangelog(CoreBridge: any) {
  try {
    const updater = ApplicationUpdater.getInstance()
    const isUpgrade = await updater.checkVersionUpgrade()
    
    const storage = CoreBridge.getStorage()
    if (storage) {
      const settings = await storage.getUserSettings()
      const previousVersion = settings?.appVersion
      const currentVersion = app.getVersion()

      if (previousVersion !== currentVersion) {
        const migrationReport = CoreBridge.getLastMigrationReport()
        if (migrationReport) {
          migrationReport.fromVersion = previousVersion || 'unknown'
          migrationReport.toVersion = currentVersion
          await storage.saveUserSetting('last_migration_report', JSON.stringify(migrationReport))
          SafeLogger.log(`📋 [Migration] Changelog saved: ${migrationReport.changes.length} changes (${previousVersion} → ${currentVersion})`)
        }
      }
      await storage.saveUserSetting('appVersion', currentVersion)
    }
  } catch (ve) {
    SafeLogger.warn('Could not sync appVersion', ve)
  }
}

async function seedDockerConnections(CoreBridge: any) {
  try {
    const storage = CoreBridge.getStorage()
    if (!storage) return

    const projectId = 'docker-preview-project'
    await storage.saveProject({
      id: projectId,
      name: 'Docker Preview',
      description: 'Auto-generated connections for local Docker databases',
      is_favorite: 1,
      order_index: -100
    })

    const dockerEnvs = [
      { name: 'DEV', port: 3306, user: 'dev_user', pass: 'dev_pass', db: 'dev_database' },
      { name: 'STAGE', port: 3307, user: 'stage_user', pass: 'stage_pass', db: 'stage_database' },
      { name: 'UAT', port: 3308, user: 'uat_user', pass: 'uat_pass', db: 'uat_database' },
      { name: 'PROD', port: 3309, user: 'prod_user', pass: 'prod_pass', db: 'prod_database' },
    ]

    // Seed Global Templates (electron-store)
    try {
      const Store = require('electron-store')
      const store = new Store()
      const existingTemplates = store.get('connectionTemplates') || []
      let templatesUpdated = false

      for (const env of dockerEnvs) {
        const templateId = `template-docker-${env.name.toLowerCase()}`
        if (!existingTemplates.find((t: any) => t.id === templateId)) {
          existingTemplates.push({
            id: templateId,
            name: `Docker ${env.name} (Global)`,
            host: 'localhost',
            port: env.port,
            username: env.user,
            password: env.pass,
            type: 'mysql',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          templatesUpdated = true
        }
      }

      // 2. Seed SQLite Default Template
      const sqliteTemplateId = 'template-sqlite-default'
      if (!existingTemplates.find((t: any) => t.id === sqliteTemplateId)) {
        existingTemplates.push({
          id: sqliteTemplateId,
          name: 'Local SQLite (Dev)',
          host: path.join(app.getPath('userData'), 'andb-storage.db'),
          port: 0,
          username: '',
          password: '',
          type: 'sqlite',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        templatesUpdated = true
      }

      if (templatesUpdated) {
        store.set('connectionTemplates', existingTemplates)
        if ((global as any).logger) (global as any).logger.info('✅ [Dev] Global Docker templates seeded')
      }
    } catch (te) {
      if ((global as any).logger) (global as any).logger.warn('⚠️ [Dev] Failed to seed global templates', te)
    }

    // Seed Project Environments
    for (const env of dockerEnvs) {
      await storage.saveProjectEnvironment({
        id: `docker-${env.name.toLowerCase()}`,
        project_id: projectId,
        env_name: env.name,
        source_type: 'mysql',
        host: 'localhost',
        port: env.port,
        username: env.user,
        database_name: env.db,
        is_read_only: env.name === 'PROD' ? 1 : 0
      })
    }
    if ((global as any).logger) (global as any).logger.info('✅ [Dev] Docker connections seeded successfully')
  } catch (error) {
    if ((global as any).logger) (global as any).logger.warn('❌ [Dev] Failed to seed Docker connections', error)
  }
}
