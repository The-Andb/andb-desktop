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

  it('renders tables correctly and parses columns from DDL', () => {
    const { } = renderComponent()

    // Ensure headers exist
    expect(screen.getByText('users')).toBeTruthy()
    expect(screen.getByText('posts')).toBeTruthy()

    // Ensure columns are parsed and rendered
    expect(screen.getAllByText('id').length).toBe(2)
    expect(screen.getByText('email')).toBeTruthy()
    expect(screen.getByText('user_id')).toBeTruthy()
  })

  it('toggles detail levels (names, keys, all)', async () => {
    renderComponent()

    // Default is "all", so 'email' (non-pk) is visible
    expect(screen.queryByText('email')).toBeTruthy()

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

  it('calculates edges between tables based on naming conventions', () => {
    const { } = renderComponent()

    // Look for SVG path elements that signify edges
    const paths = document.body.querySelectorAll('svg path')
    expect(paths.length).toBeGreaterThan(0) // Should have an edge between users and posts
  })

  it('filters tables based on search query by applying grayscale to non-matching', async () => {
    const { } = renderComponent()

    const searchInput = screen.getByPlaceholderText('Search tables...')
    await fireEvent.update(searchInput, 'user')

    // Find the users and posts document.bodys
    // We expect the 'posts' table document.body to have grayscale / opacity classes applied
    const postsElement = screen.getByText('posts').closest('.bg-white')
    expect(postsElement?.className).toContain('grayscale')

    // The 'users' table document.body should have the ring-primary-500 class
    const usersElement = screen.getByText('users').closest('.bg-white')
    expect(usersElement?.className).toContain('ring-primary-500')
  })
})
