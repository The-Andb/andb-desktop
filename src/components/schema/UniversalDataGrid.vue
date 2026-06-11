<template>
  <div ref="rootContainerRef" class="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-950 relative overflow-hidden h-full w-full">
    <!-- Loading overlay -->
    <div
      v-if="isLoading && (!rows || rows.length === 0)"
      class="absolute inset-0 z-50 bg-white/70 dark:bg-gray-950/70 backdrop-blur-sm flex flex-col items-center justify-center"
    >
      <Loader2 class="w-8 h-8 text-primary-500 animate-spin mb-4" />
      <span class="text-xs font-black uppercase text-gray-500 tracking-wider">Fetching data...</span>
    </div>

    <!-- SQL Error View -->
    <div
      v-if="isError"
      class="flex-1 p-6 flex flex-col bg-red-50/20 dark:bg-red-950/5 overflow-y-auto"
    >
      <div class="flex items-start gap-3 border border-red-200/50 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20 rounded-xl p-4 max-w-3xl">
        <AlertCircle class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div class="flex-1 min-w-0">
          <h4 class="text-xs font-black uppercase tracking-wider text-red-800 dark:text-red-400 mb-1">SQL Execution Error</h4>
          <pre class="text-[11px] font-mono text-red-700 dark:text-red-300/90 whitespace-pre-wrap select-text leading-relaxed">{{ errorMsg }}</pre>
        </div>
      </div>
    </div>

    <!-- Pristine / not yet queried state -->
    <div
      v-else-if="!isLoading && headers.length === 0 && !isError"
      class="flex-1 flex flex-col items-center justify-center text-gray-400 opacity-50 p-8"
    >
      <Database class="w-12 h-12 mb-4 text-primary-500/30" />
      <h4 class="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">No rows found</h4>
      <p class="text-[10px] uppercase font-bold text-gray-455 dark:text-gray-500 mt-1">This query or table is empty or matches no filters.</p>
    </div>

    <!-- Virtual Data Grid -->
    <div v-else class="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-950 overflow-x-auto custom-scrollbar">
      <!-- Inline empty hint banner -->
      <div
        v-if="(!rows || rows.length === 0) && !readOnly"
        class="flex items-center gap-3 px-4 py-2 border-b border-gray-100 dark:border-gray-800/50 text-[10px] text-gray-400 dark:text-gray-500 italic flex-none"
      >
        <Database class="w-3.5 h-3.5 text-primary-400/40 shrink-0" />
        <span>No rows found — double-click the row below to insert the first record.</span>
      </div>

      <div :style="{ minWidth: totalTableWidth + 'px', width: totalTableWidth + 'px' }" class="flex-1 flex flex-col min-h-0">
        <!-- Header Row -->
        <div
          class="flex-none bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center z-20 shadow-sm overflow-hidden"
        >
          <!-- Counter column header with Database icon for toggle select all -->
          <div
            class="w-12 px-2 py-3 text-[9px] font-black uppercase text-gray-455 tracking-tighter shrink-0 border-r border-gray-200 dark:border-gray-800 text-center flex items-center justify-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            @click="toggleSelectAllRows"
            title="Toggle Select/Deselect All Rows"
          >
            <Database class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          </div>
          <!-- Resizable Headers -->
          <div class="flex-1 flex overflow-hidden divide-x divide-gray-200 dark:divide-gray-800 select-none">
            <div
              v-for="(header, i) in headers"
              :key="header"
              class="px-3 py-3 text-[10px] font-black uppercase tracking-wider relative group overflow-hidden shrink-0 flex items-center gap-1.5 select-none transition-colors cursor-pointer"
              :class="[
                selectedColumns.has(header)
                  ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 font-bold hover:bg-primary-100 dark:hover:bg-primary-950/70'
                  : 'text-gray-600 dark:text-gray-455 hover:bg-gray-100 dark:hover:bg-gray-800/80'
              ]"
              :style="{ width: resizer.columnWidths.value[i] + 'px' }"
              @mousedown="startColumnDrag(i, $event)"
              @mouseenter="overColumnDrag(i)"
              @click.stop="onHeaderClick(header)"
            >
              <span class="truncate block flex-1 pointer-events-none">{{ header }}</span>
              <span v-if="sortBy === header" class="shrink-0 text-primary-500 pointer-events-none">
                <ChevronUp v-if="sortOrder === 'ASC'" class="w-3 h-3" />
                <ChevronDown v-else class="w-3 h-3" />
              </span>
              <div
                class="resize-handle"
                :class="{ resizing: resizer.activeColumnIndex.value === i }"
                @mousedown.stop="resizer.handleMouseDown(i, $event)"
              ></div>
            </div>
          </div>
        </div>

        <!-- Column Filters Row -->
        <div
          v-if="showColumnFilters"
          class="flex-none bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 flex items-center z-15 overflow-hidden"
        >
          <div class="w-12 shrink-0 border-r border-gray-200 dark:border-gray-800"></div>
          <div class="flex-1 flex overflow-hidden divide-x divide-gray-200 dark:divide-gray-800">
            <div
              v-for="(header, i) in headers"
              :key="'filter-' + header"
              class="px-2 py-1 shrink-0 flex items-center"
              :style="{ width: resizer.columnWidths.value[i] + 'px' }"
            >
              <input
                type="text"
                v-model="columnFilters[header]"
                placeholder="Filter..."
                class="w-full px-2 py-0.5 text-[10px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        <!-- Body Rows (Virtual RecycleScroller) -->
        <RecycleScroller
          ref="scroller"
          class="flex-1 custom-scrollbar"
          :items="allGridRows.map((r, i) => ({ ...r, _v_id: r._isGhostRow ? '__ghost__' : r._isStagedInsert ? `ins-${r._insertIndex}` : i }))"
          :item-size="rowHeight"
          key-field="_v_id"
          @scroll="handleScroll"
          v-slot="{ item, index }"
        >
          <div
            class="flex items-center border-b transition-colors group font-mono"
            :class="[
              item._isGhostRow
                ? 'border-dashed border-gray-200/60 dark:border-gray-700/40 opacity-50 hover:opacity-80'
                : 'border-b border-gray-100 dark:border-gray-800/50',
              !item._isGhostRow && selectedRowIndices.has(index)
                ? 'bg-primary-500/[0.04] dark:bg-primary-500/[0.06]'
                : !item._isGhostRow && item._isStagedInsert
                  ? 'bg-emerald-500/[0.08] dark:bg-emerald-500/[0.12] hover:bg-emerald-500/[0.1] dark:hover:bg-emerald-500/[0.15]'
                  : !item._isGhostRow
                    ? 'hover:bg-primary-500/[0.01] dark:hover:bg-primary-500/[0.01]'
                    : '',
              !item._isGhostRow && !item._isStagedInsert && isRowDeleted(item._originalIndex) ? 'opacity-40 line-through bg-red-100/30 dark:bg-red-950/20 decoration-red-500 decoration-1' : ''
            ]"
            :style="{ height: rowHeight + 'px', fontSize: textSize + 'px' }"
            @mousedown="!item._isStagedInsert && !item._isGhostRow && startRowDrag(index, $event)"
            @mouseenter="!item._isStagedInsert && !item._isGhostRow && overRowDrag(index)"
          >
            <!-- Index cell -->
            <div
              class="w-12 px-2 text-center border-r shrink-0 font-bold flex items-center justify-center select-none cursor-row-resize"
              :class="[
                item._isGhostRow
                  ? 'text-gray-300 dark:text-gray-600 border-r-gray-100 dark:border-r-gray-800/50 italic'
                  : selectedRowIndices.has(index)
                    ? 'bg-primary-100/70 dark:bg-primary-950/80 text-primary-600 dark:text-primary-400 border-r-primary-200 dark:border-r-primary-800'
                    : item._isStagedInsert
                      ? 'bg-emerald-100/50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-r-emerald-200 dark:border-r-emerald-800'
                      : 'text-gray-455 dark:text-gray-500 border-r-gray-100 dark:border-r-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/60'
              ]"
            >
              {{ item._isGhostRow ? '*' : item._isStagedInsert ? '+' : index + 1 }}
            </div>
            <!-- Value cells -->
            <div
              class="flex-1 flex overflow-hidden divide-x divide-gray-100 dark:divide-gray-800/40 h-full"
            >
              <div
                v-for="(header, i) in headers"
                :key="header"
                class="px-4 flex items-center truncate shrink-0 cursor-cell"
                :class="[
                  !item._isGhostRow && isCellStaged(item._isStagedInsert ? -1 : item._originalIndex, header, item._isStagedInsert, item._insertIndex)
                    ? 'bg-amber-100 dark:bg-amber-900/35 text-amber-900 dark:text-amber-200 font-semibold border-amber-300 dark:border-amber-700/50'
                    : !item._isGhostRow && selectedRowIndices.has(index) && selectedColumns.has(header)
                      ? 'bg-primary-500/[0.16] dark:bg-primary-500/[0.24] text-primary-800 dark:text-primary-200 font-semibold ring-1 ring-primary-500/20 ring-inset shadow-sm'
                      : !item._isGhostRow && selectedRowIndices.has(index)
                        ? 'bg-primary-500/[0.06] dark:bg-primary-500/[0.09] text-gray-900 dark:text-white'
                        : !item._isGhostRow && selectedColumns.has(header)
                          ? 'bg-primary-500/[0.04] dark:bg-primary-500/[0.06] text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-300',
                  isDraggingRows || isDraggingColumns ? 'select-none' : 'select-text'
                ]"
                :style="{ width: resizer.columnWidths.value[i] + 'px' }"
                @dblclick="!readOnly && startEdit(item._isGhostRow ? -1 : item._isStagedInsert ? -1 : item._originalIndex, header, item[header], item._isStagedInsert || item._isGhostRow, item._isGhostRow ? GHOST_INSERT_INDEX : item._insertIndex)"
                @contextmenu.prevent="!item._isGhostRow && showCellContextMenu(item._isStagedInsert ? -1 : item._originalIndex, header, item[header], $event, item._isStagedInsert, item._insertIndex)"
              >
                <input
                  v-if="editingCell && (editingCell.isInsert ? (editingCell.insertIndex === item._insertIndex) : (editingCell.rowIndex === item._originalIndex)) && editingCell.column === header"
                  v-model="editingValue"
                  @blur="saveEdit(item._isStagedInsert ? -1 : item._originalIndex, header, item._isStagedInsert, item._insertIndex)"
                  @keydown.enter="saveEdit(item._isStagedInsert ? -1 : item._originalIndex, header, item._isStagedInsert, item._insertIndex)"
                  @keydown.esc="cancelEdit"
                  ref="editInputRef"
                  class="w-full h-full px-2 py-0.5 text-xs bg-white dark:bg-gray-850 border border-primary-500 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono text-gray-900 dark:text-white"
                />
                <span v-else :class="{ 'text-gray-400 italic font-sans text-[10px]': item[header] === null }">
                  {{ !item._isGhostRow && isCellStaged(item._isStagedInsert ? -1 : item._originalIndex, header, item._isStagedInsert, item._insertIndex) ? (item._isStagedInsert ? stagedInsertions[item._insertIndex][header] : stagedEdits[item._originalIndex][header]) : formatValue(item[header]) }}
                </span>
              </div>
            </div>
          </div>
        </RecycleScroller>
      </div>
    </div>

    <!-- Floating Action Bar for Staged Edits -->
    <div v-if="!readOnly && (Object.keys(stagedEdits).length > 0 || stagedDeletions.size > 0 || stagedInsertions.length > 0)" class="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-xl shadow-2xl px-6 py-3 flex items-center gap-4 z-40 transition-all duration-300">
      <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">
        <span v-if="stagedInsertions.length > 0">
          <span class="text-emerald-500 font-bold font-mono">{{ stagedInsertions.length }}</span> row insertion(s)
        </span>
        <span v-if="stagedInsertions.length > 0 && (Object.keys(stagedEdits).length > 0 || stagedDeletions.size > 0)">, </span>
        <span v-if="Object.keys(stagedEdits).length > 0">
          <span class="text-amber-500 font-bold font-mono">{{ Object.keys(stagedEdits).length }}</span> cell edit(s)
        </span>
        <span v-if="Object.keys(stagedEdits).length > 0 && stagedDeletions.size > 0"> and </span>
        <span v-if="stagedDeletions.size > 0">
          <span class="text-red-500 font-bold font-mono">{{ stagedDeletions.size }}</span> row deletion(s)
        </span>
      </span>
      <div class="h-4 w-[1px] bg-gray-200 dark:bg-gray-800"></div>
      <button
        @click="revertEdits"
        class="px-3 py-1.5 border border-gray-250 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 transition-colors"
      >
        Revert
      </button>
      <button
        @click="submitEdits"
        :disabled="isSubmitting"
        class="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center gap-1.5"
      >
        <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
        <span>Submit Edits</span>
      </button>
    </div>

    <!-- Right-click Cell Context Menu -->
    <div
      v-if="contextMenu && contextMenu.show"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      class="fixed bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-[100] py-1 text-xs text-gray-300 w-56 font-sans select-none"
      @click.stop
    >
      <button
        v-if="!readOnly"
        @click="setCellToNull(contextMenu.rowIndex, contextMenu.column, contextMenu.isInsert, contextMenu.insertIndex)"
        class="w-full text-left px-3.5 py-2 hover:bg-primary-600 hover:text-white transition-colors flex items-center"
      >
        Set Field to NULL
      </button>
      <template v-if="!readOnly && contextMenu.val && typeof contextMenu.val === 'string' && contextMenu.val !== 'NULL'">
        <button
          @click="transformCellText(contextMenu.rowIndex, contextMenu.column, 'upper', contextMenu.isInsert, contextMenu.insertIndex)"
          class="w-full text-left px-3.5 py-2 hover:bg-primary-600 hover:text-white transition-colors flex items-center"
        >
          UPPERCASE Text
        </button>
        <button
          @click="transformCellText(contextMenu.rowIndex, contextMenu.column, 'lower', contextMenu.isInsert, contextMenu.insertIndex)"
          class="w-full text-left px-3.5 py-2 hover:bg-primary-600 hover:text-white transition-colors flex items-center"
        >
          lowercase Text
        </button>
        <button
          @click="transformCellText(contextMenu.rowIndex, contextMenu.column, 'capitalize', contextMenu.isInsert, contextMenu.insertIndex)"
          class="w-full text-left px-3.5 py-2 hover:bg-primary-600 hover:text-white transition-colors flex items-center"
        >
          Capitalize Text
        </button>
      </template>
      
      <div v-if="!readOnly" class="h-[1px] bg-gray-800 my-1"></div>

      <button
        v-if="!readOnly"
        @click="stageDeleteRow(contextMenu.rowIndex, contextMenu.isInsert, contextMenu.insertIndex)"
        class="w-full text-left px-3.5 py-2 hover:bg-red-650 hover:text-white text-red-400 transition-colors flex items-center"
      >
        {{ contextMenu.isInsert ? 'Remove Staged Row' : (isRowDeleted(contextMenu.rowIndex) ? 'Restore Row' : 'Delete Row') }}
      </button>

      <div v-if="!readOnly" class="h-[1px] bg-gray-800 my-1"></div>

      <button
        @click="copyCellField(contextMenu.val, false)"
        class="w-full text-left px-3.5 py-2 hover:bg-primary-600 hover:text-white transition-colors flex items-center"
      >
        Copy Field
      </button>
      <button
        @click="copyCellField(contextMenu.val, true)"
        class="w-full text-left px-3.5 py-2 hover:bg-primary-600 hover:text-white transition-colors flex items-center"
      >
        Copy Field (unquoted)
      </button>
      <button
        @click="copyRowText(contextMenu.rowIndex, false, contextMenu.isInsert, contextMenu.insertIndex)"
        class="w-full text-left px-3.5 py-2 hover:bg-primary-600 hover:text-white transition-colors flex items-center"
      >
        Copy Row
      </button>
      <button
        @click="copyRowText(contextMenu.rowIndex, true, contextMenu.isInsert, contextMenu.insertIndex)"
        class="w-full text-left px-3.5 py-2 hover:bg-primary-600 hover:text-white transition-colors flex items-center"
      >
        Copy Row (with names)
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Loader2, Database, AlertCircle, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { Andb } from '@/utils/andb'
import { useTableResizer } from '@/composables/useTableResizer'
import type { DatabaseConnection } from '@/stores/app'

