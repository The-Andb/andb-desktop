import { storage } from './storage-ipc'

/**
 * Backup and Restore Utility
 * 
 * Export/import application data
 */

export interface BackupData {
  version: string
  timestamp: string
  connections: any[]
  connectionPairs: any[]
  environments: any[]
  settings: any
}

// Defines what a user actually selected to export/import
export interface BackupSelectionConfig {
  connections: string[] // Array of IDs selected
  connectionPairs: string[]
  environments: string[]
  settings: boolean
}

export const backup = {
  /**
   * Create full backup (or filtered) of application data
   */
  async create(selection?: BackupSelectionConfig): Promise<BackupData> {
    const allConnections = await storage.getConnections() || []
    const allPairs = await storage.getConnectionPairs() || []
    const allEnvs = await storage.getEnvironments() || []
    const allSettings = await storage.getSettings() || {}

    return {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      connections: selection ? allConnections.filter(c => selection.connections.includes(c.id)) : allConnections,
      connectionPairs: selection ? allPairs.filter(p => selection.connectionPairs.includes(p.id)) : allPairs,
      environments: selection ? allEnvs.filter(e => selection.environments.includes(e.id)) : allEnvs,
      settings: (selection && !selection.settings) ? null : allSettings
    }
  },

  /**
   * Export backup as JSON string
   */
  async export(selection?: BackupSelectionConfig): Promise<string> {
    const data = await this.create(selection)
    return JSON.stringify(data, null, 2)
  },

  /**
   * Download backup file
   */
  async download(selection?: BackupSelectionConfig, filename = `andb-ui-backup-${Date.now()}.json`) {
    const json = await this.export(selection)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()

    URL.revokeObjectURL(url)
  },

  /**
   * Smart Merge Array Data
   * Updates an item if id exists, otherwise appends it
   */
  _mergeArrays(existing: any[], incoming: any[]): any[] {
    const ext = existing || []
    const inc = incoming || []
    const result = [...ext]
    
    for (const item of inc) {
      if (!item.id) continue
      const idx = result.findIndex(r => r.id === item.id)
      if (idx !== -1) {
        result[idx] = { ...result[idx], ...item } // Update
      } else {
        result.push(item) // Append
      }
    }
    return result
  },

  /**
   * Restore from backup data (Merging Mode)
   */
  async restore(data: BackupData, selection?: BackupSelectionConfig): Promise<boolean> {
    try {
      if (!data.version || !data.timestamp) {
        throw new Error('Invalid backup data format')
      }

      // Filter incoming data based on User's physical selection before merging
      const incomingConns = selection && data.connections ? data.connections.filter(c => selection.connections.includes(c.id)) : (data.connections || [])
      const incomingPairs = selection && data.connectionPairs ? data.connectionPairs.filter(p => selection.connectionPairs.includes(p.id)) : (data.connectionPairs || [])
      const incomingEnvs = selection && data.environments ? data.environments.filter(e => selection.environments.includes(e.id)) : (data.environments || [])
      
      const shouldImportSettings = !selection || selection.settings

      // 1. Merge Connections
      if (incomingConns.length > 0) {
        const existingConns = await storage.getConnections() || []
        const mergedConns = this._mergeArrays(existingConns, incomingConns)
        await storage.saveConnections(mergedConns)
      }

      // 2. Merge Pairs
      if (incomingPairs.length > 0) {
        const existingPairs = await storage.getConnectionPairs() || []
        const mergedPairs = this._mergeArrays(existingPairs, incomingPairs)
        await storage.saveConnectionPairs(mergedPairs)
      }

      // 3. Merge Environments
      if (incomingEnvs.length > 0) {
        const existingEnvs = await storage.getEnvironments() || []
        const mergedEnvs = this._mergeArrays(existingEnvs, incomingEnvs)
        await storage.saveEnvironments(mergedEnvs)
      }

      // 4. Merge Settings (Shallow Merge)
      if (shouldImportSettings && data.settings && Object.keys(data.settings).length > 0) {
        const existingSettings = await storage.getSettings() || {}
        await storage.saveSettings({ ...existingSettings, ...data.settings })
      }

      return true
    } catch (error) {
      console.error('Restore Error:', error)
      return false
    }
  },

  /**
   * Parses JSON file securely into BackupData but doesn't commit to DB
   * Used for Tree View Analysis before import
   */
  async dryRead(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const parsed = JSON.parse(content) as BackupData
          if (!parsed.version) throw new Error('Not a valid backup file')
          resolve(parsed)
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }
}

export default backup
