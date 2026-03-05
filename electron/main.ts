import { join } from 'path'
import * as Sentry from '@sentry/electron/main'

Sentry.init({
  dsn: "https://d6ce3613be4249e82f6d9ed3f74dd98b@o4510990022344704.ingest.us.sentry.io/4510990029553664",
});


// Resilient Electron API Loader
const getElectron = () => {
  let e;
  try {
    e = require('electron');
  } catch (err) { }

  if (e && typeof e !== 'string') return e;

  // Shadowing bypass 1: Module._load
  try {
    const Module = require('module');
    const fe = (Module as any)._load('electron', null, true);
    if (fe && typeof fe !== 'string') return fe;
  } catch (err) { }

  // Shadowing bypass 2: Builtin Module
  if (typeof (process as any).getBuiltinModule === 'function') {
    try {
      const be = (process as any).getBuiltinModule('electron');
      if (be && typeof be !== 'string') return be;
    } catch (err) { }
  }

  // Shadowing bypass 3: Global Require
  const globalReq = (global as any).require || (process as any).mainModule?.require;
  if (typeof globalReq === 'function') {
    try {
      const ge = globalReq('electron');
      if (ge && typeof ge !== 'string') return ge;
    } catch (err) { }
  }

  return e;
}

const electron = getElectron();
// Resilient destructuring
const app = electron?.app || (global as any).app || (process as any).app || {
  name: '',
  getPath: () => '',
  setPath: () => { },
  getAppPath: () => '',
  whenReady: () => Promise.resolve(),
  on: () => { },
  quit: () => { }
};
const BrowserWindow = electron?.BrowserWindow || (global as any).BrowserWindow || class { };
const Menu = electron?.Menu || (global as any).Menu || { setApplicationMenu: () => { } };
const ipcMain = electron?.ipcMain || (global as any).ipcMain || { on: () => { }, handle: () => { } };
const shell = electron?.shell || (global as any).shell || { openExternal: () => { } };
const { AndbBuilder } = require('./services/andb-builder')
const isDev = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'

let loadURL: any;
if (!isDev) {
  try {
    const serve = require('electron-serve')
    loadURL = serve({ directory: 'dist' })
  } catch (e) {
    // Ignore error in dev if not used
  }
}

// Set separate app name and userData path to isolate data (DB, Logs)
if (isTest) {
  app.name = 'The Andb Test'
  const userDataPath = app.getPath('userData')
  if (!userDataPath.endsWith('_v3_test')) {
    app.setPath('userData', userDataPath + '_v3_test')
  }
} else if (isDev) {
  app.name = 'The Andb Dev'
  const userDataPath = app.getPath('userData')
  if (!userDataPath.endsWith('_v3_dev')) {
    app.setPath('userData', userDataPath + '_v3_dev')
  }
} else {
  app.name = 'The Andb'
  const userDataPath = app.getPath('userData')
  if (!userDataPath.endsWith('_v3')) {
    app.setPath('userData', userDataPath + '_v3')
  }
}

// Initialize Logger early
const Logger = require('andb-logger')
try {
  let loggerInstance;
  const logConfig = {
    mode: isTest ? 'TEST' : (isDev ? 'DEV' : 'PROD'),
    dirpath: app.getPath('userData'),
    logName: 'ANDB-UI'
  }

  if (typeof Logger.getInstance === 'function') {
    loggerInstance = Logger.getInstance(logConfig);
  } else if (typeof Logger === 'function') {
    loggerInstance = new Logger(logConfig);
  }

  if (loggerInstance) {
    (global as any).logger = loggerInstance;
    // Compatibility shim: andb-logger uses .dev() instead of .debug()
    if (typeof (global as any).logger.debug !== 'function') {
      (global as any).logger.debug = (...args: any[]) => {
        if (typeof (global as any).logger.dev === 'function') {
          (global as any).logger.dev(...args);
        } else {
          console.debug(...args);
        }
      };
    }
  }
} catch (e) {
  // Silent fail
}

