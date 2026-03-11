<template>
  <div class="h-full w-full flex flex-col bg-gray-50 dark:bg-gray-950">
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 flex items-center justify-between shrink-0 h-16 gap-4">
        <!-- Title & Connection Selection -->
        <div class="flex items-center gap-4">
          <div class="flex flex-col gap-0.5">
            <h1 class="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center">
              <Folder class="w-5 h-5 mr-2 text-primary-500" />
              {{ $t('schema.title') }}
            </h1>
             <div class="flex items-center text-[10px] text-gray-500 font-bold uppercase tracking-wider gap-2">
                <Database class="w-3 h-3 opacity-50" />
                <span class="text-primary-600 dark:text-primary-400 font-black tracking-widest">{{ activeConnectionName }}</span>
               <button 
                 @click="loadSchema(false)" 
                 class="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 hover:text-primary-500 transition-colors"
                 :title="$t('schema.reloadLocal')"
               >
                 <RotateCcw class="w-3 h-3" />
               </button>
            </div>
          </div>
        </div>

        <!-- Right Actions Area -->
        <div class="flex items-center gap-4">
            <!-- Safe Mode Toggle -->
            <div class="relative flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700 select-none">
               <ShieldCheck class="w-4 h-4" :class="appStore.safeMode ? 'text-green-500' : 'text-gray-400'" />
               
               <div class="flex items-center gap-1">
                 <span class="text-[10px] font-bold uppercase tracking-widest text-gray-500 cursor-help" :title="$t('common.tooltips.safeMode', 'Safe Mode prevents potentially destructive actions during comparisons and migrations.')">{{ $t('schema.safeMode') }}</span>
                 <button @click="showSafeModeInfo = !showSafeModeInfo" class="text-gray-400 hover:text-primary-500 transition-colors p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                   <Info class="w-3 h-3" />
                 </button>
               </div>
               
               <button 
                 @click="appStore.safeMode = !appStore.safeMode"
                 class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ml-1"
                 :class="appStore.safeMode ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'"
               >
                 <span 
                   class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                   :class="appStore.safeMode ? 'translate-x-4' : 'translate-x-0'"
                 ></span>
               </button>

               <!-- Info Popover -->
               <div v-if="showSafeModeInfo" class="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50">
                 <div class="flex items-start justify-between mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                   <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 text-xs uppercase tracking-widest">
                     <ShieldCheck class="w-4 h-4 text-green-500"/> {{ $t('schema.safeMode') }} Info
                   </h3>
                   <button @click="showSafeModeInfo = false" class="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-0.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X class="w-3.5 h-3.5"/></button>
                 </div>
                 <div class="text-gray-600 dark:text-gray-300 space-y-3 text-xs leading-relaxed">
                   <p>
                     <span class="font-bold text-green-500 flex items-center gap-1 mb-0.5"><span class="w-1.5 h-1.5 rounded-full bg-green-500"></span> ON (Dry Run)</span>
                     Simulates changes without affecting your database. Generates SQL for preview only. <span class="text-gray-400 italic">Recommended.</span>
                   </p>
                   <p>
                     <span class="font-bold text-red-500 flex items-center gap-1 mb-0.5"><span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> OFF (Execute)</span>
                     Executes actual CREATE, ALTER, and DROP statements directly on the database. <span class="text-red-400 font-bold">Use with extreme caution!</span>
                   </p>
                 </div>
               </div>
            </div>

            <!-- Fetch Group -->
           <div class="flex items-center gap-3">
              
              <div v-if="selectedDbLastUpdated && !appStore.isSchemaFetching" class="hidden sm:flex flex-col items-end px-2 border-r border-gray-200 dark:border-gray-700">
                <span class="text-[9px] text-gray-400 uppercase tracking-tighter">{{ $t('schema.lastSynced') }}</span>
                <span class="text-[10px] font-bold text-gray-600 dark:text-gray-300">{{ formatTimeAgo(selectedDbLastUpdated) }}</span>
              </div>

              <button 
                @click="loadSchema(true)" 
                :disabled="appStore.isSchemaFetching || loading || !selectedConnectionId"
                class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-primary-50 text-primary-600 dark:bg-gray-800 dark:hover:bg-primary-900/30 dark:text-primary-400 rounded-lg shadow border border-gray-200 dark:border-gray-700 transition-all disabled:opacity-50 text-xs font-medium"
                :title="fetchButtonText"
              >
                <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': appStore.isSchemaFetching || loading }" />
                <span>{{ appStore.isSchemaFetching ? $t('schema.fetching') : fetchButtonText }}</span>
              </button>
           </div>
           
           <!-- System Logs Toggle -->
           
           <button 
              @click="consoleStore.toggleVisibility()" 
              class="p-2 rounded-xl text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all border border-transparent"
              :title="$t('console.toggle')"
            >
              <PanelBottom class="w-4 h-4" />
            </button>
        </div>
    </div>
    <!-- Breadcrumbs -->
    <div class="bg-gray-100/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 px-6 py-2 flex items-center gap-2 shrink-0 overflow-x-auto no-scrollbar">
      <button 
        @click="resetNavigation"
        class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-primary-500 transition-colors shrink-0"
      >
        <Database class="w-3 h-3" />
        {{ $t('schema.overview') }}
      </button>
      


      <template v-if="selectedItem">
        <ChevronRight class="w-3 h-3 text-gray-300 shrink-0" />
        <span class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-900 dark:text-white truncate shrink-0">
          <component :is="getIconForType(selectedItem.type)" class="w-3 h-3" />
          {{ selectedItem.name }}
        </span>
      </template>

      <!-- Expand / Collapse All (moved here from panel header) -->
      <div v-if="hasResults" class="flex items-center gap-0.5 ml-auto shrink-0">
        <button
          @click="treeExpandCmd = { action: 'expand', ts: Date.now() }"
          class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-gray-700 dark:hover:white"
          title="Expand All"
        >
          <Plus class="w-3 h-3" />
        </button>
        <button
          @click="treeExpandCmd = { action: 'collapse', ts: Date.now() }"
          class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-gray-700 dark:hover:white"
          title="Collapse All"
        >
          <Minus class="w-3 h-3" />
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col overflow-hidden relative">
        <main class="flex-1 flex overflow-hidden relative" v-if="!loading || hasResults">
          <!-- Left: Object Categories & List -->
          <div :style="{ width: resultsWidth + 'px' }" class="border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col shrink-0 relative">

              <!-- Search Bar (Professional Redesign) -->
              <div v-if="hasResults" class="p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0 shadow-sm">
                <div class="relative group">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200">
                    <Search class="w-4 h-4 text-gray-400 group-focus-within:text-primary-500" />
                  </span>
                  <input 
                    v-model="searchQuery"
                    type="text" 
                    :placeholder="searchFlags.content ? 'Search content & names...' : 'Search names...'"
                    class="w-full pl-9 pr-32 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-gray-900 dark:text-white transition-all shadow-inner"
                    @keyup.enter="searchFlags.content && performContentSearch()"
                  />
                  
                  <!-- Unified Search Icons (VS Code Style) -->
                  <div class="absolute inset-y-0 right-0 flex items-center pr-2 space-x-0.5">
                    <button 
                      @click="searchFlags.caseSensitive = !searchFlags.caseSensitive"
                      class="p-1 rounded-md transition-all duration-200"
                      :class="searchFlags.caseSensitive ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
                      title="Match Case"
                    >
                      <CaseSensitive class="w-3.5 h-3.5" />
                    </button>
                    <button 
                      @click="searchFlags.wholeWord = !searchFlags.wholeWord"
                      class="p-1 rounded-md transition-all duration-200"
                      :class="searchFlags.wholeWord ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
                      title="Match Whole Word"
                    >
                      <WholeWord class="w-3.5 h-3.5" />
                    </button>
                    <button 
                      @click="searchFlags.regex = !searchFlags.regex"
                      class="p-1 rounded-md transition-all duration-200"
                      :class="searchFlags.regex ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
                      title="Use Regex"
                    >
                      <Regex class="w-3.5 h-3.5" />
                    </button>
                    
                    <div class="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-0.5"></div>

                    <button 
                      @click="toggleContentSearch"
                      class="p-1 rounded-md transition-all duration-200"
                      :class="searchFlags.content ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
                      title="Content Search (Snippets)"
                    >
                      <Binary class="w-3.5 h-3.5" />
                    </button>

                    <button 
                      v-if="searchQuery"
                      @click="clearSearch"
                      class="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all"
                    >
                      <X class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <!-- Search Progress/Summary -->
                <div v-if="searchQuery" class="flex items-center justify-between mt-2 px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                   <div v-if="isSearchingContent" class="flex items-center gap-2">
                    <RefreshCw class="w-3 h-3 animate-spin text-primary-500" />
                    <span class="text-[10px] text-gray-500 uppercase font-bold tracking-tight animate-pulse">Searching codebases...</span>
                  </div>
                  <div v-else class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <span v-if="searchFlags.content" class="text-primary-600 dark:text-primary-400">
                      {{ contentSearchResults.reduce((acc, curr) => acc + (curr.matches?.length || 0), 0) }} total matches
                    </span>
                    <span v-else>
                      {{ filteredResults.length }} objects found
                    </span>
                  </div>
                  
                  <!-- Filter Tag (if any) -->
                  <div v-if="selectedFilterType !== 'all'" class="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[9px] font-black uppercase text-gray-500">
                    <Filter class="w-2.5 h-2.5" />
                    {{ selectedFilterType }}
                  </div>
                </div>
              </div>
              
              <div class="flex-1 overflow-y-auto custom-scrollbar p-2">
                <div v-if="!hasResults" class="p-8 text-center text-gray-400 h-full flex flex-col justify-center">
                  <ScanSearch class="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p class="text-xs uppercase tracking-widest font-bold">{{ $t('schema.noSchema') }}</p>
                  <p class="text-[10px] opacity-60 mt-1">{{ $t('schema.selectDbFetch') }}</p>
                </div>
                <SchemaTreeMode 
                  v-if="treeMode === 'tree'"
                  :results="filteredResults" 
                  :selected-item-name="selectedItem?.name"
                  :active-search-line="activeSearchLine"
                  :search-term="searchQuery"
                  :focus-type="focusType"
                  :expand-cmd="treeExpandCmd"
                  :navigatable-names="navigatableNames"
                  @select="selectItem"
                  @navigateTo="handleNavigateTo"
                  @navigate-to-definition="handleNavigateToDefinition"
                />

              </div>
              
              <!-- Resize Handle -->
              <div 
                @mousedown="startResultsResize"
                class="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary-400/50 transition-colors z-10"
              ></div>
            </div>

            <!-- Right: DDL Viewer (Simplified MirrorDiffView) -->
            <div class="flex-1 bg-white dark:bg-gray-950 overflow-hidden flex flex-col relative">
              <div v-if="selectedItem" class="flex-1 flex flex-col overflow-hidden">
                <div class="p-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-800 shrink-0 h-14">
                  <div class="flex items-center overflow-hidden gap-3">
                    <div class="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                      <component :is="getIconForType(selectedItem.type)" class="w-4 h-4" />
                    </div>
                    <div class="min-w-0" v-if="selectedItem.type === 'diagrams'">
                      <h2 class="font-bold text-gray-900 dark:text-white truncate" :style="{ fontSize: appStore.fontSizes.ddlHeader + 'px' }">{{ $t('schema.visualDiagram') }}</h2>
                      <p class="text-[10px] uppercase font-bold text-gray-400 tracking-wider transition-colors duration-200">{{ activeConnectionName }}</p>
                    </div>
                    <div class="min-w-0" v-else>
                      <h2 class="font-bold text-gray-900 dark:text-white truncate" :style="{ fontSize: appStore.fontSizes.ddlHeader + 'px' }">{{ selectedItem.name }}</h2>
                      <div class="flex items-center space-x-2 mt-0.5">
                        <span class="text-[10px] uppercase font-bold text-gray-400 tracking-wider transition-colors duration-200">{{ selectedItem.type }}</span>
                        <div v-if="selectedDbLastUpdated" class="flex items-center text-[10px] text-gray-400 ml-2 pl-2 border-l border-gray-200 dark:border-gray-700">
                          <span class="mr-1 opacity-70">{{ $t('schema.lastSynced') }}:</span>
                          <span class="font-mono text-gray-500 dark:text-gray-300">{{ formatTimeAgo(selectedDbLastUpdated) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-2" v-if="selectedItem.type !== 'diagrams'">
                     <!-- Tab Switcher for Tables -->
                     <div v-if="selectedItem.type === 'tables' || selectedItem.type === 'table'" class="bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 flex mr-2">
                        <button 
                            @click="viewMode = 'visual'"
                            class="px-2 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1.5 uppercase tracking-wider"
                            :class="viewMode === 'visual' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
                        >
                            <LayoutTemplate class="w-3 h-3" />
                            {{ $t('schema.visual') }}
                        </button>

                        <button 
                            @click="viewMode = 'code'"
                            class="px-2 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1.5 uppercase tracking-wider"
                            :class="viewMode === 'code' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
                        >
                            <Code2 class="w-3 h-3" />
                            {{ $t('schema.code') }}
                        </button>
                    </div>

                    <button 
                      @click="takeSnapshot"
                      :disabled="loading"
                      class="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
                      :title="$t('schema.takeSnapshot')"
                    >
                      <Camera class="w-4 h-4" />
                    </button>
                    <button 
                      @click="viewHistory"
                      class="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
                      :title="$t('schema.viewHistory')"
                    >
                      <History class="w-4 h-4" />
                    </button>

                    <div class="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                    <button 
                      @click="downloadDDL"
                      class="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
                      :title="$t('common.download')"
                    >
                      <Download class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <!-- 1. Schema Diagram Mode -->
                <div v-if="selectedItem.type === 'diagrams'" class="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden relative">
                  <SchemaDiagram :tables="schemaData.tables" />
                </div>
                
                <!-- 2. Raw SQL Viewer Mode -->
                <div v-else-if="viewMode === 'code' || (selectedItem.type !== 'tables' && selectedItem.type !== 'table')" class="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden relative">
                    <DDLViewer 
                        ref="ddlViewerRef"
                        :content="formattedDDL" 
                        :search-term="searchQuery"
                        :font-size="appStore.fontSizes.code" 
                        :font-family="appStore.fontFamilies.code"
                        :navigatable-names="navigatableNames"
                        @navigate-to-definition="handleNavigateToDefinition"
                    />
                </div>
                
                <!-- 3. Detailed Table View Mode (MySQL Workbench style) -->
                <div v-else class="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden relative bg-gray-50/50 dark:bg-gray-900/50">
                    <TableDetailedView 
                        v-if="detailedTableData && selectedItem"
                        :key="'table-detail-' + selectedItem.name"
                        :table-name="selectedItem.name"
                        :columns="detailedTableData.columns"
                        :indexes="detailedTableData.indexes"
                        :foreign-keys="detailedTableData.foreignKeys"
                        :options="detailedTableData.options"
                        :partitions="detailedTableData.partitions"
                        :triggers="schemaData.triggers"
                    ></TableDetailedView>
                    
                    <div v-else class="flex items-center justify-center h-full w-full">
                      <RefreshCw class="w-8 h-8 text-primary-500 animate-spin opacity-20" />
                    </div>
                </div>
              </div>
              
              <div v-else class="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-400 grayscale opacity-40">
                <div class="relative mb-6">
                  <div class="absolute -inset-4 bg-primary-500/10 rounded-full blur-2xl animate-pulse"></div>
                  <MousePointer2 class="w-16 h-16 text-primary-500/50" />
                </div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-widest">{{ $t('schema.selectObject') }}</h3>
                <p class="text-sm max-w-xs leading-relaxed">{{ $t('schema.selectObjectDesc') }}</p>
              </div>
            </div>
        </main>
      </div>
    </div>
  </template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick, shallowRef } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { useAppStore } from '@/stores/app'
import { useConsoleStore } from '@/stores/console'
import { useProjectsStore } from '@/stores/projects'
import Andb from '@/utils/andb'
import DDLViewer from '@/components/ddl/DDLViewer.vue'
import SchemaDiagram from '@/components/ddl/SchemaDiagram.vue'
import { 
  RefreshCw, 
  Folder,
  ScanSearch, 
  MousePointer2,
  ChevronRight,
  Search, 
  Download,
  Camera,
  RotateCcw,
  History,
  Network,
  PanelBottom,
  Code2,
  LayoutTemplate,
  CaseSensitive,
  WholeWord,
  Regex,
  X,
  Sigma,
  ShieldCheck,
  Plus,
  Minus,
  Database,
  Binary,
  Grid3X3,
  Eye,
  Cpu,
  CalendarClock,
  Zap,
  Info,
  Filter
} from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notification'
import { useSidebarStore } from '@/stores/sidebar'
import TableDetailedView from '@/components/ddl/TableDetailedView.vue'
import SchemaTreeMode from '@/components/ddl/SchemaTreeMode.vue'

const appStore = useAppStore()
const projectsStore = useProjectsStore()
const { t } = useI18n()
const consoleStore = useConsoleStore()
const notificationStore = useNotificationStore()
const sidebarStore = useSidebarStore()
const router = useRouter()
const route = useRoute()

// Watch for project changes to reset schema selection
watch(() => projectsStore.selectedProjectId, () => {
  // @ts-ignore - Handle possible null/string mismatch in different setups
  selectedConnectionId.value = ''
  selectedItem.value = null
  selectedFilterType.value = 'all'
  schemaData.value = {
    tables: [],
    procedures: [],
    functions: [],
    views: [],
    triggers: [],
    events: []
  }
})


const typeIcons = {
  tables: Grid3X3,
  views: Eye,
  procedures: Cpu,
  functions: Sigma,
  triggers: Zap,
  events: CalendarClock,
  diagrams: Network
}

const getIconForType = (type: string) => {
  const key = type?.toLowerCase() as keyof typeof typeIcons
  return typeIcons[key] || Database
}

// State
const showSafeModeInfo = ref(false)
const loading = ref(false)
const statusMessage = ref('')
const error = ref<string | null>(null)
const selectedConnectionId = computed({
  get: () => appStore.selectedConnectionId,
  set: (val) => appStore.selectedConnectionId = val
})

const activeConnectionName = computed(() => {
  const conn = appStore.getConnectionById(appStore.selectedConnectionId)
  return conn ? `${conn.environment}: ${conn.database || conn.name}` : t('schema.noConnection')
})

const resetNavigation = () => {
  selectedFilterType.value = 'all'
  selectedItem.value = null
}

const selectedFilterType = ref('all')
const treeMode = ref<'tree' | 'flat'>('tree')
const searchQuery = ref('')
const searchFlags = ref({
  caseSensitive: false,
  wholeWord: false,
  regex: false,
  content: false
})
const contentSearchResults = ref<any[]>([])
const isSearchingContent = ref(false)
const selectedItem = shallowRef<any>(null)
const activeSearchLine = ref<number | null>(null)
const focusType = ref<string | undefined>(undefined)
const treeExpandCmd = ref<{ action: 'expand' | 'collapse', ts: number } | null>(null)
const ddlViewerRef = ref<any>(null)

const schemaData = ref({
  tables: [] as any[],
  procedures: [] as any[],
  functions: [] as any[],
  views: [] as any[],
  triggers: [] as any[],
  events: [] as any[]
})

const allResults = computed(() => {
  const base = [
    ...schemaData.value.tables.map(i => ({ ...i, type: 'tables' })),
    ...schemaData.value.procedures.map(i => ({ ...i, type: 'procedures' })),
    ...schemaData.value.functions.map(i => ({ ...i, type: 'functions' })),
    ...schemaData.value.views.map(i => ({ ...i, type: 'views' })),
    ...schemaData.value.triggers.map(i => ({ ...i, type: 'triggers' })),
    ...schemaData.value.events.map(i => ({ ...i, type: 'events' }))
  ]
  const hasData = base.length > 0
  if (hasData) {
    base.unshift({ name: 'Interactive ERD', type: 'diagrams' })
  }
  return base
})
const navigatableNames = computed(() => {
  return allResults.value
    .filter(i => i.type !== 'all' && i.type !== 'diagrams')
    .map(i => i.name)
})

const filteredResults = computed(() => {
  if (searchFlags.value.content) {
    return contentSearchResults.value
  }

  let filtered = allResults.value
  
  if (selectedFilterType.value !== 'all') {
    filtered = filtered.filter(i => i.type === selectedFilterType.value)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim()
    const { caseSensitive, wholeWord, regex } = searchFlags.value
    
    try {
      let re: RegExp
      if (regex) {
         re = new RegExp(query, caseSensitive ? '' : 'i')
      } else {
         // Escape regex chars if not regex mode
         const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
         if (wholeWord) {
            re = new RegExp(`\\b${escaped}\\b`, caseSensitive ? '' : 'i')
         } else {
            re = new RegExp(escaped, caseSensitive ? '' : 'i')
         }
      }
      
      filtered = filtered.filter(i => re.test(i.name))
    } catch (e) {
      // Invalid regex fallback to simple include
      filtered = filtered.filter(i => i.name.toLowerCase().includes(query.toLowerCase()))
    }
  }

  return filtered
})

const performContentSearch = async () => {
  const query = searchQuery.value.trim()
  if (!query) {
    contentSearchResults.value = []
    return
  }

  const conn = appStore.getConnectionById(selectedConnectionId.value)
  if (!conn) return

  isSearchingContent.value = true
  try {
    const results = await Andb.search(conn, query, {
      caseSensitive: searchFlags.value.caseSensitive,
      wholeWord: searchFlags.value.wholeWord,
      regex: searchFlags.value.regex
    })
    
    // Convert results to format expected by the tree
    // results is IDependencyMatch[]: { sourceObject: { name, type }, matches: { line, snippet }[] }
    contentSearchResults.value = (results || []).map((r: any) => {
      const type = pluralizeType(r.sourceObject.type)

      return {
        name: r.sourceObject.name,
        type,
        content: r.sourceObject.content, // Pass DDL content to allow viewer to show it
        matches: r.matches,
        title: `${r.sourceObject.name} (${r.matches.length} matches)`
      }
    })
  } catch (e) {
    console.error('Content search failed:', e)
    notificationStore.add({ type: 'error', title: 'Search Failed', message: (e as any).message })
  } finally {
    isSearchingContent.value = false
  }
}

watch([searchQuery, () => searchFlags.value.caseSensitive, () => searchFlags.value.wholeWord, () => searchFlags.value.regex], () => {
  if (searchFlags.value.content) {
    performContentSearch()
  }
})

const toggleContentSearch = () => {
  searchFlags.value.content = !searchFlags.value.content
  if (searchFlags.value.content) {
    performContentSearch()
  } else {
    contentSearchResults.value = []
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  contentSearchResults.value = []
}

const selectedDbLastUpdated = ref<string | null>(null)

watch(selectedItem, () => {
    // Reset to code view when finding a new item
    // But default to visual if it's a TABLE and we prefer visual
    if (selectedItem.value?.type === 'tables' || selectedItem.value?.type === 'table') {
        viewMode.value = 'visual' 
    } else {
        viewMode.value = 'code'
    }
})

const formatTimeAgo = (dateString: string) => {
  if (!dateString) return t('schema.never')
  try {
    let utcString = dateString
    if (!dateString.endsWith('Z')) {
      utcString = dateString.replace(' ', 'T') + 'Z'
    }
    
    const date = new Date(utcString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    
    if (diffSec < 0) return t('common.timeAgo.justNow')
    if (diffSec < 60) return t('common.timeAgo.justNow')
    if (diffSec < 3600) return t('common.timeAgo.minAgo', { n: Math.floor(diffSec / 60) })
    if (diffSec < 86400) return t('common.timeAgo.hourAgo', { n: Math.floor(diffSec / 3600), s: Math.floor(diffSec / 3600) > 1 ? 's' : '' })
    return date.toLocaleDateString()
  } catch (e) {
    return t('common.info')
  }
}

const formattedDDL = computed(() => {
  const item = selectedItem.value
  if (!item) return ''
  
  // Handle different property names from Cache vs Live Fetch
  // Cache (SQLite) uses 'content', Live (Andb Core) uses 'ddl'
  const ddl = item.ddl || item.content
  
  if (!ddl) return ''
  if (Array.isArray(ddl)) {
    return ddl.join('\n')
  }
  return ddl
})

const detailedTableData = shallowRef<any>(null)

watch(selectedItem, async (newVal) => {
    detailedTableData.value = null
    if (newVal && (newVal.type === 'tables' || newVal.type === 'table')) {
        const targetName = newVal.name
        if (formattedDDL.value) {
          try {
            const result = await (window as any).electronAPI.andbParseTable(formattedDDL.value)
            // Race condition guard: check if table is still selected
            if (result.success && selectedItem.value?.name === targetName) {
              await nextTick()
              detailedTableData.value = result.data
            }
          } catch (e) {
            console.error('Failed to parse table detailed:', e)
          }
        }
    }
})

watch(formattedDDL, async (newVal) => {
    if (newVal && selectedItem.value && (selectedItem.value.type === 'tables' || selectedItem.value.type === 'table')) {
        const targetName = selectedItem.value.name
        if (!detailedTableData.value) {
            try {
                const result = await (window as any).electronAPI.andbParseTable(newVal)
                // Race condition guard: check if table is still selected
                if (result.success && selectedItem.value?.name === targetName) {
                  await nextTick()
                  detailedTableData.value = result.data
                }
            } catch (e) {
                console.error('Failed to parse table detailed (from DDL watch):', e)
            }
        }
    }
})


const hasResults = computed(() => allResults.value.length > 0 || contentSearchResults.value.length > 0)

const pluralizeType = (t: string) => {
  const map: Record<string, string> = {
    'table': 'tables',
    'view': 'views',
    'procedure': 'procedures',
    'function': 'functions',
    'trigger': 'triggers',
    'event': 'events'
  }
  const low = t.trim().toLowerCase()
  if (map[low]) return map[low]
  if (low.endsWith('s')) return low
  return low + 's'
}

// Visual View Logic
const fetchButtonText = computed(() => {
    if (appStore.isSchemaFetching) {
      return t('schema.fetching')
    }
    if (loading.value) return t('schema.fetching')
    
    if (selectedItem.value && selectedItem.value.type !== 'diagrams') {
        const type = selectedItem.value.type.toLowerCase()
        let singularType = type.endsWith('s') ? type.slice(0, -1) : type
        if (type === 'procedures') singularType = 'procedure'
        return t('schema.fetchThis', { type: singularType.toUpperCase() })
    }
    
    // If category filtered
    if (selectedFilterType.value && selectedFilterType.value !== 'all') {
        const type = selectedFilterType.value.toLowerCase()
        return t('schema.fetchAll', { type: type.toUpperCase() })
    }

    if (appStore.buttonStyle === 'full') return t('schema.fetchFromDB')
    return t('schema.fetch')
})

const viewMode = ref<'code' | 'visual'>('code')

watch(selectedItem, () => {
    // Reset to code view when finding a new item
    // But default to visual if it's a TABLE and we prefer visual
    if (selectedItem.value?.type === 'tables' || selectedItem.value?.type === 'table') {
        viewMode.value = 'visual' 
    } else {
        viewMode.value = 'code'
    }
})


// Resize Logic
const resultsWidth = ref(256)
const isResizingResults = ref(false)

const startResultsResize = () => {
  isResizingResults.value = true
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
}

const handleResize = (e: MouseEvent) => {
  if (isResizingResults.value) {
    resultsWidth.value = Math.max(200, Math.min(600, resultsWidth.value + e.movementX))
  }
}

const stopResize = () => {
  isResizingResults.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = 'default'
}

// Actions
const loadSchema = async (forceRefresh = false) => {
  if (!selectedConnectionId.value) return
  
  const conn = appStore.getConnectionById(selectedConnectionId.value)
  if (!conn) return

  loading.value = true
  if (forceRefresh) {
    appStore.isSchemaFetching = true; // Lock global fetch state
    appStore.schemaFetchProgress = null;
    consoleStore.setVisibility(true) // Open console only on manual refresh
    statusMessage.value = t('schema.fetchingFromDb')
    consoleStore.clearLogs()
  } else {
    // Silent load from cache
    statusMessage.value = t('schema.loadingCache')
  }
  
  error.value = null
  // Only reset selection if NOT forcing refresh (i.e. switching DBs)
  if (!forceRefresh) {
    selectedItem.value = null
    selectedFilterType.value = 'all'
  }

  try {
    if (forceRefresh) {
      // REAL FETCH: Hit the database
      consoleStore.addLog(t('schema.connecting'), 'info')
      
      // Atomic Refresh Logic
      if (selectedItem.value) {
        // 1. Refresh specific object
        // ... (no clearing for atomic item refresh usually)
        let objTypes: any[] = [selectedItem.value.type.toLowerCase()] // e.g., 'tables'
        let exportName: string | undefined = selectedItem.value.name

        // Special handling for Diagrams (fetch all tables instead)
        if (selectedItem.value.type === 'diagrams') {
          objTypes = ['tables']
          exportName = undefined
          consoleStore.addLog(`Refreshing tables for Interactive ERD...`, 'info')
        } else {
          consoleStore.addLog(`Refreshing single object: ${selectedItem.value.name} (${selectedItem.value.type})`, 'info')
        }
        
        // Helper to run export
        const runExports = async () => {
          const env = conn.environment
          const cmd = `andb export --source ${env}` + (exportName ? ` --name ${exportName}` : '')
          consoleStore.addLog(cmd, 'cmd')
         
          await Andb.export(conn, null as any, { 
            type: objTypes[0], // Pass specific type (e.g., 'procedures') for targeted refresh
            env, 
            name: exportName 
          })
            .then(res => {
              const summary = res.data || {}
              Object.entries(summary).forEach(([type, count]) => {
                consoleStore.addLog(`Fetched ${count} ${type}`, 'success')
              })
              return res
            })
        }
        await runExports()

      } else if (selectedFilterType.value && selectedFilterType.value !== 'all') {
        // 2. Refresh specific category
        const env = conn.environment
        const type = selectedFilterType.value as any
        const cmd = `andb export --source ${env} --type ${type}`
        consoleStore.addLog(cmd, 'cmd')
        
        await Andb.export(conn, null as any, { 
            type,
            env
        })
          .then(res => {
            const summary = res.data || {}
            Object.entries(summary).forEach(([type, count]) => {
                consoleStore.addLog(`Fetched ${count} ${type}`, 'success')
            })
            return res
          })

      } else {
        // 3. FULL REFRESH
        // POWERFUL CLEANUP HERE
        consoleStore.addLog(t('schema.cleaningCache'), 'warn')
        const clearResult = await Andb.clearConnectionData(conn)
        
        if (clearResult) {
          consoleStore.addLog(`Cleared ${clearResult.ddlCount || 0} DDL records`, 'info')
          consoleStore.addLog(`Cleared ${clearResult.comparisonCount || 0} Comparison records`, 'info')
        }
        
        consoleStore.addLog(t('schema.refreshed'), 'info')
        
        const cmd = `andb export --source ${conn.environment}`
        consoleStore.addLog(cmd, 'cmd')
   
        await Andb.export(conn, null as any, { 
          type: 'all' as any,
          environment: conn.environment 
        })
          .then(res => {
            const summary = res.data || {}
            Object.entries(summary).forEach(([type, count]) => {
                consoleStore.addLog(`Fetched ${count} ${type}`, 'success')
            })
            return res
          })
      }

      // Update cache logic stays same - we just refreshed SQLite state.
      // Now falling through to load from cache will pick up changes.
      
      notificationStore.add({
        type: 'success',
        title: t('schema.refreshed'),
        message: t('schema.refreshedDesc', { name: conn.name })
      })
      
      consoleStore.addLog(t('schema.refreshSuccess'), 'success')
      
      // Trigger sidebar update to reflect new cache
      sidebarStore.triggerRefresh()

    } 
    
    // Always load from cache to update UI state
    {
      // ... cache fetch ...
      // CACHE FETCH: Load from SQLite via Andb.getSchemas()
      console.log('[GlobalSchemaView] loadSchema called. ConnId:', selectedConnectionId.value, 'Filter:', selectedFilterType.value)
      
      // The 'conn' variable is already defined at the top of loadSchema, so we don't redefine it here.
      // If it was null, we would have returned earlier.

      const allSchemas = await Andb.getSchemas()
      console.log('[GlobalSchemaView] Fetched schemas:', allSchemas?.length, 'environments')

      const envData = allSchemas?.find((e: any) => e.name === conn.environment)
      if (!envData) console.warn('[GlobalSchemaView] Environment not found in schemas:', conn.environment)

      const targetDbName = conn.database || conn.name
      // Try exact, then case-insensitive match for both Name and Database
      const dbData = envData?.databases?.find((d: any) => {
         const dName = d.name.toLowerCase()
         return dName === targetDbName.toLowerCase() || 
                (conn.name && dName === conn.name.toLowerCase()) ||
                (conn.database && dName === conn.database.toLowerCase())
      })
      
      console.log('[GlobalSchemaView] Looking for DB:', targetDbName, 'Found:', !!dbData, 'In env:', conn.environment) 

      if (dbData) {
        // Set last updated time from DB metadata
        selectedDbLastUpdated.value = dbData.lastUpdated || null

        console.log('[GlobalSchemaView] DB Data counts - Tables:', dbData.tables?.length, 'Procs:', dbData.procedures?.length)
        
        // Update the reactive state (source of truth for computed 'allResults')
        schemaData.value = {
          tables: dbData.tables || [],
          procedures: dbData.procedures || [],
          functions: dbData.functions || [],
          views: dbData.views || [],
          triggers: dbData.triggers || [],
          events: dbData.events || []
        }
        
        // No need to manually assign to allResults (it's computed!)
        // Sorting and filtering is handled by 'filteredResults' computed property
      } else {
        selectedDbLastUpdated.value = null
        // Clear data
        schemaData.value = {
          tables: [],
          procedures: [],
          functions: [],
          views: [],
          triggers: [],
          events: []
        }
        
        if (conn.status === 'connected') {
            // Auto-refresh if empty?
            // console.log('Auto-triggering refresh...')
        }
      }
    }

  } catch (err: any) {
    error.value = err.message
    consoleStore.addLog(`Error loading schema: ${err.message}`, 'error')
    notificationStore.add({
      type: 'error',
      title: t('schema.errorLoading'),
      message: err.message
    })
  } finally {
    loading.value = false
    appStore.isSchemaFetching = false; // Release global fetch state
    appStore.schemaFetchProgress = null;
  }
}

watch(() => appStore.selectedConnectionId, async (newId) => {
  if (newId) {
    await loadSchema(false)
    // Auto fetch if cache is empty AND never synced before
    if (!selectedDbLastUpdated.value && !allResults.value.some(i => i.type !== 'diagrams')) {
      loadSchema(true)
    }
  }
}, { immediate: true })

watch(() => sidebarStore.refreshRequestKey, () => {
  // Only trigger if we are on this page
  // Note: route checks are tricky in sub-component, but assuming this is only mounted when valid
  if (selectedConnectionId.value) {
    loadSchema(true)
  }
})

watch(() => sidebarStore.refreshKey, () => {
  if (selectedConnectionId.value) {
    loadSchema(false) // Reload from cache (SQLite) as global refresh updated it
  }
})

const selectItem = (item: any) => {
  if (!item) return
  if (selectedItem.value?.name !== item.name) {
    activeSearchLine.value = null
  }
  selectedItem.value = item
  // If DDL is not already in item, we might need to fetch it
  // Ensure we are showing the correct filter type if it doesn't match
  if (item.type && item.type !== 'diagrams' && selectedFilterType.value !== 'all' && selectedFilterType.value !== item.type) {
    selectedFilterType.value = item.type
  } else if (item.type && selectedFilterType.value === 'all' && item.type !== 'diagrams') {
    selectedFilterType.value = item.type
  }
}

const takeSnapshot = async () => {
  if (!selectedItem.value || !selectedConnectionId.value) return
  
  const conn = appStore.getConnectionById(selectedConnectionId.value)
  if (!conn) return

  loading.value = true
  statusMessage.value = t('schema.takingSnapshot')
  
  try {
    await Andb.createSnapshot(conn, selectedItem.value.type, selectedItem.value.name)
    notificationStore.add({
      type: 'success',
      title: t('schema.snapshotCreated'),
      message: t('schema.snapshotSuccess', { name: selectedItem.value.name })
    })
  } catch (err: any) {
    notificationStore.add({
      type: 'error',
      title: t('schema.snapshotFailed'),
      message: err.message
    })
  } finally {
    loading.value = false
  }
}

const viewHistory = () => {
  if (!selectedItem.value || !selectedConnectionId.value) return
  
  const conn = appStore.getConnectionById(selectedConnectionId.value)
  if (!conn) return

  router.push({
    path: '/history',
    query: {
      env: conn.environment,
      name: selectedItem.value.name
    }
  })
}

const downloadDDL = () => {
  if (!formattedDDL.value) return
  const blob = new Blob([formattedDDL.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${selectedItem.value.name}.sql`
  a.click()
  URL.revokeObjectURL(url)
}

// Event Handlers for Sidebar
const handleCategorySelected = (e: any) => {
  const { type, env, db } = e.detail
  // SUPPORT DUMP: Flexible matching for database name/connection name
  const conn = appStore.resolvedConnections.find(c => 
    c.environment === env && 
    (c.database === db || c.database?.toLowerCase() === db?.toLowerCase() || c.name === db || c.name?.toLowerCase() === db?.toLowerCase())
  )
  if (conn) {
    selectedConnectionId.value = conn.id
    selectedFilterType.value = type
    // Auto-expand: pulse focusType to trigger watch in SchemaTreeMode
    focusType.value = undefined
    setTimeout(() => { focusType.value = type }, 50)
    loadSchema(false)
  }
}

const handleObjectSelected = (e: any) => {
  const { name, type, env, db } = e.detail
  // SUPPORT DUMP: Flexible matching
  const conn = appStore.resolvedConnections.find(c => 
    c.environment === env && 
    (c.database === db || c.database?.toLowerCase() === db?.toLowerCase() || c.name === db || c.name?.toLowerCase() === db?.toLowerCase())
  )
  if (conn) {
    const connIdChanged = selectedConnectionId.value !== conn.id
    selectedConnectionId.value = conn.id
    
    // Clear search to ensure the object is visible
    searchQuery.value = ''
    
    if (selectedFilterType.value !== type && type !== 'all') {
      selectedFilterType.value = type
    }
    
    // If connection changed or no results, try load from cache
    if (!hasResults.value || connIdChanged) {
      loadSchema(false).then(() => {
        const item = allResults.value.find(i => i.name === name && (type === 'all' || i.type === type))
        if (item) selectItem(item)
      })
    } else {
      const item = allResults.value.find(i => i.name === name && (type === 'all' || i.type === type))
      if (item) {
        selectItem(item)
      } else {
        // Not found? Try one more reload from CACHE
        loadSchema(false).then(() => {
          const newItem = allResults.value.find(i => i.name === name && (type === 'all' || i.type === type))
          if (newItem) selectItem(newItem)
        })
      }
    }
  }
}

const handleNavigateTo = async (payload: { item: any; line: number }) => {
  activeSearchLine.value = payload.line
  // 1. Select the item first
  if (selectedItem.value?.name !== payload.item.name) {
    selectItem(payload.item)
  }
  
  // 2. Wait for DDLViewer to be rendered or content to be updated
  await nextTick()
  // Ensure we are in code view
  viewMode.value = 'code'
  await nextTick()
  
  // 3. Scroll to the line
  if (ddlViewerRef.value) {
    ddlViewerRef.value.scrollToLine(payload.line)
  }
}

const handleNavigateToDefinition = (name: string) => {
  const item = allResults.value.find(i => i.name === name)
  if (item) {
    // Switch to code view if it's not and we are navigating to it
    if (viewMode.value !== 'code') {
      viewMode.value = 'code'
    }
    selectItem(item)
  }
}

const handleDatabaseSelected = (e: any) => {
  const { env, db } = e.detail
  const conn = appStore.resolvedConnections.find(c => 
    c.environment === env && 
    (c.database === db || c.database?.toLowerCase() === db?.toLowerCase() || c.name === db || c.name?.toLowerCase() === db?.toLowerCase())
  )
  if (conn) {
    selectedConnectionId.value = conn.id
    selectedFilterType.value = 'all'
    loadSchema(false)
  }
}

onMounted(() => {
  // If there's an active pair, default to source
  if (appStore.currentPair?.source) {
    selectedConnectionId.value = appStore.currentPair.source.id
  }
  
  window.addEventListener('category-selected', handleCategorySelected)
  window.addEventListener('object-selected', handleObjectSelected)
  window.addEventListener('database-selected', handleDatabaseSelected)

  // Global IPC progress listener
  if (window.electronAPI && window.electronAPI.onAndbProgress) {
    window.electronAPI.onAndbProgress((_event: any, data: any) => {
      if (data.operation === 'export') {
        appStore.schemaFetchProgress = {
          current: data.current || 0,
          total: data.total || 0,
          type: data.type || '',
          objectName: data.objectName || ''
        }
      }
    })
  }

  // Handle deep link selection from other views (like Compare)
  const processDeepLink = () => {
    if (route.query.select && allResults.value.length > 0) {
      handleNavigateToDefinition(route.query.select as string)
    }
  }

  watch(() => route.query.select, processDeepLink)
  watch(() => allResults.value.length, processDeepLink)
  
  processDeepLink()
})

onUnmounted(() => {
  window.removeEventListener('category-selected', handleCategorySelected)
  window.removeEventListener('object-selected', handleObjectSelected)
  window.removeEventListener('database-selected', handleDatabaseSelected)
})

</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
