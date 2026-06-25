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
          <div class="flex items-center gap-2">
            <!-- Primary: New Query button -->
            <button
              @click="openQueryConsole('', undefined, true)"
              class="group flex items-center transition-all duration-200 active:scale-[0.97]"
              :class="[
                appStore.buttonStyle === 'icons' ? 'p-2 shadow-sm rounded-lg' : appStore.buttonStyle === 'full' ? 'px-3 py-1.5 shadow-sm shadow-emerald-500/20 hover:shadow-md hover:shadow-emerald-500/30 rounded-lg font-bold' : 'px-2.5 py-1.5 rounded-lg border font-bold',
                appStore.buttonStyle === 'icons' ? '' : 'gap-2',
                appStore.buttonStyle === 'full'
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-transparent'
                  : 'text-emerald-600 dark:text-emerald-400 hover:text-white hover:bg-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-250 dark:border-emerald-900/40'
              ]"
              title="New Query (Ctrl+T)"
            >
              <Terminal class="w-3.5 h-3.5 group-hover:scale-110 transition-transform opacity-90" />
              <span v-if="appStore.buttonStyle !== 'icons'" class="hidden lg:inline text-[10.5px] uppercase tracking-wider">New Query</span>
            </button>
          </div>
        </template>
      </SchemaActionToolbar>
    </template>

    <template #breadcrumbs>
      <div class="flex items-center gap-1">
        <!-- Connection Dropdown -->
        <Menu as="div" class="relative inline-block text-left">
          <MenuButton
            class="group inline-flex items-center gap-1.5 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800/80 rounded-lg transition-all select-none focus:outline-none"
          >
            <div class="relative flex items-center">
              <Database class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
              <div class="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            </div>
            <span
              class="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-250 truncate max-w-[200px]"
              :title="activeConnectionName"
            >
              {{ activeConnectionName }}
            </span>
            <ChevronDown class="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-80 group-hover:opacity-100 transition-opacity" />
          </MenuButton>

          <transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="transform scale-95 opacity-0 -translate-y-1"
            enter-to-class="transform scale-100 opacity-100 translate-y-0"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="transform scale-100 opacity-100 translate-y-0"
            leave-to-class="transform scale-95 opacity-0 -translate-y-1"
          >
            <MenuItems
              class="absolute left-0 mt-1.5 w-56 origin-top-left rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl z-[100] p-1 focus:outline-none backdrop-blur-xl ring-1 ring-black/5"
            >
              <div class="px-2.5 py-1.5 border-b border-gray-100 dark:border-gray-800/80 mb-1 select-none">
                <p class="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Select Connection</p>
              </div>
              <div class="max-h-60 overflow-y-auto no-scrollbar">
                <MenuItem
                  v-for="conn in appStore.filteredConnections"
                  :key="conn.id"
                  v-slot="{ active }"
                >
                  <button
                    @click="appStore.selectedConnectionId = conn.id"
                    :class="[
                      conn.id === selectedConnectionId
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                        : active
                        ? 'bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-400',
                      'group flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[10.5px] font-bold uppercase tracking-wider transition-all duration-150 active:scale-[0.98]'
                    ]"
                  >
                    <span class="truncate">{{ conn.name }}</span>
                    <Check v-if="conn.id === selectedConnectionId" class="w-3.5 h-3.5 text-emerald-500" />
                  </button>
                </MenuItem>
              </div>
            </MenuItems>
          </transition>
        </Menu>

        <span class="mx-1 text-gray-300 dark:text-gray-700 font-normal select-none">/</span>

        <!-- DDL Type Dropdown -->
        <Menu as="div" class="relative inline-block text-left">
          <MenuButton
            class="group inline-flex items-center gap-1.5 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800/80 rounded-lg transition-all select-none focus:outline-none"
          >
            <component :is="selectedDdlTypeObj.icon" class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            <span class="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-250">
              {{ $t(selectedDdlTypeObj.translationKey) }}
            </span>
            <ChevronDown class="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-80 group-hover:opacity-100 transition-opacity" />
          </MenuButton>

          <transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="transform scale-95 opacity-0 -translate-y-1"
            enter-to-class="transform scale-100 opacity-100 translate-y-0"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="transform scale-100 opacity-100 translate-y-0"
            leave-to-class="transform scale-95 opacity-0 -translate-y-1"
          >
            <MenuItems
              class="absolute left-0 mt-1.5 w-48 origin-top-left rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl z-[100] p-1 focus:outline-none backdrop-blur-xl ring-1 ring-black/5"
            >
              <div class="px-2.5 py-1.5 border-b border-gray-100 dark:border-gray-800/80 mb-1 select-none">
                <p class="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Filter DDL Type</p>
              </div>
              <MenuItem
                v-for="type in ddlTypesList"
                :key="type.key"
                v-slot="{ active }"
              >
                <button
                  @click="selectDdlType(type.key)"
                  :class="[
                    type.key === selectedFilterType
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                      : active
                      ? 'bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400',
                    'group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[10.5px] font-bold uppercase tracking-wider transition-all duration-150 active:scale-[0.98]'
                  ]"
                >
                  <component :is="type.icon" class="w-3.5 h-3.5 text-emerald-500" />
                  <span class="truncate flex-1 text-left">{{ $t(type.translationKey) }}</span>
                  <Check v-if="type.key === selectedFilterType" class="w-3.5 h-3.5 text-emerald-500 ml-auto" />
                </button>
              </MenuItem>
            </MenuItems>
          </transition>
        </Menu>

        <!-- Selected Item -->
        <template v-if="selectedItem">
          <span class="mx-1 text-gray-300 dark:text-gray-700 font-normal select-none">/</span>
          <div class="flex items-center px-1.5 py-0.5">
             <span class="text-[11px] font-bold text-gray-800 dark:text-gray-250 font-mono tracking-tight">{{
               selectedItem.name
             }}</span>
          </div>
        </template>
      </div>
    </template>

    <div class="h-full w-full flex flex-col bg-gray-50 dark:bg-gray-950">
      <div class="flex-1 flex flex-col overflow-hidden relative">
        <main
          class="flex-1 flex overflow-hidden relative"
          :class="{ 'flex-row-reverse': appStore.layoutSettings.sidebarPosition === 'right' }"
          v-if="!loading || hasResults"
        >
          <SchemaObjectSidebar
            :width="resultsWidth"
            :has-results="hasResults"
            :filtered-results="filteredResults"
            :filtered-results-count="filteredResults.length"
            :selected-item-name="selectedItem?.name"
            v-model:search-flags="searchFlags"
            v-model:sortBy="sortBy"
            v-model:sortOrder="sortOrder"
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
            @update-size-filter="
              size => (selectedSizeFilter = size === selectedSizeFilter ? 'all' : size)
            "
            @select="handleSelectItem"
            @refresh="loadSchema(true)"
            @start-resize="startResultsResize"
            @new-query="openQueryConsole('', undefined, true)"
            @send-to-instant="handleSendToInstant"
            @refresh-item="handleRefreshItem"
          />

          <SchemaContentWorkspace
            class="flex-1 min-w-0"
            :connection="appStore.getConnectionById(selectedConnectionId)"
            :tabs="tabs"
            :active-tab-id="activeTabId"
            :selected-item="selectedItem"
            v-model:view-mode="viewMode"
            :formatted-ddl="formattedDdl"
            :detailed-data="detailedTableData"
            :tables="schemaData.tables"
            :is-source="isSourceInInstant"
            :is-target="isTargetInInstant"
            :has-source="!!appStore.compareStack.source"
            :triggers="schemaData.triggers"
            :navigatable-names="navigatableNames"
            :schema-metadata="schemaMetadata"
            @select-tab="handleSelectTab"
            @close-tab="handleCloseTab"
            @duplicate-tab="handleDuplicateTab"
            @close-others="handleCloseOthers"
            @close-right="handleCloseRight"
            @pick-stack="handlePickForInstant"
            @snapshot="takeSnapshot"
            @download="downloadDDL"
            @apply-table="handleApplyTable"
            @navigate-to-definition="handleNavigateToDefinition"
            @open-editor="data => openQueryConsole(data.sql, data.title)"
            @new-query="openQueryConsole('', undefined, true)"
            @create-object="type => openNewObjectTemplate(type)"
            @update-tab-sql="handleUpdateTabSql"
          />
        </main>
      </div>
    </div>

    <!-- Tab Search Switcher Modal -->
    <TabSearchModal
      v-if="isTabSearchOpen"
      :tabs="tabs"
      :active-tab-id="activeTabId"
      :recently-closed-tabs="recentlyClosedTabs"
      @close="isTabSearchOpen = false"
      @select="handleSelectTab"
      @close-tab="handleCloseTab"
      @reopen-tab="handleReopenTab"
    />
  </MainLayout>
