<template>
  <div ref="rootContainerRef" class="h-full w-full bg-white dark:bg-gray-950 flex flex-col overflow-hidden relative">
    <!-- Filter & Options Toolbar -->
    <div
      :class="isMultiLineMode ? 'py-3 h-auto' : 'h-14'"
      class="flex-none px-4 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 gap-4 transition-all duration-200"
    >
      <div class="flex-1 flex items-center gap-2">
        <!-- SELECT columns input -->
        <div class="relative w-64 group flex flex-col justify-center">
          <div class="absolute top-2 left-3 pointer-events-none text-[10px] font-black tracking-wider text-gray-400 dark:text-gray-500 select-none">
            SELECT
          </div>
          <textarea
            v-model="selectProjection"
            @keydown="handleEnterKeyDown"
            @keydown.meta.enter.prevent="executeQuery"
            @keydown.ctrl.enter.prevent="executeQuery"
            placeholder="*, CONVERT(uid USING utf8)"
            :class="[
              isMultiLineMode ? 'h-20 py-2' : 'h-8 py-1.5 resize-none overflow-hidden',
              'block w-full pl-14 pr-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-450 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all font-mono custom-scrollbar'
            ]"
          ></textarea>
          <button
            v-if="selectProjection !== '*'"
            @click="selectProjection = '*'"
            class="absolute top-2 right-2.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- FROM table (visual indicator) -->
        <span class="text-[9px] font-black uppercase text-gray-400 dark:text-gray-500 px-0.5 shrink-0">FROM</span>

        <span class="px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-800 dark:text-gray-300 rounded-lg shrink-0 select-none">
          {{ tableName }} <span class="text-primary-500 font-bold">as {{ tableAlias }}</span>
        </span>

        <!-- WHERE style filter input -->
        <div class="relative flex-1 max-w-md group flex flex-col justify-center">
          <div class="absolute top-2 left-3 pointer-events-none text-[10px] font-black tracking-wider text-gray-400 dark:text-gray-500 select-none">
            WHERE
          </div>
          <textarea
            v-model="filter"
            @keydown="handleEnterKeyDown"
            @keydown.meta.enter.prevent="executeQuery"
            @keydown.ctrl.enter.prevent="executeQuery"
            placeholder="e.g. id > 10 AND status = 'active'"
            :class="[
              isMultiLineMode ? 'h-20 py-2' : 'h-8 py-1.5 resize-none overflow-hidden',
              'block w-full pl-14 pr-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-450 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all font-mono custom-scrollbar'
            ]"
          ></textarea>
          <button
            v-if="filter"
            @click="clearFilter"
            class="absolute top-2 right-2.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Limit dropdown -->
        <div class="flex items-center gap-2 shrink-0">
          <span class="text-[10px] font-black uppercase text-gray-450 dark:text-gray-500 tracking-wider">Limit:</span>
          <select
            v-model="limit"
            @change="executeQuery"
            class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all"
          >
            <option :value="50">50</option>
            <option :value="100">100</option>
            <option :value="500">500</option>
            <option :value="1000">1000</option>
            <option :value="5000">5000</option>
          </select>
        </div>

        <button
          @click="executeQuery"
          :disabled="isLoading"
          class="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-800 dark:disabled:to-gray-900 text-white text-[11px] font-black uppercase tracking-wider rounded-lg shadow-md shadow-primary-500/10 active:scale-[0.98] transition-all shrink-0"
        >
          <Play v-if="!isLoading" class="w-3 h-3 fill-current" />
          <Loader2 v-else class="w-3 h-3 animate-spin" />
          <span>{{ isLoading ? 'Running...' : 'Execute' }}</span>
        </button>

        <!-- Multiline toggle button -->
        <button
          @click="isMultiLineMode = !isMultiLineMode"
          class="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-primary-500 transition-colors shrink-0"
          :class="{ 'bg-primary-50 dark:bg-primary-950/30 text-primary-500 border-primary-200 dark:border-primary-900/50': isMultiLineMode }"
          title="Toggle Multiline SQL Mode (Cmd+Enter to execute)"
        >
          <ChevronsUpDown class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Settings & Export Actions -->
      <div class="flex items-center gap-2.5 shrink-0">
        <!-- View Options Dropdown -->
        <div class="relative shrink-0">
          <button
            @click="toggleViewOptions"
            class="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 transition-colors"
            title="Grid View Settings"
          >
            <SlidersHorizontal class="w-3.5 h-3.5" />
            <span>View</span>
            <ChevronDown class="w-3 h-3 opacity-60" />
          </button>
          
          <div
            v-if="showViewOptions"
            @click.stop
            class="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-850 rounded-xl shadow-xl z-50 p-3 flex flex-col gap-3"
          >
            <div class="text-[9px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider pb-1.5 border-b border-gray-100 dark:border-gray-800">
              Grid Settings
            </div>
            
            <!-- Font Size -->
            <div class="flex items-center justify-between gap-4">
              <span class="text-xs text-gray-600 dark:text-gray-400 font-semibold">Font Size:</span>
              <select
                v-model="textSize"
                class="bg-gray-50 dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-750 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="10">Small (10px)</option>
                <option value="12">Medium (12px)</option>
                <option value="14">Large (14px)</option>
              </select>
            </div>

            <!-- Row Height -->
            <div class="flex items-center justify-between gap-4">
              <span class="text-xs text-gray-600 dark:text-gray-400 font-semibold">Row Height:</span>
              <select
                v-model="rowHeight"
                class="bg-gray-50 dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-755 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option :value="26">Small (26px)</option>
                <option :value="32">Medium (32px)</option>
                <option :value="40">Large (40px)</option>
              </select>
            </div>

            <!-- Column Filters Toggle -->
            <div class="flex items-center justify-between gap-4">
              <span class="text-xs text-gray-600 dark:text-gray-400 font-semibold">Column Filters:</span>
              <button
                @click="showColumnFilters = !showColumnFilters"
                class="px-2.5 py-1 text-xs font-bold rounded-lg border transition-all"
                :class="[
                  showColumnFilters
                    ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-500 border-primary-200 dark:border-primary-900/50'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-550 border-gray-200 dark:border-gray-700'
                ]"
              >
                {{ showColumnFilters ? 'Enabled' : 'Disabled' }}
              </button>
            </div>

            <!-- Auto Fit -->
            <button
              @click="autoFitColumns"
              class="w-full flex items-center justify-center gap-1.5 py-1.5 mt-1 bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors"
            >
              <Maximize2 class="w-3.5 h-3.5" />
              <span>Auto Fit Widths</span>
            </button>
          </div>
        </div>

        <!-- Export Dropdown -->
        <div class="relative shrink-0">
          <button
            @click="toggleExportMenu"
            :disabled="!results || results.length === 0"
            class="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:hover:bg-transparent rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors"
          >
            <Download class="w-3.5 h-3.5" />
            <span>Export</span>
            <ChevronDown class="w-3 h-3 opacity-60" />
          </button>
          
          <div
            v-if="showExportMenu"
            @click.stop
            class="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-xl shadow-xl z-50 p-2 flex flex-col gap-0.5"
          >
            <div class="px-2.5 py-1.5 text-[9px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider border-b border-gray-100 dark:border-gray-800 mb-1">
              {{ (gridRef?.selectedRowsCount || 0) > 0 ? `Export Selected (${gridRef?.selectedRowsCount} rows)` : 'Export All Matching' }}
            </div>
            
            <button
              @click="downloadCsv(); closeDropdowns()"
              class="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 rounded-lg text-left transition-colors"
            >
              <Download class="w-3.5 h-3.5 text-gray-450" />
              <span>Download CSV</span>
            </button>

            <button
              @click="copyResultsAsJson(); closeDropdowns()"
              class="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-gray-150 dark:hover:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 rounded-lg text-left transition-colors"
            >
              <Copy class="w-3.5 h-3.5 text-gray-450" />
              <span>Copy as JSON</span>
            </button>
          </div>
        </div>


      </div>
    </div>

    <!-- Universal Data Grid Content -->
    <UniversalDataGrid
      ref="gridRef"
      :table-id="`data-inspector-${tableName}`"
      :headers="columnHeaders"
      :rows="results"
      :is-loading="isLoading"
      :is-loading-more="isLoadingMore"
      :is-error="isError"
      :error-msg="errorMsg"
      :row-height="rowHeight"
      :text-size="parseInt(textSize)"
      :show-column-filters="showColumnFilters"
      :connection="connection"
      :table-name="tableName"
      @edits-committed="executeQuery"
      @sort-change="handleSortChange"
      @load-more="loadMore"
    />

    <!-- Data Inspector Footer / Status Bar -->
    <div
      class="flex-none h-8 px-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-gray-500"
    >
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2">
          <div
            class="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.5)]"
          ></div>
          <span class="text-gray-400">{{ connection?.name || 'Unknown' }}</span>
        </div>
        <div class="flex items-center gap-2 text-gray-455 dark:text-gray-500">
          <span>Table: <span class="text-gray-600 dark:text-gray-300 font-mono">{{ tableName }}</span></span>
        </div>
      </div>

      <div class="flex items-center gap-6">
        <div class="flex items-center gap-1.5">
          <span class="text-gray-455 dark:text-gray-500">Rows:</span>
          <span class="text-primary-500 font-bold">{{ gridRef?.filteredRowsCount || 0 }} of {{ results?.length || 0 }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="text-gray-455 dark:text-gray-500">Time:</span>
          <span class="text-primary-500 font-bold">{{ executionTime }}ms</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Play, Loader2, X, Download, Copy, ChevronDown, Maximize2, ChevronsUpDown, SlidersHorizontal } from 'lucide-vue-next'
