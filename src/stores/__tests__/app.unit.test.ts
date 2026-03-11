import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock browser globals
if (typeof window === 'undefined') {
  (global as any).window = {
    crypto: {
      randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(2, 9)
    },
    matchMedia: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
    electronAPI: {
      storage: {
        get: vi.fn().mockResolvedValue({ success: true, data: null }),
        set: vi.fn().mockResolvedValue({ success: true }),
        delete: vi.fn().mockResolvedValue({ success: true }),
      },
      log: {
        send: vi.fn()
      }
    }
  };
  (global as any).matchMedia = (global as any).window.matchMedia;
}

// Mock storage-ipc
vi.mock('@/utils/storage-ipc', () => ({
  storage: {
    getProjects: vi.fn().mockResolvedValue([]),
    getConnections: vi.fn().mockResolvedValue([]),
    getConnectionPairs: vi.fn().mockResolvedValue([]),
    getEnvironments: vi.fn().mockResolvedValue([]),
    getConnectionTemplates: vi.fn().mockResolvedValue([]),
    getSettings: vi.fn().mockResolvedValue({}),
    get: vi.fn().mockImplementation((key) => {
      if (key === 'connectionTemplates') return Promise.resolve([])
      if (key === 'projects' || key === 'connections') return Promise.resolve([])
      return Promise.resolve(null)
    }),
    set: vi.fn().mockResolvedValue({ success: true }),
    updateSettings: vi.fn().mockResolvedValue({}),
    saveProjects: vi.fn().mockResolvedValue({}),
    saveConnections: vi.fn().mockResolvedValue({}),
    saveConnectionPairs: vi.fn().mockResolvedValue({}),
    saveEnvironments: vi.fn().mockResolvedValue({}),
    saveConnectionTemplates: vi.fn().mockResolvedValue({}),
  }
}))

// Mock Andb utility for testConnection and clearConnectionData
vi.mock('@/utils/andb', () => ({
  Andb: {
    testConnection: vi.fn().mockResolvedValue({ success: true }),
    clearConnectionData: vi.fn().mockResolvedValue(true)
  }
}))

import { setActivePinia, createPinia } from 'pinia'
import { useAppStore, FONT_SIZE_PROFILES } from '../app'
import { useProjectsStore } from '../projects'
import { storage } from '@/utils/storage-ipc'
import { Andb } from '@/utils/andb'
import { nextTick } from 'vue'

const mockStorage = storage as any

describe('App Store (Connections & UI Settings)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockStorage.getSettings.mockResolvedValue({})
    mockStorage.getConnections.mockResolvedValue([])
    mockStorage.getProjects.mockResolvedValue([])
  })

  it('should initialize with default UI settings and demo connections if empty', async () => {
    const store = useAppStore()
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 20))

    expect(store.connections.length).toBe(4) // DEV, STAGE, UAT, PROD defaults
    expect(store.sidebarCollapsed).toBeFalsy()
    expect(store.buttonStyle).toBe('full')
  })

  it('should add a connection and link it to the selected project', async () => {
    const store = useAppStore()
    const projectsStore = useProjectsStore()

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    const project = projectsStore.addProject({
      name: 'Test Project',
      description: '',
      connectionIds: [],
      pairIds: [],
      enabledEnvironmentIds: ['DEV']
    })
    projectsStore.selectProject(project.id)

    const connData = {
      name: 'Test DB',
      host: 'localhost',
      port: 3306,
      database: 'test',
      username: 'root',
      status: 'idle' as const,
      environment: 'DEV' as const
    }

    const newConn = store.addConnection(connData)
    expect(newConn.id).toBeDefined()
    expect(newConn.name).toBe('Test DB')
    expect(store.connections).toContainEqual(newConn)
    expect(project.connectionIds).toContain(newConn.id)
  })

  it('should not add a duplicate connection but return the existing one', async () => {
    const store = useAppStore()
    const projectsStore = useProjectsStore()

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    const project = projectsStore.addProject({
      name: 'Test Project',
      description: '',
      connectionIds: [],
      pairIds: [],
      enabledEnvironmentIds: ['DEV']
    })
    projectsStore.selectProject(project.id)

    const connData = {
      name: 'Test DB',
      host: 'localhost',
      port: 3306,
      database: 'test',
      username: 'root',
      status: 'idle' as const,
      environment: 'DEV' as const
    }

    const c1 = store.addConnection(connData)
    const c2 = store.addConnection(connData)

    expect(c1.id).toBe(c2.id)
    expect(store.connections.filter(c => c.name === 'Test DB').length).toBe(1)
  })

  it('should remove connection from global registry if it becomes orphaned', async () => {
    const store = useAppStore()
    const projectsStore = useProjectsStore()

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    const project = projectsStore.addProject({
      name: 'Test Project',
      description: '',
      connectionIds: [],
      pairIds: [],
      enabledEnvironmentIds: ['DEV']
    })
    projectsStore.selectProject(project.id)

    const c1 = store.addConnection({
      name: 'To Be Deleted',
      host: 'localhost',
      port: 3306,
      database: 'test',
      username: 'root',
      status: 'idle',
      environment: 'DEV'
    })

    expect(store.connections.find(c => c.id === c1.id)).toBeDefined()
    expect(project.connectionIds).toContain(c1.id)

    await store.removeConnection(c1.id)

    // Should be unlinked
    expect(project.connectionIds).not.toContain(c1.id)
    // Should be removed globally since it's orphaned
    expect(store.connections.find(c => c.id === c1.id)).toBeUndefined()
    expect(Andb.clearConnectionData).toHaveBeenCalled()
  })

  it('should test a connection and update its status', async () => {
    const store = useAppStore()
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    // Assuming default connections are loaded
    const connId = store.connections[0].id
    await store.testConnection(connId)

    const conn = store.getConnectionById(connId)
    expect(conn?.status).toBe('connected')
    expect(Andb.testConnection).toHaveBeenCalledWith(expect.objectContaining({ id: connId, name: 'DEV' }))
  })

  it('should apply pre-defined font size profiles correctly', async () => {
    const store = useAppStore()
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    store.applyFontSizeProfile('small')
    expect(store.fontSizes).toEqual(FONT_SIZE_PROFILES.small)

    store.applyFontSizeProfile('large')
    expect(store.fontSizes).toEqual(FONT_SIZE_PROFILES.large)
  })
})