</template>

<script setup lang="ts">
import MainLayout from '@/layouts/MainLayout.vue'
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { Database, Terminal, Table2, Eye, Sigma, Cpu, ChevronDown, Zap, CalendarClock, Check } from 'lucide-vue-next'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'

import { useAppStore } from '@/stores/app'
import { useProjectsStore } from '@/stores/projects'
import { useSchemaLoader } from '@/composables/useSchemaLoader'

// Modular components
import SchemaActionToolbar from '@/components/schema/SchemaActionToolbar.vue'
import SchemaObjectSidebar from '@/components/schema/SchemaObjectSidebar.vue'
import SchemaContentWorkspace from '@/components/schema/SchemaContentWorkspace.vue'
import TabSearchModal from '@/components/general/TabSearchModal.vue'
import Andb from '@/utils/andb'

const appStore = useAppStore()
const { t } = useI18n()

// Composable integration
const selectedConnectionId = computed(() => appStore.selectedConnectionId)
const selectedItem = ref<any>(null)
const selectedFilterType = ref('all')

const ddlTypesList = [
  { key: 'all', translationKey: 'navigation.ddl.all', icon: Database },
  { key: 'tables', translationKey: 'navigation.ddl.tables', icon: Table2 },
  { key: 'views', translationKey: 'navigation.ddl.views', icon: Eye },
  { key: 'procedures', translationKey: 'navigation.ddl.procedures', icon: Cpu },
  { key: 'functions', translationKey: 'navigation.ddl.functions', icon: Sigma },
  { key: 'triggers', translationKey: 'navigation.ddl.triggers', icon: Zap },
  { key: 'events', translationKey: 'navigation.ddl.events', icon: CalendarClock }
]