import { Andb } from '@/utils/andb'
import type { DatabaseConnection } from '@/stores/app'
import UniversalDataGrid from './UniversalDataGrid.vue'

const props = defineProps<{
  connection?: DatabaseConnection
  tableName: string
}>()

const selectProjection = ref('*')
const filter = ref('')
const isMultiLineMode = ref(false)

const handleEnterKeyDown = (e: KeyboardEvent) => {
  if (!isMultiLineMode.value) {
    e.preventDefault()
    executeQuery()
  }
}
const limit = ref(200)
const offset = ref(0)
const hasMoreRows = ref(true)
const isLoadingMore = ref(false)
const CHUNK_SIZE = computed(() => Number(limit.value))
const isLoading = ref(false)
const isError = ref(false)
const errorMsg = ref('')
const results = ref<any[]>([])
const executionTime = ref(0)
const isCopied = ref(false)

const gridRef = ref<any>(null)

// Selection & Export/Settings States
const showViewOptions = ref(false)
const showExportMenu = ref(false)

const toggleViewOptions = (e: MouseEvent) => {
  e.stopPropagation()
  showViewOptions.value = !showViewOptions.value
  showExportMenu.value = false
}

const toggleExportMenu = (e: MouseEvent) => {
  e.stopPropagation()
  showExportMenu.value = !showExportMenu.value
  showViewOptions.value = false
}

