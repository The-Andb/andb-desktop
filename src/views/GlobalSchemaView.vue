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
          <div class="flex items-center relative">
            <!-- Unified New Object Split Action Dropdown -->
            <Menu as="div" class="relative inline-flex shadow-sm shadow-emerald-500/10 hover:shadow-md hover:shadow-emerald-500/20 transition-all duration-300 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 p-[1px]">
              <!-- Left Side: Primary default action (New Query) -->
              <button
                @click="openQueryConsole()"
                class="group flex items-center gap-2 px-3 py-1.5 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-l-[7px] transition-all duration-300 active:scale-[0.98] shrink-0"
                title="New Query"
              >
                <Terminal class="w-3.5 h-3.5 group-hover:scale-110 transition-transform opacity-90" />
                <span class="hidden lg:inline text-[10.5px] font-bold uppercase tracking-wider">New Query</span>
              </button>

              <!-- Extremely subtle vertical divider -->
              <div class="w-px bg-white/20 h-auto my-1"></div>

              <!-- Right Side: Dropdown overlay trigger -->
              <MenuButton
                class="px-2 py-1.5 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-r-[7px] transition-all duration-300 active:scale-[0.98] flex items-center justify-center focus:outline-none"
                title="More creation options"
              >
                <ChevronDown class="w-3.5 h-3.5 opacity-80 hover:opacity-100 transition-opacity" />
              </MenuButton>

              <!-- Glassmorphic Animated Dropdown Panel -->
              <transition
                enter-active-class="transition duration-150 ease-out"
                enter-from-class="transform scale-95 opacity-0 -translate-y-2"
                enter-to-class="transform scale-100 opacity-100 translate-y-0"
                leave-active-class="transition duration-100 ease-in"
                leave-from-class="transform scale-100 opacity-100 translate-y-0"
                leave-to-class="transform scale-95 opacity-0 -translate-y-2"
              >
                <MenuItems
                  class="absolute right-0 top-full mt-2 w-48 origin-top-right rounded-xl bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-800 shadow-2xl shadow-gray-950/20 z-[100] p-1 focus:outline-none backdrop-blur-xl overflow-hidden ring-1 ring-black/5"
                >
                  <div class="px-3 py-2 border-b border-gray-100 dark:border-gray-800/80 mb-1 select-none">
                    <p class="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Create Object</p>
                  </div>
                  <MenuItem v-slot="{ active }">
                    <button
                      @click="openNewObjectTemplate('TABLE')"
                      :class="[
                        active ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/15' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
                        'group flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-[10.5px] font-bold uppercase tracking-wider transition-all duration-150 active:scale-[0.98]'
                      ]"
                    >
                      <Table2 class="w-4 h-4 transition-colors duration-150" :class="active ? 'text-white' : 'text-emerald-500'" />
                      New Table
                    </button>
                  </MenuItem>
                  <MenuItem v-slot="{ active }">
                    <button
                      @click="openNewObjectTemplate('VIEW')"
                      :class="[
                        active ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/15' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
                        'group flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-[10.5px] font-bold uppercase tracking-wider transition-all duration-150 active:scale-[0.98]'
                      ]"
                    >
                      <Eye class="w-4 h-4 transition-colors duration-150" :class="active ? 'text-white' : 'text-emerald-500'" />
                      New View
                    </button>
                  </MenuItem>
                  <MenuItem v-slot="{ active }">
                    <button
                      @click="openNewObjectTemplate('FUNCTION')"
                      :class="[
                        active ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/15' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
                        'group flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-[10.5px] font-bold uppercase tracking-wider transition-all duration-150 active:scale-[0.98]'
                      ]"
                    >
                      <Sigma class="w-4 h-4 transition-colors duration-150" :class="active ? 'text-white' : 'text-emerald-500'" />
                      New Function
                    </button>
                  </MenuItem>
                  <MenuItem v-slot="{ active }">
                    <button
                      @click="openNewObjectTemplate('PROCEDURE')"
                      :class="[
                        active ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/15' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
                        'group flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-[10.5px] font-bold uppercase tracking-wider transition-all duration-150 active:scale-[0.98]'
                      ]"
                    >
                      <Cpu class="w-4 h-4 transition-colors duration-150" :class="active ? 'text-white' : 'text-emerald-500'" />
                      New Procedure
                    </button>
                  </MenuItem>
                </MenuItems>
              </transition>
            </Menu>
          </div>
        </template>
      </SchemaActionToolbar>
    </template>

    <template #breadcrumbs>
      <div class="flex items-center gap-2.5">
        <!-- Status Pill -->
        <div
          class="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 rounded-full border border-emerald-200/50 dark:border-emerald-900/50 shadow-sm shadow-emerald-500/5 transition-all active:scale-[0.98] select-none"
        >
          <div class="relative flex">
            <Database class="w-3.5 h-3.5 text-emerald-500" />
            <div class="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full ring-2 ring-white dark:ring-gray-900 animate-pulse"></div>
          </div>
          <span
            class="text-[11px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300 truncate max-w-[200px]"
            :title="activeConnectionName"
            >{{ activeConnectionName }}</span
          >
        </div>

        <ChevronRight class="w-3 h-3 text-gray-300 dark:text-gray-700 flex-shrink-0" />

        <!-- Secondary Nav Chain -->
        <div class="flex items-center gap-2 px-1.5">
          <button
            @click="resetNavigation"
            class="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-all active:scale-95"
          >
            {{ $t('schema.overview') }}
          </button>

          <template v-if="selectedFilterType && selectedFilterType !== 'all'">
            <ChevronRight class="w-3 h-3 text-gray-300 dark:text-gray-700" />
            <span
              class="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-[0.1em] border border-gray-200/50 dark:border-gray-700/50"
              >{{ $t(`navigation.ddl.${selectedFilterType.toLowerCase()}`) }}</span
            >
          </template>
          
          <template v-else-if="selectedFilterType === 'all'">
            <ChevronRight class="w-3 h-3 text-gray-300 dark:text-gray-700" />
            <span
              class="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-[0.1em] border border-gray-200/50 dark:border-gray-700/50"
              >{{ $t('navigation.ddl.all') }}</span
            >
          </template>

          <template v-if="selectedItem">
            <ChevronRight class="w-3 h-3 text-gray-300 dark:text-gray-700" />
            <div class="flex items-center gap-1.5 px-2 py-0.5 bg-white dark:bg-gray-800/40 rounded border border-gray-200 dark:border-gray-700 shadow-sm">
               <span class="text-[10px] font-bold text-gray-900 dark:text-white font-mono tracking-tight selection:bg-emerald-200">{{
                 selectedItem.name
               }}</span>
            </div>
          </template>
        </div>
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
            @update-size-filter="
              size => (selectedSizeFilter = size === selectedSizeFilter ? 'all' : size)
            "
            @select="handleSelectItem"
            @refresh="loadSchema(true)"
            @hard-refresh="handleHardRefresh"
            @start-resize="startResultsResize"
            @new-query="openQueryConsole"
            @send-to-instant="handleSendToInstant"
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
            @apply-table="handleApplyTable"
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
import { Database, Terminal, Table2, Eye, Sigma, Cpu, ChevronRight, ChevronDown } from 'lucide-vue-next'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'

