<template>
  <div class="flex-1 flex flex-col h-full bg-white dark:bg-gray-950 overflow-hidden font-sans">
    <!-- Panel Header: Glassmorphic Search Bar -->
    <div class="px-6 py-4 bg-gradient-to-b from-gray-50/80 to-white dark:from-gray-900/80 dark:to-gray-950 border-b border-gray-100 dark:border-gray-800/80 backdrop-blur-md shrink-0 flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
            <SearchCode class="w-4 h-4" />
          </div>
          <div>
            <h2 class="text-sm font-black uppercase tracking-wider text-gray-850 dark:text-gray-100">Definition Search</h2>
            <p class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Global code definition search</p>
          </div>
        </div>
        
        <!-- Connection Info Badge -->
        <div v-if="connection" class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-150/60 dark:bg-gray-800/60 text-gray-500 dark:text-gray-450 border border-gray-200/20">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="text-[10px] font-mono font-bold tracking-tight uppercase">{{ connection.name }} ({{ connection.database }})</span>
        </div>
      </div>

      <!-- Search Input Wrapper -->
      <div class="flex items-center gap-2">
        <div class="relative flex-1 group">
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 group-focus-within:text-emerald-500 transition-colors" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search variables, column names, or keywords in procedure, trigger, function, or view code..."
            class="w-full pl-10 pr-4 py-2 text-xs bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-1 focus:ring-emerald-500 outline-none text-gray-700 dark:text-gray-200 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 font-medium"
            @keydown.enter="triggerSearch"
          />
        </div>
        <button
          @click="triggerSearch"
          :disabled="isSearching || !searchQuery.trim()"
          class="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-800 dark:disabled:to-gray-900 disabled:text-gray-505 shadow-md shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98] transition-all duration-300 flex items-center gap-2"
        >
          <Loader2 v-if="isSearching" class="w-3.5 h-3.5 animate-spin" />
          <span v-else>Search</span>
        </button>
      </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 overflow-y-auto custom-scrollbar p-6 bg-gray-50/20 dark:bg-gray-950/20">
      <!-- Loading State -->
      <div v-if="isSearching" class="h-full flex flex-col items-center justify-center py-20 text-center select-none">
        <Loader2 class="w-8 h-8 text-emerald-500 animate-spin mb-4" />
        <h3 class="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">Scanning Database Definitions</h3>
        <p class="text-[9px] font-bold text-gray-450 dark:text-gray-500 uppercase tracking-widest mt-1">Deep inspection of routines, triggers, and views...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="results.length === 0" class="h-full flex flex-col items-center justify-center py-20 text-center select-none text-gray-400 dark:text-gray-500">
        <ScanSearch class="w-14 h-14 opacity-20 mb-3" />
        <h3 class="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">
          {{ hasSearched ? 'No Results Found' : 'Global Code Search' }}
        </h3>
        <p class="text-[9px] font-bold text-gray-450 dark:text-gray-500 uppercase tracking-widest mt-1 max-w-[280px] leading-normal">
          {{ hasSearched ? 'Try searching for another keyword or adjust the spelling' : 'Enter a keyword to inspect stored procedures, triggers, functions, and views' }}
        </p>
      </div>

      <!-- Results Grid -->
      <div v-else class="space-y-3">
        <div class="flex items-center justify-between px-2">
          <span class="text-[10px] font-black uppercase tracking-widest text-emerald-500">{{ results.length }} Matches Found</span>
          <span class="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Double-click to view DDL</span>
        </div>

        <div class="border border-gray-100 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900/50 shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-gray-850">
          <div
            v-for="item in results"
            :key="`${item.object_type}-${item.object_name}`"
            class="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 cursor-pointer group transition-all duration-200"
            @dblclick="handleDoubleClick(item)"
          >
            <div class="flex items-center gap-3 min-w-0">
              <!-- Type Badge -->
              <div
                class="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0"
                :class="getTypeClass(item.object_type)"
              >
                <span>{{ getTypeIcon(item.object_type) }}</span>
                <span>{{ item.object_type }}</span>
              </div>

              <!-- Name -->
              <span class="text-xs font-mono font-bold text-gray-700 dark:text-gray-250 truncate group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                {{ item.object_name }}
              </span>
            </div>

            <!-- Action Visual Indicator -->
            <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span class="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Double Click</span>
              <ChevronRight class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, watch, onMounted, onUnmounted } from 'vue'
