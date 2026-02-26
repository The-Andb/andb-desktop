import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/vue'
import ConnectionManager from '../ConnectionManager.vue'

// Mock dependencies
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ replace: vi.fn() })
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key })
}))

// Mock Stores
const mockAppStore = {
  connections: [],
  filteredConnections: [],
  testConnection: vi.fn(),
  removeConnection: vi.fn(),
  addConnection: vi.fn(),
  updateConnection: vi.fn()
}

const mockProjectsStore = {
  selectedProjectId: 'proj-1',
  currentProject: null,
  projects: [],
  reloadData: vi.fn()
}

const mockConnectionPairsStore = {
  enabledEnvironments: [
    { name: 'DEV', id: 'DEV' },
    { name: 'PROD', id: 'PROD' }
  ]
}

const mockTemplatesStore = {
  templates: [],
  reloadData: vi.fn()
}

vi.mock('@/stores/app', () => ({
  useAppStore: () => mockAppStore
}))

vi.mock('@/stores/projects', () => ({
  useProjectsStore: () => mockProjectsStore
}))

vi.mock('@/stores/connectionPairs', () => ({
  useConnectionPairsStore: () => mockConnectionPairsStore
}))

vi.mock('@/stores/connectionTemplates', () => ({
  useConnectionTemplatesStore: () => mockTemplatesStore
}))

// Mock Icons
vi.mock('lucide-vue-next', () => ({
  Plus: { template: '<svg data-testid="icon-plus"></svg>' },
  Database: { template: '<svg data-testid="icon-database"></svg>' },
  ShieldQuestion: { template: '<svg data-testid="icon-shield"></svg>' },
  Edit: { template: '<svg data-testid="icon-edit"></svg>' },
  Trash2: { template: '<svg data-testid="icon-trash"></svg>' },
  X: { template: '<svg data-testid="icon-x"></svg>' },
  Copy: { template: '<svg data-testid="icon-copy"></svg>' },
  LayoutGrid: { template: '<svg data-testid="icon-layout"></svg>' },
  List: { template: '<svg data-testid="icon-list"></svg>' },
  RefreshCw: { template: '<svg data-testid="icon-refresh"></svg>' },
  CheckCircle2: { template: '<svg data-testid="icon-check"></svg>' },
  AlertCircle: { template: '<svg data-testid="icon-alert"></svg>' }
}))

// Mock Child Component to avoid complicated rendering of forms
vi.mock('../ConnectionForm.vue', () => ({
  default: {
    template: '<div data-testid="connection-form">Mocked Form</div>',
    props: ['connection'],
    emits: ['save', 'cancel']
  }
}))

describe('ConnectionManager.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAppStore.connections = []
    mockAppStore.filteredConnections = []
  })

  const renderComponent = () => {
    return render(ConnectionManager)
  }

  it('renders the connection manager empty state when no connections exist', async () => {
    mockAppStore.filteredConnections = []
    renderComponent()

    expect(screen.getByText('All Connections')).toBeTruthy()
    expect(screen.getByText('connections.addFirstConnection')).toBeTruthy()
  })

  it('renders a list of connections', async () => {
    mockAppStore.filteredConnections = [
      { id: '1', name: 'Dev DB', host: 'localhost', port: 3306, database: 'test_db', username: 'root', environment: 'DEV', type: 'mysql', status: 'idle' },
      { id: '2', name: 'Prod DB', host: 'prod.com', port: 5432, database: 'prod_db', username: 'admin', environment: 'PROD', type: 'postgres', status: 'idle' }
    ] as any
    renderComponent()

    // Connections should be displayed
    expect(screen.getByText('Dev DB')).toBeTruthy()
    expect(screen.getByText('localhost:3306')).toBeTruthy()
    expect(screen.getByText('test_db')).toBeTruthy()

    expect(screen.getByText('Prod DB')).toBeTruthy()
    expect(screen.getByText('prod.com:5432')).toBeTruthy()
    expect(screen.getByText('prod_db')).toBeTruthy()
  })

  it('switches to add form when "Add Connection" is clicked', async () => {
    renderComponent()

    const addButton = screen.getByText('connections.addConnection')
    await fireEvent.click(addButton)

    // Form should appear
    expect(screen.getByTestId('connection-form')).toBeTruthy()
    expect(screen.getByText('Add New Connection')).toBeTruthy()

    // List should disappear
    expect(screen.queryByText('All Connections')).toBeNull()
  })

  it('switches to environment tabs view when "BY ENVIRONMENT" is clicked', async () => {
    mockAppStore.filteredConnections = [
      { id: '1', name: 'Dev DB', environment: 'DEV', host: '', port: 0, status: 'idle' },
      { id: '2', name: 'Prod DB', environment: 'PROD', host: '', port: 0, status: 'idle' }
    ] as any
    renderComponent()

    const byEnvButton = screen.getByText('BY ENVIRONMENT')
    await fireEvent.click(byEnvButton)

    // The header should change to reflect the tab filtering
    expect(screen.getByText('connections.connectionsFor')).toBeTruthy()

    // Environment tabs like DEV and PROD should be visible (from the mock pair store)
    expect(screen.getByText('DEV')).toBeTruthy()
    expect(screen.getByText('PROD')).toBeTruthy()
  })

  it('calls delete bulk action when bulk delete is used', async () => {
    mockAppStore.filteredConnections = [
      { id: '1', name: 'Conn 1', environment: 'DEV', host: '', port: 0, status: 'idle' },
      { id: '2', name: 'Conn 2', environment: 'DEV', host: '', port: 0, status: 'idle' }
    ] as any

    // Mock window.confirm (happy-dom doesn't have it by default)
    window.confirm = vi.fn().mockReturnValue(true)

    renderComponent()

    // Find all checkboxes
    const checkboxes = screen.getAllByRole('checkbox')
    // The first checkbox is the "select all" in the header
    await fireEvent.click(checkboxes[0])

    const deleteBulkBtn = screen.getByText('Delete')
    await fireEvent.click(deleteBulkBtn)

    expect(window.confirm).toHaveBeenCalled()
    expect(mockAppStore.removeConnection).toHaveBeenCalledTimes(2)
    expect(mockAppStore.removeConnection).toHaveBeenCalledWith('1')
    expect(mockAppStore.removeConnection).toHaveBeenCalledWith('2')
  })

  it('calls duplicate connection action', async () => {
    mockAppStore.filteredConnections = [
      { id: 'custom-1', name: 'To Duplicate', environment: 'DEV', host: 'localhost', port: 1234, status: 'idle' }
    ] as any

    renderComponent()

    // There is no explicit text, we have to find by title 'common.duplicate'
    const duplicateButton = screen.getByTitle('common.duplicate')
    await fireEvent.click(duplicateButton)

    expect(mockAppStore.addConnection).toHaveBeenCalledWith(expect.objectContaining({
      name: 'To Duplicate',
      host: 'localhost',
      port: 1234
    }))
  })
})