// Enable hot reload for development
if (isDev) {
  try {
    const electronReload = require('electron-reload')
    const reloadFn = electronReload.default || electronReload
    reloadFn(__dirname, {
      electron: join(__dirname, '../node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
    })
  } catch (error) {
    // electron-reload not available
  }
}



import { autoUpdater } from 'electron-updater'

// Set log level for updater
autoUpdater.logger = require('andb-logger').getInstance({
  mode: isTest ? 'TEST' : (isDev ? 'DEV' : 'PROD'),
  dirpath: app.getPath('userData'),
  logName: 'UPDATER'
})

// Control auto-download manually
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

// HOSTED UPDATE API CONFIGURATION
// When you have the API ready, just uncomment/set this URL
// const UPDATE_SERVER_URL = 'https://your-update-server.com'
// if (UPDATE_SERVER_URL) {
//   autoUpdater.setFeedURL({
//     provider: 'generic',
//     url: UPDATE_SERVER_URL
//   })
// }

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'The Andb',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false
    },
    icon: join(__dirname, '../public/icon.png'),
    titleBarStyle: 'default',
    show: false
  })



  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173/#/splash')
    mainWindow.webContents.openDevTools()
  } else {
    loadURL(mainWindow).then(() => {
      mainWindow.loadURL('app://-/index.html#splash')
    })
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    // Force dock icon on macOS (especially for dev mode)
    if (process.platform === 'darwin') {
      try {
        app.dock.setIcon(join(__dirname, '../public/icon.png'))
      } catch (e) {
        // ignore icon error
      }
    }

    mainWindow.show()

    // Check for updates on startup (in production)
    if (!isDev) {
      autoUpdater.checkForUpdatesAndNotify()
    }
  })

  // Auto Updater Events
  autoUpdater.on('checking-for-update', () => {
    mainWindow.webContents.send('update-status', { status: 'checking' })
  })

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update-status', { status: 'available', info })
  })

  autoUpdater.on('update-not-available', (info) => {
    mainWindow.webContents.send('update-status', { status: 'not-available', info })
  })

  autoUpdater.on('error', (err) => {
    mainWindow.webContents.send('update-status', { status: 'error', error: err.message })
  })

  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = 'Download speed: ' + progressObj.bytesPerSecond
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%'
    log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')'
    mainWindow.webContents.send('update-status', { status: 'downloading', progress: progressObj })
  })

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send('update-status', { status: 'downloaded', info })
  })

  // Handle window closed
  mainWindow.on('closed', () => {
    // Dereference the window object
  })

  return mainWindow
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  // Initialize AndbBuilder early
  AndbBuilder.initialize(app.getPath('userData'), app.getAppPath())

  // Initialize Framework Core Engine
  const { CoreBridge } = require('@the-andb/core')
  try {
    await CoreBridge.init(app.getPath('userData'))
    if ((global as any).logger) (global as any).logger.info('Core Engine Initialized successfully')
  } catch (e) {
    if ((global as any).logger) (global as any).logger.error('Failed to initialize Core Engine', e)
  }

  const mainWindow = createWindow()

  // Auto-load mock compare data in development mode
  // if (isDev) {
  if (false) { // Disable mock data to test real data loading
    try {
      const Store = require('electron-store')
      const store = new Store()

      // Check if mock data already exists
      const hasCache = store.has('compare_DEV_STAGE_TABLES_latest')

      if (!hasCache) {
        // Load mock data (same as IPC handler)
        const mockTables = [
          {
            name: 'users',
            status: 'different',
            type: 'tables',
            ddl: [
              'ALTER TABLE `users` ADD COLUMN `email_verified` TINYINT(1) DEFAULT 0 AFTER `email`;',
              'ALTER TABLE `users` ADD INDEX `idx_email_verified` (`email_verified`);'
            ],
            diff: {
              source: `CREATE TABLE \`users\` (\n  \`id\` INT(11) NOT NULL AUTO_INCREMENT,\n  \`username\` VARCHAR(255) NOT NULL,\n  \`email\` VARCHAR(255) NOT NULL,\n  \`email_verified\` TINYINT(1) DEFAULT 0,\n  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  PRIMARY KEY (\`id\`),\n  UNIQUE KEY \`idx_username\` (\`username\`),\n  UNIQUE KEY \`idx_email\` (\`email\`),\n  KEY \`idx_email_verified\` (\`email_verified\`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
              target: `CREATE TABLE \`users\` (\n  \`id\` INT(11) NOT NULL AUTO_INCREMENT,\n  \`username\` VARCHAR(255) NOT NULL,\n  \`email\` VARCHAR(255) NOT NULL,\n  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  PRIMARY KEY (\`id\`),\n  UNIQUE KEY \`idx_username\` (\`username\`),\n  UNIQUE KEY \`idx_email\` (\`email\`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
            }
          },
          {
            name: 'products',
            status: 'missing_in_target',
            type: 'tables',
            ddl: [
              `CREATE TABLE \`products\` (\n  \`id\` INT(11) NOT NULL AUTO_INCREMENT,\n  \`name\` VARCHAR(255) NOT NULL,\n  \`price\` DECIMAL(10,2) NOT NULL,\n  \`stock\` INT(11) DEFAULT 0,\n  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  PRIMARY KEY (\`id\`),\n  KEY \`idx_name\` (\`name\`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
            ],
            diff: {
              source: `CREATE TABLE \`products\` (\n  \`id\` INT(11) NOT NULL AUTO_INCREMENT,\n  \`name\` VARCHAR(255) NOT NULL,\n  \`price\` DECIMAL(10,2) NOT NULL,\n  \`stock\` INT(11) DEFAULT 0,\n  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  PRIMARY KEY (\`id\`),\n  KEY \`idx_name\` (\`name\`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
              target: null
            }
          },
          {
            name: 'old_logs',
            status: 'missing_in_source',
            type: 'tables',
            ddl: ['DROP TABLE IF EXISTS `old_logs`;'],
            diff: {
              source: null,
              target: `CREATE TABLE \`old_logs\` (\n  \`id\` INT(11) NOT NULL AUTO_INCREMENT,\n  \`message\` TEXT,\n  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  PRIMARY KEY (\`id\`)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
            }
          }
        ]

        const mockProcedures = [
          {
            name: 'sp_get_user_stats',
            status: 'different',
            type: 'procedures',
            ddl: [
              `DROP PROCEDURE IF EXISTS \`sp_get_user_stats\`;`,
              `CREATE PROCEDURE \`sp_get_user_stats\`(IN user_id INT)\nBEGIN\n  SELECT \n    COUNT(*) as total_orders,\n    SUM(total) as total_spent\n  FROM orders\n  WHERE user_id = user_id AND status = 'completed';\nEND;`
            ],
            diff: {
              source: `CREATE PROCEDURE \`sp_get_user_stats\`(IN user_id INT)\nBEGIN\n  SELECT \n    COUNT(*) as total_orders,\n    SUM(total) as total_spent\n  FROM orders\n  WHERE user_id = user_id AND status = 'completed';\nEND;`,
              target: `CREATE PROCEDURE \`sp_get_user_stats\`(IN user_id INT)\nBEGIN\n  SELECT \n    COUNT(*) as total_orders\n  FROM orders\n  WHERE user_id = user_id;\nEND;`
            }
          }
        ]

        store.set('compare_DEV_STAGE_TABLES_latest', {
          timestamp: new Date().toISOString(),
          srcEnv: 'DEV',
          destEnv: 'STAGE',
          ddlType: 'TABLES',
          results: mockTables
        })

        store.set('compare_DEV_STAGE_PROCEDURES_latest', {
          timestamp: new Date().toISOString(),
          srcEnv: 'DEV',
          destEnv: 'STAGE',
          ddlType: 'PROCEDURES',
          results: mockProcedures
        })

        store.set('compare_DEV_STAGE_FUNCTIONS_latest', {
          timestamp: new Date().toISOString(),
          srcEnv: 'DEV',
          destEnv: 'STAGE',
          ddlType: 'FUNCTIONS',
          results: []
        })

      }
    } catch (error) {
      // Failed to auto-load mock data
    }
  }

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Security: Prevent new window creation
app.on('web-contents-created', (event: any, contents: any) => {
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' }
  })
})

