<template>
  <MainLayout>
    <template #toolbar>
      <SchemaActionToolbar 
        :connection-id="selectedConnectionId"
        :connection-name="activeConnectionName"
        :last-updated="selectedDbLastUpdated || undefined"
        :is-fetching="loading"
        @refresh="loadSchema(true)"
      >
        <template #actions>
          <div class="flex items-center gap-1 mr-4">
            <!-- Primary Action: New Query -->
            <button 
              @click="openQueryConsole()"
              class="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-sm text-[10px] font-black uppercase tracking-widest transition-all transform active:scale-95 shrink-0"
            >
              <Terminal class="w-3.5 h-3.5" />
              <span class="hidden lg:inline">New Query</span>
            </button>

            <div class="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1 opacity-50"></div>

            <!-- Quick Object Templates -->
            <div class="flex items-center gap-1">
              <button @click="openNewObjectTemplate('TABLE')" class="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                <Table2 class="w-3.5 h-3.5" />
                <span class="hidden xl:inline">Table</span>
              </button>
              <button @click="openNewObjectTemplate('VIEW')" class="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                <Eye class="w-3.5 h-3.5" />
                <span class="hidden xl:inline">View</span>
              </button>
              <button @click="openNewObjectTemplate('FUNCTION')" class="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                <Sigma class="w-3.5 h-3.5" />
                <span class="hidden xl:inline">Function</span>
              </button>
              <button @click="openNewObjectTemplate('PROCEDURE')" class="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                <Cpu class="w-3.5 h-3.5" />
                <span class="hidden xl:inline">Procedure</span>
              </button>
            </div>

            <div class="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-2 opacity-50"></div>

            <!-- Toggleable Advanced Search -->
            <div class="flex items-center gap-2">
              <button 
                v-if="!isSearchExpanded"
                @click="isSearchExpanded = true"
                class="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest"
              >
                <Search class="w-3.5 h-3.5" />
                Advanced Search
              </button>

              <div v-else class="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
                <div class="relative group">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search class="w-3.5 h-3.5 text-primary-500" />
                  </span>
                  <input 
                    ref="toolbarSearchInput"
                    v-model="searchQuery"
                    type="text" 
                    placeholder="Search objects..."
                    class="w-48 xl:w-80 pl-9 pr-8 py-1.5 bg-white dark:bg-gray-900 border-2 border-primary-500/20 rounded-full text-[11px] font-bold focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 text-gray-900 dark:text-white transition-all shadow-lg"
                  />
                  <button 
                    @click="isSearchExpanded = false; searchQuery = ''"
                    class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-red-500"
                  >
                    <X class="w-3.5 h-3.5" />
                  </button>
                </div>

                <!-- Flag Controls (Only when expanded) -->
                <div class="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800/50 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
                  <button @click="searchFlags.columns = !searchFlags.columns" class="p-1.5 rounded-md transition-all" :class="searchFlags.columns ? 'bg-white dark:bg-gray-700 text-primary-500 shadow-sm' : 'text-gray-400'"><Columns class="w-3.5 h-3.5" /></button>
                  <button @click="searchFlags.regex = !searchFlags.regex" class="p-1.5 rounded-md transition-all" :class="searchFlags.regex ? 'bg-white dark:bg-gray-700 text-primary-500 shadow-sm' : 'text-gray-400'"><Regex class="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </SchemaActionToolbar>
    </template>

    <template #breadcrumbs>
      <div class="flex items-center gap-1.5 px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 rounded-md border border-primary-100 dark:border-primary-800/50">
        <Database class="w-3 h-3 text-primary-500" />
        <span class="text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400">{{ activeConnectionName }}</span>
      </div>

      <div class="h-4 w-px bg-gray-200 dark:bg-gray-800 mx-1 opacity-50"></div>

      <button @click="resetNavigation" class="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
        {{ $t('schema.overview') }}
      </button>

      <div class="h-4 w-px bg-gray-200 dark:bg-gray-800 mx-1 opacity-50"></div>

      <template v-if="selectedFilterType && selectedFilterType !== 'all'">
        <span class="text-gray-300 dark:text-gray-600 text-[10px]">/</span>
        <span class="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">{{ $t(`navigation.ddl.${selectedFilterType.toLowerCase()}`) }}</span>
      </template>
      <template v-else-if="selectedFilterType === 'all'">
        <span class="text-gray-300 dark:text-gray-600 text-[10px]">/</span>
        <span class="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">{{ $t('navigation.ddl.all') }}</span>
      </template>

      <template v-if="selectedItem">
        <span class="text-gray-300 dark:text-gray-600 text-[10px]">/</span>
        <span class="text-[10px] font-bold text-gray-900 dark:text-white font-mono">{{ selectedItem.name }}</span>
      </template>
    </template>

    <div class="h-full w-full flex flex-col bg-gray-50 dark:bg-gray-950">
      <div class="flex-1 flex flex-col overflow-hidden relative">
        <main class="flex-1 flex overflow-hidden relative" :class="{ 'flex-row-reverse': appStore.layoutSettings.sidebarPosition === 'right' }" v-if="!loading || hasResults">
          
          <SchemaObjectSidebar 
            :width="resultsWidth"
            :has-results="hasResults"
            :filtered-results="filteredResults"
            :filtered-results-count="filteredResults.length"
            :selected-item-name="selectedItem?.name"
            v-model:search-query="searchQuery"
            v-model:search-flags="searchFlags"
            :is-indexing-columns="isIndexingColumns"
            :selected-size-filter="selectedSizeFilter"
            :table-stats="tableStatsMap"
            :last-updated="selectedDbLastUpdated || undefined"
            :is-fetching="loading"
            :expand-cmd="treeExpandCmd"
            @toggle-content-search="searchFlags.content = !searchFlags.content"
            @toggle-column-search="searchFlags.columns = !searchFlags.columns"
            @expand-all="treeExpandCmd = { action: 'expand', ts: Date.now() }"
            @collapse-all="treeExpandCmd = { action: 'collapse', ts: Date.now() }"
            @update-size-filter="(size) => selectedSizeFilter = size === selectedSizeFilter ? 'all' : size"
            @select="handleSelectItem"
            @refresh="loadSchema(true)"
            @start-resize="startResultsResize"
            @new-query="openQueryConsole"
          />

          <SchemaContentWorkspace 
            class="flex-1 min-w-0"
            :tabs="tabs"
            :active-tab-id="activeTabId"
            :selected-item="selectedItem"
            v-model:view-mode="viewMode"
            :formatted-ddl="formattedDDL"
            :detailed-data="detailedTableData"
            :tables="schemaData.tables"
            :is-source="isSourceInInstant"
            :is-target="isTargetInInstant"
            :has-source="!!appStore.compareStack.source"
            :triggers="schemaData.triggers"
            @select-tab="handleSelectTab"
            @close-tab="handleCloseTab"
            @pick-stack="handlePickForInstant"
            @snapshot="takeSnapshot"
            @download="downloadDDL"
          />

        </main>
        
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import MainLayout from '@/layouts/MainLayout.vue'
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Database, Terminal, Table2, Eye, Sigma, Cpu, Columns, CaseSensitive, WholeWord, Regex } from 'lucide-vue-next'

