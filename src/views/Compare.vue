<template>
  <MainLayout>
    <template #toolbar>
      <CompareToolbar
        :appStore="appStore"
        v-model:viewMode="viewMode"
        v-model:showSafeModeInfo="showSafeModeInfo"
        :loading="loading"
        :loadingAction="loadingAction"
        :activePair="activePair"
        @runComparison="runComparison"
      />
    </template>

    <template #breadcrumbs>
      <CompareBreadcrumbs
        :activePair="activePair"
        :loading="loading"
        :loadingAction="loadingAction"
        @runComparison="runComparison"
      />
    </template>

    <!-- Comparison & Console Split -->
    <div class="flex-1 flex flex-col overflow-hidden relative min-w-0 bg-white dark:bg-gray-950">
      <!-- Comparison Area (Top) -->
      <div
        class="flex-1 flex overflow-hidden relative min-w-0"
        :class="{ 'flex-row-reverse': appStore.layoutSettings.sidebarPosition === 'right' }"
      >
        <main class="flex-1 flex flex-col overflow-hidden relative min-w-0">
          <!-- MIGRATION INLINE PANEL -->
          <div
            v-if="migrationTerminal.isOpen"
            class="absolute inset-0 z-[100] bg-white dark:bg-gray-900 flex flex-col animate-in slide-in-from-right-8 duration-300"
          >
            <MigrationConfirm
              :is-open="true"
              :inline="true"
              :loading="isMigrating"
              :is-migrating-item-id="isMigratingItemId"
              :item="
                migrationTerminal.type === 'batch' || migrationTerminal.type === 'custom-batch'
                  ? { isBatch: true, items: migrationTerminal.items }
                  : migrationTerminal.items[0]
              "
              :source-name="sourceName"
              :target-name="targetName"
              :sql-script="migrationTerminal.sqlScript"
              :sql-map="migrationTerminal.sqlMap"
              :fetching-sql="migrationTerminal.fetching"
              :target-is-static="isTargetDump"
              @close="closeMigrationTerminal"
              @confirm="executeConfirmedMigration"
              @select="fetchBatchItemSql"
            />
          </div>

          <!-- Removed Manual Compare Dropdowns per user request -->

          <!-- Vertical Split: Object List vs DDL View -->
          <div
            v-if="viewMode === 'list'"
            class="flex-1 flex overflow-hidden relative min-w-0"
            :class="{ 'flex-row-reverse': appStore.layoutSettings.sidebarPosition === 'right' }"
          >
            <!-- Left: Comparison Results List (Sub-sidebar style) -->
            <CompareResultsList
              :resultsWidth="resultsWidth"
              v-model:activeType="selectedFilterType"
              v-model:sortBy="sortBy"
              :selectedItem="selectedItem"
              :collapsedCategories="collapsedCategories"
              :activePair="activePair"
              :loading="loading"
              :loadingAction="loadingAction"
              :isTargetDump="isTargetDump"
              :isMigratingItemId="isMigratingItemId"
              :filteredResults="filteredResults"
              :hasResults="hasResults"
              :statusFilters="statusFilters"
              :resultsByCategory="resultsByCategory"
              @expand-all="() => { treeExpandCmd = { action: 'expand', ts: Date.now() }; collapsedCategories.clear() }"
              @collapse-all="() => { treeExpandCmd = { action: 'collapse', ts: Date.now() }; ['tables', 'views', 'procedures', 'functions', 'triggers'].forEach(c => collapsedCategories.add(c)) }"
              @refresh-comparison="runComparison"
              @fetch-and-compare="runFetchAndCompare"
              @select-item="selectItem"
              @contextmenu="handleItemContextMenu"
              @migrate="migrateSingleItem"
              @migrate-batch="migrateBatchInline"
              @migrate-custom-batch="migrateCustomItems"
              @start-resize="startResultsResize"
            />

            <!-- Right: Split DDL Detail -->
            <CompareDetailView
              :tabs="tabs"
              :activeTabId="activeTabId"
              :selectedItem="selectedItem"
              :selectedPath="selectedPath"
              :sourceName="sourceName"
              :targetName="targetName"
              :isTargetDump="isTargetDump"
              :isMigrating="isMigrating"
              :isMigratingItemId="isMigratingItemId"
              :diffOptions="diffOptions"
              :navigatableNames="navigatableNames"
              @select-tab="handleSelectTab"
              @close-tab="handleCloseTab"
              @duplicate-tab="handleDuplicateTab"
              @close-others="handleCloseOthers"
              @close-right="handleCloseRight"
              @migrate="migrateSingleItem"
              @navigate-to-definition="handleNavigateToDefinition"
              @refresh-pair="handleRefreshPair"
            />
          </div>

          <!-- Tree Mode View -->
          <div v-else class="flex-1 relative min-h-0 flex flex-col">
            <CompareTreeMode
              :results="allResults"
              :source-name="sourceName"
              :target-name="targetName"
              :target-is-static="isTargetDump"
              :migrating-item-id="isMigratingItemId"
              :tree-expand-cmd="treeExpandCmd"
              v-model:active-type="selectedFilterType"
              @migrate="migrateSingleItem"
              @select="selectItem"
              @send-to-instant="(item, slot) => sendToInstant(item, slot)"
              @contextmenu="handleItemContextMenu"
            />
          </div>
        </main>
      </div>
    </div>

    <!-- No slot needed, AI Panel is now in MainLayout -->
  </MainLayout>

  <!-- Error Details Modal -->
  <div
    v-if="showErrorModal && error"
    class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
  >
    <div
      class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-red-100 dark:border-red-900/30 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
    >
      <div class="p-6 flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0"
          >
            <AlertCircle class="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3
              class="text-lg font-extrabold text-gray-900 dark:text-white uppercase tracking-tight"
            >
              {{ $t('common.error') }}
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">
              An unexpected issue occurred during the operation
            </p>
          </div>
        </div>

        <div
          class="bg-gray-50 dark:bg-gray-950 rounded-xl p-4 border border-gray-100 dark:border-gray-800/50 font-mono text-xs text-red-600 dark:text-red-400 break-words max-h-[300px] overflow-y-auto custom-scrollbar leading-relaxed"
        >
          {{ error }}
        </div>

        <div class="flex items-center gap-3 mt-2">
          <button
            @click="showErrorModal = false"
            class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all"
          >
            {{ $t('common.close') }}
          </button>
          <button
            @click="
              runComparison();
              showErrorModal = false
            "
            class="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-red-500/20 active:scale-95"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Item Context Menu Container -->
  <div style="display: contents">
    <Teleport to="body">
      <div
        v-if="itemContextMenu.visible"
        class="fixed z-[1000] min-w-[180px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 p-1.5 animate-in fade-in zoom-in-95 duration-150"
        :style="{ top: itemContextMenu.y + 'px', left: itemContextMenu.x + 'px' }"
      >
        <button
          @click="handleIgnoreItem(itemContextMenu.item)"
          class="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
        >
          <Ban class="w-4 h-4 text-red-400 group-hover:text-red-500" />
          {{ t('compare.ignoreObject') }}
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import { useConnectionPairsStore } from '@/stores/connectionPairs'
import { useAppStore } from '@/stores/app'
import { useProjectsStore } from '@/stores/projects'
import { useConsoleStore } from '@/stores/console'
import Andb from '@/utils/andb'
import { useI18n } from 'vue-i18n'
import {
  Sigma,
  AlertCircle,
  Zap,
  Database,
  Table,
  Layers,
  Workflow,
  Ban
} from 'lucide-vue-next'
import { useOperationsStore } from '@/stores/operations'
import { useNotificationStore } from '@/stores/notification'
import { useSidebarStore } from '@/stores/sidebar'
import CompareTreeMode from '@/components/compare/CompareTreeMode.vue'
import MigrationConfirm from '@/components/compare/MigrationConfirm.vue'
import CompareResultsList from '@/components/compare/CompareResultsList.vue'
import CompareDetailView from '@/components/compare/CompareDetailView.vue'
import CompareToolbar from '@/components/compare/CompareToolbar.vue'
import CompareBreadcrumbs from '@/components/compare/CompareBreadcrumbs.vue'

