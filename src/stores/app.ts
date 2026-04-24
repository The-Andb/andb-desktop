import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { Andb } from '@/utils/andb'
import { storage } from '../utils/storage-ipc'
import { useProjectsStore, projectChangedBus } from './projects'
import { useConnectionTemplatesStore } from './connectionTemplates'


export interface SshConfig {
  enabled: boolean
  host: string
  port: number
  username: string
  password?: string
  privateKeyPath?: string
  passphrase?: string
  jumpHost?: string
}

export interface DatabaseConnection {
  id: string
  name: string
  host: string
  port: number
  database: string
  schema?: string
  username: string
  password?: string
  status: 'idle' | 'connected' | 'testing' | 'failed'
  environment: string
  lastTested?: string
  domainMapping?: {
    from: string  // e.g., '@dev.example.com'
    to: string    // e.g., '@prod.example.com'
  }
  productSettings?: {
    domain?: string
    emailServer?: string
  }
  type?: 'mysql' | 'postgres' | 'sqlite' | 'dump'
  templateId?: string // Optional link to a ConnectionTemplate
  ssh?: SshConfig
  timeout?: number
  useSSL?: boolean
  allowSelfSigned?: boolean
  charset?: string
  timezone?: string
}

export interface ConnectionPair {
  source: DatabaseConnection | null
  target: DatabaseConnection | null
}

export interface AIContext {
  source?: { name: string; ddl: string }
  target?: { name: string; ddl: string }
  objectName: string
  objectType: string
}

export const FONT_SIZE_PROFILES = {
  small: {
    title: 16,
    subtitle: 13,
    content: 12,
    quote: 10,
    code: 11
  },
  medium: {
    title: 18,
    subtitle: 14,
    content: 13,
    quote: 11,
    code: 12
  },
  large: {
    title: 22,
    subtitle: 16,
    content: 15,
    quote: 13,
    code: 14
  }
}

