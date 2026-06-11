<template>
  <div
    :style="{ width: isCollapsed ? '48px' : resultsWidth + 'px' }"
    class="border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 flex flex-col shrink-0 relative transition-all duration-300 border-r overflow-hidden"
  >
    <!-- Collapsed State Layout -->
    <div v-if="isCollapsed" class="flex-1 flex flex-col items-center py-3 justify-between">
      <button
        @click="appStore.layoutSettings.compareSidebarCollapsed = false"
        class="p-2 text-gray-400 hover:text-primary-500 hover:bg-gray-150 dark:hover:bg-gray-800 rounded-xl transition-all hover:scale-105 active:scale-95"
        title="Expand Database Overview"
      >
        <PanelLeftOpen class="w-4 h-4" />
      </button>
      
      <div class="flex-1 flex items-center justify-center">
        <span class="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500 transform rotate-90 whitespace-nowrap select-none">
          Overview
        </span>
      </div>

      <div class="w-8 h-8 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center">
        <Database class="w-4 h-4" />
      </div>
    </div>

    <!-- Results Header -->
    <template v-else>
      <div
        class="px-4 h-12 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0 flex items-center justify-between"
      >
      <div class="flex items-center gap-2">
        <Database class="w-3.5 h-3.5 text-gray-400 opacity-50" />
        <span class="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Database Overview</span>
      </div>
      <div class="flex items-center gap-1.5">
        <div
          v-if="activeType !== 'all'"
          @click="$emit('update:activeType', 'all')"
          class="cursor-pointer p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors text-primary-500"
          title="Back to Categories"
        >
          <ChevronLeft class="w-3.5 h-3.5" />
        </div>
        <div
          @click="appStore.layoutSettings.compareSidebarCollapsed = true"
          class="cursor-pointer p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-red-500"
          title="Minimize Column"
        >
          <PanelLeftClose class="w-3.5 h-3.5" />
        </div>
      </div>
    </div>

    <!-- Search Bar -->
    <div
      v-if="hasResults"
      class="px-3 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0 shadow-sm"
    >
      <!-- Search Progress/Summary & Tree Controls -->
      <div class="flex items-center justify-between px-0.5">
        <div class="flex items-center gap-2">
          <div class="text-[9px] text-gray-400 font-black uppercase tracking-widest">
            {{ filteredResults.length }} Objects Found
          </div>
        </div>

        <div class="flex items-center gap-0.5 shrink-0">
          <!-- Sort Options -->
          <button
            @click="$emit('update:sortBy', sortBy === 'date' ? 'status' : 'date')"
            class="p-1 rounded-md transition-colors"
            :class="sortBy === 'date' ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
            title="Sort by Date (Last Updated)"
          >
            <CalendarClock class="w-3.5 h-3.5" />
          </button>
          <button
            @click="$emit('update:sortBy', sortBy === 'name' ? 'status' : 'name')"
            class="p-1 rounded-md transition-colors"
            :class="sortBy === 'name' ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
            title="Sort Alphabetically (A-Z)"
          >
            <ArrowDownAZ class="w-3.5 h-3.5" />
          </button>

          <div class="w-px h-3 bg-gray-200 dark:bg-gray-700 mx-1"></div>

          <button
            @click="$emit('expand-all')"
            class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            title="Expand All"
          >
            <Plus class="w-3.5 h-3.5" />
          </button>
          <button
            @click="$emit('collapse-all')"
            class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            title="Collapse All"
          >
            <Minus class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Status Filters -->
    <div
      v-if="hasResults"
      class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 px-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700/50 shrink-0"
    >
      <span class="text-[9px] font-black uppercase tracking-tighter text-gray-400 dark:text-gray-500 mr-1">Filter:</span>
      <button
        v-for="filter in statusFilters"
        :key="filter.value"
        @click="appStore.globalSearchFilter = filter.value as any"
        class="px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border shrink-0"
        :class="appStore.globalSearchFilter === filter.value
          ? 'bg-primary-500 border-primary-500 text-white shadow-sm shadow-primary-500/20'
          : 'bg-gray-100 dark:bg-gray-700 border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'"
      >
        {{ filter.label }}
      </button>
    </div>

    <!-- Scrollable Results Content -->
    <div class="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden p-2">
      <!-- No Results / Empty State -->
      <div
        v-if="!hasResults && !loading"
        class="p-12 text-center h-full flex flex-col justify-center items-center gap-4 animate-in fade-in zoom-in duration-500"
      >
        <div class="relative">
          <ScanSearch class="w-16 h-16 text-gray-200 dark:text-gray-800" />
          <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center border border-gray-100 dark:border-gray-800">
            <Search class="w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>
        <div class="max-w-xs space-y-1">
          <p class="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
            {{ activePair ? t('compare.noData') : t('compare.noPair') }}
          </p>
          <p class="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
            {{ activePair ? t('compare.noDataDesc') : t('compare.noPairDesc') }}
          </p>
        </div>
        <div class="flex items-center gap-3 mt-2">
          <button
            v-if="activePair"
            @click="$emit('refresh-comparison')"
            class="px-6 py-2.5 bg-primary-500 text-white rounded-xl font-bold uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-primary-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            {{ t('compare.startCompare') }}
          </button>
          <button
            v-if="activePair"
            @click="$emit('fetch-and-compare')"
            class="px-6 py-2.5 border border-primary-500/30 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl font-bold uppercase text-[10px] tracking-[0.2em] transition-all flex items-center gap-2"
          >
            <RefreshCw
              class="w-3.5 h-3.5"
              :class="{ 'animate-spin': loading && loadingAction === 'fetch' }"
            />
            Fetch & Compare
          </button>
        </div>
      </div>

      <!-- Identical / Everything Filtered Out -->
      <div
        v-else-if="hasResults && filteredResults.length === 0 && !loading"
        class="p-12 text-center h-full flex flex-col justify-center items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
      >
        <div class="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center relative">
          <div class="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-20"></div>
          <CheckCircle2 class="w-10 h-10 text-emerald-500" />
        </div>
        <div class="max-w-xs space-y-1">
          <p class="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            {{ t('compare.noChanges') }}
          </p>
          <p class="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed" v-if="!appStore.globalSearchQuery">
            {{ t('compare.perfectlyInSync') }}
          </p>
          <p class="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed" v-else>
            {{ t('compare.noSearchMatches') }} "{{ appStore.globalSearchQuery }}"
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button
            v-if="appStore.globalSearchFilter === 'all' && !appStore.globalSearchQuery"
            @click="appStore.globalSearchFilter = 'equal'"
            class="px-5 py-2 border border-gray-200 dark:border-gray-700 hover:border-emerald-500 text-gray-600 dark:text-gray-400 rounded-xl font-bold uppercase text-[9px] tracking-widest transition-all"
          >
            {{ t('compare.viewIdentical') }}
          </button>
          <button
            v-if="appStore.globalSearchQuery"
            @click="appStore.globalSearchQuery = ''"
            class="px-5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 rounded-xl font-bold uppercase text-[9px] tracking-widest transition-all"
          >
            {{ t('compare.clearSearch') }}
          </button>
        </div>
      </div>

      <!-- Result List by Categories -->
      <div v-else class="space-y-1 pb-4">
        <div v-for="cat in resultsByCategory" :key="cat.type" class="flex flex-col group/cat relative">
          <!-- Category Header -->
          <div
            @click="collapsedCategories.has(cat.type) ? collapsedCategories.delete(cat.type) : collapsedCategories.add(cat.type)"
            class="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2 py-1.5 transition-colors sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm group-hover/cat:bg-gray-50/50 dark:group-hover/cat:bg-gray-800/30 mb-px overflow-hidden select-none group/catHeader"
          >
            <!-- Category Checkbox -->
            <input
              v-if="cat.changes > 0 && !isTargetDump"
              type="checkbox"
              :checked="isCategorySelected(cat)"
              @click.stop="toggleSelectCategory(cat)"
              class="mr-2 rounded border-gray-300 dark:border-gray-700 text-primary-600 focus:ring-primary-500 cursor-pointer w-3.5 h-3.5 shrink-0 transition-all bg-white dark:bg-gray-800"
            />

            <ChevronRight
              class="w-3 h-3 mr-1.5 transition-transform text-gray-400 shrink-0"
              :class="{ 'rotate-90 text-primary-500': !collapsedCategories.has(cat.type) }"
            />
            <component :is="getIconForType(cat.type)" class="w-3.5 h-3.5 mr-2 shrink-0" :class="getCategoryColor(cat.type)" />
            <span class="font-extrabold text-[10px] uppercase tracking-widest text-gray-600 dark:text-gray-300 truncate">{{ cat.type }}</span>

            <div class="ml-auto flex items-center gap-1.5">
              <!-- Orange changes count Badge & Migrate Action (overlays on hover) -->
              <div v-if="cat.changes > 0" class="relative w-5 h-5 flex items-center justify-center shrink-0">
                <!-- Batch Migrate Category Button -->
                <button
                  v-if="!isTargetDump"
                  @click.stop="$emit('migrate-batch', cat.type)"
                  class="absolute inset-0 flex items-center justify-center bg-primary-500 hover:bg-primary-600 text-white rounded-full transition-all opacity-0 group-hover/catHeader:opacity-100 shadow-sm z-10"
                  title="Migrate all changes in category"
                >
                  <Zap class="w-3 h-3 fill-current" />
                </button>

                <!-- Badge -->
                <span 
                  class="px-1.5 py-0.5 bg-primary-500 text-white text-[8px] rounded-full font-mono font-black shadow-sm shrink-0 transition-opacity"
                  :class="!isTargetDump ? 'group-hover/catHeader:opacity-0' : ''"
                >
                  {{ cat.changes }}
                </span>
              </div>

              <span class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-400 text-[8px] rounded-full font-mono shrink-0">
                {{ cat.total }}
              </span>
            </div>
          </div>

          <!-- Items List (Expanded) -->
          <div v-if="!collapsedCategories.has(cat.type)" class="pl-4 border-l border-gray-100 dark:border-gray-800 ml-3.5 mt-0.5 space-y-0.5 pb-2">
            <div
              v-for="item in cat.items"
              :key="item.name"
              @click="$emit('select-item', item)"
              @contextmenu.prevent="$emit('contextmenu', $event, item)"
              class="cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center group px-2 py-1.5 relative border border-transparent overflow-hidden"
              :class="{ 'bg-primary-50 dark:bg-primary-900/20 border-primary-200/50 dark:border-primary-800/50 shadow-sm transition-all': selectedItem?.name === item.name }"
            >
              <!-- Item Checkbox -->
              <input
                v-if="item.status?.toLowerCase() !== 'equal' && item.status?.toLowerCase() !== 'same' && !isTargetDump"
                type="checkbox"
                :checked="selectedNames.has(item.name)"
                @click.stop="toggleSelectItem(item)"
                class="mr-2.5 rounded border-gray-300 dark:border-gray-700 text-primary-600 focus:ring-primary-500 cursor-pointer w-3.5 h-3.5 shrink-0 transition-all bg-white dark:bg-gray-800 self-start mt-1.5"
              />

              <div class="flex-1 min-w-0 pr-2 flex items-center gap-1.5">
                <component :is="getIconForType(cat.type)" class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 opacity-60 shrink-0" />
                <div
                  class="font-mono truncate text-[11px] text-gray-700 dark:text-gray-300"
                  :class="{ 'font-bold text-primary-600 dark:text-primary-400': selectedItem?.name === item.name }"
                  :title="item.name"
                >
                  {{ item.name }}
                </div>
                <div 
                  v-if="item.updated_at" 
                  class="text-[9px] text-gray-400 flex items-center opacity-70 group-hover:opacity-100"
                >
                  <CalendarClock class="mr-1 w-2.5 h-2.5" />
                  <span>{{ formatTimeAgo(item.updated_at).replace(' ago', '') }}</span>
                </div>

                <!-- Snippets (Search Results) -->
                <div v-if="item.matches && item.matches.length > 0" class="mt-1.5 space-y-1 w-full">
                  <div
                    v-for="(match, mIdx) in item.matches.slice(0, 3)"
                    :key="mIdx"
                    class="text-[9px] bg-gray-50 dark:bg-gray-800/40 p-1.5 rounded border border-gray-100 dark:border-gray-800/60 font-mono text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors w-full overflow-hidden"
                  >
                    <div class="flex items-center justify-between mb-0.5 opacity-60 text-[8px]">
                      <span>Line {{ match.line }}</span>
                    </div>
                    <div
                      class="whitespace-pre overflow-x-hidden text-ellipsis text-[10px]"
                      v-html="highlightText(match.text)"
                    ></div>
                  </div>
                  <div
                    v-if="item.matches.length > 3"
                    class="text-[8px] text-gray-400 italic pl-1"
                  >
                    + {{ item.matches.length - 3 }} more matches...
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-1.5 shrink-0 ml-auto pr-1 self-start mt-0.5">
                <!-- Migration Trigger -->
                <div class="flex items-center justify-center w-6 h-6 rounded-full transition-all group/migrate bg-gray-50 dark:bg-gray-900 border border-transparent hover:border-primary-500/30">
                  <!-- State A: Processing / Migrating (Absolute Priority) -->
                  <RefreshCw v-if="isMigratingItemId === item.name" class="w-3 h-3 text-primary-500 animate-spin" />
                  
                  <!-- State B: Idle / Ready -->
                  <template v-else>
                    <component
                      :is="getStatusIcon(item.status)"
                      class="w-3.5 h-3.5 transition-all"
                      :class="[getStatusClass(item.status), { 'group-hover/migrate:hidden': item.status?.toLowerCase() !== 'equal' && item.status?.toLowerCase() !== 'same' && !isTargetDump }]"
                    />
                    <template v-if="item.status?.toLowerCase() !== 'equal' && item.status?.toLowerCase() !== 'same' && !isTargetDump">
                      <Zap
                        @click.stop="$emit('migrate', item)"
                        class="w-3.5 h-3.5 text-primary-500 hidden group-hover/migrate:block cursor-pointer hover:scale-110 active:scale-95 fill-current"
                        title="Migrate"
                      />
                    </template>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Bulk Action Bar -->
    <transition
      enter-active-class="transition ease-out duration-200 transform"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition ease-in duration-150 transform"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <div
        v-if="hasSelections && !isTargetDump"
        class="absolute bottom-4 left-3 right-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl shadow-primary-500/10 p-3 flex items-center justify-between z-30 ring-1 ring-black/5 dark:ring-white/5"
      >
        <div class="flex flex-col">
          <span class="text-[11px] font-extrabold text-gray-900 dark:text-white leading-tight">
            {{ selectedNames.size }} Item{{ selectedNames.size > 1 ? 's' : '' }} Selected
          </span>
          <button @click="clearSelections" class="text-[10px] text-primary-500 hover:text-primary-600 hover:underline text-left font-extrabold tracking-tighter mt-0.5">
            Clear selection
          </button>
        </div>
        
        <button
          @click="handleMigrateSelected"
          class="flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-[10px] font-black tracking-[0.08em] uppercase hover:scale-[1.03] active:scale-95 transition-all shadow-lg shadow-primary-500/25 select-none"
        >
          <Zap class="w-3.5 h-3.5 fill-current" />
          Migrate
        </button>
      </div>
    </transition>
  </template>

  <!-- Resize Handle -->
    <div
      v-if="!isCollapsed"
      @mousedown="startResize"
      class="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary-400/50 transition-colors z-20"
    ></div>
  </div>
