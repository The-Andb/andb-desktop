import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTableResizer } from '../useTableResizer'
import { defineComponent, h, nextTick } from 'vue'
import { mount, VueWrapper } from '@vue/test-utils'

describe('useTableResizer', () => {
  const tableId = 'test-table'
  // Helper to get fresh widths
  const getWidths = () => [100, 200, 300]
  let wrapper: VueWrapper<any>

  // Test component to exercise lifecycle hooks
  const TestComponent = defineComponent({
    props: {
        tableId: { type: String, required: true },
        initialWidths: { type: Array as () => number[], required: true }
    },
    setup(props) {
      // Clone to avoid mutation of shared props in tests
      const resizer = useTableResizer(props.tableId, [...props.initialWidths])
      return { resizer }
    },
    render() {
      return h('div')
    }
  })

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // Reset window state
    window.dispatchEvent(new MouseEvent('mouseup'))
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  it('initializes with default widths if nothing in localStorage', () => {
    wrapper = mount(TestComponent, {
        props: { tableId, initialWidths: getWidths() }
    })
    expect(wrapper.vm.resizer.columnWidths.value).toEqual(getWidths())
  })

  it('loads widths from localStorage if available on mount', async () => {
    const savedWidths = [150, 250, 350]
    localStorage.setItem(`table-widths-${tableId}`, JSON.stringify(savedWidths))

    wrapper = mount(TestComponent, {
        props: { tableId, initialWidths: getWidths() }
    })
    
    expect(wrapper.vm.resizer.columnWidths.value).toEqual(savedWidths)
  })

  it('handles mouse down and updates active column', async () => {
    wrapper = mount(TestComponent, {
        props: { tableId, initialWidths: getWidths() }
    })
    const { handleMouseDown, activeColumnIndex } = wrapper.vm.resizer
    
    handleMouseDown(0, new MouseEvent('mousedown', { button: 0 }))
    expect(activeColumnIndex.value).toBe(0)
  })

  it('updates column width during mouse move', async () => {
    wrapper = mount(TestComponent, {
        props: { tableId, initialWidths: getWidths() }
    })
    const { handleMouseDown, columnWidths } = wrapper.vm.resizer
    
    const downEvent = new MouseEvent('mousedown', { button: 0 })
    Object.defineProperty(downEvent, 'pageX', { value: 100, configurable: true })
    handleMouseDown(0, downEvent)

    const moveEvent = new MouseEvent('mousemove')
    Object.defineProperty(moveEvent, 'pageX', { value: 150, configurable: true })
    window.dispatchEvent(moveEvent)
    
    await nextTick()
    expect(columnWidths.value[0]).toBe(150)
  })

  it('enforces minimum width constraint', async () => {
    wrapper = mount(TestComponent, {
        props: { tableId, initialWidths: getWidths() }
    })
    const { handleMouseDown, columnWidths } = wrapper.vm.resizer
    
    const downEvent = new MouseEvent('mousedown', { button: 0 })
    Object.defineProperty(downEvent, 'pageX', { value: 100, configurable: true })
    handleMouseDown(0, downEvent)

    const moveEvent = new MouseEvent('mousemove')
    Object.defineProperty(moveEvent, 'pageX', { value: 10, configurable: true })
    window.dispatchEvent(moveEvent)
    
    await nextTick()
    expect(columnWidths.value[0]).toBe(50) // Min width is 50
  })

  it('saves widths to localStorage on mouse up', async () => {
    wrapper = mount(TestComponent, {
        props: { tableId, initialWidths: getWidths() }
    })
    const { handleMouseDown } = wrapper.vm.resizer

    const downEvent = new MouseEvent('mousedown', { button: 0 })
    Object.defineProperty(downEvent, 'pageX', { value: 100, configurable: true })
    handleMouseDown(0, downEvent)

    const moveEvent = new MouseEvent('mousemove')
    Object.defineProperty(moveEvent, 'pageX', { value: 150, configurable: true })
    window.dispatchEvent(moveEvent)
    
    await nextTick()
    
    window.dispatchEvent(new MouseEvent('mouseup'))
    
    expect(localStorage.getItem(`table-widths-${tableId}`)).toBe(JSON.stringify([150, 200, 300]))
  })

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    wrapper = mount(TestComponent, {
        props: { tableId, initialWidths: getWidths() }
    })
    
    wrapper.unmount()
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function))
  })
})
