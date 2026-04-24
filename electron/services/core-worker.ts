// This worker is spawned by andb-desktop to run @the-andb/core isolated from the UI thread.
// It bypasses andb-cli completely to embrace the "Bright Path" decoupled architecture.

import { CoreBridge } from '@the-andb/core';
import { DesktopStorageStrategy } from '../storage/strategy/desktop-storage.strategy';
import { SafeLogger } from '../utils/logger';

let globalProjectBaseDir = process.cwd();

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

async function handleRpcRequest(request: any) {
  const { id, method, params } = request;

  if (!method) {
    sendError(id, -32600, 'Invalid Request: missing method');
    return;
  }

  let result: any;
  try {
    switch (method) {
      case 'execute':
        if (params && params.payload) {
          params.payload.onProgress = (data: any) => {
             sendEvent('progress', { ...data, operation: params.operation });
          };
          
          const targetDir = params.payload.projectBaseDir || globalProjectBaseDir;
          const storageService = CoreBridge.getStorage();
          if (storageService) {
             (storageService as any).projectBaseDir = targetDir;
             if ((storageService as any).strategy) {
                (storageService as any).strategy.projectBaseDir = targetDir;
             }
          }
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
              const settings = await (CoreBridge.getStorage() as any).getProjectSettings(p.id);
              hydrated.push({
                  id: p.id,
                  name: p.name,
                  description: p.description,
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
              order_index: 0
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
        break;
      case 'getLatestComparisons':
        result = await (CoreBridge.getStorage() as any).getLatestComparisons(params.limit);
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
  }

  if (!userDataPath) {
    logger.error('Missing --user-data-path arg.');
    process.exit(1);
  }

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
