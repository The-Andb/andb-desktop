import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { storage } from '../utils/storage-ipc'
import type { Project } from '@/types/project'
import { useEventBus } from '@vueuse/core'
import { useAppStore } from './app'
import { useConnectionPairsStore } from './connectionPairs'

export const projectChangedBus = useEventBus<string>('project-changed')
export const useProjectsStore = defineStore('projects', () => {
  // State
  const projects = ref<Project[]>([])
  const selectedProjectId = ref<string | null>(null)
  const viewMode = ref<'list' | 'grid' | 'columns' | 'detail'>('grid')
  const isLoaded = ref(false)

  // Initialize
  let initPromise: Promise<void> | null = null

  const init = async () => {
    // If already initializing, return the existing promise
    if (initPromise) return initPromise

    initPromise = (async () => {
      const savedProjects = await storage.getProjects()
      console.log('[Projects] Init - Loaded projects:', savedProjects?.length, savedProjects)

      // 1. Load existing projects
      if (savedProjects && savedProjects.length > 0) {
        const envIdMap: Record<string, string> = {
          '1': 'DEV',
          '2': 'STAGE',
          '3': 'UAT',
          '4': 'PROD'
        }

        projects.value = savedProjects.map(p => {
          let envs = Array.isArray(p.enabledEnvironmentIds) ? p.enabledEnvironmentIds.map(String) : ['DEV', 'STAGE', 'PROD']

          // Migrate numeric IDs to Named IDs
          envs = envs.map(id => envIdMap[id] || id)

          return {
            ...p,
            connectionIds: Array.isArray(p.connectionIds) ? p.connectionIds : [],
            pairIds: Array.isArray(p.pairIds) ? p.pairIds : [],
            enabledEnvironmentIds: envs
          }
        })
      }

      // 4. Set Selection
      const settings = await storage.getSettings()
      let lastSelected = settings?.lastSelectedProjectId

      console.log('[Projects] Init - Last Selected ID:', lastSelected)

      // 5. Data Sanitization (Fix duplicate IDs from previous bugs)
      projects.value = projects.value.map(p => {
        // De-duplicate connectionIds and pairIds for every project
        const cleanConnectionIds = [...new Set(p.connectionIds || [])]
        const cleanPairIds = [...new Set(p.pairIds || [])]

        return {
          ...p,
          connectionIds: cleanConnectionIds,
          pairIds: cleanPairIds
        }
      })

      // 5.2. Connection Isolation Pass (Fix cross-project leakage)
      const appStore = useAppStore()
      const connectionPairsStore = useConnectionPairsStore()
      const connUsageMap = new Map<string, string[]>() // connId -> [projectId]
      const pairUsageMap = new Map<string, string[]>() // pairId -> [projectId]

      projects.value.forEach(p => {
        ;(p.connectionIds || []).forEach(id => {
          const usage = connUsageMap.get(id) || []
          usage.push(p.id)
          connUsageMap.set(id, usage)
        })
        ;(p.pairIds || []).forEach(id => {
          const usage = pairUsageMap.get(id) || []
          usage.push(p.id)
          pairUsageMap.set(id, usage)
        })
      })

      // Fix shared IDs by cloning
      projects.value.forEach(p => {
        // 1. Isolate Connections
        p.connectionIds = (p.connectionIds || []).map(id => {
          const usage = connUsageMap.get(id)
          if (usage && usage.length > 1 && usage[0] !== p.id) {
            const original = appStore.connections.find(c => c.id === id)
            if (original) {
              const newId = appStore.generateId()
              const clone = { ...JSON.parse(JSON.stringify(original)), id: newId }
              appStore.connections.push(clone)
              
              // Find and clone any pair in this project that uses the old connection ID
              p.pairIds.forEach(pairId => {
                const pair = connectionPairsStore.connectionPairs.find(cp => cp.id === pairId)
                if (pair) {
                  if (pair.sourceConnectionId === id) pair.sourceConnectionId = newId
                  if (pair.targetConnectionId === id) pair.targetConnectionId = newId
                }
              })
              return newId
            }
          }
          return id
        })

        // 2. Isolate Pairs
        p.pairIds = (p.pairIds || []).map(id => {
          const usage = pairUsageMap.get(id)
          if (usage && usage.length > 1 && usage[0] !== p.id) {
            const original = connectionPairsStore.connectionPairs.find(cp => cp.id === id)
            if (original) {
              const newId = appStore.generateId() // reuse generateId
              const clone = { ...JSON.parse(JSON.stringify(original)), id: newId }
              connectionPairsStore.connectionPairs.push(clone)
              return newId
            }
          }
          return id
        })
      })

      // Robust Selection Logic
      let found = false

      // Attempt 1: Match by ID
      if (lastSelected && projects.value.some(p => p.id === lastSelected)) {
        selectedProjectId.value = lastSelected
        found = true
      }

      // Attempt 2: Match by Name (Heuristic Recovery)
      if (!found && projects.value.length > 0) {
        const targetName = lastSelected
        const nameMatch = projects.value.find(p => p.name === targetName)
        if (nameMatch) {
          console.log('[Projects] Recovered selection by Name:', targetName, '->', nameMatch.id)
          selectedProjectId.value = nameMatch.id
          found = true
        }
      }

      // Final Fallback
      if (!found) {
        selectedProjectId.value = projects.value[0]?.id || null
      }

      // 6. Ensure isActive flag is consistent with selectedProjectId
      projects.value.forEach(p => {
        p.isActive = p.id === selectedProjectId.value
      })
      // 7. Auto-Cleanup: Deduplicate connections and pairs on startup
      await cleanGarbageConnections()

      isLoaded.value = true
    })()

    try {
      await initPromise
    } finally {
      initPromise = null
    }
  }

  // Call init
  init()

  // Watchers
  watch(
    projects,
    newProjects => {
      storage.saveProjects(newProjects)
    },
    { deep: true }
  )

  watch(selectedProjectId, async (newId) => {
    if (newId) {
      console.log('[Projects] Selected Project Changed:', newId)
      try {
        // @ts-ignore
        await storage.updateSettings({ lastSelectedProjectId: newId })
        console.log('[Projects] Persisted selection setting:', newId)
      } catch (err) {
        console.error('[Projects] Failed to persist selection:', err)
      }

      // DECOUPLING & INDEPENDENCE: Emit event to sync satellite stores
      projectChangedBus.emit(newId)
    }
  })

  // Getters
  const currentProject = computed(() => {
    return projects.value.find(p => p.id === selectedProjectId.value) || null
  })

  /**
   * Safe UUID generator with fallbacks
   */
  const generateId = () => {
    try {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID()
      }
      return 'p-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9)
    } catch (e) {
      return 'p-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9)
    }
  }

  // Actions
  function addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project {
    const newProject: Project = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...project,
      isActive: false // Default to false
    }

    projects.value.push(newProject)
    return newProject
  }

  const updateProject = (id: string, updates: Partial<Project>) => {
    const index = projects.value.findIndex(p => p.id === id)
    if (index !== -1) {
      projects.value[index] = {
        ...projects.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
    }
  }

  const removeProject = (id: string) => {
    // Check if we are deleting the currently selected project
    const wasSelected = selectedProjectId.value === id

    projects.value = projects.value.filter(p => p.id !== id)

    if (wasSelected) {
      // Find another project to select, or fallback to null
      const nextId = projects.value[0]?.id || null
      if (nextId) {
        selectProject(nextId)
      } else {
        selectedProjectId.value = null
      }
    }
  }

  const selectProject = (id: string) => {
    console.log('[Projects] Switching to project:', id)
    if (projects.value.some(p => p.id === id)) {
      selectedProjectId.value = id

      // Update isActive flag for all projects
      projects.value.forEach(p => {
        p.isActive = p.id === id
      })
    }
  }

  const duplicateProject = (id: string) => {
    const source = projects.value.find(p => p.id === id)
    if (!source) return

    const appStore = useAppStore()
    const connectionPairsStore = useConnectionPairsStore()

    // 1. Create the new project structure (shallow copy first)
    const newProject: Project = {
      ...JSON.parse(JSON.stringify(source)),
      id: generateId(),
      name: `${source.name} (Copy)`,
      isActive: false,
      connectionIds: [],
      pairIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // 2. Clone Connections
    const connIdMap: Record<string, string> = {}
    source.connectionIds.forEach(oldId => {
      const oldConn = appStore.connections.find(c => c.id === oldId)
      if (oldConn) {
        const newConnId = appStore.generateId() // Use appStore's generator
        const newConn = { 
          ...JSON.parse(JSON.stringify(oldConn)), 
          id: newConnId 
        }
        appStore.connections.push(newConn)
        connIdMap[oldId] = newConnId
        newProject.connectionIds.push(newConnId)
      }
    })

    // 3. Clone Pairs
      source.pairIds.forEach(oldId => {
        const oldPair = connectionPairsStore.connectionPairs.find(p => p.id === oldId)
        if (oldPair) {
          const newPairId = appStore.generateId()
        const newPair = {
          ...JSON.parse(JSON.stringify(oldPair)),
          id: newPairId,
          sourceConnectionId: oldPair.sourceConnectionId ? (connIdMap[oldPair.sourceConnectionId] || oldPair.sourceConnectionId) : undefined,
          targetConnectionId: oldPair.targetConnectionId ? (connIdMap[oldPair.targetConnectionId] || oldPair.targetConnectionId) : undefined
        }
        connectionPairsStore.connectionPairs.push(newPair)
        newProject.pairIds.push(newPairId)
      }
    })

    projects.value.push(newProject)
    return newProject
  }

  const addItemToProject = (type: 'connection' | 'pair', itemId: string, projectId?: string) => {
    const targetId = projectId || selectedProjectId.value
    if (!targetId) return
    const project = projects.value.find(p => p.id === targetId)
    if (project) {
      if (type === 'connection' && !project.connectionIds.includes(itemId)) {
        project.connectionIds.push(itemId)
      } else if (type === 'pair' && !project.pairIds.includes(itemId)) {
        project.pairIds.push(itemId)
      }
    }
  }

  const removeItemFromProject = (type: 'connection' | 'pair', itemId: string) => {
    projects.value.forEach(p => {
      if (type === 'connection') {
        p.connectionIds = p.connectionIds.filter(id => id !== itemId)
      } else {
        p.pairIds = p.pairIds.filter(id => id !== itemId)
      }
    })
  }

  async function setupDemo() {
    const appStore = useAppStore()
    const connectionPairsStore = useConnectionPairsStore()

    // 0. Ensure initialization is complete
    await init()

    // 1. Check if Demo Project already exists to avoid duplicates
    // We check by name AND a sanity check on connectionIds length to prevent claiming an empty shell
    const existingDemo = projects.value.find(p => p.name === 'Andb Live Demo')
    if (existingDemo) {
      if (existingDemo.connectionIds.length > 0 && existingDemo.pairIds.length > 0) {
        selectProject(existingDemo.id)
        return connectionPairsStore.connectionPairs.find(p => existingDemo.pairIds.includes(p.id))
      }
      // If it exists but is broken/empty, we might want to repair it or ignore it.
      // For safety, let's just select it to avoid creating another one "Andb Live Demo (Copy)" or similar.
      selectProject(existingDemo.id)
      return undefined
    }

    // 1. Create Demo Project
    const demoProject = addProject({
      name: 'Andb Live Demo',
      description: 'Safe playground using SQL dump files',
      connectionIds: [],
      pairIds: [],
      enabledEnvironmentIds: ['DEV', 'PROD']
    })

    // 2. Create Demo Connections
    const sourceConn = appStore.addConnection({
      name: 'Demo Source (SQL)',
      host: './ui/public/demo/demo-source.sql',
      port: 3306,
      database: 'demo_source',
      username: 'demo',
      environment: 'DEV',
      status: 'idle',
      type: 'dump'
    }, demoProject.id)

    const targetConn = appStore.addConnection({
      name: 'Demo Target (SQL)',
      host: './ui/public/demo/demo-target.sql',
      port: 3306,
      database: 'demo_target',
      username: 'demo',
      environment: 'PROD',
      status: 'idle',
      type: 'dump'
    }, demoProject.id)

    // Link connections to demo project
    demoProject.connectionIds = [sourceConn.id, targetConn.id]

    // 3. Create Demo Pair
    const demoPair = connectionPairsStore.addPair({
      name: 'Demo Flow',
      description: 'Compare source dump vs target dump',
      sourceConnectionId: sourceConn.id,
      targetConnectionId: targetConn.id,
      sourceEnv: 'DEV',
      targetEnv: 'PROD',
      status: 'success',
      isDefault: false
    })

    demoProject.pairIds = [demoPair.id]

    // 4. Switch to Demo Project
    selectProject(demoProject.id)

    return demoPair
  }

  async function createQuickDumpPair(sourcePath: string, targetPath: string, name?: string) {
    const appStore = useAppStore()
    const connectionPairsStore = useConnectionPairsStore()

    const projectName = name || `Instant Compare ${new Date().toLocaleTimeString()}`

    // Extract file names for labels
    const sourceFileName = sourcePath.split(/[/\\]/).pop() || 'Source'
    const targetFileName = targetPath.split(/[/\\]/).pop() || 'Target'

    // 1. Check if an identical project already exists
    const existingProject = projects.value.find(p =>
      p.name === projectName &&
      p.description.includes(sourceFileName) &&
      p.description.includes(targetFileName)
    )

    if (existingProject) {
      selectProject(existingProject.id)
      const pair = connectionPairsStore.connectionPairs.find(p => existingProject.pairIds.includes(p.id))
      if (pair) return pair
    }

    // 2. Create Project
    const quickProject = addProject({
      name: projectName,
      description: `Comparison between ${sourceFileName} and ${targetFileName}`,
      connectionIds: [],
      pairIds: [],
      enabledEnvironmentIds: ['DEV', 'PROD']
    })

    // 2. Create Connections
    const sourceConn = appStore.addConnection({
      name: `Source: ${sourceFileName}`,
      host: sourcePath,
      port: 3306,
      database: 'source',
      username: 'dump',
      environment: 'DEV',
      status: 'idle',
      type: 'dump'
    }, quickProject.id)

    const targetConn = appStore.addConnection({
      name: `Target: ${targetFileName}`,
      host: targetPath,
      port: 3306,
      database: 'target',
      username: 'dump',
      environment: 'PROD',
      status: 'idle',
      type: 'dump'
    }, quickProject.id)

    // Ensure they are linked (addConnection already does this, but being explicit)
    if (!quickProject.connectionIds.includes(sourceConn.id)) quickProject.connectionIds.push(sourceConn.id)
    if (!quickProject.connectionIds.includes(targetConn.id)) quickProject.connectionIds.push(targetConn.id)

    // 3. Create Pair
    const quickPair = connectionPairsStore.addPair({
      name: 'Migration Flow',
      description: `${sourceFileName} → ${targetFileName}`,
      sourceConnectionId: sourceConn.id,
      targetConnectionId: targetConn.id,
      sourceEnv: 'DEV',
      targetEnv: 'PROD',
      status: 'success',
      isDefault: false
    })

    if (!quickProject.pairIds.includes(quickPair.id)) quickProject.pairIds.push(quickPair.id)

    return quickPair
  }

  /**
   * Deep cleanup of orphaned data.
   * Only removes connections/pairs that are NOT referenced by ANY project.
   */
  async function cleanGarbageConnections() {
    const appStore = useAppStore()
    const connectionPairsStore = useConnectionPairsStore()

    // 1. Collect all referenced IDs from all projects
    const referencedConnectionIds = new Set<string>()
    const referencedPairIds = new Set<string>()

    projects.value.forEach(p => {
      ;(p.connectionIds || []).forEach(id => referencedConnectionIds.add(id))
      ;(p.pairIds || []).forEach(id => referencedPairIds.add(id))
    })

    // 2. Also collect IDs referenced by Connection Pairs (to avoid deleting used connections)
    connectionPairsStore.connectionPairs.forEach(pair => {
      // Only if the pair itself is referenced by a project
      if (referencedPairIds.has(pair.id)) {
        if (pair.sourceConnectionId) referencedConnectionIds.add(pair.sourceConnectionId)
        if (pair.targetConnectionId) referencedConnectionIds.add(pair.targetConnectionId)
      }
    })

    // 3. Filter out Orphans (KEEP ONLY REFERENCED)
    const originalConnCount = appStore.connections.length
    const originalPairCount = connectionPairsStore.connectionPairs.length

    appStore.connections = appStore.connections.filter(c => referencedConnectionIds.has(c.id))
    connectionPairsStore.connectionPairs = connectionPairsStore.connectionPairs.filter(p => referencedPairIds.has(p.id))

    if (appStore.connections.length !== originalConnCount || connectionPairsStore.connectionPairs.length !== originalPairCount) {
      console.log(`[Projects] Cleaned orphans: Connections ${originalConnCount} -> ${appStore.connections.length}, Pairs ${originalPairCount} -> ${connectionPairsStore.connectionPairs.length}`)
    }

    // 4. PERSIST CHANGES EXPLICITLY TO DISK
    await Promise.all([
      storage.saveConnections(appStore.connections),
      storage.saveConnectionPairs(connectionPairsStore.connectionPairs),
      storage.saveProjects(projects.value),
      storage.updateSettings({ lastSelectedProjectId: selectedProjectId.value || undefined })
    ])
  }

  return {
    projects,
    isLoaded,
    selectedProjectId,
    currentProject,
    addProject,
    updateProject,
    duplicateProject,
    removeProject,
    selectProject,
    addItemToProject,
    removeItemFromProject,
    setupDemo,
    createQuickDumpPair,
    cleanGarbageConnections,
    reloadData: init,
    viewMode
  }
})
