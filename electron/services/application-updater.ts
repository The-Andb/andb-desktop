import { app } from 'electron'
import { autoUpdater } from 'electron-updater'
import * as path from 'path'
import * as fs from 'fs'
import * as yaml from 'js-yaml'
import { SafeLogger } from '../utils/logger'

interface UpdaterConfig {
  lastRunVersion: string
  pendingChangelog?: any
  lastUpdated: string
}

export class ApplicationUpdater {
  private static instance: ApplicationUpdater
  private configPath: string
  private config: UpdaterConfig

  private constructor() {
    this.configPath = path.join(app.getPath('userData'), 'updater-config.yaml')
    this.config = this.loadConfig()
  }

  public static getInstance(): ApplicationUpdater {
    if (!this.instance) {
      this.instance = new ApplicationUpdater()
    }
    return this.instance
  }

  private loadConfig(): UpdaterConfig {
    if (fs.existsSync(this.configPath)) {
      try {
        return yaml.load(fs.readFileSync(this.configPath, 'utf8')) as UpdaterConfig
      } catch (e) {
        SafeLogger.error('Failed to load updater config', e)
      }
    }
    return {
      lastRunVersion: '0.0.0',
      lastUpdated: new Date().toISOString()
    }
  }

  private saveConfig() {
    try {
      this.config.lastUpdated = new Date().toISOString()
      fs.writeFileSync(this.configPath, yaml.dump(this.config), 'utf8')
    } catch (e) {
      SafeLogger.error('Failed to save updater config', e)
    }
  }

  public init() {
    try {
      autoUpdater.logger = {
        info: (msg) => SafeLogger.info(`[AutoUpdater] ${msg}`),
        warn: (msg) => SafeLogger.warn(`[AutoUpdater] ${msg}`),
        error: (msg) => SafeLogger.error(`[AutoUpdater] ${msg}`)
      }
      autoUpdater.autoDownload = false
      autoUpdater.autoInstallOnAppQuit = true
      return autoUpdater
    } catch (e) {
      SafeLogger.error('Auto updater initialization failed', e)
      return null
    }
  }

  /**
   * Check if app was upgraded since last run
   */
  public async checkVersionUpgrade() {
    const currentVersion = app.getVersion()
    const lastVersion = this.config.lastRunVersion

    if (currentVersion !== lastVersion) {
      SafeLogger.log(`🚀 Version Change Detected: ${lastVersion} -> ${currentVersion}`)
      
      // If we don't have human release notes, we can at least show the developer migration report 
      // or a generic "Welcome to version X"
      // In a real scenario, we might fetch actual release notes from GitHub/S3
      
      this.config.lastRunVersion = currentVersion
      this.saveConfig()
      return true
    }
    return false
  }

  public getPendingChangelog() {
    // If we have a specific changelog saved, return it.
    // Otherwise, check if we just upgraded and return a default "Update successful" message.
    return this.config.pendingChangelog || null
  }

  public dismissChangelog() {
    this.config.pendingChangelog = null
    this.saveConfig()
  }

  /**
   * Mock helper for testing updates in Dev mode
   */
  public async testUpdateFlow(sender: any, status: string) {
    const contents = sender
    if (status === 'available') {
      contents.send('update-status', { 
        status: 'available', 
        info: { 
          version: '9.9.9', 
          releaseNotes: '- Added auto-update test function\n- Improved changelog display\n- Fixed EPIPE crashes' 
        } 
      })
    } else if (status === 'downloading') {
      let progress = 0
      const interval = setInterval(() => {
        progress += 20
        contents.send('update-status', {
          status: 'downloading',
          progress: { percent: progress, bytesPerSecond: 1024 * 1024, transferred: progress * 1000, total: 10000 }
        })
        if (progress >= 100) {
          clearInterval(interval)
          contents.send('update-status', { status: 'downloaded', info: { version: '9.9.9' } })
        }
      }, 300)
    } else {
      contents.send('update-status', { status })
    }
  }
}

export default ApplicationUpdater
