<template>
  <div :style="{ width: width + 'px' }" class="border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col shrink-0 relative border-r">
    <!-- Header: Match Compare Sidebar Style -->
    <div class="px-4 py-2.5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Database class="w-3.5 h-3.5 text-gray-400 opacity-50" />
        <span class="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Database Overview</span>
      </div>
      <div class="flex items-center gap-1.5">
        <button 
          @click="emit('refresh')" 
          class="p-1 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-all"
          :title="'Refresh (' + (lastUpdated ? lastUpdated : 'Never') + ')'"
        >
          <RotateCw class="w-3 h-3" :class="{ 'animate-spin': isFetching }" />
        </button>
      </div>
    </div>

    <!-- Professional Search Bar (Compare Style) -->
    <div class="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0 space-y-3">
      <div class="relative group">
        <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-200">
          <Search class="w-3.5 h-3.5 text-gray-400 group-focus-within:text-emerald-500" />
        </span>
        <input 
          :value="searchQuery"
          @input="handleSearchInput"
          type="text"
          placeholder="Filter objects..."
          class="w-full pl-10 pr-32 py-2 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-[11px] focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 text-gray-900 dark:text-white transition-all placeholder:text-gray-400 font-medium" 
        />

        <!-- Integrated Control Icons (Sleek Inline Style) -->
        <div class="absolute inset-y-0 right-0 flex items-center pr-2 space-x-0.5">
          <button @click="toggleFlag('caseSensitive')"
            class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :class="searchFlags.caseSensitive ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'text-gray-400'"
            title="Match Case">
            <span class="text-[10px] font-bold">Aa</span>
          </button>
          <button @click="toggleFlag('wholeWord')"
            class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :class="searchFlags.wholeWord ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'text-gray-400'"
            title="Match Whole Word">
            <WholeWord class="w-3.5 h-3.5" />
          </button>
          <button @click="toggleFlag('regex')"
            class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :class="searchFlags.regex ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'text-gray-400'"
            title="Use Regex">
            <Regex class="w-3.5 h-3.5" />
          </button>

          <div v-if="searchQuery" class="flex items-center gap-1 pl-2 pr-1 border-l border-gray-200 dark:border-gray-700 ml-1">
             <span class="text-[9px] font-mono font-bold text-emerald-500">{{ filteredResultsCount }}</span>
          </div>
        </div>
      </div>

      <!-- Action & Summary Row (Exactly like Screenshot) -->
      <div class="flex items-center justify-between px-1">
        <div class="flex items-center gap-2 overflow-hidden">
          <div class="text-[10px] text-emerald-500 font-black uppercase tracking-widest whitespace-nowrap">
            {{ formatSmartNumber(filteredResultsCount) }} <span class="text-gray-400 font-bold">Objects</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button class="text-gray-400 hover:text-primary-500 transition-colors">
            <CalendarClock class="w-4 h-4" />
          </button>
          <button class="text-gray-400 hover:text-primary-500 transition-colors">
            <SortAsc class="w-4 h-4" />
          </button>
          <div class="w-px h-4 bg-gray-200 dark:bg-gray-700 opacity-40"></div>
          <div class="flex items-center gap-2">
            <button @click="emit('expand-all')" class="text-gray-300 hover:text-gray-600 dark:hover:text-white transition-colors" title="Expand All"><Plus class="w-4 h-4" /></button>
            <button @click="emit('collapse-all')" class="text-gray-300 hover:text-gray-600 dark:hover:text-white transition-colors" title="Collapse All"><Minus class="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Content Area (Always visible, internal logic handles states) -->
    <div class="flex-1 overflow-y-auto custom-scrollbar p-2">
      <div v-if="!hasResults" class="p-8 text-center text-gray-400 h-full flex flex-col justify-center">
        <ScanSearch class="w-12 h-12 mx-auto mb-2 opacity-20" />
        <p class="text-xs uppercase tracking-widest font-bold">{{ $t('schema.noSchema') }}</p>
      </div>
      <SchemaTreeMode 
        v-else
        :results="filteredResults" 
        :selected-item-name="selectedItemName"
        :search-term="internalSearchQuery"
        :stats="tableStats"
        :expand-cmd="expandCmd"
        :column-search-active="searchFlags.columns"
        @select="(item: any) => emit('select', item)"
       />
    </div>
    
    <div @mousedown="(e) => emit('start-resize', e)" class="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary-400/50 transition-colors z-10"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { 
  Search, RotateCw, Database, Plus, Minus, X, ScanSearch, 
  RefreshCw, Columns, CaseSensitive, Regex, WholeWord,
  CalendarClock, SortAsc
} from 'lucide-vue-next'
import SchemaTreeMode from '@/components/ddl/SchemaTreeMode.vue'

const formatTimeAgo = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 600) return 'Few minutes ago'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return date.toLocaleDateString()
}

const formatSmartNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const props = defineProps<{
  width: number
  hasResults: boolean
  filteredResults: any[]
  filteredResultsCount: number
  selectedItemName?: string
  searchQuery: string
  searchFlags: any
  isIndexingColumns: boolean
  selectedSizeFilter: string
  tableStats: any
  lastUpdated?: string
  isFetching: boolean
  expandCmd?: { action: 'expand' | 'collapse', ts: number } | null
}>()

// Emits
const emit = defineEmits<{
  (e: 'update:searchQuery', value: string): void
  (e: 'update:searchFlags', value: any): void
  (e: 'toggle-content-search'): void
  (e: 'toggle-column-search'): void
  (e: 'expand-all'): void
  (e: 'collapse-all'): void
  (e: 'update-size-filter', value: string): void
  (e: 'select', item: any): void
  (e: 'start-resize', event: MouseEvent): void
  (e: 'refresh'): void
  (e: 'new-query'): void
}>()

const handleSearchInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  emit('update:searchQuery', val)
}

const toggleFlag = (flag: string) => {
  const newFlags = { ...props.searchFlags, [flag]: !props.searchFlags[flag] }
  emit('update:searchFlags', newFlags)
}
</script>