import { useAppStore } from '@/stores/app'
import { useSchemaLoader } from '@/composables/useSchemaLoader'

// Modular components
import SchemaActionToolbar from '@/components/schema/SchemaActionToolbar.vue'
import SchemaObjectSidebar from '@/components/schema/SchemaObjectSidebar.vue'
import SchemaContentWorkspace from '@/components/schema/SchemaContentWorkspace.vue'
import AIReviewPanel from '@/components/ai/AIReviewPanel.vue'

const appStore = useAppStore()
const { t, locale } = useI18n()
const route = useRoute()

// Composable integration
const selectedConnectionId = computed(() => appStore.selectedConnectionId)
const selectedItem = ref<any>(null)
const selectedFilterType = ref('all')

const { 
  loading, schemaData, allResults, loadSchema, 
  selectedDbLastUpdated, columnIndex, isIndexingColumns 
} = useSchemaLoader(
  selectedConnectionId, 
  selectedItem, 
  selectedFilterType
)

watch([selectedConnectionId, () => appStore.isInitialized], () => {
  console.log('[GlobalSchemaView] Debug:', {
    routeId: selectedConnectionId.value,
    storeInitialized: appStore.isInitialized,
    totalConnections: appStore.connections.length,
    totalResolved: appStore.resolvedConnections.length,
    foundInStore: !!appStore.getConnectionById(selectedConnectionId.value || '')
  })
}, { immediate: true })

