import { ref, onMounted, onUnmounted } from 'vue'

export function useTableResizer(tableId: string, initialWidths: number[]) {
  const columnWidths = ref<number[]>(initialWidths)
  const isResizing = ref(false)
  const activeColumnIndex = ref(-1)
  const startX = ref(0)
  const startWidth = ref(0)

  const handleMouseDown = (index: number, event: MouseEvent) => {
    // Avoid triggering on double clicks or other mouse buttons
    if (event.button !== 0) return

    isResizing.value = true
    activeColumnIndex.value = index
    startX.value = event.pageX
    startWidth.value = columnWidths.value[index]
    
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    
    event.stopPropagation()
    event.preventDefault()
  }

  const handleMouseMove = (event: MouseEvent) => {
    if (!isResizing.value || activeColumnIndex.value === -1) return
    
    const delta = event.pageX - startX.value
    // Minimum width of 50px to keep text readable
    const newWidth = Math.max(50, startWidth.value + delta)
    columnWidths.value[activeColumnIndex.value] = newWidth
  }

  const handleMouseUp = () => {
    isResizing.value = false
    activeColumnIndex.value = -1
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
    
    // Persist to local storage
    try {
        localStorage.setItem(`table-widths-${tableId}`, JSON.stringify(columnWidths.value))
    } catch (e) {
        console.warn('Failed to save table widths to localStorage', e)
    }
  }

  onMounted(() => {
    const savedWidths = localStorage.getItem(`table-widths-${tableId}`)
    if (savedWidths) {
      try {
        const parsed = JSON.parse(savedWidths)
        // Only load if the column count matches
        if (Array.isArray(parsed) && parsed.length === initialWidths.length) {
          columnWidths.value = parsed
        }
      } catch (e) {
        console.error('Failed to parse saved column widths', e)
      }
    }
  })

  // Ensure listeners are cleaned up if component is unmounted during resize
  onUnmounted(() => {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  })

  return {
    columnWidths,
    handleMouseDown,
    isResizing,
    activeColumnIndex
  }
}