const connectionPairsStore = useConnectionPairsStore()
const appStore = useAppStore()
const operationsStore = useOperationsStore()
const consoleStore = useConsoleStore()
const notificationStore = useNotificationStore()
const sidebarStore = useSidebarStore()
const projectsStore = useProjectsStore()
const { t } = useI18n()

const searchInput = ref<HTMLInputElement | null>(null)

const activePair = computed(() => connectionPairsStore.activePair)
const sourceName = computed(() => activePair.value?.source?.name || 'Source')
const targetName = computed(() => activePair.value?.target?.name || 'Target')

const route = useRoute()
const router = useRouter() // Ensure router is available

const isTargetDump = computed(() => {
  const conn = activePair.value?.target
  if (!conn) return false
  return (
    conn.type === 'dump' || conn.host?.toLowerCase().endsWith('.sql') || conn.host?.includes('.sql')
  )
})

const sendToInstant = (item: any, slot: 'source' | 'target' = 'source') => {
  if (!item) return

  const ddl = item.sourceDdl || item.diff?.source || item.targetDdl || item.diff?.target || ''

  // Type Validation
  const oppositeSlot = slot === 'source' ? 'target' : 'source'
  const oppositeItem = appStore.compareStack[oppositeSlot]

  if (oppositeItem && oppositeItem.type && item.type && oppositeItem.type !== item.type) {
    notificationStore.add({
      type: 'error',
      title: 'Type Mismatch',
      message: `Cannot compare a ${item.type.replace(/s$/, '')} with a ${oppositeItem.type.replace(/s$/, '')}.`
    })
    return
  }

  const conn = slot === 'source' ? activePair.value?.source : activePair.value?.target

  appStore.compareStack[slot] = {
    name: item.name,
    ddl,
    type: item.type,
    connectionName: conn?.name,
    env: conn?.environment,
    database: conn?.database
  }

  appStore.isCompareStackVisible = true
}

// Watch for project changes to reset state
watch(
  () => projectsStore.selectedProjectId,
  () => {
    tableResults.value = []
    procedureResults.value = []
    functionResults.value = []
    viewResults.value = []
    triggerResults.value = []
    selectedItem.value = null
    selectedFilterType.value = 'all'
    error.value = null
    tabs.value = []
    activeTabId.value = null
  }
)

// Deep Link Handling
onMounted(async () => {
  // Check for pairId in query
  if (connectionPairsStore.connectionPairs.length === 0) {
    await connectionPairsStore.reloadData()
  }

  if (route.query.pairId) {
    connectionPairsStore.selectPair(route.query.pairId as string)
  } else if (connectionPairsStore.availablePairs.length > 0 && !connectionPairsStore.activePair) {
    // Auto-select first pair if none selected
    const firstPairId = connectionPairsStore.availablePairs[0].id
    if (firstPairId) {
      connectionPairsStore.selectPair(firstPairId)
    }
  }

  // Check for action=new (Auto Run)
  if (route.query.action === 'new') {
    // Wait a bit for stores to sync activePair from the selectPair call above
    await nextTick()

    // If we have an active pair, run valid comparison immediately
    if (activePair.value) {
      runComparison()
    } else {
      // Retry once after another tick if store was slow
      await nextTick()
      if (activePair.value) runComparison()
      else {
        notificationStore.add({
          type: 'info',
          title: 'New Comparison',
          message: 'Please select a Connection Pair to start comparison.'
        })
      }
    }

    // Clean URL
    router.replace({ query: { ...route.query, action: undefined } })
  }

  // Check for action=fetch-compare (Auto Run Fetch & Compare)
  if (route.query.action === 'fetch-compare') {
    await nextTick()
    if (activePair.value) {
      runFetchAndCompare()
    } else {
      await nextTick()
      if (activePair.value) runFetchAndCompare()
    }
    // Clean URL
    router.replace({ query: { ...route.query, action: undefined } })
  }
})

const viewMode = ref<'list' | 'tree'>('list')

// Removed fetchButtonText as there is no manual fetch button anymore

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

// State
const loading = ref(false)
const loadingAction = ref<'compare' | 'fetch' | null>(null)
const showSafeModeInfo = ref(false)
const statusMessage = ref('')
const resultsWidth = ref(300)
const error = ref<string | null>(null)
const tableResults = ref<any[]>([])
const procedureResults = ref<any[]>([])
const functionResults = ref<any[]>([])
const viewResults = ref<any[]>([])
const triggerResults = ref<any[]>([])
const selectedItem = ref<any>(null)
const selectedFilterType = ref<string>('all')
const searchFlags = appStore.globalSearchFlags
const diffOptions = ref({
  hideWhitespace: false,
  wrapLines: false,
  mode: 'unified' as 'unified' | 'split',
  showChangesOnly: true // default to true
})
const lastCompareTime = ref(0)
const showErrorModal = ref(false)
const treeExpandCmd = ref<{ action: 'expand' | 'collapse'; ts: number } | null>(null)
const collapsedCategories = ref(new Set<string>())
watch(selectedFilterType, (newType) => {
  if (newType && newType !== 'all') {
    // Expand the selected category
    collapsedCategories.value.delete(newType)
    // Collapse all other categories
    const allTypes = ['tables', 'views', 'procedures', 'functions', 'triggers']
    allTypes.forEach(t => {
      if (t !== newType) {
        collapsedCategories.value.add(t)
      }
    })
    // Force reactivity of Set
    collapsedCategories.value = new Set(collapsedCategories.value)
  } else if (newType === 'all') {
    // Expand all categories when 'all' is selected
    collapsedCategories.value.clear()
    collapsedCategories.value = new Set(collapsedCategories.value)
  }
}, { immediate: true })
const sortBy = ref<'status' | 'name' | 'date'>('status')

// Tabs State
const tabs = ref<any[]>([])
const activeTabId = ref<string | null>(null)

// Item Context Menu State
const itemContextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  item: null as any
})

const handleItemContextMenu = (e: MouseEvent, item: any) => {
  itemContextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    item
  }
}

const closeItemContextMenu = () => {
  itemContextMenu.value.visible = false
}