const selectedDdlTypeObj = computed(() => {
  return ddlTypesList.find(t => t.key === selectedFilterType.value) || ddlTypesList[0]
})

const selectDdlType = (typeKey: string) => {
  selectedFilterType.value = typeKey
  selectedItem.value = null
  activeTabId.value = null
}

const {
  loading,
  schemaData,
  allResults,
  loadSchema,
  selectedDbLastUpdated,
  columnIndex,
  isIndexingColumns
} = useSchemaLoader(selectedConnectionId, selectedItem, selectedFilterType)

watch(
  [selectedConnectionId, () => appStore.isInitialized],
  () => {
    console.log('[GlobalSchemaView] Debug:', {
      routeId: selectedConnectionId.value,
      storeInitialized: appStore.isInitialized,
      totalConnections: appStore.connections.length,
      totalResolved: appStore.resolvedConnections.length,
      foundInStore: !!appStore.getConnectionById(selectedConnectionId.value || '')
    })
  },
  { immediate: true }
)

// UI State
const searchFlags = appStore.globalSearchFlags
const selectedSizeFilter = ref('all')
const viewMode = ref<'visual' | 'code' | 'data'>('visual')
const resultsWidth = ref(300)
const treeExpandCmd = ref<{ action: 'expand' | 'collapse'; ts: number } | null>(null)
const isSearchExpanded = ref(false)
const sortBy = ref<'name' | 'date'>('name')
const sortOrder = ref<'asc' | 'desc'>('asc')
const toolbarSearchInput = ref<HTMLInputElement | null>(null)
const debouncedSearchQuery = ref('')
let searchDebounceTimeout: any = null



watch(() => appStore.globalSearchQuery, newVal => {
  if (searchDebounceTimeout) clearTimeout(searchDebounceTimeout)
  searchDebounceTimeout = setTimeout(() => {
    debouncedSearchQuery.value = newVal
  }, 300)
})

const tabs = ref<any[]>([])
const activeTabId = ref<string | null>(null)
const isTabSearchOpen = ref(false)
const recentlyClosedTabs = ref<any[]>([])