const props = withDefaults(
  defineProps<{
    tableId: string
    headers: string[]
    rows: any[]
    isLoading?: boolean
    isLoadingMore?: boolean
    isError?: boolean
    errorMsg?: string
    readOnly?: boolean
    rowHeight?: number
    textSize?: number
    showColumnFilters?: boolean
    connection?: DatabaseConnection
    tableName?: string
  }>(),
  {
    isLoading: false,
    isLoadingMore: false,
    isError: false,
    errorMsg: '',
    readOnly: false,
    rowHeight: 32,
    textSize: 12,
    showColumnFilters: false
  }
)

const emit = defineEmits<{
  (e: 'edits-committed'): void
  (e: 'sort-change', payload: { column: string; order: 'ASC' | 'DESC' }): void
  (e: 'load-more'): void
}>()

const isSubmitting = ref(false)

// Row/Column Selection states
const selectedRowIndices = ref<Set<number>>(new Set())
const selectedColumns = ref<Set<string>>(new Set())

// Mouse drag selection support
const isDraggingColumns = ref(false)
const dragStartColIdx = ref<number | null>(null)
const dragStartPos = ref({ x: 0, y: 0 })
let colDragHasMoved = false

const isDraggingRows = ref(false)
const dragStartRowIdx = ref<number | null>(null)