import { useAppStore } from '@/stores/app'
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
const treeExpandCmd = ref<{ action: 'expand' | 'collapse'; ts: number } | null>(null)
const isSearchExpanded = ref(false)
const toolbarSearchInput = ref<HTMLInputElement | null>(null)
const debouncedSearchQuery = ref('')
let searchDebounceTimeout: any = null



watch(searchQuery, newVal => {
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
  return conn ? conn.name : 'Unknown'
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
        } catch {
          return false
        }
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
const isSourceInInstant = computed(
  () => appStore.compareStack.source?.name === selectedItem.value?.name
)
const isTargetInInstant = computed(
  () => appStore.compareStack.target?.name === selectedItem.value?.name
)

const handlePickForInstant = (type: 'source' | 'target') => {
  if (!selectedItem.value) return
  appStore.compareStack[type] = {
    name: selectedItem.value.name,
    ddl: formattedDDL.value,
    type: selectedItem.value.type
  }
}

const handleSendToInstant = (item: any, slot: 'source' | 'target') => {
  if (!item) return
  appStore.compareStack[slot] = {
    name: item.name,
    ddl: item.ddl || item.content || '',
    type: item.type
  }
  appStore.isCompareStackVisible = true
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

const handleHardRefresh = async () => {
  if (confirm(t('schema.hardPurgeConfirm'))) {
     await loadSchema(true, false, true)
  }
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

onMounted(async () => {
  if (appStore.isInitialized) {
    loadSchema()
  }
  window.addEventListener('andb-open-tab-search', handleOpenTabSearchEvent)
})

onUnmounted(() => {
  window.removeEventListener('andb-open-tab-search', handleOpenTabSearchEvent)
})

// Auto-load when store is ready
watch(
  () => appStore.isInitialized,
  val => {
    if (val && selectedConnectionId.value) {
      loadSchema()
    }
  }
)

watch(selectedConnectionId, () => {
  if (appStore.isInitialized) {
    resetNavigation()
    loadSchema()
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