</template>

<script setup lang="ts">
import {
  Sigma,
  AlertCircle,
  ScanSearch,
  Zap,
  RefreshCw,
  Database,
  Table,
  Layers,
  Workflow,
  Search,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  XCircle,
  ArrowDownAZ,
  CalendarClock,
  Plus,
  Minus,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-vue-next'
import { reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'

const isCollapsed = computed(() => appStore.layoutSettings.compareSidebarCollapsed)

const { t } = useI18n()

const props = defineProps<{
  resultsWidth: number
  activeType: string
  sortBy: string
  selectedItem: any | null
  collapsedCategories: Set<string>
  activePair: any | null
  loading: boolean
  loadingAction: string | null
  isTargetDump: boolean
  isMigratingItemId: string | null
  filteredResults: any[]
  hasResults: boolean
  statusFilters: any[]
  resultsByCategory: any[]
}>()

const appStore = useAppStore()
const emit = defineEmits([
  'update:activeType',
  'update:sortBy',
  'expand-all',
  'collapse-all',
  'refresh-comparison',
  'fetch-and-compare',
  'select-item',
  'contextmenu',
  'migrate',
  'migrate-batch',
  'migrate-custom-batch',
  'start-resize'
])

// ==========================================
// Multi-Select State & Logic
// ==========================================
const selectedNames = reactive(new Set<string>())

const toggleSelectItem = (item: any) => {
  if (selectedNames.has(item.name)) {
    selectedNames.delete(item.name)
  } else {
    selectedNames.add(item.name)
  }
}

const isCategorySelected = (cat: any) => {
  const changedItems = cat.items.filter((i: any) => {
    const s = i.status?.toLowerCase()
    return s !== 'equal' && s !== 'same'
  })
  if (changedItems.length === 0) return false
  return changedItems.every((i: any) => selectedNames.has(i.name))
}

const toggleSelectCategory = (cat: any) => {
  const changedItems = cat.items.filter((i: any) => {
    const s = i.status?.toLowerCase()
    return s !== 'equal' && s !== 'same'
  })
  if (isCategorySelected(cat)) {
    changedItems.forEach((i: any) => selectedNames.delete(i.name))
  } else {
    changedItems.forEach((i: any) => selectedNames.add(i.name))
  }
}

const hasSelections = computed(() => selectedNames.size > 0)

const clearSelections = () => {
  selectedNames.clear()
}

const handleMigrateSelected = () => {
  const items = props.filteredResults.filter(r => selectedNames.has(r.name))
  emit('migrate-custom-batch', items)
}

watch(() => props.filteredResults, () => {
  const validNames = new Set(props.filteredResults.map(r => r.name))
  for (const name of Array.from(selectedNames)) {
    if (!validNames.has(name)) {
      selectedNames.delete(name)
    }
  }
}, { deep: true })

const startResize = (e: MouseEvent) => {
  emit('start-resize', e)
}

const getIconForType = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'tables':
    case 'table':
      return Table
    case 'views':
    case 'view':
      return Layers
    case 'procedures':
    case 'procedure':
      return Workflow
    case 'functions':
    case 'function':
      return Sigma
    case 'triggers':
    case 'trigger':
      return Zap
    default:
      return Database
  }
}

const getCategoryColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'tables':
    case 'table':
      return 'text-blue-500'
    case 'views':
    case 'view':
      return 'text-indigo-500'
    case 'procedures':
    case 'procedure':
    case 'functions':
    case 'function':
      return 'text-purple-500'
    case 'triggers':
    case 'trigger':
      return 'text-amber-500'
    default:
      return 'text-gray-500'
  }
}

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'equal':
    case 'same':
      return CheckCircle2
    case 'new':
    case 'missing_in_target':
      return PlusCircle
    case 'deprecated':
    case 'missing_in_source':
      return XCircle
    case 'modified':
    case 'different':
    case 'updated':
      return AlertCircle
    default:
      return AlertCircle
  }
}

const getStatusClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'equal':
    case 'same':
      return 'text-teal-600 dark:text-teal-400 font-bold'
    case 'new':
    case 'missing_in_target':
      return 'text-emerald-500 dark:text-emerald-400 drop-shadow-sm font-bold'
    case 'deprecated':
    case 'missing_in_source':
      return 'text-rose-500 dark:text-rose-400 drop-shadow-sm font-bold'
    case 'modified':
    case 'different':
    case 'updated':
      return 'text-amber-500 dark:text-amber-400 drop-shadow-sm font-bold'
    default:
      return 'text-gray-400'
  }
}

const formatTimeAgo = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`

  return date.toLocaleDateString()
}

const highlightText = (text: string) => {
  if (!text) return ''
  let processed = text

  const term = appStore.globalSearchQuery.trim()
  if (term) {
    try {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const re = new RegExp(`(${escaped})`, 'gi')
      processed = processed.replace(
        re,
        '<span class="bg-primary-500/30 text-primary-900 dark:text-primary-100 rounded-sm px-0.5 font-bold">$1</span>'
      )
    } catch (e) {}
  }
  return processed
}
</script>
