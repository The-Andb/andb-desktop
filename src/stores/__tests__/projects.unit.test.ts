import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock browser globals before stores are imported
if (typeof window === 'undefined') {
  (global as any).window = {
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
      }
    }
  };
  (global as any).matchMedia = (global as any).window.matchMedia;
}

import { setActivePinia, createPinia } from 'pinia'
import { useProjectsStore } from '../projects'
import { useAppStore } from '../app'
import { useConnectionPairsStore } from '../connectionPairs'
import { useConsoleStore } from '../console'
import { useOperationsStore } from '../operations'

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

import { storage } from '@/utils/storage-ipc'
const mockStorage = storage as any

// Mock andb utility
vi.mock('@/utils/andb', () => ({
  default: {
    getSchemas: vi.fn().mockResolvedValue([]),
    testConnection: vi.fn().mockResolvedValue(true)
  }
}))

import { nextTick } from 'vue'

describe('Projects Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockStorage.getProjects.mockResolvedValue([])
    mockStorage.getSettings.mockResolvedValue({})
  })

  it('should initialize with a default project if none exist', async () => {
    const store = useProjectsStore()
    // Await init implicitly done inside the store
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10)) // wait for async init

    expect(store.projects.length).toBe(1)
    expect(store.projects[0].id).toBe('default')
    expect(store.projects[0].name).toBe('Project One')
    expect(store.selectedProjectId).toBe('default')
  })

  it('should add a new project', async () => {
    const store = useProjectsStore()
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    const newProject = store.addProject({
      name: 'Test Project',
      description: 'A test project',
      connectionIds: [],
      pairIds: [],
      enabledEnvironmentIds: ['DEV']
    })

    expect(newProject.id).toBeDefined()
    expect(newProject.name).toBe('Test Project')
    expect(store.projects).toContainEqual(newProject)
  })

  it('should update an existing project', async () => {
    const store = useProjectsStore()
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    const newProject = store.addProject({
      name: 'Test Project',
      description: 'A test project',
      connectionIds: [],
      pairIds: [],
      enabledEnvironmentIds: ['DEV']
    })

    store.updateProject(newProject.id, { name: 'Updated Name', description: 'Updated Desc' })

    const updated = store.projects.find(p => p.id === newProject.id)
    expect(updated?.name).toBe('Updated Name')
    expect(updated?.description).toBe('Updated Desc')
  })

  it('should duplicate a project', async () => {
    const store = useProjectsStore()
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    const baseProject = store.addProject({
      name: 'Base Project',
      description: 'Desc',
      connectionIds: ['c1'],
      pairIds: ['p1'],
      enabledEnvironmentIds: ['DEV']
    })

    const duplicated = store.duplicateProject(baseProject.id)
    expect(duplicated).toBeDefined()
    expect(duplicated?.name).toBe('Base Project (Copy)')
    expect(duplicated?.connectionIds).toEqual(['c1'])
    expect(duplicated?.id).not.toBe(baseProject.id)
  })

  it('should not allow removing the default project', async () => {
    const store = useProjectsStore()
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    store.removeProject('default')
    expect(store.projects.some(p => p.id === 'default')).toBe(true)
  })

  it('should format storage output when saving projects', async () => {
    const store = useProjectsStore()
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    store.addProject({
      name: 'Test Save',
      description: '',
      connectionIds: [],
      pairIds: [],
      enabledEnvironmentIds: []
    })

    await nextTick()
    expect(mockStorage.saveProjects).toHaveBeenCalled()
  })

  it('should reset other stores when project selection changes', async () => {
    const store = useProjectsStore()
    const appStore = useAppStore()
    const pairsStore = useConnectionPairsStore()
    const consoleStore = useConsoleStore()
    const operationsStore = useOperationsStore()

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    const newProject = store.addProject({
      name: 'Test Reset',
      description: '',
      connectionIds: [],
      pairIds: [],
      enabledEnvironmentIds: []
    })

    // Set some dummy data in other stores
    appStore.selectedConnectionId = 'test-conn'
    pairsStore.selectedPairId = 'test-pair'
    consoleStore.logs = [{ type: 'info', message: 'test', timestamp: new Date() }]
    operationsStore.operations = [{ id: '1', projectId: newProject.id, type: 'test' as any, status: 'pending', startTime: new Date() }]

    // Change project
    store.selectProject(newProject.id)
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    // Verify reset
    expect(appStore.selectedConnectionId).toBe('')
    expect(pairsStore.selectedPairId).toBe('')
    expect(consoleStore.logs).toEqual([])
    expect(operationsStore.operations).toEqual([])
  })
})
