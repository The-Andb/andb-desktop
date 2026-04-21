import { spawn, fork, ChildProcess } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import { EventEmitter } from 'events'
import { app } from 'electron'
import { SafeLogger } from '../utils/logger'

export class BackgroundWorker extends EventEmitter {
  private static instance: BackgroundWorker | null = null
  private process: ChildProcess | null = null
  private pendingRequests = new Map<number, { resolve: Function; reject: Function }>()
  private requestId = 1
  private cliPath: string = ''
  private userDataPath: string = ''
  private sqlitePath: string = ''

  private constructor() {
    super()
  }

  public static getInstance(): BackgroundWorker {
    if (!this.instance) {
      this.instance = new BackgroundWorker()
    }
    return this.instance
  }

  public async init(userDataPath: string, sqlitePath: string = '') {
    this.userDataPath = userDataPath
    this.sqlitePath = sqlitePath

    // Core worker is bundled into dist-electron inside the app (both dev & prod)
    this.cliPath = path.join(app.getAppPath(), 'dist-electron', 'core-worker.cjs')

    if (!fs.existsSync(this.cliPath)) {
       SafeLogger.error(`[BackgroundWorker] CRITICAL: core-worker.cjs not found at ${this.cliPath}`);
    }

    await this.startProcess()
  }

  private async startProcess() {
    if (this.process) return

    const args = ['--user-data-path', this.userDataPath]
    if (this.sqlitePath) {
      args.push('--sqlite-path', this.sqlitePath)
    }

    SafeLogger.log(`🚀 [BackgroundWorker] Spawning Internal Core Worker: ${process.execPath} ${this.cliPath} ${args.join(' ')}`)
    SafeLogger.log(`🚀 [BackgroundWorker] Using Electron environment (ABI compatibility)`)

    this.process = fork(this.cliPath, args, {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      env: {
        ...process.env,
        ANDB_QUIET: '1',
        ELECTRON_RUN_AS_NODE: '1'
      },
      execPath: process.execPath
    })

    this.process.on('message', (message: any) => {
      this.handleMessage(message)
    })

    this.process.stdout?.on('data', (data) => {
      const output = data.toString().trim()
      if (output) SafeLogger.log(`[CLI Stdout] ${output}`)
    })

    this.process.stderr?.on('data', (data) => {
      const output = data.toString().trim()
      if (output) SafeLogger.log(`[CLI Stderr] ${output}`)
    })

    this.process.on('close', (code) => {
      SafeLogger.log(`[BackgroundWorker] Process exited with code ${code}`)
      this.process = null

      // Reject all pending requests
      for (const [id, handler] of this.pendingRequests.entries()) {
        handler.reject(new Error(`Background process exited with code ${code}`))
        this.pendingRequests.delete(id)
      }
    })

    this.process.on('error', (err: any) => {
      SafeLogger.error(`[BackgroundWorker] Process error:`, err)
      // Reject all pending requests
      for (const [id, handler] of this.pendingRequests.entries()) {
        handler.reject(err)
        this.pendingRequests.delete(id)
      }
    })
  }

  private handleMessage(message: any) {
    if (typeof message === 'string') {
      const trimmed = message.trim()
      if (!trimmed || !trimmed.startsWith('{')) {
        SafeLogger.log(`[CLI Output] ${trimmed}`)
        return
      }
      try {
        message = JSON.parse(trimmed)
      } catch (e) {
        console.warn(`[BackgroundWorker] Potential JSON message failed to parse: ${trimmed}`)
        return
      }
    }

    try {

      // Handle notifications
      if (message.method && message.method.startsWith('event:')) {
        const eventName = message.method.split(':')[1]
        this.emit(eventName, message.params)
        return
      }

      // Handle responses
      if (message.id) {
        const handler = this.pendingRequests.get(message.id)
        if (handler) {
          if (message.error) {
            handler.reject(new Error(message.error.message))
          } else {
            handler.resolve(message.result)
          }
          this.pendingRequests.delete(message.id)
        }
      }
    } catch (e) {
      SafeLogger.warn(`[BackgroundWorker] Failed to process IPC message:`, e)
    }
  }

