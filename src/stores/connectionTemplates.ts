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
  databases?: string[]
  schema?: string
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

  watch(
    templates,
    newVal => {
      storage.set('connectionTemplates', JSON.parse(JSON.stringify(newVal)))
    },
    { deep: true }
  )

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
      const original = templates.value[index]
      const merged = { ...original, ...updates }

      // Only check for duplicates if the name is actually being changed
      if (updates.name && updates.name.toLowerCase() !== original.name.toLowerCase()) {
        if (checkDuplicate(merged, id)) {
          throw new Error('DUPLICATE_CONNECTION')
        }
      }

      templates.value[index] = {
        ...templates.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
    }
  }

  async function removeTemplate(id: string) {
    templates.value = templates.value.filter(t => t.id !== id)

    // 1. Get all connections across all projects from storage
    const allConns = await storage.getConnections()

    // 2. Find connections referencing this template
    const connsToRemove = allConns.filter(c => c.templateId === id)

    if (connsToRemove.length > 0) {
      const { useAppStore } = await import('./app')
      const { useProjectsStore } = await import('./projects')
      const { useConnectionPairsStore } = await import('./connectionPairs')
      const { Andb } = await import('@/utils/andb')

      const appStore = useAppStore()
      const projectsStore = useProjectsStore()
      const connectionPairsStore = useConnectionPairsStore()

      // 3. For each connection referencing the template, clean it up
      for (const conn of connsToRemove) {
        // Clear cached data
        try {
          await Andb.clearConnectionData(conn)
        } catch (e) {
          console.warn('Failed to clear connection data:', e)
        }

        // Remove from current project loaded list if it's there
        appStore.connections = appStore.connections.filter(c => c.id !== conn.id)

        // Remove from all projects' connection lists in memory
        projectsStore.removeItemFromProject('connection', conn.id)

        // Clean up connection pairs referencing this connection in memory
        connectionPairsStore.connectionPairs.forEach(pair => {
          if (pair.sourceConnectionId === conn.id) {
            pair.sourceConnectionId = undefined
            pair.sourceEnv = ''
          }
          if (pair.targetConnectionId === conn.id) {
            pair.targetConnectionId = undefined
            pair.targetEnv = ''
          }
        })

        // Remove from SQLite database
        await storage.removeConnection(conn.id, conn.projectId)
      }

      // Save updated projects and connection pairs to persist changes
      await Promise.all([
        storage.saveProjects(projectsStore.projects),
        storage.saveConnectionPairs(connectionPairsStore.connectionPairs)
      ])
    }
  }

  return {
    templates,
    addTemplate,
    updateTemplate,
    removeTemplate,
    reloadData: init
  }
})
