import { dialog, WebContents } from 'electron'
import * as path from 'path'
import { SafeLogger } from '../utils/logger'

// Import dependencies safely
import BackgroundWorker from './background-worker'
// @ts-ignore
const Logger = require('andb-logger')

const INITIAL_CWD = process.cwd()

/**
 * AndbBuilder Service
 * 
 * Dynamically builds andb-core configuration from selected connection pairs
 * Replaces subprocess approach with programmatic API
 */

interface DatabaseConnection {
  id: string
  name: string
  host: string
  port: number
  database: string
  username: string
  password?: string
  environment: string
  domainMapping?: {
    from: string
    to: string
  }
  productSettings?: {
    domain?: string
    emailServer?: string
  }
  sshConfig?: any
  ssh?: any
}

interface ConnectionPair {
  id: string
  name: string
  sourceEnv: string
  targetEnv: string
}

interface AndbConfig {
  getDBDestination: (env: string, mail?: boolean) => any
  getSourceEnv: (envName: string) => string
  getDestEnv: (env: string) => string
  getDBName: (env: string, isDbMail?: boolean) => string
  replaceWithEnv: (ddl: string, destEnv: string) => string
  ENVIRONMENTS: Record<string, string>
  baseDir: string
  logName: string
  storage?: 'file' | 'sqlite' | 'hybrid'
  storagePath?: string
  enableFileOutput?: boolean  // Deprecated, use storage config instead
  dataStore?: any  // Deprecated, use storage config instead
  domainNormalization?: { pattern: string | RegExp, replacement: string }
  isNotMigrateCondition?: string | RegExp
}

export class AndbBuilder {
  private static bridgeInitialized = false
  public static userDataPath: string = ''
  public static appPath: string = ''
  public static sqlitePath: string = ''

  public static initialize(userDataPath: string, appPath: string, sqlitePath: string = '') {
    this.userDataPath = userDataPath
    this.appPath = appPath
    this.sqlitePath = sqlitePath
    
    // Initialize the background worker early with resolved paths
    BackgroundWorker.getInstance().init(userDataPath, sqlitePath).catch(e => {
       if ((global as any).logger) (global as any).logger.error('Failed to init BackgroundWorker:', e)
    })
  }

  public static async getReportList() {
    // We prefer JSON reports now
    const fs = require('fs')
    const path = require('path')
    const reportDir = path.join(AndbBuilder.userDataPath, 'reports')
    const jsonReportDir = path.join(reportDir, 'json')

    let reports: any[] = []

    // 1. Check for new JSON reports
    if (fs.existsSync(jsonReportDir)) {
      try {
        const files = fs.readdirSync(jsonReportDir)
        files.forEach((file: string) => {
          if (file.endsWith('.json')) {
            const stats = fs.statSync(path.join(jsonReportDir, file))
            reports.push({
              name: file, // Keep .json extension so getReportContent knows what to do
              path: path.join(jsonReportDir, file),
              size: stats.size,
              mtime: stats.mtime
            })
          }
        })
      } catch (e) {
        if ((global as any).logger) (global as any).logger.error('Error reading json reports directory', e)
      }
    }

    // Sort by modification time (newest first)
    return reports.sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
  }

