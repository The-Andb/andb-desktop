import { app, shell, dialog } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import { isDev } from '../bootstrap'

/**
 * Open backup folder in system explorer
 */
export async function handleOpenBackupFolder() {
  const backupPath = path.join(app.getPath('userData'), 'backups')
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true })
  }
  shell.openPath(backupPath)
  return { success: true }
}

/**
 * Relaunch the application
 */
export async function handleRelaunchApp() {
  const options: any = {
    args: process.argv.slice(1).concat(['--relaunch'])
  }
  
  // If we're not packaged, the execPath is the generic Electron binary, 
  // and we must explicitly pass the app root directory instead of letting it infer from the mutated CWD.
  if (!app.isPackaged) {
    options.execPath = process.execPath;
    
    // In dev, our current working directory was mutated by CoreBridge initialization 
    // to point to the userData folder. We MUST revert it so that when app.relaunch() 
    // inherits the CWD, it evaluates '.' or local paths correctly instead of crashing.
    try {
      const rootAppPath = app.getAppPath();
      process.chdir(rootAppPath);
      if ((global as any).logger) (global as any).logger.info(`Reverted CWD to ${rootAppPath} for safe relaunch.`);
    } catch (e) {
      console.warn('Failed to revert CWD for relaunch', e);
    }
    
    options.args = [app.getAppPath(), '--relaunch'];
  }

  app.relaunch(options)
  app.exit(0)
  return { success: true }
}

/**
 * Open file dialog
 */
export async function handlePickFile(_event: any, options: any) {
  const result = await dialog.showOpenDialog(options)
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
}

/**
 * Generic Open Directory Dialog
 */
export async function handlePickDirectory(_event: any) {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory']
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
}

/**
 * Check file permissions (especially for SSH keys)
 */
export async function handleCheckFilePermissions(_event: any, filePath: string) {
  try {
    const stats = fs.statSync(filePath)
    const isTooOpen = process.platform !== 'win32' && (stats.mode & 0o077) !== 0
    return {
      success: true,
      mode: stats.mode.toString(8),
      isTooOpen,
      platform: process.platform
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Copy file to internal uploads directory
 */
export async function handleSaveDumpFile(_event: any, sourcePath: string) {
  try {
    const uploadDir = path.join(app.getPath('userData'), 'uploads', 'dumps')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const fileName = path.basename(sourcePath)
    const newFileName = `${Date.now()}_${fileName}`
    const targetPath = path.join(uploadDir, newFileName)

    fs.copyFileSync(sourcePath, targetPath)
    if ((global as any).logger) (global as any).logger.info(`File uploaded: ${sourcePath} -> ${targetPath}`)
    return targetPath
  } catch (error) {
    if ((global as any).logger) (global as any).logger.error('Failed to save dump file:', error)
    throw error
  }
}

/**
 * Logger (Cross-Process)
 */
export function handleAppLog(_event: any, args: any) {
  const { level, message, data } = args || {}
  const logger = (global as any).logger;
  if (!logger) {
    if (isDev) console.log(`[Renderer-${level}] ${message}`, data || '');
    return;
  }

  try {
    switch (level) {
      case 'error':
        logger.error(`[Renderer] ${message}`, data);
        break;
      case 'warn':
        logger.warn(`[Renderer] ${message}`, data);
        break;
      case 'info':
      default:
        logger.info(`[Renderer] ${message}`, data);
        break;
    }
  } catch (e) {
    if (isDev) console.error('Logger direct call failed:', e);
  }
}

export function handleAppLogWrite(_event: any, content: any) {
  const logger = (global as any).logger;
  if (logger && typeof logger.write === 'function') {
    try {
      logger.write(content);
    } catch (e) {
      if (isDev) console.error('Logger.write failed:', e);
    }
  } else if (isDev) {
    console.log('[Renderer-Write]', content);
  }
}

/**
 * CLI and Integrations
 */
export async function handleCliCheckPath() {
  try {
    execSync('which andb', { stdio: 'ignore' })
    return true
  } catch (e) {
    return false
  }
}

/**
 * Check if CLI is installed (using service)
 */
export async function handleCheckCliInstalled() {
  const { CliInstaller } = require('../services/cli-installer')
  return await CliInstaller.getInstance().isInstalled()
}

/**
 * Install CLI (using service)
 */
export async function handleInstallCli() {
  const { CliInstaller } = require('../services/cli-installer')
  const cliPath = handleCliGetBinaryPath()
  return await CliInstaller.getInstance().install(cliPath)
}

/**
 * Execute generic andb command (Subprocess)
 */
export async function handleExecuteAndbCommand(_event: any, command: string, args: string[]) {
  try {
    const { exec } = require('child_process')
    const { promisify } = require('util')
    const execAsync = promisify(exec)

    // Safety check: only allow andb commands
    if (!command.startsWith('andb')) {
      return { success: false, error: 'Only andb commands allowed' }
    }

    const { stdout, stderr } = await execAsync(`${command} ${args.join(' ')}`)
    return { success: true, data: stdout, error: stderr }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export function handleCliGetBinaryPath() {
  if (isDev) {
    return path.join(app.getAppPath(), '../andb-cli/bin/andb.js')
  } else {
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', '.bin', 'andb')
  }
}

export function handleMcpGetPath() {
  if (isDev) {
    return path.join(app.getAppPath(), '../andb-mcp/dist/index.js')
  } else {
    return path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', '@the-andb', 'mcp', 'dist', 'index.js')
  }
}