export const useAppStore = defineStore('app', () => {
  // State
  const sidebarCollapsed = ref(false)
  const safeMode = ref(true) // Default to true for safety
  const aiEnabled = ref(true) // Master switch for AI features
  const isInitialized = ref(false)
  const compareMode = ref<'auto' | 'instant'>('auto')
  const compareStack = ref<{
    source: { name: string; ddl: string; type?: string } | null
    target: { name: string; ddl: string; type?: string } | null
  }>({
    source: null,
    target: null
  })
  const isCompareStackVisible = ref(false)

  // ... (inside the store factory)
  const buttonStyle = ref<'full' | 'minimal' | 'icons'>('full')
  const navStyle = ref<'vertical-list' | 'horizontal-tabs'>('vertical-list')
  const fontSizes = ref({
    title: 18,
    subtitle: 14,
    content: 13,
    quote: 11,
    code: 12
  })
  const fontFamilies = ref({
    general: "'Inter', sans-serif",
    code: "'JetBrains Mono', monospace"
  })
  const fontSizeProfile = ref<'small' | 'medium' | 'large' | 'custom'>('medium')

  // Store the last custom configuration to restore it when switching back to Custom
  const lastCustomFontSizes = ref({ ...FONT_SIZE_PROFILES.medium })
  const hiddenHorizontalTabs = ref<string[]>([])

  const connections = ref<DatabaseConnection[]>([])

  // Global Schema Fetching State
  const isSchemaFetching = ref(false)
  const schemaFetchMessage = ref('')
  const activeFetchConnectionId = ref<string | null>(null)
  const schemaFetchProgresses = ref<Record<string, { current: number; total: number; type: string; objectName: string; connectionName?: string }>>({})

  // Telemetry Identity
  const installationId = ref<string>('')

  const layoutSettings = ref({
    sidebar: true,
    breadcrumbs: true,
    toolbar: true,
    sidebarPosition: 'left' as 'left' | 'right',
    aiPanel: false,
    aiPanelPosition: 'right' as 'left' | 'right',
    aiPanelWidth: 320
  })

  // Global AI Context
  const aiContext = ref<AIContext | null>(null)

  // Initialize state
  let initPromise: Promise<void> | null = null

  const init = async () => {
    if (initPromise) return initPromise

    initPromise = (async () => {
      const savedSettings = await storage.getSettings()
      sidebarCollapsed.value = savedSettings.sidebarCollapsed
      buttonStyle.value = savedSettings.buttonStyle || 'full'
      navStyle.value = savedSettings.navStyle || 'vertical-list'
      
      if (savedSettings.layoutSettings) {
        layoutSettings.value = { ...layoutSettings.value, ...savedSettings.layoutSettings }
      }
      if (savedSettings.fontSizes) {
        fontSizes.value = { ...fontSizes.value, ...savedSettings.fontSizes }
      }
      if (savedSettings.fontFamilies) {
        fontFamilies.value = { ...fontFamilies.value, ...savedSettings.fontFamilies }
      }
      if (savedSettings.fontSizeProfile) {
        fontSizeProfile.value = savedSettings.fontSizeProfile
      }
      if (savedSettings.hiddenHorizontalTabs) {
        hiddenHorizontalTabs.value = savedSettings.hiddenHorizontalTabs
      }
      if (savedSettings.lastCustomFontSizes) {
        lastCustomFontSizes.value = { ...lastCustomFontSizes.value, ...savedSettings.lastCustomFontSizes }
      }

      safeMode.value = savedSettings.safeMode !== undefined ? savedSettings.safeMode : true
      aiEnabled.value = savedSettings.aiEnabled !== undefined ? savedSettings.aiEnabled : true

      // If we loaded 'custom', we should ensure fontSizes reflects the loaded values (already done by fontSizes loading logic above)
      // If we loaded a profile, apply it to ensure consistency.

      // Manage Installation ID
      if (savedSettings.installationId) {
        installationId.value = savedSettings.installationId
      } else {
        installationId.value = generateId()
        storage.updateSettings({ installationId: installationId.value })
      }

      selectedConnectionId.value = savedSettings.lastSelectedConnectionId || '1' // Fallback to DEV (id 1) if none

      const savedConnections = await storage.getConnections()
      // storage.getConnections() now handles deduplication internally via _deduplicateConnections
      if (savedConnections.length > 0) {
        connections.value = savedConnections
      } else {
        // Default demo connections
        connections.value = [
          {
            id: '1',
            name: 'DEV',
            host: '127.0.0.1',
            port: 3306,
            database: 'dev_database',
            username: 'root',
            password: 'root123',
            status: 'idle',
            environment: 'DEV'
          },
          {
            id: '2',
            name: 'STAGE',
            host: '127.0.0.1',
            port: 3307,
            database: 'stage_database',
            username: 'root',
            password: 'root123',
            status: 'idle',
            environment: 'STAGE'
          },
          {
            id: '3',
            name: 'UAT',
            host: '127.0.0.1',
            port: 3308,
            database: 'uat_database',
            username: 'root',
            password: 'root123',
            status: 'idle',
            environment: 'UAT'
          },
          {
            id: '4',
            name: 'PROD',
            host: '127.0.0.1',
            port: 3309,
            database: 'prod_database',
            username: 'root',
            password: 'root123',
            status: 'idle',
            environment: 'PROD'
          }
        ]

        // Not automatically assigning demo connections anymore since there's no guaranteed default project
        const projectsStore = useProjectsStore()
        if (projectsStore.projects.length === 0) {
          await projectsStore.reloadData()
        }
      }
      isInitialized.value = true
    })()

    try {
      await initPromise
    } finally {
      initPromise = null
    }
  }

  // Call init
  init()

  const currentPair = ref<ConnectionPair>({
    source: null,
    target: null
  })

  // Global selected connection for exploration (Schema view, etc)
  const selectedConnectionId = ref<string>('')

  projectChangedBus.on(() => {
    selectedConnectionId.value = ''
  })

  const filteredConnections = computed(() => {
    const projectsStore = useProjectsStore()
    const project = projectsStore.currentProject

    // Filter by both IDs assigned to the project AND the environments enabled for this project
    if (!project) return []
    return resolvedConnections.value.filter(conn =>
      project.connectionIds.includes(conn.id) &&
      project.enabledEnvironmentIds.includes(conn.environment)
    )
  })

  /**
   * RESOLVED CONNECTIONS (Single Source of Truth)
   * This computed property dynamically merges global template credentials
   * into project-level connections that reference them.
   */
  const resolvedConnections = computed<DatabaseConnection[]>(() => {
    const templatesStore = useConnectionTemplatesStore()

    return connections.value.map(conn => {
      // 1. If explicit templateId exists, use it
      let template = conn.templateId
        ? templatesStore.templates.find(t => t.id === conn.templateId)
        : null

      // 2. Legacy Fallback: Match by infrastructure details if no templateId
      if (!template && conn.host && conn.host !== 'localhost' && conn.host !== 'file') {
        template = templatesStore.templates.find(t =>
          t.host === conn.host &&
          (t.port === conn.port || !conn.port) &&
          t.username === conn.username
        ) || null
      }

      if (!template) return { ...conn }

      // 3. Resolve Connection (Template is Single Source of Truth for infrastructure)
      return {
        ...conn,
        // Infrastructure: Template ALWAYS wins if it exists (SSoT)
        host: template.host || conn.host,
        port: template.port || conn.port,
        username: template.username || conn.username,
        password: template.password || conn.password,
        ssh: template.ssh || conn.ssh,
        type: template.type || conn.type || 'mysql',
        // TemplateId is preserved
        templateId: template.id
      }
    })
  })

  // Getters using resolved connections
  const getConnectionById = computed(() => {
    return (id: string) => resolvedConnections.value.find(conn => conn.id === id)
  })

  const getConnectionsByEnvironment = computed(() => {
    return (env: string) => filteredConnections.value.filter(conn => conn.environment === env)
  })



  const isPairValid = computed(() => {
    return currentPair.value.source && currentPair.value.target
  })

  // Watch and auto-save to storage
  watch(
    connections,
    newConnections => {
      storage.saveConnections(newConnections)
    },
    { deep: true }
  )

  // Auto-select first connection if current one becomes invalid (e.g. project switch)
  watch(() => filteredConnections.value, (newConns) => {
    const projectsStore = useProjectsStore()
    if (newConns.length > 0) {
      if (!newConns.some(c => c.id === selectedConnectionId.value)) {
        selectedConnectionId.value = newConns[0].id
      }
    } else if (projectsStore.isLoaded) {
      selectedConnectionId.value = ''
    }
  }, { immediate: true })

  watch(sidebarCollapsed, newValue => {
    storage.updateSettings({ sidebarCollapsed: newValue })
  })


  watch(safeMode, newValue => {
    storage.updateSettings({ safeMode: newValue })
  })

  watch(aiEnabled, newValue => {
    storage.updateSettings({ aiEnabled: newValue })
  })

  watch(navStyle, newValue => {
    storage.updateSettings({ navStyle: newValue })
  })

  watch(buttonStyle, newValue => {
    storage.updateSettings({ buttonStyle: newValue })
  })

  watch(fontSizes, newValue => {
    storage.updateSettings({ fontSizes: { ...newValue } })

    // If we make Manual changes while in 'custom' mode, update our lastCustomFontSizes
    if (fontSizeProfile.value === 'custom') {
      lastCustomFontSizes.value = { ...newValue }
      storage.updateSettings({ lastCustomFontSizes: { ...newValue } })
    }
  }, { deep: true })

  watch(fontSizeProfile, newValue => {
    storage.updateSettings({ fontSizeProfile: newValue })
  })

  watch(fontFamilies, newValue => {
    storage.updateSettings({ fontFamilies: { ...newValue } })
  }, { deep: true })

  watch(hiddenHorizontalTabs, newValue => {
    storage.updateSettings({ hiddenHorizontalTabs: newValue })
  }, { deep: true })

  watch(selectedConnectionId, newValue => {
    storage.updateSettings({ lastSelectedConnectionId: newValue })
  })

  watch(layoutSettings, newValue => {
    storage.updateSettings({ layoutSettings: { ...newValue } })
  }, { deep: true })

  const generateId = () => {
    try {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID()
      }
      return 'c-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9)
    } catch (e) {
      return 'c-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9)
    }
  }

  // Actions
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  const setConnectionPair = (sourceId: string, targetId: string) => {
    const source = getConnectionById.value(sourceId)
    const target = getConnectionById.value(targetId)

    if (source && target) {
      currentPair.value = { source, target }
    }
  }

  const addConnection = (connection: Omit<DatabaseConnection, 'id'>, projectId?: string) => {
    // Check for duplicates (same host, port, database, and name)
    const existing = connections.value.find(c => 
      c.host === connection.host && 
      c.port === connection.port && 
      c.database === connection.database &&
      c.name === connection.name &&
      c.environment === connection.environment &&
      (c.type || 'mysql') === (connection.type || 'mysql')
    )

    if (existing) {
      if (projectId) {
        const projectsStore = useProjectsStore()
        projectsStore.addItemToProject('connection', existing.id, projectId)
      }
      return existing
    }

    const newConnection: DatabaseConnection = {
      ...connection,
      id: generateId()
    }
    connections.value.push(newConnection)

    // Register to specified or current project
    const projectsStore = useProjectsStore()
    const targetProjectId = projectId || projectsStore.selectedProjectId

    if (targetProjectId) {
      // Use a robust way to ensure we link to the right project even if it's new
      const project = projectsStore.projects.find(p => p.id === targetProjectId)
      if (project) {
        if (!project.connectionIds.includes(newConnection.id)) {
          project.connectionIds.push(newConnection.id)
        }
      } else {
        // Fallback for simple addition if project object isn't found in list yet
        projectsStore.addItemToProject('connection', newConnection.id, targetProjectId)
      }
    }

    return newConnection
  }

  const updateConnection = (id: string, updates: Partial<DatabaseConnection>) => {
    const index = connections.value.findIndex(conn => conn.id === id)
    if (index !== -1) {
      connections.value[index] = { ...connections.value[index], ...updates }
    }
  }

  const removeConnection = async (id: string) => {
    const conn = getConnectionById.value(id)
    if (conn) {
      // Clear cached data for this connection
      await Andb.clearConnectionData(conn)
    }

    const projectsStore = useProjectsStore()
    const currentProjectId = projectsStore.selectedProjectId

    // 1. Unlink from Current Project (Atomic Delete)
    if (currentProjectId) {
      const currentProject = projectsStore.projects.find(p => p.id === currentProjectId)
      if (currentProject) {
        currentProject.connectionIds = currentProject.connectionIds.filter(cid => cid !== id)
        // Trigger reactivity and save
        // Note: projectsStore watcher watches 'projects', so mutation triggers save.
        // But to be safe and explicit given the bug report:
        // We rely on the watcher in projects.ts
      }
    }

    // 2. Prevent Orphaned Connections: Garbage Collect immediately
    // If we are deleting explicitly, we should remove it from the system OR check usage.
    // Given the objective "Prevent connections from existing independently", we should remove it.

    // Check if this connection is used by ANY other project
    const isUsed = projectsStore.projects.some(p => p.id !== currentProjectId && p.connectionIds.includes(id))

    if (isUsed) {
      console.log(`Connection ${id} is still used by other projects. Unlinking from current only.`)
    } else {
      console.log(`Connection ${id} is now orphaned. Removing from global registry.`)
      connections.value = connections.value.filter(conn => conn.id !== id)
    }
  }

  const testConnection = async (id: string) => {
    const connection = getConnectionById.value(id)
    if (!connection) return

    updateConnection(id, { status: 'testing' })

    try {
      const result = await Andb.testConnection(connection)
      updateConnection(id, {
        status: result.success ? 'connected' : 'failed',
        lastTested: new Date().toISOString()
      })
      return result.success
    } catch (error: any) {
      if (window.electronAPI) {
        window.electronAPI.log.send('error', `Connection test error for connection ID: ${id}`, error.message)
      }
      updateConnection(id, { status: 'failed' })
      return false
    }
  }

  const resetConnections = async () => {
    connections.value = [
      {
        id: '1',
        name: 'DEV',
        host: '127.0.0.1',
        port: 3306,
        database: 'dev_database',
        username: 'root',
        password: 'root123',
        status: 'idle',
        environment: 'DEV'
      },
      {
        id: '2',
        name: 'STAGE',
        host: '127.0.0.1',
        port: 3307,
        database: 'stage_database',
        username: 'root',
        password: 'root123',
        status: 'idle',
        environment: 'STAGE'
      },
      {
        id: '3',
        name: 'UAT',
        host: '127.0.0.1',
        port: 3308,
        database: 'uat_database',
        username: 'root',
        password: 'root123',
        status: 'idle',
        environment: 'UAT'
      },
      {
        id: '4',
        name: 'PROD',
        host: '127.0.0.1',
        port: 3309,
        database: 'prod_database',
        username: 'root',
        password: 'root123',
        status: 'idle',
        environment: 'PROD'
      }
    ]
    await storage.saveConnections(connections.value)
  }


  const applyFontSizeProfile = (profileKey: 'small' | 'medium' | 'large' | 'custom') => {
    fontSizeProfile.value = profileKey
    if (profileKey === 'custom') {
      // Restore last custom configuration
      fontSizes.value = { ...lastCustomFontSizes.value }
    } else if (FONT_SIZE_PROFILES[profileKey]) {
      fontSizes.value = { ...FONT_SIZE_PROFILES[profileKey] }
    }
  }
  const clearCompareStack = () => {
    compareStack.value = { source: null, target: null }
    isCompareStackVisible.value = false
  }

  const isDark = ref(false)

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    isDark.value = true
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    isDark.value = event.matches
  })

  return {
    // State
    isInitialized,
    sidebarCollapsed,
    safeMode,
    aiEnabled,
    isDark,
    buttonStyle,
    navStyle,
    fontSizes,
    fontFamilies,
    fontSizeProfile,
    layoutSettings,
    hiddenHorizontalTabs,
    lastCustomFontSizes,
    connections,
    resolvedConnections,
    filteredConnections,
    currentPair,

    selectedConnectionId,
    installationId,
    compareMode,
    compareStack,
    isCompareStackVisible,
    clearCompareStack,

    // App-wide locks & progress
    isSchemaFetching,
    schemaFetchMessage,
    activeFetchConnectionId,
    schemaFetchProgresses,

    updateSchemaProgress: (id: string, progress: any) => {
      schemaFetchProgresses.value[id] = progress
      isSchemaFetching.value = Object.keys(schemaFetchProgresses.value).length > 0
    },

    removeSchemaProgress: (id: string) => {
      delete schemaFetchProgresses.value[id]
      isSchemaFetching.value = Object.keys(schemaFetchProgresses.value).length > 0
    },

    // Getters
    getConnectionById,
    getConnectionsByEnvironment,
    isPairValid,

    // Actions
    toggleSidebar,
    setConnectionPair,
    addConnection,
    updateConnection,
    removeConnection,
    testConnection,
    resetConnections,
    applyFontSizeProfile,
    generateId,
    clearAllStatuses: () => {
      connections.value.forEach(conn => {
        conn.status = 'idle'
      })
    },
    reloadData: init,
    
    // AI Trigger signalling
    aiContext,
    aiReviewTrigger: ref(0),
    requestAiReview: () => {
      layoutSettings.value.aiPanel = true
      // Incrementing a counter is a simple, effective signal that watchers can detect
      // @ts-ignore
      const appStore = useAppStore()
      appStore.aiReviewTrigger++
    }
  }
})