// UI State
const searchQuery = ref('')
const searchFlags = ref({
  caseSensitive: false,
  wholeWord: false,
  regex: false,
  content: false,
  columns: false
})
const selectedSizeFilter = ref('all')
const viewMode = ref<'visual' | 'code'>('visual')
const resultsWidth = ref(300)
const treeExpandCmd = ref({ action: '', ts: 0 })
const isSearchExpanded = ref(false)
const toolbarSearchInput = ref<HTMLInputElement | null>(null)
const debouncedSearchQuery = ref('')
let searchDebounceTimeout: any = null

watch(searchQuery, (newVal) => {
  if (searchDebounceTimeout) clearTimeout(searchDebounceTimeout)
  searchDebounceTimeout = setTimeout(() => {
    debouncedSearchQuery.value = newVal
  }, 300)
})

const tabs = ref<any[]>([])
const activeTabId = ref<string | null>(null)

// Selection logic
const activeConnectionName = computed(() => {
  const conn = appStore.resolvedConnections.find(c => c.id === selectedConnectionId.value)
  return conn ? conn.name : 'Unknown'
})

const selectedEnv = computed(() => {
  const conn = appStore.connections.find(c => c.id === selectedConnectionId.value)
  return conn ? conn.environment : ''
})

const selectedDbName = computed(() => {
  const conn = appStore.resolvedConnections.find(c => c.id === selectedConnectionId.value)
  return conn ? conn.database || conn.name : ''
})

// Advanced Filtering Logic
const filteredResults = computed(() => {
  let results = allResults.value

  if (selectedFilterType.value !== 'all') {
    results = results.filter(r => r.type === selectedFilterType.value)
  }

  const query = debouncedSearchQuery.value.trim()
  if (query) {
    const q = query
    const isRegex = searchFlags.value.regex
    const isCase = searchFlags.value.caseSensitive
    const isWhole = searchFlags.value.wholeWord

    const match = (text: string) => {
      if (!text) return false
      if (isRegex) {
        try {
          return new RegExp(q, isCase ? '' : 'i').test(text)
        } catch { return false }
      }
      let t = isCase ? text : text.toLowerCase()
      let query = isCase ? q : q.toLowerCase()
      if (isWhole) return t === query
      return t.includes(query)
    }

    if (searchFlags.value.columns) {
        results = results.filter(r => {
            const tableCols = columnIndex.value[r.name]
            return tableCols?.columns.some(c => match(c.name))
        })
    } else if (searchFlags.value.content) {
        results = results.filter(r => match(r.ddl || r.content || ''))
    } else {
        results = results.filter(r => match(r.name))
    }
  }

  return results
})

const hasResults = computed(() => allResults.value.length > 0)

const formattedDDL = computed(() => selectedItem.value?.ddl || selectedItem.value?.content || '')

const detailedTableData = computed(() => {
  if (!selectedItem.value || selectedItem.value.type !== 'tables') return null
  return columnIndex.value[selectedItem.value.name]
})

const tableStatsMap = ref({}) // Simplified for now

// Instant Compare Integration
const isSourceInInstant = computed(() => appStore.compareStack.source?.name === selectedItem.value?.name)
const isTargetInInstant = computed(() => appStore.compareStack.target?.name === selectedItem.value?.name)

const handlePickForInstant = (type: 'source' | 'target') => {
  if (!selectedItem.value) return
  appStore.compareStack[type] = {
    name: selectedItem.value.name,
    ddl: formattedDDL.value,
    type: selectedItem.value.type
  }
}