// Filtering & Sorting (Local representation)
const columnFilters = ref<Record<string, string>>({})
const sortBy = ref<string | null>(null)
const sortOrder = ref<'ASC' | 'DESC'>('ASC')

const startColumnDrag = (idx: number, event: MouseEvent) => {
  if (event.button !== 0) return
  if ((event.target as HTMLElement).closest('.resize-handle') || (event.target as HTMLElement).closest('button')) return
  dragStartColIdx.value = idx
  dragStartPos.value = { x: event.clientX, y: event.clientY }
  colDragHasMoved = false
}

const overColumnDrag = (idx: number) => {
  if (!isDraggingColumns.value || dragStartColIdx.value === null) return
  if (dragStartColIdx.value !== idx) {
    colDragHasMoved = true
  }
  selectColumnRange(dragStartColIdx.value, idx)
}

const selectColumnRange = (start: number, end: number) => {
  const min = Math.min(start, end)
  const max = Math.max(start, end)
  const nextActiveCols = new Set<string>()
  props.headers.forEach((h, index) => {
    if (index >= min && index <= max) {
      nextActiveCols.add(h)
    }
  })
  selectedColumns.value = nextActiveCols
}

const onHeaderClick = (header: string) => {
  if (colDragHasMoved) return
  if (sortBy.value === header) {
    sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
  } else {
    sortBy.value = header
    sortOrder.value = 'ASC'
  }
  emit('sort-change', { column: header, order: sortOrder.value })
}