// Selection logic
const activeConnectionName = computed(() => {
  const conn = appStore.resolvedConnections.find(c => c.id === selectedConnectionId.value)
  if (conn) return conn.name
  
  // Fallback: if no valid connection is selected but we have filtered connections,
  // we should display the first one's name and proactively update the store
  if (appStore.filteredConnections.length > 0) {
    nextTick(() => {
      appStore.selectedConnectionId = appStore.filteredConnections[0].id
    })
    return appStore.filteredConnections[0].name
  }
  
  return 'Select Database'
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
    const isRegex = searchFlags.regex
    const isCase = searchFlags.caseSensitive
    const isWhole = searchFlags.wholeWord

    const match = (text: string) => {
      if (!text) return false
      if (isRegex) {
        try {
          return new RegExp(q, isCase ? '' : 'i').test(text)
        } catch {
          return false
        }
      }
      let t = isCase ? text : text.toLowerCase()
      let queryStr = isCase ? q : q.toLowerCase()
      if (isWhole) return t === queryStr
      return t.includes(queryStr)
    }

    if (searchFlags.columns) {
      results = results.filter(r => r.type === 'tables')
    }

    if (searchFlags.columns || searchFlags.content) {
      results = results.map(r => {
        let matchedCols: string[] = []
        if (searchFlags.columns && r.type === 'tables') {
          const cached = columnIndex.value[r.name]
          const colNames = cached
            ? cached.columns.map(c => c.name)
            : Andb.parseColumnNamesFromDdl(r.ddl || r.content || '')
          matchedCols = colNames.filter(cName => match(cName))
        }

        let matches: { line: number; text: string }[] = []
        if (searchFlags.content) {
          const ddlText = r.ddl || r.content || ''
          const lines = ddlText.split('\n')
          lines.forEach((lineText: string, idx: number) => {
            if (match(lineText)) {
              matches.push({ line: idx + 1, text: lineText })
            }
          })
        }

        return {
          ...r,
          matchedColumns: matchedCols,
          matches
        }
      }).filter(r => (searchFlags.columns && r.matchedColumns.length > 0) || (searchFlags.content && r.matches.length > 0))
    } else {
      // Default: match query against name only
      results = results.filter(r => match(r.name))
    }
  }

  // Apply sorting based on sortBy and sortOrder
  results = [...results].sort((a, b) => {
    let comparison = 0
    if (sortBy.value === 'date') {
      const timeA = new Date(a.updated_at || a.lastUpdated || a.createTime || a.updateTime || 0).getTime()
      const timeB = new Date(b.updated_at || b.lastUpdated || b.createTime || b.updateTime || 0).getTime()
      comparison = timeA - timeB
    } else {
      comparison = a.name.localeCompare(b.name)
    }
    return sortOrder.value === 'asc' ? comparison : -comparison
  })

  return results
})

const schemaMetadata = computed(() => {
  const tables = (schemaData.value?.tables || []).map((t: any) => t.name)
  const columns: Record<string, string[]> = {}
  
  for (const [tableName, tableInfo] of Object.entries(columnIndex.value || {})) {
    if (tableInfo && (tableInfo as any).columns) {
      columns[tableName] = (tableInfo as any).columns.map((c: any) => c.name)
    }
  }
  
  return { tables, columns }
})

const navigatableNames = computed(() => {
  return allResults.value.map(r => r.name)
})

const handleNavigateToDefinition = (name: string) => {
  if (!name) return
  const target = allResults.value.find(r => r.name.toLowerCase() === name.toLowerCase())
  if (target) {
    handleSelectItem(target)
  }
}

const hasResults = computed(() => allResults.value.length > 0)

const formattedDdl = computed(() => selectedItem.value?.ddl || selectedItem.value?.content || '')

const detailedTableData = computed(() => {
  if (!selectedItem.value || selectedItem.value.type !== 'tables') return null
  if (selectedItem.value.isNew) return selectedItem.value
  return columnIndex.value[selectedItem.value.name]
})

