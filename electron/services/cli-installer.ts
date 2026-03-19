import { symlink, unlink, lstat, mkdir } from 'fs/promises'
import * as path from 'path'
import * as os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export class CliInstaller {
  private static instance: CliInstaller | null = null
  private binPath = '/usr/local/bin/andb'

  private constructor() {}

  public static getInstance(): CliInstaller {
    if (!this.instance) {
      this.instance = new CliInstaller()
    }
    return this.instance
  }

  /**
   * Install the CLI by creating a symlink in /usr/local/bin
   * @param cliSourcePath The absolute path to the bundled andb.js or CLI entry point
   */
  public async install(cliSourcePath: string): Promise<{ success: boolean; message: string }> {
    if (os.platform() === 'win32') {
      return { success: false, message: 'Auto-Link is currently supported on macOS and Linux only.' }
    }

    try {
      // 1. Ensure /usr/local/bin exists
      const binDir = path.dirname(this.binPath)
      try {
        await lstat(binDir)
      } catch (e) {
        // Try to create it if it doesn't exist (might need sudo, but /usr/local/bin is usually there)
        await mkdir(binDir, { recursive: true })
      }

      // 2. Remove existing link if it exists
      try {
        await unlink(this.binPath)
      } catch (e) {
        // Ignore if it doesn't exist
      }

      // 3. Create the symlink
      // Check if we have write access to /usr/local/bin
      try {
        await symlink(cliSourcePath, this.binPath)
        return { success: true, message: 'CLI installed successfully to ' + this.binPath }
      } catch (err: any) {
        if (err.code === 'EACCES' || err.code === 'EPERM') {
          // Try with sudo via osascript on Mac
          const command = `ln -sf "${cliSourcePath}" "${this.binPath}"`
          if (os.platform() === 'darwin') {
            await execAsync(`osascript -e 'do shell script "${command}" with administrator privileges'`)
            return { success: true, message: 'CLI installed successfully with admin privileges.' }
          } else {
            return { success: false, message: 'Permission denied. Please run: sudo ln -sf ' + cliSourcePath + ' ' + this.binPath }
          }
        }
        throw err
      }
    } catch (error: any) {
      console.error('Failed to install CLI:', error)
      return { success: false, message: error.message || 'Unknown error during installation.' }
    }
  }

  public async isInstalled(): Promise<boolean> {
    try {
      const stats = await lstat(this.binPath)
      return stats.isSymbolicLink() || stats.isFile()
    } catch (e) {
      return false
    }
  }
}

export default CliInstaller