/**
 * Open backup folder in system explorer
 */
ipcMain.handle('open-backup-folder', async () => {
  const fs = require('fs')
  const path = require('path')
  const backupPath = path.join(app.getPath('userData'), 'backups')

  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true })
  }

  shell.openPath(backupPath)
  return { success: true }
})

/**
 * Open file dialog
 */
ipcMain.handle('pick-file', async (_event: any, options: any) => {
  const { dialog } = require('electron')
  const result = await dialog.showOpenDialog(options)
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

/**
 * Check file permissions (especially for SSH keys)
 */
ipcMain.handle('check-file-permissions', async (_event: any, filePath: string) => {
  const fs = require('fs')
  try {
    const stats = fs.statSync(filePath)
    // On Unix, we want to check if it's too open (anything in group or others)
    // Stats.mode contains both file type and permissions.
    // We mask with 0o077 to check group/other bits.
    const isTooOpen = process.platform !== 'win32' && (stats.mode & 0o077) !== 0
    return {
      success: true,
      mode: stats.mode.toString(8),
      isTooOpen,
      platform: process.platform
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

/**
 * Copy file to internal uploads directory
 */
ipcMain.handle('save-dump-file', async (_event: any, sourcePath: string) => {
  const fs = require('fs')
  const path = require('path')
  const { app } = require('electron')

  try {
    const uploadDir = path.join(app.getPath('userData'), 'uploads', 'dumps')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const fileName = path.basename(sourcePath)
    // Add timestamp to avoid collisions
    const newFileName = `${Date.now()}_${fileName}`
    const targetPath = path.join(uploadDir, newFileName)

    fs.copyFileSync(sourcePath, targetPath)

    if ((global as any).logger) (global as any).logger.info(`File uploaded: ${sourcePath} -> ${targetPath}`)

    return targetPath // Return the internal path
  } catch (error) {
    if ((global as any).logger) (global as any).logger.error('Failed to save dump file:', error)
    throw error
  }
})

/**
 * Create a manual DDL snapshot
 */
ipcMain.handle('andb-create-snapshot', async (_event: any, args: any) => {
  const { connection, type, name } = args
  try {
    if ((global as any).logger) (global as any).logger.info(`IPC: andb-create-snapshot for ${type}:${name}`)
    const result = await AndbBuilder.createManualSnapshot(connection, type, name)
    return { success: true, data: result }
  } catch (error: any) {
    if ((global as any).logger) (global as any).logger.error('andb-create-snapshot error:', error)
    return { success: false, error: error.message }
  }
})

/**
 * Restore a snapshot
 */
ipcMain.handle('andb-restore-snapshot', async (_event: any, args: any) => {
  const { connection, snapshot } = args
  try {
    if ((global as any).logger) (global as any).logger.info(`IPC: andb-restore-snapshot for ${snapshot.ddl_type}:${snapshot.ddl_name}`)
    const result = await AndbBuilder.restoreSnapshot(connection, snapshot)
    return { success: true, data: result }
  } catch (error: any) {
    if ((global as any).logger) (global as any).logger.error('andb-restore-snapshot error:', error)
    return { success: false, error: error.message }
  }
})

/**
 * Restricted User Management
 */
ipcMain.handle('setup-restricted-user', async (_event: any, args: any) => {
  try {
    const result = await AndbBuilder.setupRestrictedUser(args)
    return { success: true, data: result }
  } catch (error: any) {
    if ((global as any).logger) (global as any).logger.error('setup-restricted-user error:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('probe-restricted-user', async (_event: any, args: any) => {
  try {
    const result = await AndbBuilder.probeRestrictedUser(args)
    return { success: true, data: result }
  } catch (error: any) {
    if ((global as any).logger) (global as any).logger.error('probe-restricted-user error:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('generate-user-setup-script', async (_event: any, args: any) => {
  try {
    if ((global as any).logger) (global as any).logger.info('IPC: generate-user-setup-script called')
    if ((global as any).logger) (global as any).logger.debug(`Args: ${JSON.stringify(args)}`)

    if (!(AndbBuilder as any).generateUserSetupScript) {
      if ((global as any).logger) (global as any).logger.error('Error: AndbBuilder.generateUserSetupScript is missing!')
      throw new Error('Internal Error: generateUserSetupScript method missing on AndbBuilder')
    }

    const result = await AndbBuilder.generateUserSetupScript(args)
    if ((global as any).logger) (global as any).logger.info(`Result type: ${typeof result}`)
    if ((global as any).logger) (global as any).logger.debug(`Result sample: ${String(result).substring(0, 50)}`)

    return { success: true, data: result }
  } catch (error: any) {
    let errorMessage = 'Script generation failed';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      errorMessage = JSON.stringify(error);
    }

    if ((global as any).logger) (global as any).logger.error(`Error caught in main.ts: ${errorMessage}`)
    if (error.stack && (global as any).logger) (global as any).logger.debug(`Stack: ${error.stack}`)
    if ((global as any).logger) (global as any).logger.error('generate-user-setup-script error:', error)
    return { success: false, error: errorMessage }
  }
})

// ========================================
// IPC Handlers for andb-core CLI
// ========================================

/**
 * Execute andb-core operation (direct import, no subprocess)
 */
ipcMain.handle('execute-andb-operation', async (
  _event: any,
  sourceConn: any,
  targetConn: any,
  operation: string,
  options: any
) => {
  try {
    const result = await AndbBuilder.execute(
      sourceConn,
      targetConn,
      operation as any,
      options
    )
    return { success: true, data: result }
  } catch (error: any) {
    if ((global as any).logger) (global as any).logger.error('execute-andb-operation error:', error)
    return { success: false, error: error.message }
  }
})

/**
 * Test database connection (direct MySQL test)
 */
ipcMain.handle('test-connection', async (_event: any, connection: any) => {
  try {
    if ((global as any).logger) (global as any).logger.info(`IPC: test-connection for ${connection.host}`)

    // Use AndbBuilder.execute to leverage Core Engine
    const result = await AndbBuilder.execute(connection, null, 'test-connection');
    return result;
  } catch (error: any) {
    if ((global as any).logger) (global as any).logger.error('test-connection error:', error)
    return {
      success: false,
      message: error.message || 'Connection failed'
    }
  }
})

// ========================================
// IPC Handlers for Database/Storage (Core SQLite)
// ========================================

/**
 * Get migration history
 */
ipcMain.handle('get-migration-history', async (_event: any, limit: number = 50) => {
  try {
    const storage = await (AndbBuilder as any).getSQLiteStorage()
    return { success: true, data: await storage.getMigrationHistory(limit) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

/**
 * Get snapshots for an object
 */
ipcMain.handle('get-snapshots', async (_event: any, environment: string, database: string, type: string, name: string) => {
  try {
    const data = await AndbBuilder.getSnapshots(environment, database, type, name)
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

/**
 * Get all snapshots globally
 */
ipcMain.handle('get-all-snapshots', async (_event: any, limit: number = 200) => {
  try {
    const data = await AndbBuilder.getAllSnapshots(limit)
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})


/**
 * Get comparison history
 */
ipcMain.handle('get-comparison-history', async (_event: any, limit: number = 50) => {
  try {
    const storage = await (AndbBuilder as any).getSQLiteStorage()
    return { success: true, data: await storage.getLatestComparisons(limit) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

/**
 * Get database stats
 */
ipcMain.handle('get-database-stats', async () => {
  try {
    return { success: true, data: await AndbBuilder.getDatabaseStats() }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// ========================================
// IPC Handlers for Reports
// ========================================

/**
 * Get list of available reports
 */
ipcMain.handle('andb-get-report-list', async () => {
  try {
    const data = await AndbBuilder.getReportList()
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

/**
 * Get report content
 */
ipcMain.handle('andb-get-report-content', async (_event: any, filename: any) => {
  try {
    const content = await AndbBuilder.getReportContent(filename)
    return { success: true, data: content }
  } catch (error: any) {
    if ((global as any).logger) (global as any).logger.error('Failed to get report content', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('andb-delete-all-reports', async () => {
  try {
    await AndbBuilder.deleteAllReports()
    return { success: true }
  } catch (error: any) {
    if ((global as any).logger) (global as any).logger.error('Failed to delete reports', error)
    return { success: false, error: error.message }
  }
})

// ========================================
// IPC Handlers for andb-core Operations
// ========================================

/**
 * Execute andb-core operation with selected pair
 * Replaces old subprocess approach with programmatic API
 */
ipcMain.handle('andb-execute', async (event: any, args: any) => {
  const { sourceConnection, targetConnection, operation, options } = args

  try {
    const result = await AndbBuilder.execute(
      sourceConnection,
      targetConnection,
      operation,
      options,
      event.sender
    )

    // AndbBuilder.execute() already returns { success, data } or { success: false, error }
    // so we return it directly to avoid double-wrapping
    return result
  } catch (error: any) {
    if ((global as any).logger) (global as any).logger.error('andb-execute error:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('andb-get-saved-comparison-results', async (_event: any, args: any) => {
  const { sourceConnection, targetConnection, type } = args
  try {
    return {
      success: true,
      data: await AndbBuilder.getSavedComparisonResults(sourceConnection, targetConnection, type)
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})


// ========================================
// IPC Handlers for Storage (electron-store)
// ========================================

// Initialize store (electron-store v8 is CJS compatible)
import Store from 'electron-store'
const store = new Store()

// Lazy load security service to ensure app path is ready
import { SecurityService } from './services/security'

/**
 * Generic Storage Get
 */
ipcMain.handle('storage-get', async (_event: any, key: string) => {
  try {
    let data = store.get(key)

    // Decrypt passwords if connections or templates
    if ((key === 'connections' || key === 'connectionTemplates') && Array.isArray(data)) {
      const security = SecurityService.getInstance()
      data = data.map((conn: any) => {
        if (conn.password) {
          conn.password = security.decrypt(conn.password)
        }
        return conn
      })
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

/**
 * Generic Storage Set
 */
ipcMain.handle('storage-set', async (_event: any, key: string, value: any) => {
  try {
    // Encrypt passwords if connections or templates
    if ((key === 'connections' || key === 'connectionTemplates') && Array.isArray(value)) {
      const security = SecurityService.getInstance()
      value = value.map((conn: any) => {
        // Clone to avoid mutating original object
        const c = { ...conn }
        if (c.password) {
          c.password = security.encrypt(c.password)
        }
        return c
      })
    }

    store.set(key, value)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

/**
 * Security IPC Handlers
 */
ipcMain.handle('security-get-public-key', async () => {
  try {
    return { success: true, data: SecurityService.getInstance().getPublicKey() }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('security-encrypt-token', async (_event: any, token: string) => {
  try {
    return { success: true, data: SecurityService.getInstance().secureEncrypt(token) }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('security-decrypt-token', async (_event: any, encryptedToken: string) => {
  try {
    return { success: true, data: SecurityService.getInstance().secureDecrypt(encryptedToken) }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('security-regenerate-keys', async () => {
  try {
    SecurityService.getInstance().generateKeys()
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('backup-encrypt', async (_event: any, data: string, password: string) => {
  try {
    const crypto = require('crypto');
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(password, 'salt-andb', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { success: true, data: iv.toString('hex') + ':' + encrypted };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('backup-decrypt', async (_event: any, encryptedData: string, password: string) => {
  try {
    const crypto = require('crypto');
    const algorithm = 'aes-256-cbc';
    const parts = encryptedData.split(':');
    if (parts.length < 2) throw new Error('Invalid backup format');
    const iv = Buffer.from(parts.shift() || '', 'hex');
    const encryptedText = parts.join(':');
    const key = crypto.scryptSync(password, 'salt-andb', 32);
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return { success: true, data: decrypted };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

/**
 * Generic Storage Delete
 */
ipcMain.handle('storage-delete', async (_event: any, key: string) => {
  try {
    store.delete(key)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

/**
 * Generic Storage Has
 */
ipcMain.handle('storage-has', async (_event: any, key: string) => {
  try {
    return { success: true, data: store.has(key) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

/**
 * Generic Storage Clear
 */
ipcMain.handle('storage-clear', async () => {
  try {
    store.clear()
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

/**
 * Get all schemas from SQLite storage (replaces filesystem scanning)
 */
ipcMain.handle('andb-get-schemas', async (_event: any) => {
  try {
    const storage = await (AndbBuilder as any).getSQLiteStorage()
    const environments = await storage.getEnvironments()
    const result: any[] = []

    for (const env of environments) {
      const databases = await storage.getDatabases(env)

      const envObj = {
        name: env,
        databases: [] as any[]
      }

      for (const db of databases) {
        const dbObj = {
          name: db,
          tables: [] as any[],
          views: [] as any[],
          procedures: [] as any[],
          functions: [] as any[],
          triggers: [] as any[],
          events: [] as any[],
          totalCount: 0
        }

        const ddlTypes = ['tables', 'views', 'procedures', 'functions', 'triggers', 'events']
        for (const type of ddlTypes) {
          const typeKey = type.toLowerCase()
          const objects = await storage.getDDLObjects(env, db, typeKey)

          // Silent per-type find - too noisy for users
          // if (objects.length > 0) {
          //   console.log(`[SQLITE-CACHE] Found ${objects.length} ${typeKey} for ${db} in ${env}`)
          // }

          for (const obj of objects) {
            // @ts-ignore
            if (!dbObj[typeKey]) dbObj[typeKey] = []
            // @ts-ignore
            dbObj[typeKey].push({
              name: obj.name,
              content: obj.content,
              updated_at: obj.updated_at,
              checksum: require('crypto').createHash('md5').update(obj.content || '').digest('hex')
            })
          }
        }

        dbObj.totalCount = dbObj.tables.length + dbObj.views.length + dbObj.procedures.length + dbObj.functions.length + dbObj.triggers.length + dbObj.events.length

        if (dbObj.totalCount > 0) {
          envObj.databases.push(dbObj)
        }
      }

      if (envObj.databases.length > 0) {
        result.push(envObj)
      }
    }

    const totalDBs = result.reduce((acc, env) => acc + env.databases.length, 0)
    console.log(`[SQLITE-CACHE] Loaded ${result.length} environments, ${totalDBs} databases total`)

    return { success: true, data: result }
  } catch (error: any) {
    if ((global as any).logger) (global as any).logger.error('andb-get-schemas error:', error)
    return { success: false, error: error.message }
  }
})

/**
 * Parse CREATE TABLE DDL into structured data
 */
ipcMain.handle('andb-parse-table', async (_event: any, ddl: string) => {
  try {
    const { CoreBridge } = require('@the-andb/core')
    // Ensure core engine is initialized
    const container = await CoreBridge.init()
    const parserInstance = container.parser
    if (!parserInstance) throw new Error('Parser service not initialized')

    const result = parserInstance.parseTableDetailed(ddl)
    return { success: !!result, data: result }
  } catch (error: any) {
    if ((global as any).logger) (global as any).logger.error('andb-parse-table error:', error)
    return { success: false, error: error.message }
  }
})

/**
 * Clear all data from SQLite storage
 */
ipcMain.handle('andb-clear-storage', async () => {
  try {
    const storage = await (AndbBuilder as any).getSQLiteStorage()
    // Returns { ddl, comparison, snapshot, migration, actions }
    const result = await storage.clearAll()
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

/**
 * Clear specific connection data
 */
ipcMain.handle('andb-clear-connection-data', async (_event: any, connection: any) => {
  try {
    const result = await AndbBuilder.clearConnectionData(connection)
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Load mock compare data for testing
ipcMain.handle('load-mock-compare-data', async () => {
  try {
    const Store = require('electron-store')
    const store = new Store()

    // Mock tables with DDL
    const mockTables = [
      {
        name: 'users',
        status: 'different',
        type: 'tables',
        ddl: [
          'ALTER TABLE `users` ADD COLUMN `email_verified` TINYINT(1) DEFAULT 0 AFTER `email`;',
          'ALTER TABLE `users` ADD INDEX `idx_email_verified` (`email_verified`);'
        ],
        diff: {
          source: `CREATE TABLE \`users\` (
  \`id\` INT(11) NOT NULL AUTO_INCREMENT,
  \`username\` VARCHAR(255) NOT NULL,
  \`email\` VARCHAR(255) NOT NULL,
  \`email_verified\` TINYINT(1) DEFAULT 0,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`idx_username\` (\`username\`),
  UNIQUE KEY \`idx_email\` (\`email\`),
  KEY \`idx_email_verified\` (\`email_verified\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
          target: `CREATE TABLE \`users\` (
  \`id\` INT(11) NOT NULL AUTO_INCREMENT,
  \`username\` VARCHAR(255) NOT NULL,
  \`email\` VARCHAR(255) NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`idx_username\` (\`username\`),
  UNIQUE KEY \`idx_email\` (\`email\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
        }
      },
      {
        name: 'products',
        status: 'missing_in_target',
        type: 'tables',
        ddl: [
          `CREATE TABLE \`products\` (
  \`id\` INT(11) NOT NULL AUTO_INCREMENT,
  \`name\` VARCHAR(255) NOT NULL,
  \`price\` DECIMAL(10,2) NOT NULL,
  \`stock\` INT(11) DEFAULT 0,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_name\` (\`name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
        ],
        diff: {
          source: `CREATE TABLE \`products\` (
  \`id\` INT(11) NOT NULL AUTO_INCREMENT,
  \`name\` VARCHAR(255) NOT NULL,
  \`price\` DECIMAL(10,2) NOT NULL,
  \`stock\` INT(11) DEFAULT 0,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_name\` (\`name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
          target: null
        }
      },
      {
        name: 'old_logs',
        status: 'missing_in_source',
        type: 'tables',
        ddl: [
          'DROP TABLE IF EXISTS `old_logs`;'
        ],
        diff: {
          source: null,
          target: `CREATE TABLE \`old_logs\` (
  \`id\` INT(11) NOT NULL AUTO_INCREMENT,
  \`message\` TEXT,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
        }
      }
    ]

    // Mock procedures
    const mockProcedures = [
      {
        name: 'sp_get_user_stats',
        status: 'different',
        type: 'procedures',
        ddl: [
          `DROP PROCEDURE IF EXISTS \`sp_get_user_stats\`;`,
          `CREATE PROCEDURE \`sp_get_user_stats\`(IN user_id INT)
BEGIN
  SELECT 
    COUNT(*) as total_orders,
    SUM(total) as total_spent
  FROM orders
  WHERE user_id = user_id AND status = 'completed';
END;`
        ],
        diff: {
          source: `CREATE PROCEDURE \`sp_get_user_stats\`(IN user_id INT)
BEGIN
  SELECT 
    COUNT(*) as total_orders,
    SUM(total) as total_spent
  FROM orders
  WHERE user_id = user_id AND status = 'completed';
END;`,
          target: `CREATE PROCEDURE \`sp_get_user_stats\`(IN user_id INT)
BEGIN
  SELECT 
    COUNT(*) as total_orders
  FROM orders
  WHERE user_id = user_id;
END;`
        }
      }
    ]

    // Store mock data
    store.set('compare_DEV_STAGE_TABLES_latest', {
      timestamp: new Date().toISOString(),
      srcEnv: 'DEV',
      destEnv: 'STAGE',
      ddlType: 'TABLES',
      results: mockTables
    })

    store.set('compare_DEV_STAGE_PROCEDURES_latest', {
      timestamp: new Date().toISOString(),
      srcEnv: 'DEV',
      destEnv: 'STAGE',
      ddlType: 'PROCEDURES',
      results: mockProcedures
    })

    store.set('compare_DEV_STAGE_FUNCTIONS_latest', {
      timestamp: new Date().toISOString(),
      srcEnv: 'DEV',
      destEnv: 'STAGE',
      ddlType: 'FUNCTIONS',
      results: []
    })

    return {
      success: true,
      message: `Loaded ${mockTables.length} tables, ${mockProcedures.length} procedures`
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// ========================================
// IPC Handlers for Logger (Cross-Process)
// ========================================

ipcMain.handle('app-log', (_event: any, { level, message, data }: any) => {
  const logger = (global as any).logger;
  if (!logger) {
    if (isDev) console.log(`[Renderer-${level}] ${message}`, data || '');
    return;
  }

  try {
    switch (level) {
      case 'error':
        logger.error(`[Renderer] ${message}`, data);
        break;
      case 'warn':
        logger.warn(`[Renderer] ${message}`, data);
        break;
      case 'info':
      default:
        logger.info(`[Renderer] ${message}`, data);
        break;
    }
  } catch (e) {
    if (isDev) console.error('Logger direct call failed:', e);
  }
})

ipcMain.handle('app-log-write', (_event: any, content: any) => {
  const logger = (global as any).logger;
  if (logger && typeof logger.write === 'function') {
    try {
      logger.write(content);
    } catch (e) {
      if (isDev) console.error('Logger.write failed:', e);
    }
  } else if (isDev) {
    console.log('[Renderer-Write]', content);
  }
})

// Close database on app quit
// NOTE: Database is now managed by andb-core
// app.on('before-quit', () => {
//   database.close()
// })

// ========================================
// IPC Handlers for Auto Updater
// ========================================

ipcMain.handle('check-for-updates', async () => {
  if (isDev) return { success: false, message: 'Cannot check for updates in DEV mode' }
  try {
    const result = await autoUpdater.checkForUpdates()
    return { success: true, result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('quit-and-install', () => {
  autoUpdater.quitAndInstall()
})

ipcMain.handle('download-update', async () => {
  try {
    const result = await autoUpdater.downloadUpdate()
    return { success: true, result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Mock Update Events for Debugging
ipcMain.handle('debug-test-update', (_event: any, status: any) => {
  if (!isDev) return
  const contents = _event.sender

  if (status === 'available') {
    contents.send('update-status', { status: 'available', info: { version: '9.9.9', releaseNotes: 'Test Update' } })
  } else if (status === 'downloading') {
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      contents.send('update-status', {
        status: 'downloading',
        progress: { percent: progress, bytesPerSecond: 1024 * 1024, transferred: progress * 1000, total: 10000 }
      })
      if (progress >= 100) {
        clearInterval(interval)
        contents.send('update-status', { status: 'downloaded', info: { version: '9.9.9' } })
      }
    }, 500)
  } else {
    contents.send('update-status', { status })
  }
})


// ========================================
// IPC Handlers for Integrations (CLI & MCP)
// ========================================

ipcMain.handle('cli-check-path', async () => {
  try {
    const { execSync } = require('child_process')
    // Check if `andb` is globally accessible
    execSync('which andb', { stdio: 'ignore' })
    return true
  } catch (e) {
    return false
  }
})

ipcMain.handle('cli-get-binary-path', () => {
  const path = require('path')
  // In development, it might just point to a valid script/bin.
  // In production, it points inside app.asar.unpacked
  if (isDev) {
    return path.join(app.getAppPath(), '../andb-cli/bin/andb.js')
  } else {
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', '.bin', 'andb')
  }
})

ipcMain.handle('mcp-get-path', () => {
  const path = require('path')
  if (isDev) {
    return path.join(app.getAppPath(), '../andb-mcp/dist/index.js')
  } else {
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', '@the-andb', 'mcp', 'dist', 'index.js')
  }
})

ipcMain.handle('get-features-status', async () => {
  try {
    const { CoreBridge } = require('@the-andb/core')
    return await CoreBridge.execute('getFeaturesStatus', {})
  } catch (e: any) {
    if ((global as any).logger) (global as any).logger.error('Failed to get feature status', e)
    return {} // All disabled by default
  }
})

ipcMain.handle('update-feature-flag', async (_event: any, args: any) => {
  try {
    const { key, enabled } = args
    const { CoreBridge } = require('@the-andb/core')
    return await CoreBridge.execute('updateFeatureFlag', { key, enabled })
  } catch (e: any) {
    if ((global as any).logger) (global as any).logger.error('Failed to update feature flag', e)
    return { success: false, error: e.message }
  }
})


// End of file