const handleIgnoreItem = (item: any) => {
  if (!item || !projectsStore.currentProject) return

  const settings = { ...(projectsStore.currentProject.settings || {}) }
  const excludeTags = [...(settings.excludeTags || [])]

  if (!excludeTags.includes(item.name)) {
    excludeTags.push(item.name)
    settings.excludeTags = excludeTags
    projectsStore.updateProject(projectsStore.currentProject.id, { settings })

    // Remove from local state immediately for snappy UX
    const type = item.type?.toLowerCase() || 'tables'
    if (type === 'tables') tableResults.value = tableResults.value.filter(i => i.name !== item.name)
    else if (type === 'procedures')
      procedureResults.value = procedureResults.value.filter(i => i.name !== item.name)
    else if (type === 'functions')
      functionResults.value = functionResults.value.filter(i => i.name !== item.name)
    else if (type === 'views')
      viewResults.value = viewResults.value.filter(i => i.name !== item.name)
    else if (type === 'triggers')
      triggerResults.value = triggerResults.value.filter(i => i.name !== item.name)

    // Close any open tabs for this object
    const tabId = `${item.type || 'unknown'}-${item.name}`
    handleCloseTab(tabId)

    notificationStore.add({
      type: 'success',
      title: 'Object Ignored',
      message: t('compare.ignoredNotification', { name: item.name })
    })
  }

  closeItemContextMenu()
}

const handleSelectTab = (id: string) => {
  const tab = tabs.value.find(t => t.id === id)
  if (tab) {
    activeTabId.value = id
    selectedItem.value = tab.data
  }
}

