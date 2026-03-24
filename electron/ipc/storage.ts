import { app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import * as crypto from 'crypto'
import { SecurityService } from '../services/security'
import { desktopStorageStrategy } from '../bootstrap'
import { GlobalConnectionEntity } from '../storage/entities/gui/GlobalConnectionEntity'
import { GuiPreferenceEntity } from '../storage/entities/gui/GuiPreferenceEntity'

function getRepository(entity: any) {
  const dataSource = desktopStorageStrategy.getDataSource()
  if (!dataSource || !dataSource.isInitialized) throw new Error('Database not initialized')
  return dataSource.getRepository(entity)
}

/**
 * Handle Generic Storage Get
 */
export async function handleStorageGet(_event: any, key: string) {
  try {
    if (key === 'connections' || key === 'connectionTemplates') {
      const repo = getRepository(GlobalConnectionEntity)
      const data = await repo.find({ order: { name: 'ASC' } })
      
      const security = SecurityService.getInstance()
      const decryptedData = data.map((conn: any) => {
        if (conn.password) {
          try {
            conn.password = security.decrypt(conn.password)
          } catch(e) {}
        }
        if (conn.ssh_config_json) {
           conn.ssh = JSON.parse(conn.ssh_config_json)
        }
        if (conn.permissions_json) {
           conn.permissions = JSON.parse(conn.permissions_json)
        }
        if (conn.domain_mapping_json) {
           conn.domainMapping = JSON.parse(conn.domain_mapping_json)
        }
        if (conn.product_settings_json) {
           conn.productSettings = JSON.parse(conn.product_settings_json)
        }
        return conn
      })
      return { success: true, data: decryptedData }
    }

    // Generic Preferences
    const repo = getRepository(GuiPreferenceEntity)
    const pref = await repo.findOne({ where: { key } })
    
    let result = pref ? pref.value : undefined
    try {
      if (result && (result.startsWith('{') || result.startsWith('['))) {
        result = JSON.parse(result)
      }
    } catch { }

    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Generic Storage Set
 */
export async function handleStorageSet(_event: any, key: string, value: any) {
  try {
    if ((key === 'connections' || key === 'connectionTemplates') && Array.isArray(value)) {
      const repo = getRepository(GlobalConnectionEntity)
      const security = SecurityService.getInstance()
      
      for (const conn of value) {
        let encryptedPassword = conn.password;
        if (encryptedPassword) {
          encryptedPassword = security.encrypt(encryptedPassword)
        }
        await repo.upsert({
          id: conn.id,
          name: conn.name,
          environment: conn.environment || null,
          type: conn.type || 'mysql',
          host: conn.host || null,
          port: conn.port || null,
          database: conn.database || null,
          username: conn.username || null,
          password: encryptedPassword || null,
          ssh_config_json: conn.ssh ? JSON.stringify(conn.ssh) : null,
          permissions_json: conn.permissions ? JSON.stringify(conn.permissions) : null,
          templateId: conn.templateId || null,
          domain_mapping_json: conn.domainMapping ? JSON.stringify(conn.domainMapping) : null,
          product_settings_json: conn.productSettings ? JSON.stringify(conn.productSettings) : null,
          updated_at: new Date()
        }, ['id']);
      }
      return { success: true }
    }

    // Generic Preferences
    const repo = getRepository(GuiPreferenceEntity)
    const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value)
    await repo.upsert({ key, value: serialized }, ['key'])

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
    const repo = getRepository(GuiPreferenceEntity)
    await repo.delete({ key })
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
    const repo = getRepository(GuiPreferenceEntity)
    const count = await repo.count({ where: { key } })
    return { success: true, data: count > 0 }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle Generic Storage Clear
 */
export async function handleStorageClear() {
  try {
    await getRepository(GuiPreferenceEntity).clear()
    await getRepository(GlobalConnectionEntity).clear()
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

/**
 * Handle SQLite User Settings Get
 */
export async function handleGetUserSettings() {
  try {
    const settings = await desktopStorageStrategy.getUserSettings()
    return { success: true, data: settings }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Handle SQLite User Settings Save
 */
export async function handleSaveUserSetting(_event: any, key: string, value: any) {
  try {
    await desktopStorageStrategy.saveUserSetting(key, value)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
