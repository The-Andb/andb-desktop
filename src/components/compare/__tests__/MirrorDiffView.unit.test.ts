import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/vue'
import MirrorDiffView from '../MirrorDiffView.vue'

// Mock dependencies
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string, options?: any) => options ? `${key} ${JSON.stringify(options)}` : key })
}))

const mockAppStore = {
  fontFamilies: { code: 'monospace' },
  fontSizes: { code: 12 }
}

vi.mock('@/stores/app', () => ({
  useAppStore: () => mockAppStore
}))

// Mock PrismJS to prevent errors during rendering
vi.mock('prismjs', () => ({
  default: {
    highlight: (text: string) => text,
    languages: { sql: {} }
  }
}))
vi.mock('prismjs/components/prism-sql', () => ({}))

vi.mock('lucide-vue-next', () => ({
  Settings: { template: '<svg data-testid="icon-settings"></svg>' },
  Check: { template: '<svg data-testid="icon-check"></svg>' }
}))

describe('MirrorDiffView.vue', () => {
  const renderComponent = (props = {}) => {
    return render(MirrorDiffView, {
      props: {
        sourceDdl: 'CREATE TABLE users (id INT);',
        targetDdl: 'CREATE TABLE users (id INT, name VARCHAR(255));',
        sourceLabel: 'DEV',
        targetLabel: 'PROD',
        status: 'modified',
        ...props
      },
      global: {
        mocks: {
          $t: (key: string, options?: any) => options ? `${key} ${JSON.stringify(options)}` : key
        }
      }
    })
  }

  it('renders split view correctly with source and target labels', () => {
    renderComponent()

    // Check headers
    expect(screen.getAllByText(/compare\.diffView\.source/)).toBeTruthy()
    expect(screen.getAllByText(/compare\.diffView\.target/)).toBeTruthy()

    // Ensure the DDL text is rendered (un-highlighted due to mock)
    expect(screen.getByText('CREATE TABLE users (id INT);')).toBeTruthy()
    expect(screen.getByText('CREATE TABLE users (id INT, name VARCHAR(255));')).toBeTruthy()
  })

  it('renders added/removed empty placeholders if source or target are missing', () => {
    const { } = renderComponent({
      sourceDdl: null,
      targetDdl: 'CREATE TABLE new_table (id INT);',
      status: 'missing_in_source'
    })

    // Source side should show deleted
    expect(screen.getAllByText('compare.diffView.deleted')).toBeTruthy()
    expect(screen.getAllByText('compare.diffView.sourceEmpty')).toBeTruthy()

    // Target side should show new
    expect(screen.getAllByText('compare.diffView.new')).toBeTruthy()
    expect(screen.getByText('CREATE TABLE new_table (id INT);')).toBeTruthy()
  })

  it('displays unified view if selected in settings', async () => {
    renderComponent()

    // Open settings
    const settingsBtn = screen.getByTestId('icon-settings').parentElement!
    await fireEvent.click(settingsBtn)

    // Switch to Unified
    const unifiedRadio = screen.getByLabelText('compare.diffView.unifiedMode')
    await fireEvent.click(unifiedRadio)

    // Verify Unified Header appears
    expect(screen.getAllByText(/compare\.diffView\.unified/)).toBeTruthy()
    // It should combine the lines in a single pane. The exact DOM is complex to test text content, 
    // but the split pane headers should disappear
    expect(screen.queryByText(/compare\.diffView\.source/)).toBeNull()
  })

  it('aligns diff rows correctly for modified DDL', () => {
    const { } = renderComponent({
      sourceDdl: 'CREATE TABLE x (\n  a INT\n);',
      targetDdl: 'CREATE TABLE x (\n  b INT\n);',
      status: 'modified'
    })

    // Look for classes indicating removed/added
    const addedLines = document.body.querySelectorAll('.line-added')
    const removedLines = document.body.querySelectorAll('.line-removed')

    expect(addedLines.length).toBeGreaterThan(0)
    expect(removedLines.length).toBeGreaterThan(0)
  })
})