const handleCloseTab = (id: string) => {
  const index = tabs.value.findIndex(t => t.id === id)
  if (index === -1) return

  tabs.value.splice(index, 1)

  if (activeTabId.value === id) {
    if (tabs.value.length > 0) {
      const nextTab = tabs.value[Math.min(index, tabs.value.length - 1)]
      handleSelectTab(nextTab.id)
    } else {
      activeTabId.value = null
      selectedItem.value = null
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

const statusFilters = computed(() => [
  { label: t('common.all'), value: 'all' },
  { label: t('compare.filters.modified'), value: 'modified' },
  { label: t('compare.filters.new'), value: 'new' },
  { label: t('compare.filters.deprecated'), value: 'deprecated' },
  { label: t('compare.filters.identical'), value: 'equal' }
])

// Migration State
const isMigrating = ref(false)
const isMigratingBatch = ref<string | null>(null)
const isMigratingItemId = ref<string | null>(null)

const selectedPath = ref({
  env: '',
  db: '',
  type: ''
})

// View State
const isResizingResults = ref(false)

const startResultsResize = () => {
  isResizingResults.value = true
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
}

const handleResize = (e: MouseEvent) => {
  if (isResizingResults.value) {
    resultsWidth.value = Math.max(200, Math.min(800, resultsWidth.value + e.movementX))
  }
}

const stopResize = () => {
  isResizingResults.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
}

const allResults = computed(() => {
  const all = [
    ...tableResults.value.map(i => ({ ...i, type: 'tables' })),
    ...procedureResults.value.map(i => ({ ...i, type: 'procedures' })),
    ...functionResults.value.map(i => ({ ...i, type: 'functions' })),
    ...viewResults.value.map(i => ({ ...i, type: 'views' })),
    ...triggerResults.value.map(i => ({ ...i, type: 'triggers' }))
  ]

  return all.sort((a, b) => {
    if (sortBy.value === 'date') {
      // Sort by last updated (newest first)
      const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0
      const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0
      if (timeA !== timeB) return timeB - timeA // Descending
    } else if (sortBy.value === 'status') {
      // Sort by status priority: different/updated > missing/new > equal/same
      const getPriority = (s: string) => {
        s = s?.toLowerCase()
        if (s === 'different' || s === 'updated' || s === 'modified') return 0
        if (s === 'missing_in_target' || s === 'new' || s === 'missing') return 1
        if (s === 'missing_in_source' || s === 'deprecated') return 2
        if (s === 'equal' || s === 'same') return 3
        return 4
      }

      const priA = getPriority(a.status)
      const priB = getPriority(b.status)

      if (priA !== priB) return priA - priB
    }

    // In all modes, if the primary criteria is equal, sort alphabetically
    return a.name.localeCompare(b.name)
  })
})

const filteredResults = computed(() => {
  let filtered = allResults.value



  // Filter by status
  const filter = appStore.globalSearchFilter
  filtered = filtered.filter(i => {
    const status = i.status.toLowerCase()
    if (filter === 'modified')
      return status === 'modified' || status === 'different' || status === 'updated'
    if (filter === 'new') return status === 'new' || status === 'missing_in_target'
    if (filter === 'deprecated') return status === 'deprecated' || status === 'missing_in_source'
    if (filter === 'equal') return status === 'equal' || status === 'same'
    // Default 'all' means all DIFFERENCES. We hide 'equal/same' by default to clear them from the list after migration
    if (filter === 'all') return status !== 'equal' && status !== 'same'
    return true
  })

  // Filter by search query
  if (appStore.globalSearchQuery.trim()) {
    const query = appStore.globalSearchQuery.trim()
    const { caseSensitive, wholeWord, regex } = searchFlags

    const buildMatches = (item: any, testFunc: (text: string) => boolean) => {
      const matches: any[] = []
      const findInContent = (content: string) => {
        if (!content) return
        const lines = content.split('\n')
        lines.forEach((lineText, idx) => {
          if (testFunc(lineText)) {
            matches.push({
              line: idx + 1,
              text: lineText.trim()
            })
          }
        })
      }
      findInContent(item.diff?.source || '')
      findInContent(item.diff?.target || '')
      
      const uniqueMatches: any[] = []
      const seen = new Set<string>()
      matches.forEach(m => {
        const key = `${m.line}:${m.text}`
        if (!seen.has(key)) {
          seen.add(key)
          uniqueMatches.push(m)
        }
      })
      return uniqueMatches
    }

    try {
      let re: RegExp
      if (regex) {
        re = new RegExp(query, caseSensitive ? '' : 'i')
      } else {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        if (wholeWord) {
          re = new RegExp(`\\b${escaped}\\b`, caseSensitive ? '' : 'i')
        } else {
          re = new RegExp(escaped, caseSensitive ? '' : 'i')
        }
      }

      filtered = filtered
        .map(i => {
          const matches = buildMatches(i, (text) => re.test(text))
          const nameMatches = re.test(i.name)
          return { ...i, matches, nameMatches }
        })
        .filter(i => i.nameMatches || i.matches.length > 0)
    } catch (e) {
      // Invalid regex fallback to simple include
      filtered = filtered
        .map(i => {
          const lowerQuery = query.toLowerCase()
          const matches = buildMatches(i, (text) => text.toLowerCase().includes(lowerQuery))
          const nameMatches = i.name.toLowerCase().includes(lowerQuery)
          return { ...i, matches, nameMatches }
        })
        .filter(i => i.nameMatches || i.matches.length > 0)
    }
  } else {
    // Clear matches if no search query
    filtered = filtered.map(i => ({ ...i, matches: [] }))
  }

  return filtered
})

const navigatableNames = computed(() => {
  return allResults.value.map(r => r.name)
})

const handleNavigateToDefinition = (name: string) => {
  // Navigate to Schema view with selected object
  router.push({
    name: 'Schema',
    query: { select: name }
  })
}

const hasResults = computed(() => allResults.value.length > 0)

const resultsByCategory = computed(() => {
  const categories = ['tables', 'views', 'procedures', 'functions', 'triggers']
  return categories
    .map(cat => {
      // 1. Get raw items (unfiltered by search) to show total DDL count
      const rawItems = allResults.value.filter(i => i.type === cat)

      // 2. respect search and status filters for active display
      const items = filteredResults.value.filter(i => i.type === cat)

      return {
        type: cat,
        items,
        total: rawItems.length,
        changes: items.filter(
          i => i.status.toLowerCase() !== 'equal' && i.status.toLowerCase() !== 'same'
        ).length
      }
    })
    .filter(c => c.total > 0)
})

// Actions
const runComparison = async () => {
  if (!activePair.value) return
  const { source, target } = activePair.value
  // Debounce: prevent rapid re-clicks within 1.5 seconds
  const now = Date.now()
  if (now - lastCompareTime.value < 1500) return
  lastCompareTime.value = now

  loading.value = true
  loadingAction.value = 'compare'
  sidebarStore.isComparing = true

  statusMessage.value = t('compare.initializing')
  consoleStore.clearLogs()
  error.value = null

  try {
    if (appStore.excludedEnvironments.includes(source.environment) || appStore.excludedEnvironments.includes(target.environment)) {
      consoleStore.addLog(`⚠️ Smart Sync Warning: Source or Target environment is excluded from sync scope. Skipping...`, 'warn')
      sidebarStore.isComparing = false
      loading.value = false
      loadingAction.value = null
      return
    }

    let objTypes: ('tables' | 'procedures' | 'functions' | 'triggers' | 'views')[] = (
      ['tables', 'procedures', 'functions', 'triggers', 'views'] as any[]
    ).filter(type => !appStore.excludedCategories.includes(`${source.environment}:${source.database}:${type}`))
    let compareName: string | undefined = undefined

    // Atomic Compare Logic
    if (selectedItem.value) {
      // 1. Compare specific object
      objTypes = [selectedItem.value.type.toLowerCase() as any] // e.g., 'tables'
      compareName = selectedItem.value.name
      consoleStore.addLog(
        `Comparing single object: ${selectedItem.value.name} (${selectedItem.value.type})`,
        'info'
      )
      statusMessage.value = t('compare.analyzingItem', { name: selectedItem.value.name })
    } else if (selectedFilterType.value && selectedFilterType.value !== 'all') {
      // 2. Compare specific category
      objTypes = [selectedFilterType.value.toLowerCase() as any]
      consoleStore.addLog(`Comparing category: ${selectedFilterType.value}`, 'info')
      statusMessage.value = t('compare.analyzingItem', { name: selectedFilterType.value })
    } else {
      consoleStore.addLog(
        `Starting comparison between ${source.name} (${source.host}) and ${target.name} (${target.host})`,
        'info'
      )
      statusMessage.value = t('compare.analyzing')
    }

    // Compare (Always run to update comparison results from local cache)
    statusMessage.value = t('compare.comparingObjects')

    // Start recording operation
    const opId = operationsStore.addOperation({
      type: 'compare',
      sourceEnv: activePair.value.sourceEnv,
      targetEnv: activePair.value.targetEnv,
      status: 'pending',
      startTime: new Date()
    })

    const results = await Promise.all(
      objTypes.map(type =>
        Andb.compare(source, target, {
          type,
          sourceEnv: activePair.value!.sourceEnv,
          targetEnv: activePair.value!.targetEnv,
          name: compareName
        })
      )
    )

    // Map results based on what we fetched
    objTypes.forEach((type, index) => {
      const res = Array.isArray(results[index]) ? results[index] : []

      if (compareName) {
        let targetArray: any[] = []
        if (type === 'tables') targetArray = tableResults.value
        else if (type === 'procedures') targetArray = procedureResults.value
        else if (type === 'functions') targetArray = functionResults.value
        else if (type === 'views') targetArray = viewResults.value
        else if (type === 'triggers') targetArray = triggerResults.value

        const newArray = [...targetArray]
        res.forEach(newItem => {
          const existingIdx = newArray.findIndex(item => item.name === newItem.name)
          if (existingIdx >= 0) {
            newArray[existingIdx] = newItem
          } else {
            newArray.push(newItem)
          }
        })

        if (type === 'tables') tableResults.value = newArray
        else if (type === 'procedures') procedureResults.value = newArray
        else if (type === 'functions') functionResults.value = newArray
        else if (type === 'views') viewResults.value = newArray
        else if (type === 'triggers') triggerResults.value = newArray
      } else {
        if (type === 'tables') tableResults.value = res
        else if (type === 'procedures') procedureResults.value = res
        else if (type === 'functions') functionResults.value = res
        else if (type === 'views') viewResults.value = res
        else if (type === 'triggers') triggerResults.value = res
      }
    })

    const totalCount =
      tableResults.value.length +
      procedureResults.value.length +
      functionResults.value.length +
      viewResults.value.length +
      triggerResults.value.length

    // Complete operation record
    operationsStore.completeOperation(opId, true, { ddlCount: totalCount })

    // Sync to Sidebar Store
    sidebarStore.setComparisonResults(allResults.value)
    sidebarStore.triggerRefresh()

    // Auto-select first result if we did a bulk comparison
    if (!compareName && filteredResults.value.length > 0) {
      selectItem(filteredResults.value[0])
    }

    consoleStore.addLog('Comparison completed successfully', 'success')
  } catch (e: any) {
    error.value = e.message || 'Comparison failed'
    consoleStore.addLog(`Comparison failed: ${e.message}`, 'error')
    notificationStore.add({
      type: 'error',
      title: 'Comparison Failed',
      message: e.message
    })
  } finally {
    appStore.isSchemaFetching = false // Release global fetch state
    appStore.schemaFetchProgresses = {}

    // 5. Update Sidebar to show new objects
    await sidebarStore.loadSchemas(true)

    sidebarStore.isComparing = false
    loading.value = false
  }
}

const runFetchAndCompare = async () => {
  if (!activePair.value) return
  const { source, target } = activePair.value
  loading.value = true
  loadingAction.value = 'fetch'
  sidebarStore.isComparing = true
  statusMessage.value = 'Fetching fresh DDLs from databases in parallel...'

  try {
    if (
      appStore.excludedEnvironments.includes(source.environment) || 
      appStore.excludedEnvironments.includes(target.environment) ||
      appStore.excludedDatabases.includes(`${source.environment}:${source.database}`) ||
      appStore.excludedDatabases.includes(`${target.environment}:${target.database}`)
    ) {
      consoleStore.addLog(`⚠️ Smart Sync Warning: Source or Target database/environment is excluded from sync scope. Skipping Fetch...`, 'warn')
      sidebarStore.isComparing = false
      loading.value = false
      loadingAction.value = null
      return
    }

    const allTypes = ['tables', 'views', 'procedures', 'functions', 'triggers'] as const

    const sourceTypes = allTypes.filter(type => !appStore.excludedCategories.includes(`${source.environment}:${source.database}:${type}`))
    const targetTypes = allTypes.filter(type => !appStore.excludedCategories.includes(`${target.environment}:${target.database}:${type}`))

    consoleStore.addLog(`Fetching Source & Target DDLs in parallel...`, 'info')
    
    // Fetch source and target in parallel
    await Promise.all([
      ...sourceTypes.map(type => Andb.export(source, target, { type, environment: source.environment })),
      ...targetTypes.map(type => Andb.export(source, target, { type, environment: target.environment }))
    ])

    // Run comparison
    statusMessage.value = 'Analyzing differences...'
    await runComparison()

    notificationStore.add({
      title: 'Fetch Complete',
      message: 'Fresh DDLs imported and compared successfully',
      type: 'success'
    })
  } catch (e: any) {
    error.value = e.message
    showErrorModal.value = true
    consoleStore.addLog(`Fetch error: ${e.message}`, 'error')
  } finally {
    sidebarStore.isComparing = false
    loading.value = false
    loadingAction.value = null
  }
}

const handleRefreshPair = async (item: any) => {
  if (!activePair.value || !item) return
  loading.value = true
  loadingAction.value = 'fetch'
  sidebarStore.isComparing = true
  statusMessage.value = `Refreshing and re-comparing ${item.name} (${item.type})...`

  try {
    const { source, target } = activePair.value
    const type = item.type // e.g., 'tables', 'views', etc.
    const name = item.name

    consoleStore.addLog(`Fetching Source: ${source.name} - ${name} (${type})`, 'info')
    await Andb.export(source, target, { type, environment: source.environment, name })

    consoleStore.addLog(`Fetching Target: ${target.name} - ${name} (${type})`, 'info')
    await Andb.export(source, target, { type, environment: target.environment, name })

    // Run comparison for the active pair
    statusMessage.value = 'Analyzing differences...'
    await runComparison()

    notificationStore.add({
      title: 'Pair Refresh Complete',
      message: `Object ${name} refreshed and compared successfully`,
      type: 'success'
    })
  } catch (e: any) {
    error.value = e.message
    showErrorModal.value = true
    consoleStore.addLog(`Pair refresh error: ${e.message}`, 'error')
  } finally {
    sidebarStore.isComparing = false
    loading.value = false
    loadingAction.value = null
  }
}

// ==========================================
// Expose for debugging if needed
// ==========================================
defineExpose({})

const selectItem = (item: any) => {
  if (!item) return

  // Update AI Context globally
  appStore.aiContext = {
    source: { name: sourceName.value, ddl: item.diff?.source || '' },
    target: { name: targetName.value, ddl: item.diff?.target || '' },
    objectName: item.name,
    objectType: item.type
  }

  const tabId = `${item.type || 'unknown'}-${item.name}`
  const existingTab = tabs.value.find(t => t.id === tabId)

  if (!existingTab) {
    tabs.value.push({
      id: tabId,
      name: item.name,
      type: item.type,
      icon: getIconForType(item.type),
      data: item
    })
  } else {
    existingTab.data = item
  }

  activeTabId.value = tabId
  selectedItem.value = item
}

const handleObjectSelected = (event: any) => {
  const { env, db, name, type } = event.detail

  selectedPath.value = { env, db, type }

  // Normalize type (ensure plural)
  const normalizedType = type.endsWith('s') ? type : type + 's'

  const found = allResults.value.find(
    i => i.name === name && (i.type === normalizedType || i.type === type)
  )

  if (found) {
    selectedItem.value = found
    // Ensure selected type matches the item type
    selectedFilterType.value = 'all'
  } else {
    // If NOT found, it might be because comparison hasn't run or item is new/missing
    // Let's trigger a LOCAL comparison first to check cache
    consoleStore.addLog(
      `Object ${name} not in current results. Triggering local comparison...`,
      'info'
    )
    runComparison().then(() => {
      const retryFound = allResults.value.find(i => i.name === name)
      if (retryFound) selectedItem.value = retryFound
    })
  }
}

const handleCategorySelected = (event: any) => {
  const { env, db, type } = event.detail
  selectedFilterType.value = type
  selectedPath.value = { env, db, type }

  // Clear diff view when category is selected
  selectedItem.value = null

  // If we have literally 0 results for this category after selection,
  // maybe we should auto-trigger a comparison?
  const hasTypeResults = allResults.value.some(i => i.type.toLowerCase() === type.toLowerCase())
  if (type !== 'all' && !hasTypeResults) {
    consoleStore.addLog(`No results for ${type}. Auto-triggering comparison...`, 'info')
    runComparison()
  }
}

// Migration Actions

const migrationTerminal = ref<{
  isOpen: boolean
  items: any[]
  sqlScript: string
  sqlMap?: Record<string, string>
  fetching: boolean
  type: 'single' | 'batch' | 'custom-batch'
  batchType?: string
}>({
  isOpen: false,
  items: [],
  sqlScript: '',
  sqlMap: {},
  fetching: false,
  type: 'single'
})

const fetchBatchItemSql = async (item: { type: string; name: string }) => {
  if (
    !migrationTerminal.value.isOpen ||
    (migrationTerminal.value.type !== 'batch' && migrationTerminal.value.type !== 'custom-batch')
  )
    return
  if (!activePair.value) return

  const key = `${item.type}-${item.name}`
  if (migrationTerminal.value.sqlMap && migrationTerminal.value.sqlMap[key]) return // Already fetched

  migrationTerminal.value.fetching = true
  try {
    const { source, target }: any = activePair.value
    const result = await Andb.generate(source, target, {
      type: item.type, // e.g., 'tables', 'procedures'
      name: item.name,
      sourceEnv: source.environment,
      targetEnv: target.environment,
      dryRun: true
    })
    if (!migrationTerminal.value.sqlMap) migrationTerminal.value.sqlMap = {}
    migrationTerminal.value.sqlMap[key] = result.sql || `-- Result: ${result.message}`
  } catch (e: any) {
    if (!migrationTerminal.value.sqlMap) migrationTerminal.value.sqlMap = {}
    migrationTerminal.value.sqlMap[key] =
      `-- Error generating SQL preview: ${e.message || 'Unknown'}`
  } finally {
    migrationTerminal.value.fetching = false
  }
}

const closeMigrationTerminal = () => {
  migrationTerminal.value.isOpen = false
  migrationTerminal.value.items = []
  migrationTerminal.value.sqlScript = ''
  migrationTerminal.value.sqlMap = {}
}

const executeConfirmedMigration = async (allowDestructive: boolean = false) => {
  if (!migrationTerminal.value.isOpen) return
  const items = [...migrationTerminal.value.items]
  const batchType = migrationTerminal.value.batchType
  const dialogType = migrationTerminal.value.type

  try {
    if (dialogType === 'single') {
      await migrateSingleItem(items[0], true, allowDestructive)
    } else if (dialogType === 'batch') {
      await migrateBatchInline(batchType!, true, allowDestructive)
    } else if (dialogType === 'custom-batch') {
      await migrateCustomItems(items, true, allowDestructive)
    }
  } finally {
    closeMigrationTerminal()
  }
}

const migrateSingleItem = async (item: any, skipConfirm: boolean = false, force: boolean = false) => {
  if (
    !activePair.value ||
    !item ||
    !item.name ||
    isMigratingItemId.value === item.name ||
    isMigrating.value ||
    isTargetDump.value
  )
    return

  // Prompt user for confirmation to prevent accidental clicks if not skipped
  if (!skipConfirm) {
    migrationTerminal.value = {
      isOpen: true,
      items: [item],
      sqlScript: '',
      fetching: true,
      type: 'single'
    }

    // fetch SQL
    try {
      const { source, target }: any = activePair.value
      const result = await Andb.generate(source, target, {
        type: item.type,
        name: item.name,
        sourceEnv: source.environment,
        targetEnv: target.environment,
        dryRun: true
      })
      migrationTerminal.value.sqlScript = result.sql || `-- Result: ${result.message}`
    } catch (e: any) {
      migrationTerminal.value.sqlScript = `-- Error generating SQL preview: ${e.message || 'Unknown'}`
    } finally {
      migrationTerminal.value.fetching = false
    }

    return
  }

  isMigratingItemId.value = item.name
  isMigrating.value = true

  try {
    const { source, target } = activePair.value

    let status: 'NEW' | 'UPDATED' | 'DEPRECATED' = 'NEW'
    if (item.status === 'modified' || item.status === 'different' || item.status === 'updated') {
      status = 'UPDATED'
    } else if (item.status === 'deprecated' || item.status === 'missing_in_source') {
      status = 'DEPRECATED'
    }

    const opId = operationsStore.addOperation({
      type: 'migrate',
      sourceEnv: source.environment,
      targetEnv: target.environment,
      status: 'pending',
      startTime: new Date()
    })

    try {
      if (appStore.safeMode) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      await Andb.migrate(source, target, {
        type: item.type as any,
        sourceEnv: source.environment,
        targetEnv: target.environment,
        name: item.name,
        status: status,
        dryRun: appStore.safeMode,
        force: force
      })

      if (!appStore.safeMode) {
        await applyAtomicVerify(item)
        try {
          await Andb.createSnapshot(target, item.type, item.name)
        } catch (snapshotErr: any) {
          console.warn(`[Compare] Failed to create snapshot for ${item.name}:`, snapshotErr)
        }
      }

      notificationStore.add({
        type: appStore.safeMode ? 'info' : 'success',
        title: appStore.safeMode ? t('compare.dryRunComplete') : 'Migration Successful',
        message: appStore.safeMode
          ? t('compare.dryRunDesc', { name: item.name })
          : `${item.name} (${item.type}) has been migrated and verified.`
      })

      sidebarStore.setComparisonResults(allResults.value)
      sidebarStore.triggerRefresh()

      operationsStore.completeOperation(opId, true)

      if (!appStore.safeMode) {
        try {
          const projectId = projectsStore.selectedProjectId
          if (projectId) {
            const gitConfRes = await window.electronAPI?.storage?.get(`git_config_${projectId}`)
            if (gitConfRes?.success && gitConfRes.data?.remoteUrl) {
              window.electronAPI?.andbExecute({
                sourceConnection: {} as any,
                targetConnection: {} as any,
                operation: 'git-sync' as any,
                options: {
                  config: gitConfRes.data,
                  env: target.environment,
                  db: target.database || target.name,
                  message: `chore(schema): auto-sync after migration of ${item.name}`
                }
              })
            }
          }
        } catch (gitErr) {
          console.warn('[Compare] Git auto-sync failed (optional):', gitErr)
        }
      }
    } catch (e: any) {
      operationsStore.completeOperation(opId, false, { error: e.message })
      throw e
    }
  } catch (e: any) {
    notificationStore.add({
      type: 'error',
      title: 'Migration Failed',
      message: e.message || 'An unknown error occurred during migration.'
    })
    if (window.electronAPI) {
      window.electronAPI.log.send('error', `Migration failed for ${item.name}`, e.message)
    }
  } finally {
    isMigrating.value = false
    isMigratingItemId.value = null
  }
}
const migrateBatchInline = async (type: string, skipConfirm: boolean = false, force: boolean = false) => {
  if (isTargetDump.value) {
    notificationStore.add({
      type: 'warning',
      title: t('compare.dumpReadOnly'),
      message: t('compare.cannotMigrateToDump')
    })
    return
  }

  if (!activePair.value || isMigratingBatch.value) return

  if (!skipConfirm) {
    const batchTypeLower = type.toLowerCase()
    const ddlTypes =
      batchTypeLower === 'schema'
        ? ['tables', 'views', 'procedures', 'functions', 'triggers']
        : [batchTypeLower]

    let pendingItems: any[] = []
    const resultsMap: Record<string, any> = {
      tables: tableResults.value,
      procedures: procedureResults.value,
      functions: functionResults.value,
      views: viewResults.value,
      triggers: triggerResults.value
    }
    for (const dtype of ddlTypes) {
      pendingItems.push(
        ...(resultsMap[dtype] || []).filter((i: any) => {
          const s = i.status?.toLowerCase()
          return (
            s === 'new' ||
            s === 'updated' ||
            s === 'different' ||
            s === 'modified' ||
            s === 'missing_in_target' ||
            s === 'deprecated' ||
            s === 'missing_in_source'
          )
        })
      )
    }

    if (pendingItems.length === 0) {
      notificationStore.add({
        type: 'info',
        title: 'Nothing to migrate',
        message: 'There are no pending changes in this category.'
      })
      return
    }

    if (pendingItems.length === 1) {
      // Smart Fallback: If only 1 item, treat as single item for better UX (shows SQL Preview)
      return migrateSingleItem(pendingItems[0], skipConfirm)
    }

    migrationTerminal.value = {
      isOpen: true,
      items: pendingItems,
      sqlScript:
        '-- Note: Interactive preview is not available for batch mode migrations.\n-- All selected items will be executed consecutively.',
      sqlMap: {},
      fetching: false,
      type: 'batch',
      batchType: type
    }
    return
  }

  isMigratingBatch.value = type
  isMigrating.value = true

  try {
    const { source, target } = activePair.value

    // Start recording operation
    const opId = operationsStore.addOperation({
      type: 'migrate',
      sourceEnv: source.environment,
      targetEnv: target.environment,
      status: 'pending',
      startTime: new Date()
    })

    try {
      const batchTypeLower = type.toLowerCase()

      const ddlTypes =
        batchTypeLower === 'schema'
          ? ['tables', 'views', 'procedures', 'functions', 'triggers']
          : [batchTypeLower]

      const statuses: ('NEW' | 'UPDATED' | 'DEPRECATED')[] = ['NEW', 'UPDATED', 'DEPRECATED']

      const resultsMap: Record<string, any> = {
        tables: tableResults,
        procedures: procedureResults,
        functions: functionResults,
        views: viewResults,
        triggers: triggerResults
      }

      for (const ddlType of ddlTypes) {
        // 1. Migrate all changes for this type
        for (const status of statuses) {
          const categoryItems = (resultsMap[ddlType]?.value || []).filter((i: any) => {
            const s = i.status?.toLowerCase()
            if (status === 'NEW') {
              return s === 'new' || s === 'missing_in_target'
            } else if (status === 'UPDATED') {
              return s === 'updated' || s === 'different' || s === 'modified'
            } else if (status === 'DEPRECATED') {
              return s === 'deprecated' || s === 'missing_in_source'
            }
            return false
          })

          if (categoryItems.length === 0) continue

          const objects = categoryItems.map((item: any) => ({
            type: item.type || ddlType,
            name: item.name,
            status: status
          }))

          if (appStore.safeMode) {
            // Run sequentially for visualization in safe mode
            for (const item of categoryItems) {
              isMigratingItemId.value = item.name
              try {
                await new Promise(resolve => setTimeout(resolve, 500))
                await Andb.migrate(source, target, {
                  type: (item.type || ddlType) as any,
                  sourceEnv: source.environment,
                  targetEnv: target.environment,
                  name: item.name,
                  status: status,
                  dryRun: true
                })
              } catch (err: any) {
                console.error(`Dry run failed for ${item.name}:`, err)
              }
            }
            isMigratingItemId.value = null
          } else {
            // Run in bulk for live migration
            await Andb.migrate(source, target, {
              type: ddlType as any,
              sourceEnv: source.environment,
              targetEnv: target.environment,
              status: status,
              objects,
              dryRun: appStore.safeMode,
              force: force
            })
          }
        }

        if (!appStore.safeMode) {
          // 2. Export Target (Atomic for Category)
          await Andb.export(source, target, {
            type: ddlType as any,
            environment: target.environment
          })

          // 3. Compare (Atomic for Category)
          const results = await Andb.compare(source, target, {
            type: ddlType as any,
            sourceEnv: source.environment,
            targetEnv: target.environment
          })

          // 4. Update UI State immediately
          if (Array.isArray(results) && resultsMap[ddlType]) {
            resultsMap[ddlType].value = results.map((r: any) => ({
              ...r,
              type: ddlType.endsWith('s') ? ddlType : ddlType + 's'
            }))

            if (selectedItem.value && selectedItem.value.type === ddlType) {
              const found = results.find((r: any) => r.name === selectedItem.value.name)
              if (found) {
                selectedItem.value = { ...found, type: ddlType }
              }
            }
          }
        }
      }

      notificationStore.add({
        type: appStore.safeMode ? 'info' : 'success',
        title: appStore.safeMode ? 'Batch Dry Run Complete' : 'Batch Migration Successful',
        message: appStore.safeMode
          ? 'Dry run execution successfully simulated.'
          : `${type === 'Schema' ? 'Entire schema' : 'All ' + type} has been migrated and verified.`
      })

      // Update Sidebar with new results
      sidebarStore.setComparisonResults(allResults.value)
      sidebarStore.triggerRefresh()

      // Complete operation record
      operationsStore.completeOperation(opId, true, {
        log: appStore.safeMode ? 'Dry run execution successfully simulated.' : undefined
      })

      // Hybrid Model: Auto-sync to Git if configured
      if (!appStore.safeMode) {
        try {
          const projectId = projectsStore.selectedProjectId
          if (projectId) {
            const gitConfRes = await window.electronAPI?.storage?.get(`git_config_${projectId}`)
            if (gitConfRes?.success && gitConfRes.data?.remoteUrl) {
              window.electronAPI?.andbExecute({
                sourceConnection: {} as any,
                targetConnection: {} as any,
                operation: 'git-sync' as any,
                options: {
                  config: gitConfRes.data,
                  env: target.environment,
                  db: target.database || target.name,
                  message: `chore(schema): auto-sync after migration of ${type}`
                }
              })
            }
          }
        } catch (gitErr) {
          console.warn('[Compare] Git auto-sync failed (optional):', gitErr)
        }
      }
    } catch (e: any) {
      operationsStore.completeOperation(opId, false, { error: e.message })
      throw e
    }
  } catch (e: any) {
    notificationStore.add({
      type: 'error',
      title: 'Migration Failed',
      message: e.message || 'An unknown error occurred during migration.'
    })
    if (window.electronAPI) {
      window.electronAPI.log.send('error', `Migration failed for ${type}`, e.message)
    }
  } finally {
    isMigratingBatch.value = null
    isMigrating.value = false
  }
}

const migrateCustomItems = async (items: any[], skipConfirm: boolean = false, force: boolean = false) => {
  if (isTargetDump.value) {
    notificationStore.add({
      type: 'warning',
      title: t('compare.dumpReadOnly'),
      message: t('compare.cannotMigrateToDump')
    })
    return
  }

  if (!activePair.value || isMigratingBatch.value || !items || items.length === 0) return

  if (!skipConfirm) {
    if (items.length === 1) {
      return migrateSingleItem(items[0], false)
    }
    
    migrationTerminal.value = {
      isOpen: true,
      items: items,
      sqlScript:
        '-- Note: Interactive preview is not available for custom selection migrations.\n-- All selected items will be executed consecutively.',
      sqlMap: {},
      fetching: false,
      type: 'custom-batch'
    }
    return
  }

  isMigratingBatch.value = 'Selection'
  isMigrating.value = true
  let successCount = 0
  let totalCount = items.length

  try {
    const { source, target } = activePair.value

    const opId = operationsStore.addOperation({
      type: 'migrate',
      sourceEnv: source.environment,
      targetEnv: target.environment,
      status: 'pending',
      startTime: new Date()
    })

    try {
      const typeSet = new Set<string>()
      const objects: any[] = []

      for (const item of items) {
        const s = item.status?.toLowerCase()

        let status: 'NEW' | 'UPDATED' | 'DEPRECATED' = 'NEW'
        if (s === 'modified' || s === 'different' || s === 'updated') {
          status = 'UPDATED'
        } else if (s === 'deprecated' || s === 'missing_in_source') {
          status = 'DEPRECATED'
        }

        objects.push({
          type: item.type,
          name: item.name,
          status
        })
      }

      if (objects.length > 0) {
        try {
          if (appStore.safeMode) {
            // Run sequentially for visualization in safe mode
            for (const obj of objects) {
              isMigratingItemId.value = obj.name
              try {
                await new Promise(resolve => setTimeout(resolve, 500))
                await Andb.migrate(source, target, {
                  type: obj.type as any,
                  sourceEnv: source.environment,
                  targetEnv: target.environment,
                  name: obj.name,
                  status: obj.status,
                  dryRun: true
                })
                successCount++
                typeSet.add(obj.type)
              } catch (err: any) {
                console.error(`Dry run failed for ${obj.name}:`, err)
                notificationStore.add({
                  type: 'error',
                  title: `Migration Failed: ${obj.name}`,
                  message: err.message || 'An error occurred.'
                })
              }
            }
            isMigratingItemId.value = null
          } else {
            // Run in bulk for live migration
            const result = await Andb.migrate(source, target, {
              type: 'schema' as any,
              sourceEnv: source.environment,
              targetEnv: target.environment,
              objects,
              dryRun: appStore.safeMode,
              force: force
            })

            if (result.successful && Array.isArray(result.successful)) {
              for (const succObj of result.successful) {
                successCount++
                typeSet.add(succObj.type)

                try {
                  await Andb.createSnapshot(target, succObj.type, succObj.name)
                } catch (snapshotErr) {
                  console.warn(`[Compare] Failed to create snapshot for ${succObj.name}:`, snapshotErr)
                }
              }
            }

            if (result.failed && Array.isArray(result.failed)) {
              for (const failObj of result.failed) {
                console.error(`Failed to migrate ${failObj.name}:`, failObj.error)
                notificationStore.add({
                  type: 'error',
                  title: `Migration Failed: ${failObj.name}`,
                  message: failObj.error || 'An error occurred during migration.'
                })
              }
            }
          }
        } catch (err: any) {
          console.error('Batch selection migration failed:', err)
          notificationStore.add({
            type: 'error',
            title: 'Batch Migration Failed',
            message: err.message || 'An error occurred.'
          })
        }
      }

      if (!appStore.safeMode) {
        for (const ddlType of Array.from(typeSet)) {
          const resultsMap: Record<string, any> = {
            tables: tableResults,
            procedures: procedureResults,
            functions: functionResults,
            views: viewResults,
            triggers: triggerResults
          }

          await Andb.export(source, target, {
            type: ddlType as any,
            environment: target.environment
          })

          const results = await Andb.compare(source, target, {
            type: ddlType as any,
            sourceEnv: source.environment,
            targetEnv: target.environment
          })

          const key = ddlType.toLowerCase()
          if (Array.isArray(results) && resultsMap[key]) {
            resultsMap[key].value = results.map((r: any) => ({
              ...r,
              type: ddlType.endsWith('s') ? ddlType : ddlType + 's'
            }))
          }
        }
      }

      operationsStore.completeOperation(opId, true, {
        log: appStore.safeMode
          ? 'Dry run execution successfully simulated.'
          : `Successfully migrated ${successCount} out of ${totalCount} items.`
      })

      notificationStore.add({
        type: appStore.safeMode ? 'info' : 'success',
        title: appStore.safeMode ? 'Batch Dry Run Complete' : 'Batch Migration Complete',
        message: appStore.safeMode 
           ? 'Dry run execution successfully simulated.' 
           : `Successfully migrated and verified ${successCount} items.`
      })

      sidebarStore.setComparisonResults(allResults.value)
      sidebarStore.triggerRefresh()
    } catch (innerErr: any) {
      operationsStore.completeOperation(opId, false, { error: innerErr.message })
      throw innerErr
    }
  } catch (e: any) {
    notificationStore.add({
      type: 'error',
      title: 'Migration Interrupted',
      message: e.message || 'An unexpected error occurred during batch migration.'
    })
  } finally {
    isMigratingBatch.value = null
    isMigrating.value = false
  }
}

/**
 * Perform atomic export and comparison for a single item
 * and update the local state without re-running full comparison
 */
const applyAtomicVerify = async (item: any) => {
  if (!activePair.value) return

  try {
    const { source, target } = activePair.value

    // 1. Export atomic (Target only, since source hasn't changed)
    await Andb.export(source, target, {
      type: item.type as any,
      environment: target.environment,
      name: item.name
    })

    // 2. Compare atomic
    const results = await Andb.compare(source, target, {
      type: item.type as any,
      sourceEnv: source.environment,
      targetEnv: target.environment,
      name: item.name
    })

    if (Array.isArray(results)) {
      let updatedItem = results.find((r: any) => r.name === item.name)

      // If theCLI comparison output excludes items with no differences,
      // it means the item is now fully identical! We must synthesize the status update.
      if (!updatedItem) {
        updatedItem = { ...item, status: 'EQUAL', diff: { source: '', target: '' } }
      }

      // 3. Patch the specific result list
      const resultsMap: Record<string, any> = {
        tables: tableResults,
        procedures: procedureResults,
        functions: functionResults,
        views: viewResults,
        triggers: triggerResults
      }

      const listRef = resultsMap[item.type.toLowerCase()]
      if (listRef) {
        const index = listRef.value.findIndex((i: any) => i.name === item.name)
        if (index !== -1) {
          // Update the item in the list using splice for guaranteed reactivity
          const updatedObject = { ...listRef.value[index], ...updatedItem, type: item.type }
          listRef.value.splice(index, 1, updatedObject)

          // Update selected item if focused to refresh diff view
          if (selectedItem.value?.name === item.name) {
            selectedItem.value = { ...updatedObject }
          }
        }
      }
    }
  } catch (e: any) {
    if (window.electronAPI) {
      window.electronAPI.log.send(
        'warn',
        `Atomic verify failed for ${item.name}, falling back to full comparison`,
        e.message
      )
    }
    // Fallback to full comparison if atomic fails
    await runComparison()
  }
}

const handleDatabaseRefreshRequested = (e: any) => {
  const { env } = e.detail
  if (
    activePair.value &&
    (activePair.value.sourceEnv === env || activePair.value.targetEnv === env)
  ) {
    runComparison()
  }
}

const handleCategoryRefreshRequested = (e: any) => {
  const { type, env } = e.detail
  if (
    activePair.value &&
    (activePair.value.sourceEnv === env || activePair.value.targetEnv === env)
  ) {
    selectedFilterType.value = type
    runComparison()
  }
}

const handleObjectRefreshRequested = (e: any) => {
  const { name, type, env } = e.detail
  if (
    activePair.value &&
    (activePair.value.sourceEnv === env || activePair.value.targetEnv === env)
  ) {
    // Select it first so runComparison(true) knows what to refresh atomically
    const normalizedType = type.endsWith('s') ? type : type + 's'
    const item = allResults.value.find(i => i.name === name && i.type === normalizedType)
    if (item) {
      selectedItem.value = item
    } else {
      // If not in local results, at least set the search/filter so it might appear
      selectedFilterType.value = normalizedType
    }
    runComparison()
  }
}

const handlePairFetchCompareRequested = (e: any) => {
  if (activePair.value && activePair.value.id === e.detail.pairId) {
    runFetchAndCompare()
  }
}

// Lifecycle
onMounted(async () => {
  window.addEventListener('category-selected', handleCategorySelected as any)
  window.addEventListener('object-selected', handleObjectSelected as any)
  window.addEventListener('database-refresh-requested', handleDatabaseRefreshRequested as any)
  window.addEventListener('category-refresh-requested', handleCategoryRefreshRequested as any)
  window.addEventListener('object-refresh-requested', handleObjectRefreshRequested as any)
  window.addEventListener('pair-fetch-compare-requested', handlePairFetchCompareRequested as any)

  // Trigger local comparison on init (fetch from DB is manual)
  if (activePair.value) {
    runComparison()
  }

  // Shortcuts
  window.addEventListener('andb-close-active-tab', handleCloseActiveTab)
  window.addEventListener('andb-prev-tab', handlePrevTab)
  window.addEventListener('andb-next-tab', handleNextTab)
  window.addEventListener('andb-refresh-active-view', handleRefreshActiveView)
  window.addEventListener('andb-focus-search', handleFocusSearch)

  window.addEventListener('click', closeItemContextMenu)
})

const handlePrevTab = () => {
  if (tabs.value.length <= 1) return
  const index = tabs.value.findIndex(t => t.id === activeTabId.value)
  const prevIndex = (index - 1 + tabs.value.length) % tabs.value.length
  handleSelectTab(tabs.value[prevIndex].id)
}

const handleNextTab = () => {
  if (tabs.value.length <= 1) return
  const index = tabs.value.findIndex(t => t.id === activeTabId.value)
  const nextIndex = (index + 1) % tabs.value.length
  handleSelectTab(tabs.value[nextIndex].id)
}

const handleCloseActiveTab = () => {
  if (activeTabId.value) handleCloseTab(activeTabId.value)
}
const handleRefreshActiveView = () => runComparison()
const handleFocusSearch = () => searchInput.value?.focus()

onUnmounted(() => {
  window.removeEventListener('category-selected', handleCategorySelected as any)
  window.removeEventListener('object-selected', handleObjectSelected as any)
  window.removeEventListener('database-refresh-requested', handleDatabaseRefreshRequested as any)
  window.removeEventListener('category-refresh-requested', handleCategoryRefreshRequested as any)
  window.removeEventListener('object-refresh-requested', handleObjectRefreshRequested as any)
  window.removeEventListener('pair-fetch-compare-requested', handlePairFetchCompareRequested as any)

  window.removeEventListener('andb-close-active-tab', handleCloseActiveTab)
  window.removeEventListener('andb-prev-tab', handlePrevTab)
  window.removeEventListener('andb-next-tab', handleNextTab)
  window.removeEventListener('andb-refresh-active-view', handleRefreshActiveView)
  window.removeEventListener('andb-focus-search', handleFocusSearch)

  window.removeEventListener('click', closeItemContextMenu)
})

// Auto-run comparison when sidebar refresh is clicked (Top refresh button)
watch(
  () => sidebarStore.refreshRequestKey,
  () => {
    if (route.path === '/compare' && activePair.value) {
      consoleStore.addLog('Sidebar refresh requested: Re-running local comparison...', 'info')
      runComparison()
    }
  }
)

// Auto-load or Auto-compare on pair change
watch(
  () => connectionPairsStore.selectedPairId,
  newId => {
    if (newId) {
      // Reset state first
      tableResults.value = []
      procedureResults.value = []
      functionResults.value = []
      viewResults.value = []
      triggerResults.value = []
      selectedItem.value = null // Resets detail view

      // Trigger local comparison on pair change
      runComparison()
    }
  }
)
</script>