const startRowDrag = (idx: number, event: MouseEvent) => {
  if (event.button !== 0) return
  isDraggingRows.value = true
  dragStartRowIdx.value = idx
  selectRowRange(idx, idx)
}

const overRowDrag = (idx: number) => {
  if (!isDraggingRows.value || dragStartRowIdx.value === null) return
  selectRowRange(dragStartRowIdx.value, idx)
}

const selectRowRange = (start: number, end: number) => {
  const min = Math.min(start, end)
  const max = Math.max(start, end)
  const newSet = new Set<number>()
  for (let i = min; i <= max; i++) {
    newSet.add(i)
  }
  selectedRowIndices.value = newSet
}

const toggleSelectAllRows = () => {
  if (selectedRowIndices.value.size > 0 || selectedColumns.value.size > 0) {
    selectedRowIndices.value.clear()
    selectedColumns.value.clear()
  } else {
    selectedRowIndices.value = new Set(filteredResults.value.map((_, idx) => idx))
  }
}

// Table resizer setup
const resizer = useTableResizer(props.tableId, Array(100).fill(150))
const rootContainerRef = ref<HTMLElement | null>(null)
const scroller = ref<any>(null)

// Editing cells
const editingCell = ref<{ rowIndex: number, column: string, isInsert?: boolean, insertIndex?: number } | null>(null)
const editingValue = ref('')
const stagedEdits = ref<Record<number, Record<string, any>>>({})
const stagedDeletions = ref<Set<number>>(new Set())
const stagedInsertions = ref<any[]>([])
const editInputRef = ref<HTMLInputElement | null>(null)

