import path from 'path'

// Import dependencies safely
// @ts-ignore
const { CoreBridge } = require('@the-andb/core')
// @ts-ignore
const Logger = require('andb-logger')

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

  public static initialize(userDataPath: string, appPath: string) {
    this.userDataPath = userDataPath
    this.appPath = appPath
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
    const storage = await this.getSQLiteStorage()
    return await storage.getStats()
  }

  /**
   * Get Storage service from NestJS via Bridge
   */
  public static async getSQLiteStorage() {
    await CoreBridge.init(AndbBuilder.userDataPath);
    return await CoreBridge.getStorage();
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
      storagePath: require('path').join(AndbBuilder.userDataPath, 'andb-storage.db'),
      enableFileOutput: false,
      ...extraConfig
    }
  }

  /**
   * Ensure CoreBridge is ready
   */
  public static async getNestApp() {
    await CoreBridge.init(AndbBuilder.userDataPath);
    this.bridgeInitialized = true;
    return true;
  }

  /**
   * Build and execute andb-core operation
   */
  static async execute(
    sourceConn: DatabaseConnection,
    targetConn: DatabaseConnection | null,
    operation: 'export' | 'compare' | 'migrate' | 'generate' | 'getSchemaObjects' | 'test-connection',
    options: any = {}
  ): Promise<any> {
    const fs = require('fs')
    const originalCwd = process.cwd()
    const userDataDir = AndbBuilder.userDataPath

    try {
      if (targetConn && sourceConn?.environment?.toUpperCase() === targetConn?.environment?.toUpperCase()) {
        throw new Error(`Comparison within the same environment '${sourceConn.environment}' is not permitted.`)
      }

      if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true })
      process.chdir(userDataDir)

      await CoreBridge.init(AndbBuilder.userDataPath);

      const sEnv = sourceConn.environment.toUpperCase();
      const sType = (sourceConn as any).type === 'dump' || sourceConn.host === 'file' ? 'dump' : 'mysql';

      // Only pass sshConfig if it has a valid host
      const isValidSsh = (cfg: any) => cfg && typeof cfg === 'object' && !!cfg.host;
      const sourceSsh = sourceConn.sshConfig || (sourceConn as any).ssh;

      const payload: any = {
        ...options,
        connection: sourceConn,
        srcEnv: sEnv,
        destEnv: targetConn ? targetConn.environment.toUpperCase() : null,
        env: sEnv,
        sourceConfig: {
          host: sourceConn.host,
          port: sourceConn.port,
          database: sourceConn.database || sourceConn.name,
          user: sourceConn.username,
          password: sourceConn.password || '',
          type: sType,
          ...(isValidSsh(sourceSsh) ? { sshConfig: sourceSsh } : {})
        }
      };

      if ((global as any).logger) {
        const scope = options.name ? ` (Object: ${options.name})` : (options.type ? ` (Category: ${options.type})` : '');
        (global as any).logger.info(`[AndbBuilder] ${operation} → ${sEnv}/${payload.sourceConfig.database}${scope}`);
      }

      if (targetConn) {
        const targetSsh = targetConn.sshConfig || (targetConn as any).ssh;
        payload.targetConfig = {
          host: targetConn.host,
          port: targetConn.port,
          database: targetConn.database || targetConn.name,
          user: targetConn.username,
          password: targetConn.password || '',
          type: (targetConn as any).type === 'dump' || targetConn.host === 'file' ? 'dump' : 'mysql',
          ...(isValidSsh(targetSsh) ? { sshConfig: targetSsh } : {})
        };
      }

      let result = await CoreBridge.execute(operation, payload);

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
    const storage = await this.getSQLiteStorage()
    const srcEnv = sourceConn.environment
    const destEnv = targetConn.environment
    const dbName = sourceConn.database || sourceConn.name
    const destDbName = targetConn.database || targetConn.name

    const results = await storage.getComparisons(srcEnv, destEnv, dbName, ddlType);

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
        type: res.type.toUpperCase(),
        ddl: Array.isArray(alterStmts) ? alterStmts : (alterStmts ? [alterStmts] : []),
        diff: {
          source: await storage.getDDL(srcEnv, dbName, ddlType, res.name),
          target: await storage.getDDL(destEnv, destDbName, ddlType, res.name)
        }
      }
    }))
  }

  static async clearConnectionData(connection: DatabaseConnection) {
    const storage = await this.getSQLiteStorage()
    return await storage.clearDataForConnection(connection.environment, connection.database)
  }

  static async getSnapshots(environment: string, database: string, type: string, name: string) {
    const storage = await this.getSQLiteStorage()
    return await storage.getSnapshots(environment, database, type.toUpperCase(), name)
  }

  static async getMigrationHistory(limit: number = 100) {
    const storage = await this.getSQLiteStorage()
    return await storage.getMigrationHistory(limit)
  }

  static async getAllSnapshots(limit: number = 200) {
    const storage = await this.getSQLiteStorage()
    return await storage.getAllSnapshots(limit)
  }

  static async createManualSnapshot(connection: DatabaseConnection, type: string, name: string) {
    await CoreBridge.init(AndbBuilder.userDataPath);
    return { success: true, message: 'Snapshot feature simplified' };
  }

  static async restoreSnapshot(connection: DatabaseConnection, snapshot: any) {
    await CoreBridge.init(AndbBuilder.userDataPath);
    return await CoreBridge.execute('migrate', {
      destEnv: connection.environment.toUpperCase(),
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
    await CoreBridge.init(AndbBuilder.userDataPath)
    const { adminConnection, restrictedUser, permissions, script } = args

    // Ensure admin connection type is set
    if (!(adminConnection as any).type) (adminConnection as any).type = 'mysql'

    return await CoreBridge.execute('setup-restricted-user', {
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
    await CoreBridge.init(AndbBuilder.userDataPath)
    const { connection, permissions } = args
    if (!connection.type) connection.type = 'mysql'

    return await CoreBridge.execute('probe-restricted-user', {
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
    await CoreBridge.init(AndbBuilder.userDataPath)
    const { adminConnection, restrictedUser, permissions, isReconfigure } = args
    if (!(adminConnection as any).type) (adminConnection as any).type = 'mysql'

    return await CoreBridge.execute('generate-user-setup-script', {
      adminConnection,
      restrictedUser,
      permissions,
      isReconfigure
    })
  }

  static async test(): Promise<boolean> {
    try {
      await CoreBridge.init(AndbBuilder.userDataPath);
      return true
    } catch (error) {
      return false
    }
  }
}

export default AndbBuilder