watch(
  () => selectedItem.value,
  async newVal => {
    // Forcibly activate Visual mode if viewing a visual designer object
    if (newVal && newVal.isNew) {
      viewMode.value = 'visual'
    }

    const ddl = newVal?.ddl || newVal?.content
    if (newVal && newVal.type === 'tables' && ddl) {
      const tableName = newVal.name
      if (!columnIndex.value[tableName]) {
        try {
          console.log('[OnDemandParse] Parsing table DDL:', tableName)
          const parsed = await Andb.parseTable(ddl)
          console.log('[OnDemandParse] Parsed result:', parsed)
          if (parsed) {
            columnIndex.value = {
              ...columnIndex.value,
              [tableName]: {
                columns: parsed.columns || [],
                indexes: parsed.indexes || [],
                foreignKeys: parsed.foreignKeys || [],
                options: parsed.options || {},
                partitions: parsed.partitions || null
              }
            }
          }
        } catch (e) {
          console.warn('[OnDemandParse] Failed to parse table DDL:', e)
        }
      }
    }
  },
  { immediate: true }
)

const tableStatsMap = ref({}) // Simplified for now

// Instant Compare Integration
const isSourceInInstant = computed(() => {
  if (!selectedItem.value) return false
  const src = appStore.compareStack.source
  const conn = appStore.getConnectionById(selectedConnectionId.value)
  return (
    src?.name === selectedItem.value.name &&
    src?.env === conn?.environment &&
    src?.database === conn?.database
  )
})
const isTargetInInstant = computed(() => {
  if (!selectedItem.value) return false
  const dest = appStore.compareStack.target
  const conn = appStore.getConnectionById(selectedConnectionId.value)
  return (
    dest?.name === selectedItem.value.name &&
    dest?.env === conn?.environment &&
    dest?.database === conn?.database
  )
})

const handlePickForInstant = (type: 'source' | 'target') => {
  if (!selectedItem.value) return
  const conn = appStore.getConnectionById(selectedConnectionId.value)
  const current = appStore.compareStack[type]
  
  // Uncheck if clicking the already selected slot on the same database
  if (
    current?.name === selectedItem.value.name &&
    current?.env === conn?.environment &&
    current?.database === conn?.database
  ) {
    appStore.compareStack[type] = null
    if (!appStore.compareStack.source && !appStore.compareStack.target) {
      appStore.isCompareStackVisible = false
    }
    return
  }

  // Remove from the opposite slot if it's selected there to prevent being both source and target
  const oppositeSlot = type === 'source' ? 'target' : 'source'
  const opposite = appStore.compareStack[oppositeSlot]
  if (
    opposite?.name === selectedItem.value.name &&
    opposite?.env === conn?.environment &&
    opposite?.database === conn?.database
  ) {
    appStore.compareStack[oppositeSlot] = null
  }

  appStore.compareStack[type] = {
    name: selectedItem.value.name,
    ddl: formattedDdl.value,
    type: selectedItem.value.type,
    connectionName: conn?.name,
    env: conn?.environment,
    database: conn?.database
  }
  
  appStore.isCompareStackVisible = true
}

const handleSendToInstant = (item: any, slot: 'source' | 'target') => {
  if (!item) return
  const conn = appStore.getConnectionById(selectedConnectionId.value)
  appStore.compareStack[slot] = {
    name: item.name,
    ddl: item.ddl || item.content || '',
    type: item.type,
    connectionName: conn?.name,
    env: conn?.environment,
    database: conn?.database
  }
  appStore.isCompareStackVisible = true
}

const handleRefreshItem = async (item: any) => {
  if (!item) return
  const prevSelected = selectedItem.value
  selectedItem.value = item
  await loadSchema(true, true)
  selectedItem.value = prevSelected
}

// Tab Management
const openQueryConsole = (initialSql: string = '', customName?: string, skipAutoload: boolean = false) => {
  const queryId = `query-${Date.now()}`
  const newTab = {
    id: queryId,
    name: customName || `Query ${tabs.value.filter(t => t.type === 'query').length + 1}`,
    type: 'query',
    connection: appStore.getConnectionById(selectedConnectionId.value),
    initialSql,
    skipAutoload
  }

  tabs.value.push(newTab)
  activeTabId.value = queryId
  selectedItem.value = newTab
}

const handleUpdateTabSql = (id: string, newSql: string) => {
  const tab = tabs.value.find(t => t.id === id)
  if (tab) {
    tab.initialSql = newSql
  }
}