const closeDropdowns = () => {
  showViewOptions.value = false
  showExportMenu.value = false
}

const handleGlobalKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    closeDropdowns()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeyDown)
  window.addEventListener('click', closeDropdowns)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeyDown)
  window.removeEventListener('click', closeDropdowns)
})

const tableAlias = computed(() => {
  if (!props.tableName) return ''
  const parts = props.tableName.split(/[_-]/).filter(Boolean)
  if (parts.length > 1) {
    return parts.map(p => p[0]).join('').toLowerCase()
  }
  return props.tableName[0].toLowerCase()
})

const sortBy = ref<string | null>(null)
const sortOrder = ref<'ASC' | 'DESC'>('ASC')

// Layout Customizations
const textSize = ref('12')
const rowHeight = ref(32)
const showColumnFilters = ref(false)

const handleSortChange = (payload: { column: string; order: 'ASC' | 'DESC' }) => {
  sortBy.value = payload.column
  sortOrder.value = payload.order
  executeQuery()
}

const autoFitColumns = () => {
  gridRef.value?.autoFitColumns()
}

const persistedHeaders = ref<string[]>([])

const columnHeaders = computed(() => {
  if (results.value && results.value.length > 0) {
    return Object.keys(results.value[0])
  }
  return persistedHeaders.value
})

const clearFilter = () => {
  filter.value = ''
  executeQuery()
}



