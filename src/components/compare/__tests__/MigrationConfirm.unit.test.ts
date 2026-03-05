import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/vue'
import MigrationConfirm from '../MigrationConfirm.vue'

// Mock dependencies
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key })
}))

const mockAppStore = {
  fontFamilies: { code: 'monospace' },
  fontSizes: { code: 12 }
}

vi.mock('@/stores/app', () => ({
  useAppStore: () => mockAppStore
}))

// Mock Icons
vi.mock('lucide-vue-next', () => ({
  Zap: { template: '<svg data-testid="icon-zap"></svg>' },
  ArrowRight: { template: '<svg data-testid="icon-arrow"></svg>' },
  AlertTriangle: { template: '<svg data-testid="icon-alert"></svg>' },
  Table: { template: '<svg data-testid="icon-table"></svg>' },
  Layers: { template: '<svg data-testid="icon-layers"></svg>' },
  Database: { template: '<svg data-testid="icon-database"></svg>' },
  Trash2: { template: '<svg data-testid="icon-trash"></svg>' },
  PlusCircle: { template: '<svg data-testid="icon-plus"></svg>' },
  FileEdit: { template: '<svg data-testid="icon-edit"></svg>' },
  Terminal: { template: '<svg data-testid="icon-terminal"></svg>' },
  Copy: { template: '<svg data-testid="icon-copy"></svg>' },
  Check: { template: '<svg data-testid="icon-check"></svg>' },
  List: { template: '<svg data-testid="icon-list"></svg>' },
  Workflow: { template: '<svg data-testid="icon-workflow"></svg>' },
  Sigma: { template: '<svg data-testid="icon-sigma"></svg>' }
}))

// Mock DDLViewer to avoid rendering complex Monaco/highlighting components
vi.mock('@/components/ddl/DDLViewer.vue', () => ({
  default: {
    template: '<div data-testid="ddl-viewer">{{ content }}</div>',
    props: ['content']
  }
}))

describe('MigrationConfirm.vue', () => {
  const renderComponent = (props = {}) => {
    return render(MigrationConfirm, {
      props: {
        isOpen: true,
        loading: false,
        sourceName: 'DEV',
        targetName: 'PROD',
        item: { name: 'users', type: 'tables', status: 'new' }, // Single item by default
        sqlScript: 'CREATE TABLE users (id INT);',
        ...props
      },
      global: {
        mocks: {
          $t: (key: string) => key
        }
      }
    })
  }

  it('renders single item migration correctly', () => {
    renderComponent()

    // Header should say single
    expect(screen.getByText('migration.titleSingle')).toBeTruthy()
    // It should have the correct source/target breadcrumbs
    expect(screen.getByText('DEV')).toBeTruthy()
    expect(screen.getByText('PROD')).toBeTruthy()

    // It should display the SQL
    expect(screen.getByTestId('ddl-viewer')).toBeTruthy()
    expect(screen.getByText('CREATE TABLE users (id INT);')).toBeTruthy()
  })

  it('renders batch mode with grouped items and summary', () => {
    renderComponent({
      item: {
        isBatch: true,
        items: [
          { name: 'users', type: 'tables', status: 'new' },
          { name: 'posts', type: 'tables', status: 'modified' },
          { name: 'get_users', type: 'procedures', status: 'deprecated' }
        ]
      },
      sqlMap: {
        'tables-users': 'CREATE TABLE users (id INT);',
        'tables-posts': 'ALTER TABLE posts ADD COLUMN views INT;',
        'procedures-get_users': 'DROP PROCEDURE get_users;'
      }
    })

    // Header should say batch
    expect(screen.getByText('migration.titleBatch')).toBeTruthy()

    // Summary numbers should be displayed (3 items, 2 types)
    expect(screen.getAllByText('3')).toBeTruthy() // Total items
    expect(screen.getAllByText('2')).toBeTruthy() // Types changed (tables, procedures)

    // Verify groups and items are rendered
    expect(screen.getByText('tables')).toBeTruthy()
    expect(screen.getByText('procedures')).toBeTruthy()
    expect(screen.getByText('users')).toBeTruthy()
    expect(screen.getByText('posts')).toBeTruthy()
    expect(screen.getByText('get_users')).toBeTruthy()

    // Verify first item's SQL is rendered because it auto-selects
    expect(screen.getByText('CREATE TABLE users (id INT);')).toBeTruthy()
  })

  it('disables confirm button and shows warning if target is static (dump file)', () => {
    renderComponent({
      targetIsStatic: true
    })

    // Confirm button should be disabled
    const confirmBtn = screen.getByRole('button', { name: /migration\.actionSingle/ })
    expect(confirmBtn.hasAttribute('disabled')).toBe(true)

    // Should show static warning label
    expect(screen.getByText('migration.staticWarning')).toBeTruthy()
  })

  it('emits close and confirm events correctly', async () => {
    const { emitted } = renderComponent()

    const cancelBtn = screen.getByText('common.cancel')
    await fireEvent.click(cancelBtn)
    expect(emitted()).toHaveProperty('close')

    const confirmBtn = screen.getByRole('button', { name: /migration\.actionSingle/ })
    await fireEvent.click(confirmBtn)
    expect(emitted()).toHaveProperty('confirm')
  })

  it('switches SQL preview when clicking different items in batch mode', async () => {
    renderComponent({
      item: {
        isBatch: true,
        items: [
          { name: 'users', type: 'tables', status: 'new' },
          { name: 'posts', type: 'tables', status: 'modified' }
        ]
      },
      sqlMap: {
        'tables-users': 'CREATE TABLE users (id INT);',
        'tables-posts': 'ALTER TABLE posts ADD COLUMN views INT;'
      }
    })

    // Initially shows first item
    expect(screen.getByText('CREATE TABLE users (id INT);')).toBeTruthy()

    // Click second item
    const postsItem = screen.getByText('posts')
    await fireEvent.click(postsItem)

    // It should now show the SQL for posts
    expect(screen.getByText('ALTER TABLE posts ADD COLUMN views INT;')).toBeTruthy()
  })
})