const checkAndRestoreAutoSave = async (connId: string) => {
  if (!connId) return

  // Check if we already have a query tab open for this connection
  const hasQueryTab = tabs.value.some(t => t.type === 'query' && t.connection?.id === connId)
  if (hasQueryTab) return

  const currentProject = useProjectsStore().currentProject
  const baseDir = currentProject?.projectBaseDir || currentProject?.settings?.projectBaseDir
  if (!baseDir) return

  try {
    const result = await (window as any).electronAPI.andbLoadQuery({
      projectBaseDir: baseDir,
      filename: `autosave_${connId}.sql`
    })
    
    if (result.success && result.sql && result.sql.trim()) {
      const connName = appStore.getConnectionById(connId)?.name || ''
      openQueryConsole(result.sql, `Restored Query ${connName ? `(${connName}) ` : ''}${Date.now().toString().slice(-4)}`)
    }
  } catch (e) {
    console.warn('[GlobalSchemaView] Could not load auto-save:', e)
  }
}

const openDefinitionSearch = (query: string = '') => {
  const existing = tabs.value.find(t => t.type === 'deep-search')
  if (existing) {
    activeTabId.value = existing.id
    selectedItem.value = existing
    window.dispatchEvent(new CustomEvent('update-definition-search-query', { detail: { query } }))
  } else {
    const searchId = `deep-search-${Date.now()}`
    const newTab = {
      id: searchId,
      name: 'Definition Search',
      type: 'deep-search',
      initialQuery: query
    }
    tabs.value.push(newTab)
    activeTabId.value = searchId
    selectedItem.value = newTab
  }
}

const openNewObjectTemplate = (type: 'TABLE' | 'VIEW' | 'FUNCTION' | 'PROCEDURE') => {
  if (type === 'TABLE') {
    const newTabId = `new-table-${Date.now()}`
    const newTab = {
      id: newTabId,
      type: 'tables',
      name: 'new_table',
      isNew: true,
      columns: [
        { name: 'id', type: 'INT', pk: true, notNull: true, autoIncrement: true, comment: '', default: '' }
      ],
      indexes: [],
      foreignKeys: [],
      options: { engine: 'InnoDB', charset: 'utf8mb4' },
      partitions: null
    }
    tabs.value.push(newTab)
    activeTabId.value = newTabId
    selectedItem.value = newTab
    return
  }

  const templates = {
    VIEW: `CREATE VIEW \`new_view\` AS\nSELECT * FROM some_table;`,
    FUNCTION: `CREATE FUNCTION \`new_function\` ()\nRETURNS INTEGER\nBEGIN\n\nRETURN 1;\nEND`,
    PROCEDURE: `CREATE PROCEDURE \`new_procedure\` ()\nBEGIN\n\nEND`
  }

  const displayNames = {
    VIEW: 'New View',
    FUNCTION: 'New Function',
    PROCEDURE: 'New Procedure'
  }

  const templateKey = type as keyof typeof templates
  openQueryConsole(templates[templateKey], displayNames[templateKey])
}

const handleApplyTable = (sql: string) => {
  openQueryConsole(sql, 'Create Table Preview')
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
    const [closedTab] = tabs.value.splice(idx, 1)
    if (closedTab) {
      // Keep only unique closed tabs, limit to last 10
      recentlyClosedTabs.value = [
        closedTab,
        ...recentlyClosedTabs.value.filter(t => t.id !== closedTab.id)
      ].slice(0, 10)
    }
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

const handleDuplicateTab = (id: string) => {
  const tab = tabs.value.find(t => t.id === id)
  if (!tab) return

  const newTab = JSON.parse(JSON.stringify(tab))
  newTab.id = `${tab.id}-copy-${Date.now()}`
  newTab.name = `${tab.name} (${t('common.copy')})`

  const index = tabs.value.findIndex(t => t.id === id)
  tabs.value.splice(index + 1, 0, newTab)
  handleSelectTab(newTab.id)
}

const handleCloseOthers = (id: string) => {
  tabs.value = tabs.value.filter(t => t.id === id)
  handleSelectTab(id)
}

const handleCloseRight = (id: string) => {
  const index = tabs.value.findIndex(t => t.id === id)
  if (index !== -1) {
    tabs.value = tabs.value.slice(0, index + 1)
    handleSelectTab(id)
  }
}

const handleReopenTab = (tab: any) => {
  const existing = tabs.value.find(t => t.id === tab.id)
  if (!existing) {
    tabs.value.push(tab)
  }
  recentlyClosedTabs.value = recentlyClosedTabs.value.filter(t => t.id !== tab.id)
  handleSelectTab(tab.id)
}

const resetNavigation = () => {
  selectedItem.value = null
  selectedFilterType.value = 'all'
  
  // Preserve query and deep-search tabs across connection changes
  tabs.value = tabs.value.filter(t => t.type === 'query' || t.type === 'deep-search')
  
  // Select the first remaining tab if the active one was discarded
  if (activeTabId.value && !tabs.value.some(t => t.id === activeTabId.value)) {
    if (tabs.value.length > 0) {
      handleSelectTab(tabs.value[0].id)
    } else {
      activeTabId.value = null
    }
  }
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
    target: { name: selectedItem.value.name, ddl: formattedDdl.value }
  }
})