const executeQuery = async () => {
  if (!props.connection || !props.tableName) return

  isLoading.value = true
  isError.value = false
  errorMsg.value = ''
  offset.value = 0
  hasMoreRows.value = true
  const startTime = Date.now()

  try {
    const cols = selectProjection.value.trim() || '*'
    let query = `SELECT ${cols} FROM \`${props.tableName}\` as \`${tableAlias.value}\``
    
    if (filter.value.trim()) {
      const cleanFilter = filter.value.trim()
      query += ` WHERE ${cleanFilter}`
    }

    if (sortBy.value) {
      query += ` ORDER BY \`${sortBy.value}\` ${sortOrder.value}`
    }

    const data = await Andb.executeQuery(props.connection, query, [], undefined, undefined, CHUNK_SIZE.value, 0)
    executionTime.value = Date.now() - startTime
    results.value = Array.isArray(data) ? data : [data]
    if (results.value.length < CHUNK_SIZE.value) {
      hasMoreRows.value = false
    }
    if (results.value.length > 0) {
      persistedHeaders.value = Object.keys(results.value[0])
    } else if (persistedHeaders.value.length === 0 && props.tableName) {
      try {
        const desc = await Andb.executeQuery(props.connection, `DESCRIBE \`${props.tableName}\``)
        if (Array.isArray(desc) && desc.length > 0) {
          persistedHeaders.value = desc.map((r: any) => r.Field || r.COLUMN_NAME || r.name || Object.values(r)[0])
        }
      } catch { /* ignore */ }
    }
    
    gridRef.value?.clearSelections()
    setTimeout(autoFitColumns, 0)
  } catch (err: any) {
    isError.value = true
    errorMsg.value = err.message || 'Failed to execute query'
    results.value = []
  } finally {
    isLoading.value = false
  }
}

const downloadCsv = () => {
  const { cols, rows } = gridRef.value?.getExportData() || { cols: [], rows: [] }
  if (rows.length === 0 || cols.length === 0) return

  const csvContent = [
    cols.join(','),
    ...rows.map((row: any) =>
      cols
        .map((header: string) => {
          let val = row[header]
          if (val === null) return 'NULL'
          if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`
          return String(val)
        })
        .join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${props.tableName}_data_${new Date().toISOString()}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const copyResultsAsJson = () => {
  const { cols, rows } = gridRef.value?.getExportData() || { cols: [], rows: [] }
  if (rows.length === 0 || cols.length === 0) return

  const formattedRows = rows.map((row: any) => {
    const subset: Record<string, any> = {}
    cols.forEach((c: string) => {
      subset[c] = row[c]
    })
    return subset
  })

  navigator.clipboard.writeText(JSON.stringify(formattedRows, null, 2))
  isCopied.value = true
  setTimeout(() => {
    isCopied.value = false
  }, 2000)
}

watch(
  [() => props.tableName, () => props.connection?.id],
  () => {
    filter.value = ''
    selectProjection.value = '*'
    sortBy.value = null
    sortOrder.value = 'ASC'
    results.value = []
    persistedHeaders.value = []
    executeQuery()
  },
  { immediate: true }
)

const loadMore = async () => {
  if (isLoading.value || isLoadingMore.value || !hasMoreRows.value || !props.connection || !props.tableName) return

  isLoadingMore.value = true
  const nextOffset = offset.value + CHUNK_SIZE.value

  try {
    const cols = selectProjection.value.trim() || '*'
    let query = `SELECT ${cols} FROM \`${props.tableName}\` as \`${tableAlias.value}\``
    
    if (filter.value.trim()) {
      const cleanFilter = filter.value.trim()
      query += ` WHERE ${cleanFilter}`
    }

    if (sortBy.value) {
      query += ` ORDER BY \`${sortBy.value}\` ${sortOrder.value}`
    }

    const data = await Andb.executeQuery(props.connection, query, [], undefined, undefined, CHUNK_SIZE.value, nextOffset)
    const newRows = Array.isArray(data) ? data : [data]

    if (newRows.length < CHUNK_SIZE.value) {
      hasMoreRows.value = false
    }

    results.value = [...results.value, ...newRows]
    offset.value = nextOffset
  } catch (err: any) {
    console.error('Failed to load more rows', err)
  } finally {
    isLoadingMore.value = false
  }
}
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

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
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