const GHOST_INSERT_INDEX = -99

const addRow = () => {
  if (props.headers.length === 0) return
  const newRow: Record<string, any> = {}
  props.headers.forEach(col => {
    newRow[col] = null
  })
  stagedInsertions.value.push(newRow)
}

const contextMenu = ref<{
  show: boolean
  x: number
  y: number
  rowIndex: number
  column: string
  val: any
  isInsert?: boolean
  insertIndex?: number
} | null>(null)

const isRowDeleted = (rowIndex: number) => {
  return stagedDeletions.value.has(rowIndex)
}

const showCellContextMenu = (rowIndex: number, column: string, val: any, event: MouseEvent, isInsert = false, insertIndex?: number) => {
  event.preventDefault()
  event.stopPropagation()
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    rowIndex,
    column,
    val,
    isInsert,
    insertIndex
  }
}

const setCellToNull = (rowIndex: number, column: string, isInsert = false, insertIndex?: number) => {
  if (isInsert && insertIndex !== undefined) {
    stagedInsertions.value[insertIndex][column] = null
  } else {
    if (!stagedEdits.value[rowIndex]) {
      stagedEdits.value[rowIndex] = {}
    }
    stagedEdits.value[rowIndex][column] = 'NULL'
  }
  closeDropdowns()
}