import { Search, SearchCode, Loader2, ScanSearch, ChevronRight } from 'lucide-vue-next'
import { Andb } from '@/utils/andb'
import { useNotificationStore } from '@/stores/notification'

const props = defineProps<{
  connection: any
  initialQuery?: string
}>()

const emit = defineEmits<{
  'open-editor': [data: { sql: string; title: string }]
}>()

const notificationStore = useNotificationStore()

const searchQuery = ref('')
const results = shallowRef<any[]>([])
const isSearching = ref(false)
const hasSearched = ref(false)

let debounceTimeout: any = null

onMounted(() => {
  if (props.initialQuery) {
    searchQuery.value = props.initialQuery
    executeSearch()
  }
  window.addEventListener('update-definition-search-query', handleUpdateQuery as any)
})

onUnmounted(() => {
  window.removeEventListener('update-definition-search-query', handleUpdateQuery as any)
})

const handleUpdateQuery = (e: CustomEvent) => {
  const query = e.detail?.query || ''
  searchQuery.value = query
  executeSearch()
}

// 500ms Debounce search trigger
watch(searchQuery, (newVal) => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  if (!newVal.trim()) {
    results.value = []
    hasSearched.value = false
    return
  }
  debounceTimeout = setTimeout(() => {
    executeSearch()
  }, 500)
})

const triggerSearch = () => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  executeSearch()
}

const executeSearch = async () => {
  const query = searchQuery.value.trim()
  if (!query || !props.connection) return

  isSearching.value = true
  hasSearched.value = true

  try {
    const data = await Andb.deepSearch(props.connection, query)
    results.value = data
  } catch (err: any) {
    console.error('Definition Search Error:', err)
    notificationStore.add({
      type: 'error',
      title: 'Definition Search Failed',
      message: err.message || 'An error occurred during global code search.'
    })
  } finally {
    isSearching.value = false
  }
}

// Icon mapper for types
const getTypeIcon = (type: string) => {
  const t = type.toUpperCase()
  if (t === 'PROCEDURE') return '⚙️'
  if (t === 'FUNCTION') return '𝑓'
  if (t === 'TRIGGER') return '⚡'
  if (t === 'VIEW') return '👁️'
  return '📦'
}

// Styling classes for badges
const getTypeClass = (type: string) => {
  const t = type.toUpperCase()
  if (t === 'PROCEDURE') return 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
  if (t === 'FUNCTION') return 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
  if (t === 'TRIGGER') return 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
  if (t === 'VIEW') return 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
  return 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
}

const handleDoubleClick = async (item: any) => {
  if (!props.connection) return
  isSearching.value = true
  try {
    let showCreateSql = ''
    let typeLabel = ''
    const typeUpper = item.object_type.toUpperCase()
    if (typeUpper === 'PROCEDURE') {
      showCreateSql = `SHOW CREATE PROCEDURE \`${item.object_name}\``
      typeLabel = 'Create Procedure'
    } else if (typeUpper === 'FUNCTION') {
      showCreateSql = `SHOW CREATE FUNCTION \`${item.object_name}\``
      typeLabel = 'Create Function'
    } else if (typeUpper === 'TRIGGER') {
      showCreateSql = `SHOW CREATE TRIGGER \`${item.object_name}\``
      typeLabel = 'SQL Original Statement'
    } else if (typeUpper === 'VIEW') {
      showCreateSql = `SHOW CREATE VIEW \`${item.object_name}\``
      typeLabel = 'Create View'
    } else {
      throw new Error(`Unsupported object type: ${item.object_type}`)
    }

    const rows = await Andb.executeQuery(props.connection, showCreateSql)
    if (rows && rows.length > 0) {
      const row = rows[0]
      const keys = Object.keys(row)
      const targetKey = keys.find(k => k.toLowerCase() === typeLabel.toLowerCase()) || keys[2] || keys[1]
      const ddl = row[targetKey] || ''

      if (ddl) {
        emit('open-editor', {
          sql: ddl,
          title: `${item.object_name}`
        })
      } else {
        throw new Error('DDL definition not found in SHOW CREATE output')
      }
    } else {
      throw new Error('No details returned from database')
    }
  } catch (err: any) {
    console.error('Failed to get object DDL:', err)
    notificationStore.add({
      type: 'error',
      title: 'Failed to retrieve DDL',
      message: err.message || 'An error occurred while fetching object creation script.'
    })
  } finally {
    isSearching.value = false
  }
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(16, 185, 129, 0.15);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(16, 185, 129, 0.35);
}
</style>
