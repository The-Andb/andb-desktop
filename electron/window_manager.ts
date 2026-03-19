import * as path from 'path'
import { app, BrowserWindow, Menu, shell } from 'electron'
import { isDev } from './bootstrap'

let mainWindow: BrowserWindow | null = null

export function getMainWindow() {
  return mainWindow
}

export function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'The Andb',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false
    },
    icon: path.join(__dirname, '../public/icon.png'),
    titleBarStyle: 'default',
    show: false
  })

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173/#/splash')
    mainWindow.webContents.openDevTools()
  } else {
    // electron-serve handling is usually done in main.ts to avoid circular deps
    // but we can pass the loader or handle it via protocol
    mainWindow.loadURL('app://-/index.html#splash')
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    if (process.platform === 'darwin') {
      try {
        app.dock.setIcon(path.join(__dirname, '../public/icon.png'))
      } catch (e) {}
    }
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Prevent new window creation (Security)
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' }
  })

  return mainWindow
}

export function setupAppMenu() {
  const isMac = process.platform === 'darwin'
  const template: any[] = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    { role: 'fileMenu' },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://the-andb.com')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
