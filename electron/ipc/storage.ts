import { app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import Store from 'electron-store'
import * as crypto from 'crypto'
import { SecurityService } from '../services/security'

let _store: Store | null = null
function getStore() {
  if (!_store) _store = new Store()
  return _store
}

/**
 * Handle Generic Storage Get
 */
export async function handleStorageGet(_event: any, key: string) {
  try {
    let data = getStore().get(key)

    // Decrypt passwords if connections or templates
    if ((key === 'connections' || key === 'connectionTemplates') && Array.isArray(data)) {
      const security = SecurityService.getInstance()
      data = data.map((conn: any) => {
        if (conn.password) {
          conn.password = security.decrypt(conn.password)
        }
        return conn
      })
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Generic Storage Set
 */
export async function handleStorageSet(_event: any, key: string, value: any) {
  try {
    // Encrypt passwords if connections or templates
    if ((key === 'connections' || key === 'connectionTemplates') && Array.isArray(value)) {
      const security = SecurityService.getInstance()
      value = value.map((conn: any) => {
        const c = { ...conn }
        if (c.password) {
          c.password = security.encrypt(c.password)
        }
        return c
      })
    }

    getStore().set(key, value)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Generic Storage Delete
 */
export async function handleStorageDelete(_event: any, key: string) {
  try {
    getStore().delete(key)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Generic Storage Has
 */
export async function handleStorageHas(_event: any, key: string) {
  try {
    return { success: true, data: getStore().has(key) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Generic Storage Clear
 */
export async function handleStorageClear() {
  try {
    getStore().clear()
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Security - Get Public Key
 */
export async function handleSecurityGetPublicKey() {
  try {
    return { success: true, data: SecurityService.getInstance().getPublicKey() }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

/**
 * Handle Security - Encrypt Token
 */
export async function handleSecurityEncryptToken(_event: any, token: string) {
  try {
    return { success: true, data: SecurityService.getInstance().secureEncrypt(token) }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

/**
 * Handle Security - Decrypt Token
 */
export async function handleSecurityDecryptToken(_event: any, encryptedToken: string) {
  try {
    return { success: true, data: SecurityService.getInstance().secureDecrypt(encryptedToken) }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

/**
 * Handle Security - Regenerate Keys
 */
export async function handleSecurityRegenerateKeys() {
  try {
    SecurityService.getInstance().generateKeys()
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

/**
 * Handle Backup Encryption
 */
export async function handleBackupEncrypt(_event: any, data: string, password: string) {
  try {
    const algorithm = 'aes-256-cbc'
    const key = crypto.scryptSync(password, 'salt-andb', 32)
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(algorithm, key, iv)
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return { success: true, data: iv.toString('hex') + ':' + encrypted }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Backup Decryption
 */
export async function handleBackupDecrypt(_event: any, encryptedData: string, password: string) {
  try {
    const algorithm = 'aes-256-cbc'
    const parts = encryptedData.split(':')
    if (parts.length < 2) throw new Error('Invalid backup format')
    const iv = Buffer.from(parts.shift() || '', 'hex')
    const encryptedText = parts.join(':')
    const key = crypto.scryptSync(password, 'salt-andb', 32)
    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return { success: true, data: decrypted }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Clear All Andb Storage (FS)
 */
export async function handleAndbClearStorage() {
  try {
    const userDataPath = app.getPath('userData')
    const storageDir = path.join(userDataPath, 'storage')
    if (fs.existsSync(storageDir)) {
      fs.rmSync(storageDir, { recursive: true, force: true })
    }
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Update Feature Flag
 */
export async function handleUpdateFeatureFlag(_event: any, args: any) {
  try {
    const { key, enabled } = args || {}
    const { BackgroundWorker } = require('../services/background-worker')
    return await BackgroundWorker.getInstance().updateFeatureFlag(key, enabled)
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
