<template>
  <div
    :style="{ width: width + 'px' }"
    class="border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col shrink-0 relative border-r"
  >
    <!-- Header: Match Compare Sidebar Style -->
    <div
      class="px-4 h-12 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0 flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <Database class="w-3.5 h-3.5 text-gray-400 opacity-50" />
        <span
          class="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500"
          >Database Overview</span
        >
      </div>
      <div class="flex items-center gap-1">
        <!-- Standard Refresh -->
        <button
          @click="emit('refresh')"
          class="p-1 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-all"
          :title="$t('schema.fetchTooltip') + ' (' + (lastUpdated ? lastUpdated : 'Never') + ')'"
        >
          <RotateCw class="w-3 h-3" :class="{ 'animate-spin': isFetching }" />
        </button>


      </div>
    </div>

    <!-- Professional Search Bar (Compare Style) -->
    <div
      class="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0 space-y-3"
    >

      <!-- Action & Summary Row (Exactly like Screenshot) -->
      <div class="flex items-center justify-between px-1">
        <div class="flex items-center gap-2 overflow-hidden">
          <div
            class="text-[10px] text-emerald-500 font-black uppercase tracking-widest whitespace-nowrap"
          >
            {{ formatSmartNumber(filteredResultsCount) }}
            <span class="text-gray-400 font-bold">Objects</span>
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
            <button
              @click="emit('expand-all')"
              class="text-gray-300 hover:text-gray-600 dark:hover:text-white transition-colors"
              title="Expand All"
            >
              <Plus class="w-4 h-4" />
            </button>
            <button
              @click="emit('collapse-all')"
              class="text-gray-300 hover:text-gray-600 dark:hover:text-white transition-colors"
              title="Collapse All"
            >
              <Minus class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Content Area (Always visible, internal logic handles states) -->
    <div class="flex-1 overflow-y-auto custom-scrollbar p-2">
      <div
        v-if="!hasResults"
        class="p-8 text-center text-gray-400 h-full flex flex-col justify-center"
      >
        <ScanSearch class="w-12 h-12 mx-auto mb-2 opacity-20" />
        <p class="text-xs uppercase tracking-widest font-bold">{{ $t('schema.noSchema') }}</p>
      </div>
      <SchemaTreeMode
        v-else
        :results="filteredResults"
        :selected-item-name="selectedItemName"
        :search-term="appStore.globalSearchQuery"
        :stats="tableStats"
        :expand-cmd="expandCmd"
        :column-search-active="searchFlags.columns"
        @select="(item: any) => emit('select', item)"
        @send-to-instant="(item: any, slot: 'source' | 'target') => emit('send-to-instant', item, slot)"
      />
    </div>

    <div
      @mousedown="e => emit('start-resize', e)"
      class="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary-400/50 transition-colors z-10"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import {
  RotateCw,
  Database,
  Plus,
  Minus,
  SortAsc,
  CalendarClock,
  ScanSearch
} from 'lucide-vue-next'
import SchemaTreeMode from '@/components/ddl/SchemaTreeMode.vue'

const formatSmartNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const appStore = useAppStore()
const props = defineProps<{
  width: number
  hasResults: boolean
  filteredResults: any[]
  filteredResultsCount: number
  selectedItemName?: string
    searchFlags: any
  isIndexingColumns: boolean
  selectedSizeFilter: string
  tableStats: any
  lastUpdated?: string
  isFetching: boolean
  expandCmd?: { action: 'expand' | 'collapse'; ts: number } | null
}>()

// Emits
const emit = defineEmits<{
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
  (e: 'send-to-instant', item: any, slot: 'source' | 'target'): void
}>()


</script>