const transformCellText = (rowIndex: number, column: string, type: 'upper' | 'lower' | 'capitalize', isInsert = false, insertIndex?: number) => {
  const currentVal = isInsert && insertIndex !== undefined ? stagedInsertions.value[insertIndex]?.[column] : props.rows[rowIndex]?.[column]
  if (typeof currentVal !== 'string') return
  
  let newVal = currentVal
  if (type === 'upper') newVal = currentVal.toUpperCase()
  else if (type === 'lower') newVal = currentVal.toLowerCase()
  else if (type === 'capitalize') newVal = currentVal.charAt(0).toUpperCase() + currentVal.slice(1)
  
  if (isInsert && insertIndex !== undefined) {
    stagedInsertions.value[insertIndex][column] = newVal
  } else {
    if (!stagedEdits.value[rowIndex]) {
      stagedEdits.value[rowIndex] = {}
    }
    stagedEdits.value[rowIndex][column] = newVal
  }
  closeDropdowns()
}

const stageDeleteRow = (rowIndex: number, isInsert = false, insertIndex?: number) => {
  if (isInsert && insertIndex !== undefined) {
    stagedInsertions.value.splice(insertIndex, 1)
  } else {
    if (stagedDeletions.value.has(rowIndex)) {
      stagedDeletions.value.delete(rowIndex)
    } else {
      stagedDeletions.value.add(rowIndex)
    }
  }
  closeDropdowns()
}

const copyCellField = (val: any, unquoted: boolean) => {
  let str = formatValue(val)
  if (!unquoted && typeof val === 'string') {
    str = `'${str}'`
  }
  navigator.clipboard.writeText(str)
  closeDropdowns()
}

const copyRowText = (rowIndex: number, withNames: boolean, isInsert = false, insertIndex?: number) => {
  const row = isInsert && insertIndex !== undefined ? stagedInsertions.value[insertIndex] : props.rows[rowIndex]
  if (!row) return
  
  let str = ''
  if (withNames) {
    str = Object.entries(row).map(([k, v]) => `${k}=${formatValue(v)}`).join(', ')
  } else {
    str = Object.values(row).map(v => formatValue(v)).join(', ')
  }
  navigator.clipboard.writeText(str)
  closeDropdowns()
}

const isCellStaged = (rowIndex: number, column: string, isInsert = false, insertIndex?: number) => {
  if (isInsert && insertIndex !== undefined) {
    return stagedInsertions.value[insertIndex]?.[column] !== null
  }
  return stagedEdits.value[rowIndex]?.[column] !== undefined
}

const startEdit = (rowIndex: number, column: string, val: any, isInsert = false, insertIndex?: number) => {
  if (insertIndex === GHOST_INSERT_INDEX) {
    addRow()
    const newInsertIndex = stagedInsertions.value.length - 1
    editingCell.value = { rowIndex: -1, column, isInsert: true, insertIndex: newInsertIndex }
    editingValue.value = 'NULL'
    nextTick(() => {
      editInputRef.value?.focus()
      editInputRef.value?.select()
    })
    return
  }
  editingCell.value = { rowIndex, column, isInsert, insertIndex }
  editingValue.value = val === null ? 'NULL' : String(val)
  nextTick(() => {
    editInputRef.value?.focus()
    editInputRef.value?.select()
  })
}

const saveEdit = (rowIndex: number, column: string, isInsert = false, insertIndex?: number) => {
  if (!editingCell.value) return
  if (isInsert && insertIndex !== undefined) {
    stagedInsertions.value[insertIndex][column] = editingValue.value === 'NULL' ? null : editingValue.value
  } else {
    const originalVal = props.rows[rowIndex]?.[column]
    const originalStr = originalVal === null ? 'NULL' : String(originalVal)
    
    if (editingValue.value === originalStr) {
      if (stagedEdits.value[rowIndex]) {
        delete stagedEdits.value[rowIndex][column]
        if (Object.keys(stagedEdits.value[rowIndex]).length === 0) {
          delete stagedEdits.value[rowIndex]
        }
      }
    } else {
      if (!stagedEdits.value[rowIndex]) {
        stagedEdits.value[rowIndex] = {}
      }
      stagedEdits.value[rowIndex][column] = editingValue.value
    }
  }
  editingCell.value = null
}

const cancelEdit = () => {
  editingCell.value = null
}

const revertEdits = () => {
  stagedEdits.value = {}
  stagedDeletions.value.clear()
  stagedInsertions.value = []
  editingCell.value = null
}

