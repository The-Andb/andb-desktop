import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/vue'
import SchemaDiagram from '../SchemaDiagram.vue'

// Mock dependencies
vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,...')
}))

vi.mock('lucide-vue-next', () => ({
  Table: { template: '<svg data-testid="icon-table"></svg>' },
  Key: { template: '<svg data-testid="icon-key"></svg>' },
  Circle: { template: '<svg data-testid="icon-circle"></svg>' },
  Minus: { template: '<svg data-testid="icon-minus"></svg>' },
  Plus: { template: '<svg data-testid="icon-plus"></svg>' },
  Maximize2: { template: '<svg data-testid="icon-maximize"></svg>' },
  LayoutTemplate: { template: '<svg data-testid="icon-layout"></svg>' },
  MousePointer2: { template: '<svg data-testid="icon-pointer"></svg>' },
  GitBranch: { template: '<svg data-testid="icon-branch"></svg>' },
  Grid3X3: { template: '<svg data-testid="icon-grid"></svg>' },
  Search: { template: '<svg data-testid="icon-search"></svg>' },
  Download: { template: '<svg data-testid="icon-download"></svg>' },
  RefreshCw: { template: '<svg data-testid="icon-refresh"></svg>' }
}))

vi.mock('@/utils/andb', () => ({
  default: {
    parseTable: vi.fn().mockImplementation(async (ddl: string) => {
      if (ddl.includes('CREATE TABLE users')) {
        return {
          columns: [
            { name: 'id', type: 'INT', pk: true },
            { name: 'email', type: 'VARCHAR(255)', pk: false }
          ],
          primaryKey: ['id']
        }
      }
      if (ddl.includes('CREATE TABLE posts')) {
        return {
          columns: [
            { name: 'id', type: 'INT', pk: true },
            { name: 'user_id', type: 'INT', pk: false },
            { name: 'title', type: 'VARCHAR(100)', pk: false }
          ],
          primaryKey: ['id']
        }
      }
      return { columns: [], primaryKey: [] }
    })
  }
}))

describe('SchemaDiagram.vue', () => {
  const baseTables = [
    {
      name: 'users',
      ddl: `
        CREATE TABLE users (
          id INT PRIMARY KEY,
          email VARCHAR(255)
        )
      `
    },
    {
      name: 'posts',
      ddl: `
        CREATE TABLE posts (
          id INT PRIMARY KEY,
          user_id INT,
          title VARCHAR(100)
        )
      `
    }
  ]

  const renderComponent = (props = {}) => {
    return render(SchemaDiagram, {
      props: {
        tables: baseTables,
        ...props
      }
    })
  }

  it('renders tables correctly and parses columns from DDL', async () => {
    const { } = renderComponent()

    // Ensure headers exist
    expect(await screen.findByText('users')).toBeTruthy()
    expect(await screen.findByText('posts')).toBeTruthy()

    // Ensure columns are parsed and rendered
    expect(screen.getAllByText('id').length).toBe(2)
    expect(screen.getByText('email')).toBeTruthy()
    expect(screen.getByText('user_id')).toBeTruthy()
  })

  it('toggles detail levels (names, keys, all)', async () => {
    renderComponent()

    // Default is "all", so 'email' (non-pk) is visible
    expect(await screen.findByText('email')).toBeTruthy()

    // Switch to 'names'
    const namesBtn = screen.getByText('names')
    await fireEvent.click(namesBtn)
    // Non-PK and PK columns should hide (only header 'users' is visible)
    // Actually the DOM might still be there but under a v-if
    expect(screen.queryByText('email')).toBeNull()
    expect(screen.queryByText('id')).toBeNull()

    // Switch to 'keys'
    const keysBtn = screen.getByText('keys')
    await fireEvent.click(keysBtn)
    // Email should still be hidden because it is not a PK
    expect(screen.queryByText('email')).toBeNull()
    // but 'id' should be visible because it is a PK
    expect(screen.getAllByText('id').length).toBe(2)
  })

  it('calculates edges between tables based on naming conventions', async () => {
    const { } = renderComponent()

    // Wait for tables to render first
    await screen.findByText('users')
    await screen.findByText('posts')
    
    // Look for SVG path elements that signify edges
    const paths = document.body.querySelectorAll('svg path')
    expect(paths.length).toBeGreaterThan(0)
  })

  it('filters tables based on search query by applying grayscale to non-matching', async () => {
    const { } = renderComponent()

    const searchInput = screen.getByPlaceholderText('Search tables...')
    await fireEvent.update(searchInput, 'user')

    // Find the users and posts elements
    // We expect the 'posts' table element to have grayscale / opacity classes applied
    const postsElement = (await screen.findByText('posts')).closest('.bg-white')
    expect(postsElement?.className).toContain('grayscale')

    // The 'users' table element should have the ring-primary-500 class
    const usersElement = (await screen.findByText('users')).closest('.bg-white')
    expect(usersElement?.className).toContain('ring-primary-500')
  })
})
