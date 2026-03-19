import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { storage } from '../utils/storage-ipc'
import type { SshConfig } from './app'

export interface ConnectionTemplate {
  id: string
  name: string
  host: string
  port: number
  database?: string
  username: string
  password?: string
  type: 'mysql' | 'postgres' | 'sqlite' | 'dump'
  ssh?: SshConfig
  permissions?: {
    writeAlter: boolean
    writeView: boolean
    writeRoutine: boolean
  }
  description?: string
  environment?: string
  useSSL?: boolean
  allowSelfSigned?: boolean
  charset?: string
  timezone?: string
  timeout?: number
  createdAt: string
  updatedAt: string
}

export const useConnectionTemplatesStore = defineStore('connectionTemplates', () => {
  const templates = ref<ConnectionTemplate[]>([])

  const init = async () => {
    // 1. Check unified storage
    const saved = await storage.get('connectionTemplates')
    if (saved && saved.length > 0) {
      templates.value = saved
      return
    }

    // 2. Migration: Check legacy localStorage
    try {
      const legacy = localStorage.getItem('connection-templates')
      if (legacy) {
        const parsed = JSON.parse(legacy)
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log('[Migration] Moving legacy connection templates to unified storage')
          templates.value = parsed.map((t: any) => ({
            ...t,
            // Ensure dates are strings for IPC transport
            createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : new Date().toISOString()
          }))
          // Save to unified storage immediately
          await storage.set('connectionTemplates', JSON.parse(JSON.stringify(templates.value)))
          // Clear legacy
          localStorage.removeItem('connection-templates')
        }
      }
    } catch (e) {
      console.error('Failed to migrate legacy templates:', e)
    }
  }

  init()

  watch(templates, (newVal) => {
    storage.set('connectionTemplates', JSON.parse(JSON.stringify(newVal)))
  }, { deep: true })

  function checkDuplicate(template: Partial<ConnectionTemplate>, excludeId?: string) {
    return templates.value.some(t => {
      if (excludeId && t.id === excludeId) return false
      return t.name.toLowerCase() === template.name?.toLowerCase()
    })
  }

  function addTemplate(template: Omit<ConnectionTemplate, 'id' | 'createdAt' | 'updatedAt'>) {
    if (checkDuplicate(template)) {
      throw new Error('DUPLICATE_CONNECTION')
    }

    const newTemplate: ConnectionTemplate = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...template
    }
    templates.value.push(newTemplate)
    return newTemplate
  }

  function updateTemplate(id: string, updates: Partial<ConnectionTemplate>) {
    const index = templates.value.findIndex(t => t.id === id)
    if (index !== -1) {
      const merged = { ...templates.value[index], ...updates }
      if (checkDuplicate(merged, id)) {
        throw new Error('DUPLICATE_CONNECTION')
      }

      templates.value[index] = {
        ...templates.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
    }
  }

  function removeTemplate(id: string) {
    templates.value = templates.value.filter(t => t.id !== id)
  }

  return {
    templates,
    addTemplate,
    updateTemplate,
    removeTemplate,
    reloadData: init
  }
})