const getRowIdentifierClause = (row: any) => {
  const cols = Object.keys(row)
  const idCol = cols.find(c => c.toLowerCase() === 'id') || cols.find(c => c.toLowerCase().endsWith('id'))
  if (idCol && row[idCol] !== undefined && row[idCol] !== null) {
    const val = typeof row[idCol] === 'number' ? row[idCol] : `'${String(row[idCol]).replace(/'/g, "''")}'`
    return `\`${idCol}\` = ${val}`
  }
  return cols.map(c => {
    if (row[c] === null) return `\`${c}\` IS NULL`
    const val = typeof row[c] === 'number' ? row[c] : `'${String(row[c]).replace(/'/g, "''")}'`
    return `\`${c}\` = ${val}`
  }).join(' AND ')
}

const submitEdits = async () => {
  if (!props.connection || !props.tableName) return
  if (Object.keys(stagedEdits.value).length === 0 && stagedDeletions.value.size === 0 && stagedInsertions.value.length === 0) return
  
  isSubmitting.value = true
  
  try {
    const sqls: string[] = []
    
    for (const ins of stagedInsertions.value) {
      const columns: string[] = []
      const values: string[] = []
      for (const [col, val] of Object.entries(ins)) {
        columns.push(`\`${col}\``)
        if (val === null || val === 'NULL') {
          values.push('NULL')
        } else {
          const isNum = !isNaN(Number(val)) && val !== ''
          const valStr = isNum ? String(val) : `'${String(val).replace(/'/g, "''")}'`
          values.push(valStr)
        }
      }
      if (columns.length > 0) {
        sqls.push(`INSERT INTO \`${props.tableName}\` (${columns.join(', ')}) VALUES (${values.join(', ')});`)
      }
    }

    for (const [rIdxStr, cols] of Object.entries(stagedEdits.value)) {
      const rowIndex = parseInt(rIdxStr, 10)
      if (stagedDeletions.value.has(rowIndex)) continue
      const originalRow = props.rows[rowIndex]
      if (!originalRow) continue
      
      const setClauses = Object.entries(cols).map(([col, newVal]) => {
        if (newVal === null || newVal === 'NULL') return `\`${col}\` = NULL`
        const val = typeof originalRow[col] === 'number' && !isNaN(Number(newVal)) ? Number(newVal) : `'${String(newVal).replace(/'/g, "''")}'`
        return `\`${col}\` = ${val}`
      }).join(', ')
      
      const whereClause = getRowIdentifierClause(originalRow)
      sqls.push(`UPDATE \`${props.tableName}\` SET ${setClauses} WHERE ${whereClause};`)
    }
    
    for (const rowIndex of stagedDeletions.value) {
      const originalRow = props.rows[rowIndex]
      if (!originalRow) continue
      
      const whereClause = getRowIdentifierClause(originalRow)
      sqls.push(`DELETE FROM \`${props.tableName}\` WHERE ${whereClause};`)
    }
    
    if (sqls.length > 0) {
      const batchSql = sqls.join('\n')
      await Andb.executeQuery(props.connection, batchSql)
    }
    
    revertEdits()
    emit('edits-committed')
  } catch (err: any) {
    console.error('Failed to submit edits', err)
  } finally {
    isSubmitting.value = false
  }
}

const totalTableWidth = computed(() => {
  const sumOfCols = resizer.columnWidths.value.slice(0, props.headers.length).reduce((a, b) => a + b, 0)
  return sumOfCols + 48
})

const filteredResults = computed(() => {
  if (!props.rows) return []
  return props.rows.filter(row => {
    return Object.entries(columnFilters.value).every(([col, filterText]) => {
      if (!filterText) return true
      const cellVal = row[col]
      const filterStr = filterText.trim()

      if (typeof cellVal === 'number') {
        const match = filterStr.match(/^(=|>|<|<=|>=)\s*(-?\d+(\.\d+)?)$/)
        if (match) {
          const op = match[1]
          const val = parseFloat(match[2])
          switch (op) {
            case '=': return cellVal === val
            case '>': return cellVal > val
            case '<': return cellVal < val
            case '<=': return cellVal <= val
            case '>=': return cellVal >= val
          }
        }
        
        const parsedVal = parseFloat(filterStr)
        if (!isNaN(parsedVal)) {
          return cellVal === parsedVal
        }
      }

      const strVal = formatValue(cellVal).toLowerCase()
      return strVal.includes(filterStr.toLowerCase())
    })
  })
})

