import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock browser globals
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
        get: vi.fn().mockResolvedValue({ success: true, data: {} }),
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
    getSettings: vi.fn().mockResolvedValue({}),
    get: vi.fn().mockResolvedValue({}),
    updateSettings: vi.fn().mockResolvedValue({}),
    saveProjects: vi.fn().mockResolvedValue({}),
    saveConnections: vi.fn().mockResolvedValue({}),
    saveConnectionPairs: vi.fn().mockResolvedValue({}),
    saveEnvironments: vi.fn().mockResolvedValue({}),
  }
}))

import { setActivePinia, createPinia } from 'pinia'
import { useConnectionPairsStore } from '../connectionPairs'
import { useProjectsStore } from '../projects'
import { useAppStore } from '../app'
import { storage } from '@/utils/storage-ipc'
import { nextTick } from 'vue'

const mockStorage = storage as any

describe('ConnectionPairs Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockStorage.getEnvironments.mockResolvedValue([])
    mockStorage.getConnectionPairs.mockResolvedValue([])
  })

  it('should initialize with default environments and pairs if storage is empty', async () => {
    const store = useConnectionPairsStore()
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(store.environments.length).toBe(4) // DEV, STAGE, UAT, PROD
    expect(store.connectionPairs.length).toBe(3) // Default pairs
    expect(store.selectedPairId).toBe('1')
  })

  it('should add a custom connection pair', async () => {
    const store = useConnectionPairsStore()
    // const useProjectsStore() = useProjectsStore() // Needed for registering to project

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    const newPair = store.addPair({
      name: 'Custom Flow',
      sourceEnv: 'DEV',
      targetEnv: 'PROD',
      description: 'Test custom flow',
      isDefault: false,
      status: 'idle'
    })

    expect(newPair.id).toBeDefined()
    expect(newPair.name).toBe('Custom Flow')
    expect(store.connectionPairs).toContainEqual(newPair)
  })

  it('should not add a duplicate connection pair but return existing', async () => {
    const store = useConnectionPairsStore()
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    const pairData = {
      name: 'Duplicate Flow',
      sourceEnv: 'DEV',
      targetEnv: 'PROD',
      description: 'Test duplicate flow',
      isDefault: false,
      status: 'idle' as const
    }

    const newPair = store.addPair(pairData)
    const duplicatePair = store.addPair(pairData)

    expect(newPair.id).toBe(duplicatePair.id) // Should return the exact same object id
    expect(store.connectionPairs.filter(p => p.name === 'Duplicate Flow').length).toBe(1)
  })

  it('should set default pair and auto-select it', async () => {
    const store = useConnectionPairsStore()
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    store.setDefaultPair('2')

    expect(store.selectedPairId).toBe('2')
    expect(store.connectionPairs.find(p => p.id === '2')?.isDefault).toBe(true)
    expect(store.connectionPairs.find(p => p.id === '1')?.isDefault).toBe(false)
  })

  it('should compute availablePairs combining custom and auto-generated pairs', async () => {
    const store = useConnectionPairsStore()
    // const useProjectsStore() = useProjectsStore()
    const appStore = useAppStore()

    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 10))

    // Set up a mock project with specific environments and connections
    const testProject = useProjectsStore().addProject({
      name: 'Test Project',
      description: '',
      connectionIds: ['c1', 'c2'],
      pairIds: ['custom-pair'],
      enabledEnvironmentIds: ['DEV', 'PROD']
    })
    useProjectsStore().selectProject(testProject.id)

    appStore.connections = [
      { id: 'c1', environment: 'DEV', name: 'Dev DB', host: '', port: 0, database: '', username: '', password: '', status: 'idle' },
      { id: 'c2', environment: 'PROD', name: 'Prod DB', host: '', port: 0, database: '', username: '', password: '', status: 'idle' }
    ]

    store.connectionPairs = [
      { id: 'custom-pair', name: 'My Custom Pair', sourceEnv: 'DEV', targetEnv: 'PROD', description: '', isDefault: false, status: 'idle' }
    ]

    await nextTick()

    // 1 custom + Auto-generated DEV to PROD should be deduplicated (auto-pick shouldn't duplicate existing route if exact match is custom pair)
    // Actually the logic uses project.pairIds to find custom pairs, and then ignores auto-generated if route exists
    // Wait, the test uses DEV->PROD custom pair, so auto-pair is skipped.
    const pairs = store.availablePairs
    expect(pairs.length).toBe(1)
    expect(pairs[0].name).toBe('My Custom Pair')
  })
})
