import { app } from 'electron'
import path from 'path'

// Import dependencies safely
// @ts-ignore
const { bootstrapCore } = require('@the-andb/core-nest')
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
  private static nestApp: any = null
  private static sqliteStorage: any = null

  public static async getReportList() {
    // We prefer JSON reports now
    const fs = require('fs')
    const path = require('path')
    const reportDir = path.join(app.getPath('userData'), 'reports')
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

    // 2. Check for legacy HTML reports (optional, if we want backward compat)
    /* 
    if (fs.existsSync(reportDir)) {
        // ... (existing logic)
    }
    */
    // For now, let's just use JSON if available, or maybe merge them?
    // User wants "switch approach", so let's focus on JSON.
    // If no JSON reports, maybe list HTML for migration? But let's stick to JSON.

    // Sort by modification time (newest first)
    return reports.sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
  }

  public static async getReportContent(filename: string) {
    const fs = require('fs')
    const path = require('path')
    // The previous implementation looked for HTML files in 'reports'
    // The new implementation looks for JSON files in 'reports/json'
    // filename coming in might be "dbname.env.json" or just a name.

    // Let's assume the UI sends the full filename derived from getReportList
    const reportDir = path.join(app.getPath('userData'), 'reports')

    // Try to find the file. If it ends with .html, try to find the corresponding .json
    // But since we are changing the paradigm, we should expect the UI to ask for JSON.
    // However, legacy reports are HTML.

    let filePath = path.join(reportDir, filename)

    // If the request is for an HTML file, try to find the JSON version in the 'json' subdirectory
    if (filename.endsWith('.html')) {
      // Typically "dbname.env.html" -> we want "reports/json/dbname.env.json"
      // But wait, the previous code saved HTML to 'reports/filename'.
      // ReportHelper saves JSON to 'reports/json/dbname.env.json'.

      // Let's try to infer the JSON path.
      const basename = path.basename(filename, '.html');
      // The new path should be reports/json/[basename].json
      filePath = path.join(reportDir, 'json', `${basename}.json`)
    } else {
      // If it's already asking for something else, or if the list returns json files.
      // Let's check if it is in json folder
      if (fs.existsSync(path.join(reportDir, 'json', filename))) {
        filePath = path.join(reportDir, 'json', filename);
      }
    }

    // Security check
    if (!filePath.startsWith(reportDir)) { // Basic check, realpath would be better but simple prefix check for now
      return null;
    }

    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        // Return parsed JSON if it is a json file, otherwise string
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
    const reportDir = path.join(app.getPath('userData'), 'reports')

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
   * Get Storage service from NestJS
   */
  public static async getSQLiteStorage() {
    const nestAppCtx = await this.getNestApp();
    return nestAppCtx.get('StorageService');
  }

  /**
   * Build andb-core config from connection pair
   */
  static buildConfig(
    sourceConn: DatabaseConnection,
    targetConn: DatabaseConnection | null,
    extraConfig: any = {}
  ): AndbConfig {
    // Build ENVIRONMENTS object dynamically with uppercase keys
    const sEnv = sourceConn.environment.toUpperCase()
    const ENVIRONMENTS: Record<string, string> = {
      [sEnv]: sEnv
    }

    if (targetConn) {
      const tEnv = targetConn.environment.toUpperCase()
      ENVIRONMENTS[tEnv] = tEnv
    }

    return {
      // DEBUG: Log core path
      ...(this.getCorePath(), {}),

      /**
       * Get database destination configuration
       */
      getDBDestination: (env: string, mail = false) => {
        if (!env) return undefined

        const srcEnv = sourceConn?.environment?.toUpperCase()
        const trgEnv = targetConn?.environment?.toUpperCase()
        const currentEnv = env.toUpperCase()

        const conn = (srcEnv && currentEnv === srcEnv)
          ? sourceConn
          : (trgEnv && currentEnv === trgEnv ? targetConn : null)

        if (!conn) return undefined

        // Resolve path if it's relative
        let host = conn.host
        const fs = require('fs')
        const isDump = (conn as any).type === 'dump' || (host && host.toLowerCase().endsWith('.sql')) || (host && host.includes('.sql'))

        if ((global as any).logger) {
          (global as any).logger.info(`[AndbBuilder] Resolving path: type=${(conn as any).type}, host=${host}, isDump=${isDump}`);
        }

        if (isDump && (host.startsWith('./') || !path.isAbsolute(host))) {
          const appPath = app.getAppPath()
          const directPath = path.resolve(appPath, host)
          const publicPath = path.resolve(appPath, 'public', host)

          if (fs.existsSync(directPath)) {
            host = directPath
          } else if (fs.existsSync(publicPath)) {
            host = publicPath
          } else {
            // Fallback to direct path
            host = directPath
          }
        }

        if ((global as any).logger && isDump) {
          (global as any).logger.info(`[AndbBuilder] Resolved Dump path: ${host} (Exists: ${fs.existsSync(host)})`);
        }

        return {
          envName: conn.environment,
          host: host,
          port: conn.port || 3306,
          database: mail ? undefined : (conn.database || conn.name), // Fallback to connection name for storage isolation
          user: conn.username,
          type: isDump ? 'dump' : ((conn as any).type || 'mysql'), // Ensure Core uses 'dump' driver for .sql files
          dumpPath: host,
          ...(conn.password ? { password: conn.password } : {})
        }
      },

      /**
       * Get source environment (always return source from pair)
       */
      getSourceEnv: (_envName: string) => {
        return sourceConn?.environment || ''
      },

      /**
       * Get destination environment (always return target from pair)
       */
      getDestEnv: (_env: string) => {
        return targetConn?.environment || ''
      },

      /**
       * Get database name for environment
       */
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

      /**
       * Replace domain in DDL based on destination environment
       * Example: @dev.example.com → @prod.example.com
       */
      replaceWithEnv: (ddl: string, destEnv: string) => {
        let result = ddl

        // Apply source domain mapping (if exists)
        if (sourceConn.domainMapping?.from && sourceConn.domainMapping?.to) {
          result = result.replace(
            new RegExp(sourceConn.domainMapping.from, 'g'),
            sourceConn.domainMapping.to
          )
        }

        // Apply target domain mapping (if exists)
        if (targetConn?.domainMapping?.from && targetConn?.domainMapping?.to) {
          result = result.replace(
            new RegExp(targetConn.domainMapping.from, 'g'),
            targetConn.domainMapping.to
          )
        }

        /**
         * Dynamic Product Settings Replacement
         * Replaces values based on Source vs Target configuration
         */
        if (targetConn && targetConn.productSettings && sourceConn.productSettings) {
          // 1. Email Server Domain Replacement
          // e.g. Replace @dev.abc.net with @prod.abc.net
          if (sourceConn.productSettings.emailServer && targetConn.productSettings.emailServer) {
            // Create regex escaping special chars
            const escapedSource = sourceConn.productSettings.emailServer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            result = result.replace(new RegExp(escapedSource, 'g'), targetConn.productSettings.emailServer);
          }

          // 2. Project Domain Replacement
          // e.g. Replace dev.abc.com with prod.abc.com
          if (sourceConn.productSettings.domain && targetConn.productSettings.domain) {
            const escapedSource = sourceConn.productSettings.domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            result = result.replace(new RegExp(escapedSource, 'g'), targetConn.productSettings.domain);
          }
        }
        return result
      },

      ENVIRONMENTS,
      baseDir: app.getPath('userData'),
      logName: 'andb',

      // Storage Configuration - Use SQLite for better performance
      storage: 'sqlite',
      storagePath: require('path').join(app.getPath('userData'), 'andb-storage.db'),
      enableFileOutput: false,  // Disable file output, use SQLite only
      ...extraConfig
    }
  }

  public static getCorePath() {
    try {
      require.resolve('@the-andb/core');
      require.resolve('@the-andb/core/package.json');
    } catch (e) {
      // Quietly fail
    }
  }

  /**
   * Get or bootstrap NestJS application context
   */
  public static async getNestApp() {
    if (!this.nestApp) {
      const { bootstrapCore } = require('@the-andb/core-nest');
      this.nestApp = await bootstrapCore();

      // Initialize Storage
      const storageService = this.nestApp.get('StorageService');
      const dbPath = path.join(app.getPath('userData'), 'andb-storage.db');
      storageService.initialize(dbPath);
    }
    return this.nestApp;
  }

  /**
   * Build and execute andb-core operation
   */
  static async execute(
    sourceConn: DatabaseConnection,
    targetConn: DatabaseConnection | null,
    operation: 'export' | 'compare' | 'migrate' | 'generate' | 'getSchemaObjects',
    options: any = {}
  ): Promise<any> {
    const fs = require('fs')
    const originalCwd = process.cwd()
    const userDataDir = app.getPath('userData')

    try {
      // Strict Rule: Disallow comparison within the same environment
      if (targetConn && sourceConn?.environment?.toUpperCase() === targetConn?.environment?.toUpperCase()) {
        throw new Error(`Comparison within the same environment '${sourceConn.environment}' is not permitted. Please select different environments to prevent conflicts.`)
      }

      // Force CWD to userData to ensure andb-core writes files there
      if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true })
      }
      process.chdir(userDataDir)

      // Build config from pair
      const config = this.buildConfig(sourceConn, targetConn, {
        domainNormalization: options.domainNormalization,
        isNotMigrateCondition: options.isNotMigrateCondition
      })

      if ((global as any).logger) {
        (global as any).logger.info(`[AndbBuilder] Executing ${operation}: ${sourceConn.name} (${sourceConn.environment}) -> ${targetConn?.name || 'None'} (${targetConn?.environment || 'None'})`);
        (global as any).logger.info(`[AndbBuilder] Source Type: ${(sourceConn as any).type}, Host: ${sourceConn.host}, DB: ${sourceConn.database}`);
      }

      // Initialize global logger
      try {
        let loggerInstance;
        if (typeof Logger.getInstance === 'function') {
          loggerInstance = Logger.getInstance({
            mode: 'PROD',
            dirpath: app.getPath('userData'),
            logName: 'ANDB-UI'
          });
        } else if (typeof Logger === 'function') {
          loggerInstance = new Logger({
            mode: 'PROD',
            dirpath: app.getPath('userData'),
            logName: 'ANDB-UI'
          });
        }

        if (loggerInstance) {
          (global as any).logger = loggerInstance;
        }
      } catch (e) {
        // Silently fail logger init
      }

      // Get Nest App
      const nestAppCtx = await this.getNestApp();
      const configService = nestAppCtx.get('ProjectConfigService');
      const exporterService = nestAppCtx.get('ExporterService');
      const comparatorService = nestAppCtx.get('ComparatorService');
      const migratorService = nestAppCtx.get('MigratorService');
      const driverFactory = nestAppCtx.get('DriverFactoryService');

      // Inject connections into config service
      const sEnv = sourceConn.environment.toUpperCase();
      configService.setConnection(sEnv, {
        host: sourceConn.host,
        port: sourceConn.port,
        database: sourceConn.database || sourceConn.name,
        user: sourceConn.username,
        password: sourceConn.password || '',
      }, (sourceConn as any).type === 'dump' ? 'dump' as any : 'mysql' as any);

      if (targetConn) {
        const tEnv = targetConn.environment.toUpperCase();
        configService.setConnection(tEnv, {
          host: targetConn.host,
          port: targetConn.port,
          database: targetConn.database || targetConn.name,
          user: targetConn.username,
          password: targetConn.password || '',
        }, (targetConn as any).type === 'dump' ? 'dump' as any : 'mysql' as any);
      }

      if (options.domainNormalization) {
        configService.setDomainNormalization(
          new RegExp(options.domainNormalization.pattern),
          options.domainNormalization.replacement
        );
      }

      const services = { exporterService, comparatorService, migratorService, driverFactory, configService };

      // Execute operation based on type
      switch (operation) {
        case 'export':
          return await this.executeExport(services, options, sEnv);

        case 'compare':
          if (!targetConn) throw new Error('Target connection is required for comparison');
          return await this.executeCompare(services, options, sEnv, targetConn.environment.toUpperCase());

        case 'migrate':
          if (!targetConn) throw new Error('Target connection is required for migration');
          return await this.executeMigrate(services, options, targetConn.environment.toUpperCase(), sEnv);

        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error: any) {
      if ((global as any).logger) (global as any).logger.error('[AndbBuilder] execute error:', error)
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      }
    } finally {
      // Restore original CWD
      try {
        process.chdir(originalCwd)
      } catch (e) {
        // Silently fail CWD restore
      }
    }
  }

  /**
   * Execute export operation
   */
  private static async executeExport(services: any, options: any, env: string) {
    const { name = null } = options;
    return await services.exporterService.exportSchema(env, name);
  }

  /**
   * Execute compare operation
   */
  private static async executeCompare(
    services: any,
    options: any,
    srcEnv: string,
    destEnv: string
  ) {
    const { type = 'tables' } = options;
    const ddlType = type.toLowerCase();

    const srcConn = services.configService.getConnection(srcEnv);
    const destConn = services.configService.getConnection(destEnv);

    const srcDriver = await services.driverFactory.create(srcConn.type, srcConn.config);
    const destDriver = await services.driverFactory.create(destConn.type, destConn.config);

    try {
      await srcDriver.connect();
      await destDriver.connect();

      const srcIntro = srcDriver.getIntrospectionService();
      const destIntro = destDriver.getIntrospectionService();
      const dbName = srcConn.config.database || 'default';
      const destDbName = destConn.config.database || 'default';

      const diff = await services.comparatorService.compareSchema(srcIntro, destIntro, dbName);

      // Map ISchemaDiff to UI format
      const results: any[] = [];

      if (ddlType === 'tables') {
        // 1. Changed Tables
        for (const name of Object.keys(diff.tables)) {
          results.push({
            name,
            status: 'different',
            type: 'TABLES',
            ddl: services.migratorService.generateAlterSQL(diff.tables[name]),
            diff: {
              source: await srcIntro.getTableDDL(dbName, name),
              target: await destIntro.getTableDDL(destDbName, name)
            }
          });
        }

        // 2. Dropped Tables (Missing in Source)
        for (const name of diff.droppedTables) {
          results.push({
            name,
            status: 'missing_in_source',
            type: 'TABLES',
            ddl: [`DROP TABLE IF EXISTS \`${name}\`;`],
            diff: {
              source: null,
              target: await destIntro.getTableDDL(destDbName, name)
            }
          });
        }

        // 3. New Tables (Missing in Target)
        const srcTables = await srcIntro.listTables(dbName);
        const destTables = await destIntro.listTables(destDbName);
        for (const name of srcTables) {
          if (!destTables.includes(name)) {
            const ddl = await srcIntro.getTableDDL(dbName, name);
            results.push({
              name,
              status: 'missing_in_target',
              type: 'TABLES',
              ddl: [ddl],
              diff: {
                source: ddl,
                target: null
              }
            });
          }
        }
      } else {
        // Generic Objects
        for (const obj of diff.objects) {
          const typeMatch = obj.type.toLowerCase() + 's' === ddlType || (ddlType === 'procedures' && obj.type === 'PROCEDURE');
          if (!typeMatch) continue;

          results.push({
            name: obj.name,
            status: obj.operation === 'DROP' ? 'missing_in_source' : (obj.operation === 'CREATE' ? 'missing_in_target' : 'different'),
            type: obj.type + 'S',
            ddl: services.migratorService.generateObjectSQL(obj),
            diff: {
              source: obj.operation === 'DROP' ? null : obj.definition,
              target: obj.operation === 'CREATE' ? null : (await this._getObjectDDL(destIntro, destDbName, obj.type, obj.name))
            }
          });
        }
      }

      return results;
    } finally {
      await srcDriver.disconnect();
      await destDriver.disconnect();
    }
  }

  private static async _getObjectDDL(intro: any, db: string, type: string, name: string): Promise<string | null> {
    try {
      switch (type) {
        case 'VIEW': return await intro.getViewDDL(db, name);
        case 'PROCEDURE': return await intro.getProcedureDDL(db, name);
        case 'FUNCTION': return await intro.getFunctionDDL(db, name);
        case 'TRIGGER': return await intro.getTriggerDDL(db, name);
        case 'EVENT': return await intro.getEventDDL(db, name);
        default: return null;
      }
    } catch (e) {
      return null;
    }
  }


  /**
   * Execute migrate operation
   */
  private static async executeMigrate(services: any, options: any, destEnv: string, srcEnv: string) {
    const {
      type = 'tables',
      name = null,
      dryRun = false,
      ddl = null
    } = options;

    const sqls = Array.isArray(ddl) ? ddl : (ddl ? [ddl] : []);

    if (dryRun) {
      return sqls.length > 0 ? sqls : ["-- No change detected or no DDL provided"];
    }

    // Real migration execution
    const destConn = services.configService.getConnection(destEnv);
    const destDriver = await services.driverFactory.create(destConn.type, destConn.config);

    try {
      await destDriver.connect();
      for (const sql of sqls) {
        if (sql && sql.trim()) {
          await destDriver.query(sql);
        }
      }

      // Log to history
      const storage = await this.getSQLiteStorage();
      await storage.saveMigration({
        srcEnv,
        destEnv,
        database: destConn.config.database,
        type,
        name: name || 'batch',
        operation: 'MIGRATE',
        status: 'SUCCESS'
      });

      return { success: true, message: `Successfully migrated ${name || type}` };
    } catch (error: any) {
      // Log failure
      const storage = await this.getSQLiteStorage();
      await storage.saveMigration({
        srcEnv,
        destEnv,
        database: destConn?.config?.database || 'unknown',
        type,
        name: name || 'batch',
        operation: 'MIGRATE',
        status: 'FAILED',
        error: error.message
      });
      throw error;
    } finally {
      await destDriver.disconnect();
    }
  }

  /**
   * Fetch saved comparison results from SQLite without re-running comparison
   */
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

    const mapped = await Promise.all(results.map(async (res: any) => {
      let alterStmts = res.alter_statements
      try {
        if (alterStmts && typeof alterStmts === 'string' && alterStmts.startsWith('[')) {
          alterStmts = JSON.parse(alterStmts)
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

    return mapped
  }


  /**
   * Clear cached data for a specific connection
   */
  static async clearConnectionData(connection: DatabaseConnection) {
    const storage = await this.getSQLiteStorage()
    const result = await storage.clearDataForConnection(connection.environment, connection.database)

    if ((global as any).logger) {
      (global as any).logger.info(`[AndbBuilder] Cleared connection data for ${connection.environment}:${connection.database}`);
      (global as any).logger.info(`[AndbBuilder]   - Deleted ${result.ddlCount} DDL records`);
      (global as any).logger.info(`[AndbBuilder]   - Deleted ${result.comparisonCount} Comparison records`);
    }

    return result
  }

  /**
   * Fetch snapshots for an object
   */
  static async getSnapshots(environment: string, database: string, type: string, name: string) {
    const storage = await this.getSQLiteStorage()
    return await storage.getSnapshots(environment, database, type.toUpperCase(), name)
  }

  /**
   * Fetch migration history
   */
  static async getMigrationHistory(limit: number = 100) {
    const storage = await this.getSQLiteStorage()
    return await storage.getMigrationHistory(limit)
  }

  /**
   * Fetch all snapshots globally
   */
  static async getAllSnapshots(limit: number = 200) {
    const storage = await this.getSQLiteStorage()
    return await storage.getAllSnapshots(limit)
  }

  /**
   * Create a manual snapshot of an object
   */
  static async createManualSnapshot(connection: DatabaseConnection, type: string, name: string) {
    if ((global as any).logger) (global as any).logger.info(`Starting manual snapshot for ${type}:${name}`)

    const nestAppCtx = await this.getNestApp();
    const storageService = nestAppCtx.get('StorageService');
    const driverFactory = nestAppCtx.get('DriverFactoryService');

    const env = connection.environment.toUpperCase();
    const config = {
      host: connection.host,
      port: connection.port,
      database: connection.database || connection.name,
      user: connection.username,
      password: connection.password || '',
    };
    const connType = (connection as any).type === 'dump' ? 'dump' : 'mysql';

    const driver = await driverFactory.create(connType as any, config);
    try {
      await driver.connect();
      const intro = driver.getIntrospectionService();
      const dbName = config.database || 'default';

      let ddl: string | null = null;
      const upperType = type.toUpperCase();

      if (upperType === 'TABLE' || upperType === 'TABLES') {
        ddl = await intro.getTableDDL(dbName, name);
      } else if (upperType === 'VIEW' || upperType === 'VIEWS') {
        ddl = await intro.getViewDDL(dbName, name);
      } else if (upperType === 'PROCEDURE' || upperType === 'PROCEDURES') {
        ddl = await intro.getProcedureDDL(dbName, name);
      } else if (upperType === 'FUNCTION' || upperType === 'FUNCTIONS') {
        ddl = await intro.getFunctionDDL(dbName, name);
      } else if (upperType === 'TRIGGER' || upperType === 'TRIGGERS') {
        ddl = await intro.getTriggerDDL(dbName, name);
      }

      if (!ddl) {
        throw new Error(`Could not fetch DDL for ${type} ${name}`);
      }

      await storageService.saveSnapshot(env, dbName, upperType, name, ddl, 'Manual Snapshot');
      return { success: true, ddl };
    } finally {
      await driver.disconnect();
    }
  }

  /**
   * Restore a historical snapshot to the database
   */
  static async restoreSnapshot(connection: DatabaseConnection, snapshot: any) {
    if ((global as any).logger) (global as any).logger.info(`Restoring snapshot for ${snapshot.ddl_name}`)

    const nestAppCtx = await this.getNestApp();
    const driverFactory = nestAppCtx.get('DriverFactoryService');

    const config = {
      host: connection.host,
      port: connection.port,
      database: connection.database || connection.name,
      user: connection.username,
      password: connection.password || '',
    };
    const connType = (connection as any).type === 'dump' ? 'dump' : 'mysql';

    const driver = await driverFactory.create(connType as any, config);
    try {
      await driver.connect();
      const ddl = snapshot.ddl_content;

      if (!ddl) throw new Error('Snapshot has no DDL content');

      // Execute restoration
      await driver.query(ddl);

      // Log action
      const storage = await this.getSQLiteStorage();
      await storage.saveMigration({
        srcEnv: 'SNAPSHOT',
        destEnv: connection.environment.toUpperCase(),
        database: config.database,
        type: snapshot.ddl_type,
        name: snapshot.ddl_name,
        operation: 'RESTORE',
        status: 'SUCCESS'
      });

      return { success: true };
    } finally {
      await driver.disconnect();
    }
  }

  /**
   * Test if andb-core is available and working
   */
  static async test(): Promise<boolean> {
    try {
      const { bootstrapCore } = require('@the-andb/core-nest')
      return !!bootstrapCore
    } catch (error) {
      return false
    }
  }
}

export default AndbBuilder
