import { autoUpdater } from 'electron-updater'
import { isDev } from '../bootstrap'
import ApplicationUpdater from '../services/application-updater'

/**
 * Handle Checking for Updates
 */
export async function handleCheckForUpdates() {
  if (isDev) return { success: false, message: 'Cannot check for updates in DEV mode' }
  try {
    const result = await autoUpdater.checkForUpdates()
    return { success: true, result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Quitting and Installing
 */
export function handleQuitAndInstall() {
  autoUpdater.quitAndInstall()
}

/**
 * Handle Downloading Update
 */
export async function handleDownloadUpdate() {
  try {
    const result = await autoUpdater.downloadUpdate()
    return { success: true, result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Debugging Mock Update Events
 */
export async function handleDebugTestUpdate(_event: any, status: any) {
  // Allow in Prod for power user debugging if explicitly called
  const updater = ApplicationUpdater.getInstance()
  return await updater.testUpdateFlow(_event.sender, status)
}

/**
 * Handle Get App Changelog (post-update release notes)
 */
export async function handleGetAppChangelog() {
  const updater = ApplicationUpdater.getInstance()
  const changelog = await updater.getPendingChangelog()
  
  if (changelog) {
    return { success: true, data: changelog }
  }

  // Fallback: If no custom changelog, return generic version info if upgrade was detected
  return { success: false }
}

/**
 * Handle Dismiss App Changelog
 */
export async function handleDismissAppChangelog() {
  ApplicationUpdater.getInstance().dismissChangelog()
  return { success: true }
}

/**
 * Listen and forward auto-updater events to a window
 */
export function setupUpdaterEventListeners(mainWindow: any) {
  autoUpdater.on('checking-for-update', () => {
    mainWindow.webContents.send('update-status', { status: 'checking' })
  })

  autoUpdater.on('update-available', (info: any) => {
    mainWindow.webContents.send('update-status', { status: 'available', info })
  })

  autoUpdater.on('update-not-available', (info: any) => {
    mainWindow.webContents.send('update-status', { status: 'not-available', info })
  })

  autoUpdater.on('error', (err: any) => {
    mainWindow.webContents.send('update-status', { status: 'error', error: err.message })
  })

  autoUpdater.on('download-progress', (progressObj: any) => {
    mainWindow.webContents.send('update-status', { status: 'downloading', progress: progressObj })
  })

  autoUpdater.on('update-downloaded', (info: any) => {
    mainWindow.webContents.send('update-status', { status: 'downloaded', info })
  })
}
