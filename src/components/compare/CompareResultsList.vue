<template>
  <div
    :style="{ width: resultsWidth + 'px' }"
    class="border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 flex flex-col shrink-0 relative transition-all duration-300 border-r"
  >
    <!-- Results Header -->
    <div
      class="px-4 py-2.5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0 flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <Database class="w-3.5 h-3.5 text-gray-400 opacity-50" />
        <span class="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Database Overview</span>
      </div>
      <div
        v-if="activeType !== 'all'"
        @click="$emit('update:activeType', 'all')"
        class="cursor-pointer p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors text-primary-500"
      >
        <ChevronLeft class="w-3.5 h-3.5" />
      </div>
    </div>

    <!-- Search Bar -->
    <div
      v-if="hasResults"
      class="px-3 pt-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0 shadow-sm"
    >
      <div class="relative group">
        <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200">
          <Search class="w-4 h-4 text-gray-400 group-focus-within:text-primary-500" />
        </span>
        <input
          :value="searchQuery"
          @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          type="text"
          :placeholder="t('history.searchPlaceholder')"
          class="w-full pl-9 pr-36 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-gray-900 dark:text-white transition-all shadow-inner"
        />

        <!-- Unified Search Icons (VS Code Style) -->
        <div class="absolute inset-y-0 right-0 flex items-center pr-2 space-x-0.5">
          <button
            @click="$emit('update:searchFlags', { ...searchFlags, caseSensitive: !searchFlags.caseSensitive })"
            class="p-1 rounded-md transition-all duration-200"
            :class="searchFlags.caseSensitive ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
            title="Match Case"
          >
            <CaseSensitive class="w-3.5 h-3.5" />
          </button>
          <button
            @click="$emit('update:searchFlags', { ...searchFlags, wholeWord: !searchFlags.wholeWord })"
            class="p-1 rounded-md transition-all duration-200"
            :class="searchFlags.wholeWord ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
            title="Match Whole Word"
          >
            <WholeWord class="w-3.5 h-3.5" />
          </button>
          <button
            @click="$emit('update:searchFlags', { ...searchFlags, regex: !searchFlags.regex })"
            class="p-1 rounded-md transition-all duration-200"
            :class="searchFlags.regex ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
            title="Use Regex"
          >
            <Regex class="w-3.5 h-3.5" />
          </button>

          <div class="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-0.5"></div>

          <button
            @click="$emit('update:searchFlags', { ...searchFlags, columns: !searchFlags.columns })"
            class="p-1 rounded-md transition-all duration-200"
            :class="searchFlags.columns ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
            title="Content Search (Snippets)"
          >
            <Binary class="w-3.5 h-3.5" />
          </button>

          <button
            v-if="searchQuery"
            @click="$emit('update:searchQuery', '')"
            class="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Search Progress/Summary & Tree Controls -->
      <div class="flex items-center justify-between mt-2.5 px-0.5">
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
    <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 px-1 mt-1 border-t border-gray-100 dark:border-gray-800/50">
      <span class="text-[9px] font-black uppercase tracking-tighter text-gray-400 mr-1">Filter:</span>
      <button
        v-for="filter in statusFilters"
        :key="filter.value"
        @click="$emit('update:selectedStatusFilter', filter.value)"
        class="px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border shrink-0"
        :class="selectedStatusFilter === filter.value
          ? 'bg-primary-500 border-primary-500 text-white shadow-sm shadow-primary-500/20'
          : 'bg-gray-100 dark:bg-gray-800 border-transparent text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'"
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
          <p class="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed" v-if="!searchQuery">
            {{ t('compare.perfectlyInSync') }}
          </p>
          <p class="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed" v-else>
            {{ t('compare.noSearchMatches') }} "{{ searchQuery }}"
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button
            v-if="selectedStatusFilter === 'all' && !searchQuery"
            @click="$emit('update:selectedStatusFilter', 'equal')"
            class="px-5 py-2 border border-gray-200 dark:border-gray-700 hover:border-emerald-500 text-gray-600 dark:text-gray-400 rounded-xl font-bold uppercase text-[9px] tracking-widest transition-all"
          >
            {{ t('compare.viewIdentical') }}
          </button>
          <button
            v-if="searchQuery"
            @click="$emit('update:searchQuery', '')"
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
            class="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2 py-1 transition-colors sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm group-hover/cat:bg-gray-50/50 dark:group-hover/cat:bg-gray-800/30 mb-px overflow-hidden select-none"
          >
            <ChevronRight
              class="w-3 h-3 mr-1.5 transition-transform text-gray-400 shrink-0"
              :class="{ 'rotate-90 text-primary-500': !collapsedCategories.has(cat.type) }"
            />
            <component :is="getIconForType(cat.type)" class="w-3.5 h-3.5 mr-2 shrink-0" :class="getCategoryColor(cat.type)" />
            <span class="font-extrabold text-[10px] uppercase tracking-widest text-gray-600 dark:text-gray-300 truncate">{{ cat.type }}</span>

            <div class="ml-auto flex items-center gap-1">
              <span v-if="cat.changes > 0" class="px-1.5 py-0.5 bg-orange-500 text-white text-[8px] rounded-full font-mono font-black shadow-sm shrink-0">
                {{ cat.changes }}
              </span>
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
              <div class="flex-1 min-w-0 pr-2">
                <div
                  class="font-mono truncate text-[11px] text-gray-700 dark:text-gray-300"
                  :class="{ 'font-bold text-primary-600 dark:text-primary-400': selectedItem?.name === item.name }"
                  :title="item.name"
                >
                  {{ item.name }}
                </div>
                <div class="text-[9px] text-gray-400 uppercase tracking-tighter flex items-center opacity-70 group-hover:opacity-100">
                  <component :is="getIconForType(item.type)" class="mr-1 w-2.5 h-2.5" />
                  <span>{{ item.type }}</span>
                </div>
              </div>

              <div class="flex items-center gap-1.5 shrink-0 ml-auto pr-1">
                <!-- Migration Trigger -->
                <div class="flex items-center justify-center w-6 h-6 rounded-full transition-all group/migrate bg-gray-50 dark:bg-gray-900 border border-transparent hover:border-orange-500/30">
                  <!-- State A: Processing / Migrating (Absolute Priority) -->
                  <RefreshCw v-if="isMigratingItemId === item.name" class="w-3 h-3 text-orange-500 animate-spin" />
                  
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
                        class="w-3.5 h-3.5 text-orange-500 hidden group-hover/migrate:block cursor-pointer hover:scale-110 active:scale-95 fill-current"
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

    <!-- Resize Handle -->
    <div
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
  CaseSensitive,
  WholeWord,
  Regex,
  Binary,
  Search,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  XCircle,
  ArrowDownAZ,
  CalendarClock,
  Plus,
  Minus
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  resultsWidth: number
  activeType: string
  searchQuery: string
  searchFlags: { caseSensitive: boolean; wholeWord: boolean; regex: boolean; columns: boolean }
  selectedStatusFilter: string
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

const emit = defineEmits([
  'update:activeType',
  'update:searchQuery',
  'update:searchFlags',
  'update:selectedStatusFilter',
  'update:sortBy',
  'expand-all',
  'collapse-all',
  'refresh-comparison',
  'fetch-and-compare',
  'select-item',
  'contextmenu',
  'migrate',
  'start-resize'
])

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
</script>
