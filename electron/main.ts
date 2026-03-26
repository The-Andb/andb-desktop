import * as path from 'path'
import { app, BrowserWindow } from 'electron'
import { 
  initSentry, 
  configureAppPaths, 
  initLogger, 
  initAutoUpdater, 
  initCoreServices, 
  isDev 
} from './bootstrap'
import { createWindow, setupAppMenu } from './window_manager'
import { registerIpcHandlers } from './ipc'

// 0. Global Error Handling (EPIPE mitigation)
const handleEPIPE = (err: any) => {
  if (err.code === 'EPIPE') return
  process.exit(1)
}
process.stdout.on('error', handleEPIPE)
process.stderr.on('error', handleEPIPE)

// 1. Pre-init Logic (Sentry, Paths, Logger)
initSentry()
configureAppPaths()
initLogger()

// 2. Production Static Server (electron-serve)
if (!isDev) {
  try {
    const serve = require('electron-serve')
    serve({ directory: 'dist' })
  } catch (e) {
    if ((global as any).logger) (global as any).logger.error('Failed to initialize electron-serve', e)
  }
}

// 3. Hot Reload (Development)
if (isDev) {
  try {
    const electronReload = require('electron-reload')
    const reloadFn = electronReload.default || electronReload
    reloadFn(__dirname, {
      electron: path.join(__dirname, '../node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
    })
  } catch (error) {}
}

/**
 * Main Application Orchestration
 */
app.whenReady().then(async () => {
  // 4. Initialize Core Engine, Database, and Dev Seeding
  try {
    await initCoreServices()
  } catch (e) {
    // Core failure is critical but window can still show error state
    if ((global as any).logger) (global as any).logger.error('Core Services failed to initialize', e)
  }

  // 5. Create Application Window
  const mainWindow = createWindow()

  // 6. Setup Application Menu
  setupAppMenu()

  // 7. Register Global IPC Handlers
  registerIpcHandlers()

  // 8. Auto Updater Startup (Production)
  if (!isDev) {
    const autoUpdater = initAutoUpdater()
    if (autoUpdater) {
      autoUpdater.checkForUpdatesAndNotify()
    }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

/**
 * App Termination
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Security: Deep Link and Window Creation Protection
app.on('web-contents-created', (_event, contents) => {
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' }
  })
})