  public async call(method: string, params: any = {}): Promise<any> {
    if (!this.process) await this.startProcess()

    return new Promise((resolve, reject) => {
      const id = this.requestId++
      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params
      }

      this.pendingRequests.set(id, { resolve, reject })
      
      if (this.process?.send) {
        this.process.send(request)
      } else {
        this.process?.stdin?.write(JSON.stringify(request) + '\n')
      }
    })
  }

  /**
   * Compatibility layer for execute
   */
  public async execute(operation: string, payload: any): Promise<any> {
    return this.call('execute', { operation, payload })
  }

  public async parseTable(ddl: string): Promise<any> {
    return this.call('parseTable', { ddl })
  }

  public async parseTrigger(ddl: string): Promise<any> {
    return this.call('parseTrigger', { ddl })
  }

  public async normalize(ddl: string, options: any = {}): Promise<any> {
    return this.call('normalize', { ddl, options })
  }

  public async getStats(): Promise<any> {
    return this.call('getStats')
  }

  public async getComparisons(srcEnv: string, destEnv: string, database: string, type: string, databaseType: string = 'mysql'): Promise<any> {
    return this.call('getComparisons', { srcEnv, destEnv, database, type, databaseType })
  }

  public async getLatestComparisons(limit: number = 50): Promise<any> {
    return this.call('getLatestComparisons', { limit })
  }

  public async compareArbitrary(srcDDL: string, destDDL: string, type?: string): Promise<any> {
    return this.call('execute', { operation: 'compare-arbitrary', payload: { srcDDL, destDDL, type } })
  }

  public async compareCustom(src: any, dest: any): Promise<any> {
    return this.call('execute', { operation: 'compare-custom', payload: { src, dest } })
  }

  public async getDDL(env: string, database: string, type: string, name: string, databaseType: string = 'mysql'): Promise<any> {
    return this.call('getDDL', { env, database, type, name, databaseType })
  }

  public async getDDLObjects(env: string, database: string, type: string, databaseType: string = 'mysql'): Promise<any> {
    return this.call('getDDLObjects', { env, database, type, databaseType })
  }

  public async getEnvironments(): Promise<any> {
    return this.call('getEnvironments')
  }

  // --- SQLite Project Management APIs ---
  public async getProjects(): Promise<any> {
    return this.call('getProjects')
  }

  public async saveProject(project: any): Promise<any> {
    return this.call('saveProject', { project })
  }

  public async deleteProject(id: string): Promise<any> {
    return this.call('deleteProject', { id })
  }

  public async getProjectEnvironments(projectId: string): Promise<any> {
    return this.call('getProjectEnvironments', { projectId })
  }

  public async saveProjectEnvironment(env: any): Promise<any> {
    return this.call('saveProjectEnvironment', { env })
  }

  public async deleteProjectEnvironment(id: string): Promise<any> {
    return this.call('deleteProjectEnvironment', { id })
  }
  // --------------------------------------

  public async getDatabases(env: string, databaseType?: string): Promise<any> {
    return this.call('getDatabases', { env, databaseType })
  }

  public async getSnapshots(env: string, database: string, type: string, name: string, databaseType: string = 'mysql'): Promise<any> {
    return this.call('getSnapshots', { env, database, type, name, databaseType })
  }

  public async getAllSnapshots(limit: number = 200): Promise<any> {
    return this.call('getAllSnapshots', { limit })
  }

  public async getMigrationHistory(limit: number = 100): Promise<any> {
    return this.call('getMigrationHistory', { limit })
  }

  public async clearConnectionData(env: string, database: string, databaseType: string = 'mysql'): Promise<any> {
    return this.call('clearConnectionData', { env, database, databaseType })
  }

  public async addMigration(migration: any): Promise<any> {
    return this.call('addMigration', { migration })
  }

  public async updateMigrationStatus(id: number, status: string, error?: string): Promise<any> {
    return this.call('updateMigrationStatus', { id, status, error })
  }

  public async addComparison(comparison: any): Promise<any> {
    return this.call('addComparison', { comparison })
  }

  public async getComparisonHistory(limit: number = 50): Promise<any> {
    return this.call('getComparisonHistory', { limit })
  }

  public async addExportLog(log: any): Promise<any> {
    return this.call('addExportLog', { log })
  }

  public async getExportLogs(limit: number = 50): Promise<any> {
    return this.call('getExportLogs', { limit })
  }

  public async addAuditLog(log: any): Promise<any> {
    return this.call('addAuditLog', { log })
  }

  public async getAuditLogs(limit: number = 50): Promise<any> {
    return this.call('getAuditLogs', { limit })
  }

  public async cleanup(daysToKeep: number = 30): Promise<any> {
    return this.call('cleanup', { daysToKeep })
  }

  public async getFeaturesStatus(): Promise<any> {
    return this.call('getFeaturesStatus')
  }

  public async updateFeatureFlag(key: string, enabled: boolean): Promise<any> {
    return this.call('updateFeatureFlag', { key, enabled })
  }

  public stop() {
    if (this.process) {
      this.call('exit', {}).catch(() => { })
      this.process.kill()
      this.process = null
    }
  }
}

export default BackgroundWorker