watch(
  aiContext,
  newCtx => {
    if (newCtx) {
      appStore.aiContext = newCtx
    }
  },
  { immediate: true }
)

const handleOpenTabSearchEvent = () => {
  isTabSearchOpen.value = true
}

const handleCategorySelectedEvent = (e: CustomEvent) => {
  const { type } = e.detail
  if (type) {
    selectedFilterType.value = type
    // Clear stale selected item + active tab so right panel reflects the new category
    selectedItem.value = null
    activeTabId.value = null
  }
}

const handleObjectSelectedEvent = (e: CustomEvent) => {
  const { name, type } = e.detail
  if (type) {
    selectedFilterType.value = type
  }

  const trySelect = (results: any[]) => {
    const target = results.find(
      (r: any) => r.name === name && r.type === type
    )
    if (target) {
      handleSelectItem(target)
      return true
    }
    return false
  }

  // 1. Try immediate select
  if (trySelect(allResults.value)) return

  // 2. Watch for results populating (e.g. when switching connections)
  const unwatch = watch(
    () => allResults.value,
    (newResults) => {
      if (newResults && newResults.length > 0) {
        if (trySelect(newResults)) {
          unwatch()
        }
      }
    },
    { deep: true }
  )

  // Safeguard timeout
  setTimeout(unwatch, 5000)
}

const handleOpenDefinitionSearchEvent = (e: CustomEvent) => {
  const query = e.detail?.query || ''
  openDefinitionSearch(query)
}

onMounted(async () => {
  if (appStore.isInitialized) {
    if (!selectedConnectionId.value && appStore.filteredConnections.length > 0) {
      appStore.selectedConnectionId = appStore.filteredConnections[0].id
    }
    loadSchema()
    if (selectedConnectionId.value) {
      checkAndRestoreAutoSave(selectedConnectionId.value)
    }
  }
  window.addEventListener('andb-open-tab-search', handleOpenTabSearchEvent)
  window.addEventListener('category-selected', handleCategorySelectedEvent as any)
  window.addEventListener('object-selected', handleObjectSelectedEvent as any)
  window.addEventListener('open-definition-search', handleOpenDefinitionSearchEvent as any)
})

onUnmounted(() => {
  window.removeEventListener('andb-open-tab-search', handleOpenTabSearchEvent)
  window.removeEventListener('category-selected', handleCategorySelectedEvent as any)
  window.removeEventListener('object-selected', handleObjectSelectedEvent as any)
  window.removeEventListener('open-definition-search', handleOpenDefinitionSearchEvent as any)
})

// Auto-load when store is ready
watch(
  () => appStore.isInitialized,
  val => {
    if (val) {
      if (!selectedConnectionId.value && appStore.filteredConnections.length > 0) {
        appStore.selectedConnectionId = appStore.filteredConnections[0].id
      }
      if (selectedConnectionId.value) {
        loadSchema()
        checkAndRestoreAutoSave(selectedConnectionId.value)
      }
    }
  }
)

watch(selectedConnectionId, (newId) => {
  if (appStore.isInitialized) {
    resetNavigation()
    loadSchema()
    if (newId) {
      checkAndRestoreAutoSave(newId)
    }
  }
})

watch(isSearchExpanded, async val => {
  if (val) {
    await nextTick()
    toolbarSearchInput.value?.focus()
  }
})
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
