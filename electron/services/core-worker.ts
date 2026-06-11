// This worker is spawned by andb-desktop to run @the-andb/core isolated from the UI thread.
// It bypasses andb-cli completely to embrace the "Bright Path" decoupled architecture.

import { CoreBridge } from '@the-andb/core';
import { DesktopStorageStrategy } from '../storage/strategy/desktop-storage.strategy';
import { SafeLogger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

let globalProjectBaseDir = process.cwd();
let globalUserDataPath = '';

// Protect against EPIPE crashes in worker
process.stdout.on('error', (err: any) => {
  if (err.code === 'EPIPE') return;
  process.exit(1);
});
process.stderr.on('error', (err: any) => {
  if (err.code === 'EPIPE') return;
  process.exit(1);
});

// Use SafeLogger for all worker logging
const logger = SafeLogger;

function sendResponse(id: any, result: any) {
  const response = {
    jsonrpc: '2.0',
    id,
    result
  };
  if (process.send) {
    process.send(response);
  }
}

function sendError(id: any, code: number, message: string) {
  const response = {
    jsonrpc: '2.0',
    id,
    error: { code, message }
  };
  if (process.send) {
    process.send(response);
  }
}

function sendEvent(method: string, params: any) {
  const notification = {
    jsonrpc: '2.0',
    method: `event:${method}`,
    params
  };
  if (process.send) {
    process.send(notification);
  }
}

/**
 * Critical Self-Healing Utility: Identifies legacy vault paths and automagically moves them
 * into the newly standardized project canonical tree, resolving duplication gracefully.
 */
function healDirectoryLayout(vaultRoot: string, targetDir: string): string {
  if (!vaultRoot || !targetDir || vaultRoot === targetDir) return targetDir;
  
  try {
    if (!fs.existsSync(targetDir)) return targetDir;

    const normRoot = path.normalize(vaultRoot).replace(/\\/g, '/').replace(/\/$/, '');
    const normTarget = path.normalize(targetDir).replace(/\\/g, '/').replace(/\/$/, '');
    const targetName = path.basename(normTarget);
    
    // Pattern matching the previous iteration ID-suffix format: project-slug-5fcc440f
    const legacyPattern = /^[a-z0-9_-]+-[a-f0-9]{8,36}$/i;
    
    if (legacyPattern.test(targetName)) {
        const lastHyphen = targetName.lastIndexOf('-');
        const slug = targetName.substring(0, lastHyphen);
        const canonicalName = slug.replace(/[^a-z0-9_-]/gi, '_').toLowerCase().replace(/-+/g, '_');
        
        const projectsDir = path.join(normRoot, 'projects');
        const canonicalDir = path.join(projectsDir, canonicalName);
        
        // Prevent self-referential infinite recursion if normalization fails
        if (normTarget === canonicalDir.replace(/\\/g, '/').replace(/\/$/, '')) return targetDir;

        if (!fs.existsSync(projectsDir)) {
            fs.mkdirSync(projectsDir, { recursive: true });
        }

        if (!fs.existsSync(canonicalDir)) {
            // ATOMIC UPGRADE: Move entire older folder to correct sub-structure
            fs.renameSync(normTarget, canonicalDir);
            logger.info(`[SelfHealer] Atomic upgraded legacy vault: ${normTarget} -> ${canonicalDir}`);

            // HOIST DUPLICATION FIX:
            // If older logic nested projects/{canonical} inside legacy folder, extract it!
            const nestedFolder = path.join(canonicalDir, 'projects', canonicalName);
            if (fs.existsSync(nestedFolder)) {
                logger.info(`[SelfHealer] Found nested duplication at ${nestedFolder}. Hoisting contents up...`);
                const items = fs.readdirSync(nestedFolder);
                for (const item of items) {
                    const src = path.join(nestedFolder, item);
                    const dest = path.join(canonicalDir, item);
                    if (!fs.existsSync(dest)) {
                        fs.renameSync(src, dest);
                    }
                }
                // Teardown the residual nested artifacts
                try {
                   fs.rmSync(path.join(canonicalDir, 'projects'), { recursive: true, force: true });
                } catch(e) {}
            }
            return canonicalDir;
        } else {
            // The new canonical folder already exists!
            // Silent switch: Immediately fulfill the redirection to the proper path.
            return canonicalDir;
        }
    }
  } catch (e: any) {
      logger.error(`[SelfHealer] Critical healing failure: ${e.message}`);
  }
  
  return targetDir;
}

async function handleRpcRequest(request: any) {
  const { id, method, params } = request;

  if (!method) {
    sendError(id, -32600, 'Invalid Request: missing method');
    return;
  }

  let result: any;
  try {
    // 1. Determine the incoming raw target path from RPC parameters or process default
    let rawTargetDir = params?.__projectBaseDir || params?.payload?.projectBaseDir || globalProjectBaseDir;
    
    // PATH RESCUE GUARD:
    // Intercept corrupt configurations that leaked internal Electron Application Support pathing
    // from legacy database records, forcing automatic restoration to the global Vault root.
    if (rawTargetDir && !fs.existsSync(rawTargetDir) && (
        (globalUserDataPath && rawTargetDir.startsWith(globalUserDataPath)) || 
        rawTargetDir.includes('Application Support') || 
        rawTargetDir.includes('AppData')
    )) {
        // Try to recover correct path from DB project record
        const activeProjectId = params?.__activeProjectId;
        let recoveredDir = '';
        if (activeProjectId) {
          try {
            const storage = CoreBridge.getStorage();
            if (storage) {
              const projects = await (storage as any).queryRaw(
                'SELECT project_base_dir FROM projects WHERE id = ? LIMIT 1', [activeProjectId]
              );
              if (projects && projects[0]?.project_base_dir) {
                recoveredDir = projects[0].project_base_dir;
              }
            }
          } catch { /* non-fatal */ }
        }
        rawTargetDir = recoveredDir || globalProjectBaseDir;
    }

    // 2. Run context self-healer to automatically reconcile legacy structure into /projects
    const effectiveDir = healDirectoryLayout(globalProjectBaseDir, rawTargetDir);

    // 3. Determine contextual scope state definitively
    const isProjectScoped = effectiveDir !== globalProjectBaseDir;

    const coreStorage = CoreBridge.getStorage();
    if (coreStorage) {
       if (coreStorage.getProjectBaseDir() !== effectiveDir) {
          coreStorage.setProjectBaseDir(effectiveDir, isProjectScoped);
       }
       
       // ISOLATION FIX: Force-sync project name to guarantee disk folder segregation (fixes cross-project mixing)
       if (params?.__activeProjectName) {
          coreStorage.setActiveProject(params.__activeProjectName);
       }
    }

    const coreConfig = CoreBridge.getConfig();
    if (coreConfig && params?.__activeProjectId) {
       if (coreConfig.getActiveProjectId() !== params.__activeProjectId) {
          // Pull fresh schema definitions from SQLite explicitly when context changes
          await coreConfig.reload(params.__activeProjectId).catch(() => {});
          coreConfig.setActiveProjectId(params.__activeProjectId);
       }
    }

    switch (method) {
      case 'execute':
        if (params && params.payload) {
          params.payload.onProgress = (data: any) => {
             sendEvent('progress', { ...data, operation: params.operation });
          };
        }
        result = await CoreBridge.execute(params.operation, params.payload);
        break;
      case 'getStats':
        result = await (CoreBridge.getStorage() as any).getStats();
        break;
      case 'getComparisons':
        result = await (CoreBridge.getStorage() as any).getComparisons(params.srcEnv, params.destEnv, params.database, params.type, params.databaseType);
        break;
      case 'getEnvironments':
        result = await CoreBridge.getApp()?.config.getEnvironments();
        break;
      case 'getProjects':
        {
          const rawProjects = await (CoreBridge.getStorage() as any).getProjects();
          const hydrated: any[] = [];
          for (const p of rawProjects) {
              const settings = (await (CoreBridge.getStorage() as any).getProjectSettings(p.id)) || {};
              hydrated.push({
                  id: p.id,
                  name: p.name,
                  description: p.description,
                  projectBaseDir: p.project_base_dir || null,
                  connectionIds: settings.connectionIds ? JSON.parse(settings.connectionIds) : [],
                  pairIds: settings.pairIds ? JSON.parse(settings.pairIds) : [],
                  enabledEnvironmentIds: settings.enabledEnvironmentIds ? JSON.parse(settings.enabledEnvironmentIds) : ['DEV', 'STAGE', 'PROD'],
                  isActive: settings.isActive === '1',
                  createdAt: p.created_at,
                  updatedAt: p.updated_at
              });
          }
          result = hydrated;
        }
        break;
      case 'saveProject':
        {
          const projectData = params.project;
          await (CoreBridge.getStorage() as any).saveProject({
              id: projectData.id,
              name: projectData.name,
              description: projectData.description || '',
              is_favorite: 0,
              order_index: 0,
              project_base_dir: projectData.projectBaseDir || null
          });
          
          if (projectData.connectionIds) {
              await (CoreBridge.getStorage() as any).saveProjectSetting(projectData.id, 'connectionIds', JSON.stringify(projectData.connectionIds));
          }
          if (projectData.pairIds) {
              await (CoreBridge.getStorage() as any).saveProjectSetting(projectData.id, 'pairIds', JSON.stringify(projectData.pairIds));
          }
          if (projectData.enabledEnvironmentIds) {
              await (CoreBridge.getStorage() as any).saveProjectSetting(projectData.id, 'enabledEnvironmentIds', JSON.stringify(projectData.enabledEnvironmentIds));
          }
          if (projectData.isActive !== undefined) {
              await (CoreBridge.getStorage() as any).saveProjectSetting(projectData.id, 'isActive', projectData.isActive ? '1' : '0');
          }
          
          result = { success: true };
        }
        break;
      case 'deleteProject':
        result = await (CoreBridge.getStorage() as any).deleteProject(params.id);
        break;
      case 'getProjectEnvironments':
        result = await (CoreBridge.getStorage() as any).getProjectEnvironments(params.projectId);
        break;
      case 'saveProjectEnvironment':
        result = await (CoreBridge.getStorage() as any).saveProjectEnvironment(params.env);
        break;
      case 'deleteProjectEnvironment':
        result = await (CoreBridge.getStorage() as any).deleteProjectEnvironment(params.id);
        break;
      case 'getDatabases':
        result = await (CoreBridge.getStorage() as any).getDatabases(params.env, params.databaseType);
        break;
      case 'getDDL':
        result = await (CoreBridge.getStorage() as any).getDDL(params.env, params.database, params.type, params.name, params.databaseType);
        break;
      case 'getDDLObjects':
        result = await (CoreBridge.getStorage() as any).getDDLObjects(params.env, params.database, params.type, params.databaseType);
        break;
      case 'getSnapshots':
        result = await (CoreBridge.getStorage() as any).getSnapshots(params.env, params.database, params.type, params.name, params.databaseType);
        break;
      case 'getAllSnapshots':
        result = await (CoreBridge.getStorage() as any).getAllSnapshots(params.limit);
        break;
      case 'getMigrationHistory':
        result = await (CoreBridge.getStorage() as any).getMigrationHistory(params.limit);
        break;
      case 'clearConnectionData':
        result = await (CoreBridge.getStorage() as any).clearConnectionData(params.env, params.database, params.databaseType);
        
        // Physical Purge Extension: If requested, wipe the physical disk directories to eliminate stale/mixed data
        if (params.purgeFiles === true) {
           try {
             const fs = require('fs');
             const path = require('path');
             const env = params.env;
             const dbType = params.databaseType || 'mysql';
             const dbName = params.database;
             
             if (env && dbName) {
                // This exactly mirrors the scoped layout used by strategy engine
                const targetFolder = path.join(effectiveDir, 'db', env, dbType, dbName);
                
                if (fs.existsSync(targetFolder)) {
                   console.log(`💥 [CoreWorker] Force Clean: Deleting physical folder ${targetFolder}`);
                   fs.rmSync(targetFolder, { recursive: true, force: true });
                }
             }
           } catch (fileErr: any) {
              console.warn(`[CoreWorker] Hard purge warning: Could not delete cache files - ${fileErr.message}`);
           }
        }
        break;
      case 'getLatestComparisons':
        result = await (CoreBridge.getStorage() as any).getLatestComparisons(params.limit);
        break;
      case 'purgeActiveProject':
        try {
           const fs = require('fs');
           const path = require('path');
           
           // 'effectiveDir' is guaranteed scoped and context-isolated to the active project
           const dbDir = path.join(effectiveDir, 'db');
           
           if (fs.existsSync(dbDir)) {
              console.log(`💥 [CoreWorker] PROJECT HARD PURGE: Deleting entire db folder at ${dbDir}`);
              fs.rmSync(dbDir, { recursive: true, force: true });
              result = { success: true, message: `Folder ${dbDir} wiped.` };
           } else {
              result = { success: true, message: 'No db directory to wipe.' };
           }
        } catch (fileErr: any) {
           throw new Error(`Failed to purge active project folder: ${fileErr.message}`);
        }
        break;
      case 'ping':
        result = 'pong';
        break;
      case 'getFeaturesStatus':
        result = await CoreBridge.execute('getFeaturesStatus', {});
        break;
      case 'updateFeatureFlag':
        result = await CoreBridge.execute('updateFeatureFlag', params);
        break;
      case 'parseTable':
        result = await CoreBridge.getApp()?.parser.parseTableDetailed(params.ddl);
        break;
      case 'parseTrigger':
        result = await CoreBridge.getApp()?.parser.parseTrigger(params.ddl);
        break;
      case 'normalize':
        result = await CoreBridge.getApp()?.parser.normalize(params.ddl, params.options);
        break;
      case 'exit':
        sendResponse(id, 'Goodbye');
        process.exit(0);
      default:
        sendError(id, -32601, `Method not found: ${method}`);
        return;
    }

    sendResponse(id, result);
  } catch (err: any) {
    logger.error(`Error executing ${method}:`, err);
    sendError(id, -32603, err.message || 'Internal error');
  }
}

async function bootstrap() {
  logger.log('🚀 Internal Core-Worker starting...');

  // Parse custom args since we don't use commander here
  let userDataPath = '';
  let sqlitePath = '';
  let secretsPathArg = '';
  
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === '--user-data-path') {
      userDataPath = process.argv[i + 1];
    }
    if (process.argv[i] === '--sqlite-path') {
      sqlitePath = process.argv[i + 1];
    }
    if (process.argv[i] === '--secrets-path') {
      secretsPathArg = process.argv[i + 1];
    }
    if (process.argv[i] === '--project-base-dir') {
      const pBase = process.argv[i + 1];
      if (pBase) globalProjectBaseDir = pBase;
    }
  }

  if (!userDataPath) {
    logger.error('Missing --user-data-path arg.');
    process.exit(1);
  }
  
  globalUserDataPath = userDataPath;

  try {
     const fsSync = require('fs');
     const p = require('path');
     const dbConfigPath = p.join(userDataPath, 'db-config.yaml');
     if (fsSync.existsSync(dbConfigPath)) {
       const content = fsSync.readFileSync(dbConfigPath, 'utf8');
       const match = content.match(/^projectBaseDir:\s*(.+)$/m);
       if (match && match[1]) {
           globalProjectBaseDir = match[1].trim();
       }
     }
  } catch (e) {
     logger.error('Failed to parse db-config.yaml in CoreWorker', e);
  }

  logger.log(`[CoreWorker] Parsed projectBaseDir: ${globalProjectBaseDir}`);

  try {
    const strategy = new DesktopStorageStrategy();
    const { secretPromptProvider } = require('@the-andb/core');
    const p = require('path');
    const fsSync = require('fs');
    
    // Priority: 1. Passed argument (Internal Workspace) -> 2. User Data Dir (External Overrides)
    let finalSecretsPath = secretsPathArg;
    
    if (!finalSecretsPath || !fsSync.existsSync(finalSecretsPath)) {
       finalSecretsPath = p.join(userDataPath, 'secrets');
    }
    
    if (secretPromptProvider) {
       secretPromptProvider.setSecretsPath(finalSecretsPath);
    }

    await CoreBridge.init(userDataPath, sqlitePath || undefined, strategy, globalProjectBaseDir, (event) => {
      sendEvent('app-control', event);
    }, secretPromptProvider);
    logger.log(`✅ DesktopStorageStrategy & Core Engine ready for RPC. BaseDir: ${globalProjectBaseDir}`);

    if (process.send) {
      logger.log('👂 Listening on IPC message channel...');
      process.on('message', async (message: any) => {
        try {
          const request = typeof message === 'string' ? JSON.parse(message) : message;
          await handleRpcRequest(request);
        } catch (e) {
          logger.error('Failed to parse IPC message:', e);
        }
      });
    } else {
      logger.warn('⚠️ No IPC channel found. This worker expects to be child_process.fork()ed from Electron.');
    }
  } catch (err: any) {
    logger.error('Failed to initialize internal Core Worker:', err);
    process.exit(1);
  }
}

bootstrap();
