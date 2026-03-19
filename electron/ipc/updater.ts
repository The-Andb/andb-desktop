import { autoUpdater } from 'electron-updater'
import { isDev } from '../bootstrap'

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
 * Handle Debugging Mock Update Events (Dev Only)
 */
export function handleDebugTestUpdate(_event: any, status: any) {
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