// Tab Management
const openQueryConsole = (initialSql: string = '', customName?: string) => {
  const queryId = `query-${Date.now()}`
  const newTab = {
    id: queryId,
    name: customName || `Query ${tabs.value.filter(t => t.type === 'query').length + 1}`,
    type: 'query',
    connection: appStore.getConnectionById(selectedConnectionId.value),
    initialSql
  }
  
  tabs.value.push(newTab)
  activeTabId.value = queryId
  selectedItem.value = newTab
}

const openNewObjectTemplate = (type: 'TABLE' | 'VIEW' | 'FUNCTION' | 'PROCEDURE') => {
  const templates = {
    TABLE: `CREATE TABLE \`new_table\` (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  name VARCHAR(255) NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);`,
    VIEW: `CREATE VIEW \`new_view\` AS\nSELECT * FROM some_table;`,
    FUNCTION: `CREATE FUNCTION \`new_function\` ()\nRETURNS INTEGER\nBEGIN\n\nRETURN 1;\nEND`,
    PROCEDURE: `CREATE PROCEDURE \`new_procedure\` ()\nBEGIN\n\nEND`
  }
  
  const displayNames = {
    TABLE: 'New Table',
    VIEW: 'New View',
    FUNCTION: 'New Function',
    PROCEDURE: 'New Procedure'
  }
  
  openQueryConsole(templates[type], displayNames[type])
}

const handleSelectItem = (item: any) => {
  const tabId = `${item.type}-${item.name}`
  const existing = tabs.value.find(t => t.id === tabId)
  if (!existing) {
    tabs.value.push({ ...item, id: tabId })
  }
  selectedItem.value = item
  activeTabId.value = tabId
}

const handleSelectTab = (id: string) => {
  const tab = tabs.value.find(t => t.id === id)
  if (tab) {
    selectedItem.value = tab
    activeTabId.value = id
  }
}

const handleCloseTab = (id: string) => {
  const idx = tabs.value.findIndex(t => t.id === id)
  if (idx !== -1) {
    tabs.value.splice(idx, 1)
    if (activeTabId.value === id) {
      if (tabs.value.length > 0) {
        handleSelectTab(tabs.value[Math.max(0, idx - 1)].id)
      } else {
        selectedItem.value = null
        activeTabId.value = null
      }
    }
  }
}

const resetNavigation = () => {
  selectedItem.value = null
  selectedFilterType.value = 'all'
  tabs.value = []
  activeTabId.value = null
}

const startResultsResize = (e: MouseEvent) => {
  const startX = e.clientX
  const startWidth = resultsWidth.value
  const doResize = (moveE: MouseEvent) => {
    resultsWidth.value = startWidth + (moveE.clientX - startX)
  }
  const stopResize = () => {
    window.removeEventListener('mousemove', doResize)
    window.removeEventListener('mouseup', stopResize)
  }
  window.addEventListener('mousemove', doResize)
  window.addEventListener('mouseup', stopResize)
}

const takeSnapshot = () => console.log('Snapshot...')
const downloadDDL = () => console.log('Download...')

const aiContext = computed(() => {
  if (!selectedItem.value) return null
  return {
    objectName: selectedItem.value.name,
    objectType: selectedItem.value.type,
    target: { name: selectedItem.value.name, ddl: formattedDDL.value }
  }
})

watch(aiContext, (newCtx) => {
  if (newCtx) {
    appStore.aiContext = newCtx
  }
}, { immediate: true })

onMounted(async () => {
  if (appStore.isInitialized) {
    loadSchema()
  }
})

// Auto-load when store is ready
watch(() => appStore.isInitialized, (val) => {
  if (val && selectedConnectionId.value) {
    loadSchema()
  }
})

watch(selectedConnectionId, () => {
  if (appStore.isInitialized) {
    resetNavigation()
    loadSchema()
  }
})

watch(isSearchExpanded, async (val) => {
  if (val) {
    await nextTick()
    toolbarSearchInput.value?.focus()
  }
})
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>