  public static async getReportContent(filename: string) {
    const fs = require('fs')
    const path = require('path')
    const reportDir = path.join(AndbBuilder.userDataPath, 'reports')

    let filePath = path.join(reportDir, filename)

    if (filename.endsWith('.html')) {
      const basename = path.basename(filename, '.html');
      filePath = path.join(reportDir, 'json', `${basename}.json`)
    } else {
      if (fs.existsSync(path.join(reportDir, 'json', filename))) {
        filePath = path.join(reportDir, 'json', filename);
      }
    }

    // Security check
    if (!filePath.startsWith(reportDir)) {
      return null;
    }

    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        if (filePath.endsWith('.json')) {
          return JSON.parse(content)
        }
        return content
      } catch (e) {
        if ((global as any).logger) (global as any).logger.error(`Failed to read report file ${filePath}`, e)
        return null
      }
    }

    return null
  }

  public static async deleteAllReports() {
    const fs = require('fs')
    const path = require('path')
    const reportDir = path.join(AndbBuilder.userDataPath, 'reports')

    if (!fs.existsSync(reportDir)) return

    const files = fs.readdirSync(reportDir)
    for (const file of files) {
      if (file.endsWith('.html')) {
        fs.unlinkSync(path.join(reportDir, file))
      }
    }
  }

  public static async getDatabaseStats() {
    return await BackgroundWorker.getInstance().getStats()
  }

  public static async getSQLiteStorage() {
    return BackgroundWorker.getInstance()
  }

  /**
   * Get BackgroundWorker instance (replaces direct storage access)
   */
  public static async getBackgroundWorker() {
    const worker = BackgroundWorker.getInstance()
    // BackgroundWorker handles its own start/init via its init method called from main.ts
    return worker
  }

  /**
   * Build andb-core config from connection pair
   */
  static buildConfig(
    sourceConn: DatabaseConnection,
    targetConn: DatabaseConnection | null,
    extraConfig: any = {}
  ): AndbConfig {
    const sEnv = sourceConn.environment.toUpperCase()
    const ENVIRONMENTS: Record<string, string> = {
      [sEnv]: sEnv
    }

    if (targetConn) {
      const tEnv = targetConn.environment.toUpperCase()
      ENVIRONMENTS[tEnv] = tEnv
    }

    return {
      getDBDestination: (env: string, mail = false) => {
        if (!env) return undefined

        const srcEnv = sourceConn?.environment?.toUpperCase()
        const trgEnv = targetConn?.environment?.toUpperCase()
        const currentEnv = env.toUpperCase()

        const conn = (srcEnv && currentEnv === srcEnv)
          ? sourceConn
          : (trgEnv && currentEnv === trgEnv ? targetConn : null)

        if (!conn) return undefined

        let host = conn.host
        const fs = require('fs')
        const isDump = (conn as any).type === 'dump' || (host && host.toLowerCase().endsWith('.sql')) || (host && host.includes('.sql'))

        if (isDump && (host.startsWith('./') || !path.isAbsolute(host))) {
          const appPath = AndbBuilder.appPath
          const directPath = path.resolve(appPath, host)
          const publicPath = path.resolve(appPath, 'public', host)

          if (fs.existsSync(directPath)) {
            host = directPath
          } else if (fs.existsSync(publicPath)) {
            host = publicPath
          } else {
            host = directPath
          }
        }

        return {
          envName: conn.environment,
          host: host,
          port: conn.port || 3306,
          database: mail ? undefined : (conn.database || conn.name),
          user: conn.username,
          type: isDump ? 'dump' : ((conn as any).type || 'mysql'),
          dumpPath: host,
          ...(conn.password ? { password: conn.password } : {})
        }
      },

      getSourceEnv: (_envName: string) => {
        return sourceConn?.environment || ''
      },

      getDestEnv: (_env: string) => {
        return targetConn?.environment || ''
      },

      getDBName: (env: string, _isDbMail = false) => {
        if (!env) return ''
        const srcEnv = sourceConn?.environment?.toUpperCase()
        const trgEnv = targetConn?.environment?.toUpperCase()
        const currentEnv = env.toUpperCase()
        const conn = (srcEnv && currentEnv === srcEnv)
          ? sourceConn
          : (trgEnv && currentEnv === trgEnv ? targetConn : null)
        return conn?.database || conn?.name || ''
      },

      replaceWithEnv: (ddl: string, destEnv: string) => {
        let result = ddl
        if (sourceConn.domainMapping?.from && sourceConn.domainMapping?.to) {
          result = result.replace(new RegExp(sourceConn.domainMapping.from, 'g'), sourceConn.domainMapping.to)
        }
        if (targetConn?.domainMapping?.from && targetConn?.domainMapping?.to) {
          result = result.replace(new RegExp(targetConn.domainMapping.from, 'g'), targetConn.domainMapping.to)
        }
        if (targetConn && targetConn.productSettings && sourceConn.productSettings) {
          if (sourceConn.productSettings.emailServer && targetConn.productSettings.emailServer) {
            const escapedSource = sourceConn.productSettings.emailServer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            result = result.replace(new RegExp(escapedSource, 'g'), targetConn.productSettings.emailServer);
          }
          if (sourceConn.productSettings.domain && targetConn.productSettings.domain) {
            const escapedSource = sourceConn.productSettings.domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            result = result.replace(new RegExp(escapedSource, 'g'), targetConn.productSettings.domain);
          }
        }
        return result
      },

      ENVIRONMENTS,
      baseDir: AndbBuilder.userDataPath,
      logName: 'andb',
      storage: 'sqlite',
      storagePath: require('@the-andb/core').CoreBridge.getDbPath(),
      enableFileOutput: false,
      ...extraConfig
    }
  }

  /**
   * Ensure BackgroundWorker is ready
   */
  public static async getNestApp() {
    // Initialized from main.ts
    this.bridgeInitialized = true;
    return true;
  }

  /**
   * Build and execute andb-core operation
   */
  static async execute(
    sourceConn: DatabaseConnection,
    targetConn: DatabaseConnection | null,
    operation: 'export' | 'compare' | 'migrate' | 'generate' | 'getSchemaObjects' | 'test-connection' | 'andb-create-snapshot' | 'create-snapshot' | 'getTableStats' | 'getServerInfo' | 'getFKGraph' | 'ai-configure' | 'ai-review' | 'ai-ask',
    options: any = {},
    sender?: WebContents
  ): Promise<any> {
    const fs = require('fs')
    const originalCwd = INITIAL_CWD
    const userDataDir = AndbBuilder.userDataPath
    SafeLogger.log(`[AndbBuilder] execute called for operation: ${operation}`);

    try {
      if (
        targetConn && 
        sourceConn?.environment && 
        targetConn?.environment && 
        sourceConn.environment.toUpperCase() === targetConn.environment.toUpperCase()
      ) {
        throw new Error(`Comparison within the same environment '${sourceConn.environment}' is not permitted.`)
      }

      if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true })
      process.chdir(userDataDir)

      // Progress listener is now handled globally in ipc/andb.ts to avoid leaks

      // Use conn name/id as fallback to avoid downstream 'UNKNOWN' registration failures
      const sEnv = sourceConn?.environment?.toUpperCase() || 
                   sourceConn?.name?.toUpperCase() || 
                   sourceConn?.id?.toUpperCase() || 'DEFAULT';
      const tEnv = targetConn?.environment?.toUpperCase() || null;

      // Build sourceConfig in the format ProjectConfigService.setConnection() expects
      // so OrchestrationService.syncConfigWithPayload() can pre-register the connection
      // before ExporterService looks it up by env name.
      const buildConfig = (conn: DatabaseConnection | null) => {
        if (!conn) return null;
        
        let resolvedHost = conn.host;
        let resolvedPath = (conn as any).path || ((conn as any).type === 'sqlite' ? conn.host : undefined);
        
        if ((conn as any).type === 'dump' || (conn as any).type === 'sqlite' || (conn as any).type === 'file') {
          if (resolvedHost && typeof resolvedHost === 'string' && !require('path').isAbsolute(resolvedHost)) {
            resolvedHost = require('path').resolve(originalCwd, resolvedHost);
          }
          if (resolvedPath && typeof resolvedPath === 'string' && !require('path').isAbsolute(resolvedPath)) {
            resolvedPath = require('path').resolve(originalCwd, resolvedPath);
          }
        }
        
        return {
          host: resolvedHost,
          port: conn.port,
          user: conn.username,
          password: conn.password || '',
          database: conn.database || conn.name,
          path: resolvedPath,
          type: (conn as any).type || 'mysql',
          sshConfig: (conn as any).ssh || (conn as any).sshConfig,
        };
      };

      const payload: any = {
        ...options,
        connection: sourceConn, // Raw connection for getSchemaObjects / test-connection
        srcEnv: sEnv,
        destEnv: tEnv,
        env: sEnv,
        db: sourceConn?.database || sourceConn?.name,
        sourceConnection: sourceConn,
        targetConnection: targetConn,
        // These are required by syncConfigWithPayload → setConnection, so ExporterService
        // and other orchestrators can call configService.getConnection(env).
        sourceConfig: buildConfig(sourceConn),
        ...(targetConn ? { targetConfig: buildConfig(targetConn) } : {}),
        projectBaseDir: options.options?.projectBaseDir
      };

      SafeLogger.log(`[AndbBuilder] Prepared payload for ${operation}:`, JSON.stringify({
        operation,
        env: payload.env,
        db: sourceConn?.database || sourceConn?.name,
        hasConn: !!payload.connection
      }));

      if ((global as any).logger) {
        const scope = options.name ? ` (Object: ${options.name})` : (options.type ? ` (Category: ${options.type})` : '');
        const dbName = sourceConn?.database || sourceConn?.name || 'unknown';
        (global as any).logger.info(`[AndbBuilder] ${operation} → ${sEnv}/${dbName}${scope}`);
      }

      let result = await BackgroundWorker.getInstance().execute(operation, payload);

      // Normalize result for consistent IPC response
      if (!result || typeof result !== 'object' || !('success' in result)) {
        result = { success: true, data: result };
      }

      return result;
    } catch (error: any) {
      if ((global as any).logger) (global as any).logger.error('[AndbBuilder] execute error:', error)
      return { success: false, error: error.message || 'Unknown error occurred' }
    } finally {
      try { process.chdir(originalCwd) } catch (e) { }
    }
  }

  private static safeJsonParse(data: any) {
    if (typeof data === 'object') return data;
    try { return JSON.parse(data); } catch (e) { return null; }
  }

  static async getSavedComparisonResults(
    sourceConn: DatabaseConnection,
    targetConn: DatabaseConnection,
    type: string
  ): Promise<any> {
    const ddlType = type.toLowerCase()
    const worker = BackgroundWorker.getInstance()
    const srcEnv = sourceConn.environment
    const destEnv = targetConn.environment
    const dbName = sourceConn.database || sourceConn.name
    const destDbName = targetConn.database || targetConn.name
    const databaseType = sourceConn.type || 'mysql'
 
    const results = await worker.getComparisons(srcEnv, destEnv, dbName, ddlType, databaseType);
 
    return await Promise.all(results.map(async (res: any) => {
      let alterStmts = res.alter_statements
      try {
        if (alterStmts && typeof alterStmts === 'string' && alterStmts.startsWith('[')) {
          alterStmts = this.safeJsonParse(alterStmts)
        }
      } catch (e) { }
 
      return {
        name: res.name,
        status: res.status,
        type: res.type?.toUpperCase() || '',
        ddl: Array.isArray(alterStmts) ? alterStmts : (alterStmts ? [alterStmts] : []),
        diff: {
          source: await worker.getDDL(srcEnv, dbName, ddlType, res.name, databaseType),
          target: await worker.getDDL(destEnv, destDbName, ddlType, res.name, targetConn.type || 'mysql')
        }
      }
    }))
  }

  static async clearConnectionData(connection: DatabaseConnection) {
    const worker = BackgroundWorker.getInstance()
    const databaseType = connection.type || 'mysql'
    return await worker.clearConnectionData(connection.environment, connection.database, databaseType)
  }
 
  static async getSnapshots(environment: string, database: string, type: string, name: string, databaseType: string = 'mysql') {
    const worker = BackgroundWorker.getInstance()
    return await worker.getSnapshots(environment, database, type?.toUpperCase() || '', name, databaseType)
  }
 
  static async getMigrationHistory(limit: number = 100) {
    const worker = BackgroundWorker.getInstance()
    return await worker.getMigrationHistory(limit)
  }
 
  static async getAllSnapshots(limit: number = 200) {
    const worker = BackgroundWorker.getInstance()
    return await worker.getAllSnapshots(limit)
  }

  static async addMigration(migration: any) {
    const worker = BackgroundWorker.getInstance()
    return await worker.addMigration(migration)
  }

  static async updateMigrationStatus(id: number, status: string, error?: string) {
    const worker = BackgroundWorker.getInstance()
    return await worker.updateMigrationStatus(id, status, error)
  }

  static async addComparison(comparison: any) {
    const worker = BackgroundWorker.getInstance()
    return await worker.addComparison(comparison)
  }

  static async getComparisonHistory(limit: number = 50) {
    const worker = BackgroundWorker.getInstance()
    return await worker.getComparisonHistory(limit)
  }

  static async addExportLog(log: any) {
    const worker = BackgroundWorker.getInstance()
    return await worker.addExportLog(log)
  }

  static async getExportLogs(limit: number = 50) {
    const worker = BackgroundWorker.getInstance()
    return await worker.getExportLogs(limit)
  }

  static async addAuditLog(log: any) {
    const worker = BackgroundWorker.getInstance()
    return await worker.addAuditLog(log)
  }

  static async getAuditLogs(limit: number = 50) {
    const worker = BackgroundWorker.getInstance()
    return await worker.getAuditLogs(limit)
  }

  static async databaseCleanup(daysToKeep: number = 30) {
    const worker = BackgroundWorker.getInstance()
    return await worker.cleanup(daysToKeep)
  }

  static async parseTable(ddl: string) {
    const worker = BackgroundWorker.getInstance()
    return await worker.execute('parseTable', { ddl })
  }

  static async createManualSnapshot(connection: DatabaseConnection, type: string, name: string) {
    return { success: true, message: 'Snapshot feature simplified' };
  }

  static async restoreSnapshot(connection: DatabaseConnection, snapshot: any) {
    return await BackgroundWorker.getInstance().execute('migrate', {
      destEnv: connection?.environment?.toUpperCase() || '',
      targetConfig: {
        host: connection.host,
        port: connection.port,
        database: connection.database || connection.name,
        user: connection.username,
        password: connection.password || '',
        type: (connection as any).type === 'dump' ? 'dump' : 'mysql'
      },
      objects: [{
        ddl: snapshot.ddl_content,
        type: snapshot.ddl_type,
        name: snapshot.ddl_name,
        status: 'RESTORE'
      }]
    });
  }

  /**
   * Setup Restricted User
   */
  static async setupRestrictedUser(args: {
    adminConnection: DatabaseConnection,
    restrictedUser: any,
    permissions: any,
    script: string
  }) {
    const { adminConnection, restrictedUser, permissions, script } = args

    // Ensure admin connection type is set
    if (!(adminConnection as any).type) (adminConnection as any).type = 'mysql'

    return await BackgroundWorker.getInstance().execute('setup-restricted-user', {
      adminConnection,
      restrictedUser,
      permissions,
      script
    })
  }

  static async probeRestrictedUser(args: {
    connection: any,
    permissions: any
  }) {
    const { connection, permissions } = args
    if (!connection.type) connection.type = 'mysql'

    return await BackgroundWorker.getInstance().execute('probe-restricted-user', {
      connection,
      permissions
    })
  }

  static async generateUserSetupScript(args: {
    adminConnection: DatabaseConnection,
    restrictedUser: any,
    permissions: any,
    isReconfigure?: boolean
  }) {
    const { adminConnection, restrictedUser, permissions, isReconfigure } = args
    if (!(adminConnection as any).type) (adminConnection as any).type = 'mysql'

    return await BackgroundWorker.getInstance().execute('generate-user-setup-script', {
      adminConnection,
      restrictedUser,
      permissions,
      isReconfigure
    })
  }

  static async compareArbitrary(srcDDL: string, destDDL: string, type?: string) {
    return await BackgroundWorker.getInstance().compareArbitrary(srcDDL, destDDL, type);
  }

  static async compareCustom(src: any, dest: any) {
    return await BackgroundWorker.getInstance().compareCustom(src, dest);
  }

  static async test(): Promise<boolean> {
    try {
      await BackgroundWorker.getInstance().getStats();
      return true
    } catch (error) {
      return false
    }
  }

  static async configureAI(apiKey: string, provider: string = 'gemini') {
    return await BackgroundWorker.getInstance().execute('ai-configure', { apiKey, provider });
  }

  static async reviewSchema(context: any) {
    return await BackgroundWorker.getInstance().execute('ai-review', { context });
  }

  static async askDBA(question: string, context?: any) {
    return await BackgroundWorker.getInstance().execute('ai-ask', { question, context });
  }
}

export default AndbBuilder