const allGridRows = computed(() => {
  const gridRows = filteredResults.value.map((r, idx) => ({
    ...r,
    _isStagedInsert: false,
    _isGhostRow: false,
    _originalIndex: idx
  }))
  stagedInsertions.value.forEach((ins, idx) => {
    gridRows.push({
      ...ins,
      _isStagedInsert: true,
      _isGhostRow: false,
      _insertIndex: idx
    })
  })
  if (props.headers.length > 0 && !props.readOnly) {
    const ghostRow: Record<string, any> = { _isStagedInsert: false, _isGhostRow: true, _insertIndex: GHOST_INSERT_INDEX }
    props.headers.forEach(col => { ghostRow[col] = null })
    gridRows.push(ghostRow)
  }
  return gridRows
})

const handleScroll = (event: Event) => {
  if (props.isLoading || props.isLoadingMore) return
  const target = event.target as HTMLElement
  if (!target) return
  const threshold = 100
  const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < threshold
  if (isNearBottom) {
    emit('load-more')
  }
}

const formatValue = (val: any): string => {
  if (val === null) return 'NULL'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

const autoFitColumns = () => {
  if (!props.rows || props.rows.length === 0) return
  const newWidths = [...resizer.columnWidths.value]
  
  props.headers.forEach((header, i) => {
    let maxLen = header.length
    const sampleRows = props.rows.slice(0, 100)
    sampleRows.forEach(row => {
      const val = formatValue(row[header])
      if (val.length > maxLen) {
        maxLen = val.length
      }
    })
    
    const measuredWidth = Math.max(80, Math.min(500, maxLen * 8 + 32))
    newWidths[i] = measuredWidth
  })
  
  resizer.columnWidths.value = newWidths
  try {
    localStorage.setItem(`table-widths-${props.tableId}`, JSON.stringify(newWidths))
  } catch (e) {
    console.warn('Failed to save table widths', e)
  }
}

const closeDropdowns = () => {
  if (contextMenu.value) {
    contextMenu.value.show = false
  }
}

const handleGlobalMouseUp = () => {
  isDraggingColumns.value = false
  dragStartColIdx.value = null
  isDraggingRows.value = false
  dragStartRowIdx.value = null
}

const handleGlobalMouseMove = (e: MouseEvent) => {
  if (dragStartColIdx.value !== null && !isDraggingColumns.value) {
    const dist = Math.sqrt(
      Math.pow(e.clientX - dragStartPos.value.x, 2) +
      Math.pow(e.clientY - dragStartPos.value.y, 2)
    )
    if (dist >= 5) {
      isDraggingColumns.value = true
      selectColumnRange(dragStartColIdx.value, dragStartColIdx.value)
    }
  }
}

const handleGlobalKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    closeDropdowns()
    cancelEdit()
  }
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  window.addEventListener('mouseup', handleGlobalMouseUp)
  window.addEventListener('mousemove', handleGlobalMouseMove)
  window.addEventListener('keydown', handleGlobalKeyDown)
  window.addEventListener('click', closeDropdowns)
  
  if (rootContainerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      scroller.value?.updateViews()
    })
    resizeObserver.observe(rootContainerRef.value)
  }
  setTimeout(autoFitColumns, 0)
})

onUnmounted(() => {
  window.removeEventListener('mouseup', handleGlobalMouseUp)
  window.removeEventListener('mousemove', handleGlobalMouseMove)
  window.removeEventListener('keydown', handleGlobalKeyDown)
  window.removeEventListener('click', closeDropdowns)
  resizeObserver?.disconnect()
})

const getExportData = () => {
  const exportCols = selectedColumns.value.size > 0
    ? props.headers.filter(c => selectedColumns.value.has(c))
    : props.headers
  let exportRows = filteredResults.value
  if (selectedRowIndices.value.size > 0) {
    exportRows = filteredResults.value.filter((_, idx) => selectedRowIndices.value.has(idx))
  }
  return { cols: exportCols, rows: exportRows }
}

defineExpose({
  autoFitColumns,
  getExportData,
  clearSelections: () => {
    selectedRowIndices.value.clear()
    selectedColumns.value.clear()
  },
  selectedRowsCount: computed(() => selectedRowIndices.value.size),
  selectedColsCount: computed(() => selectedColumns.value.size),
  filteredRowsCount: computed(() => filteredResults.value.length)
})

watch(() => props.rows, () => {
  columnFilters.value = {}
  revertEdits()
  setTimeout(autoFitColumns, 0)
})
</script>

<style scoped>
.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  background-color: transparent;
  transition: background-color 0.2s;
  z-index: 30;
}

.resize-handle:hover,
.resize-handle.resizing {
  background-color: theme('colors.primary.500');
  opacity: 0.5;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.2);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.4);
}
</style>
