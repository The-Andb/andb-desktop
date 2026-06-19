<template>
  <div class="flex-1 flex flex-col bg-white dark:bg-gray-950 overflow-hidden relative">
    <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 shrink-0">
      <div class="flex items-center gap-2">
        <Search class="w-5 h-5 text-primary-500" />
        <h2 class="font-bold text-gray-900 dark:text-white uppercase tracking-widest text-sm">Advanced Search</h2>
      </div>
    </div>

    <!-- Search Input -->
    <div class="p-4 border-b border-gray-100 dark:border-gray-800 shrink-0 bg-white dark:bg-gray-950">
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search class="w-5 h-5 text-gray-400" />
        </div>
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          type="text"
          placeholder="Search in all DDLs (Ctrl+F to focus)..."
          class="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-xl leading-5 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-mono transition-all duration-200 shadow-sm"
          @keydown.esc="searchQuery = ''"
        />
        <div class="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
          <label class="flex items-center gap-1.5 cursor-pointer text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <input type="checkbox" v-model="matchCase" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
            Match Case
          </label>
          <button v-if="searchQuery" @click="searchQuery = ''" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div class="mt-3 flex items-center justify-between text-xs text-gray-500">
        <div>
          <span v-if="searchQuery && isSearching">Searching...</span>
          <span v-else-if="searchQuery">Found {{ searchResults.length }} objects matching query</span>
          <span v-else>Type to search in {{ allResults.length }} database objects</span>
        </div>
      </div>
    </div>

    <!-- Search Results -->
    <div class="flex-1 overflow-y-auto custom-scrollbar p-4 bg-gray-50/50 dark:bg-gray-950/50">
      <div v-if="searchQuery && !isSearching && searchResults.length === 0" class="flex flex-col items-center justify-center py-12 text-gray-400">
        <SearchX class="w-12 h-12 mb-4 opacity-20" />
        <p class="text-sm">No matches found for "<span class="font-bold text-gray-900 dark:text-gray-200">{{ searchQuery }}</span>"</p>
      </div>
      
      <div v-else-if="searchQuery && searchResults.length > 0" class="space-y-4">
        <div v-for="result in paginatedResults" :key="result.item.type + '-' + result.item.name" class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group/result">
          <!-- Result Header -->
          <div 
            class="px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
            @click="$emit('open-item', result.item)"
          >
            <div class="flex items-center gap-2">
              <component :is="getIconForType(result.item.type)" class="w-4 h-4 text-primary-500" />
              <span class="text-xs font-bold text-gray-500 uppercase tracking-widest">{{ result.item.type }}</span>
              <ChevronRight class="w-3 h-3 text-gray-300 dark:text-gray-600" />
              <span class="font-mono font-bold text-sm text-gray-900 dark:text-white">{{ result.item.name }}</span>
            </div>
            
            <button class="text-xs text-primary-600 dark:text-primary-400 font-bold opacity-0 group-hover/result:opacity-100 transition-opacity flex items-center gap-1">
              Open File <ExternalLink class="w-3 h-3" />
            </button>
          </div>
          
          <!-- Code Snippets -->
          <div class="p-3 bg-gray-50/30 dark:bg-gray-950/30 font-mono text-xs overflow-x-auto space-y-2">
            <template v-for="(match, idx) in result.matches.slice(0, 5)" :key="idx">
              <div class="flex gap-3">
                <div class="w-12 text-right shrink-0 text-gray-400 dark:text-gray-600 select-none border-r border-gray-200 dark:border-gray-800 pr-2">
                  <span class="text-[9px] uppercase font-bold tracking-tighter opacity-50 block leading-tight">{{ match.source }}</span>
                  {{ match.lineNum }}
                </div>
                <div class="text-gray-800 dark:text-gray-300 whitespace-pre" v-html="highlightSnippet(match.lineText)"></div>
              </div>
            </template>
            <div v-if="result.matches.length > 5" class="text-center text-gray-400 text-[10px] uppercase font-bold py-1 bg-gray-100/50 dark:bg-gray-800/50 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" @click="$emit('open-item', result.item)">
              + {{ result.matches.length - 5 }} more matches
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="searchResults.length > pageSize" class="flex justify-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
          <button v-if="currentPage * pageSize < searchResults.length" @click="currentPage++" class="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
            Load More ({{ searchResults.length - currentPage * pageSize }} remaining)
          </button>
        </div>
      </div>
      
      <div v-else class="flex flex-col items-center justify-center py-20 text-gray-400 opacity-50">
        <Search class="w-16 h-16 mb-4" />
        <p class="text-sm uppercase tracking-widest font-bold">Search Across All DDLs</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Search, X, SearchX, ChevronRight, ExternalLink, Table, Layers, Workflow, Sigma, Zap, Database } from 'lucide-vue-next'

function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

const props = defineProps<{
  allResults: any[]
}>()

const emit = defineEmits(['open-item'])

const searchQuery = ref('')
const matchCase = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)
const isSearching = ref(false)
const searchResults = ref<any[]>([])

const currentPage = ref(1)
const pageSize = 20

const getIconForType = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'tables': case 'table': return Table
    case 'views': case 'view': return Layers
    case 'procedures': case 'procedure': return Workflow
    case 'functions': case 'function': return Sigma
    case 'triggers': case 'trigger': return Zap
    default: return Database
  }
}

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const highlightSnippet = (text: string) => {
  if (!searchQuery.value) return text
  const term = escapeRegExp(searchQuery.value)
  const flags = matchCase.value ? 'g' : 'gi'
  const regex = new RegExp(`(${term})`, flags)
  // sanitize html
  const sanitized = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return sanitized.replace(regex, '<mark class="bg-yellow-300 dark:bg-yellow-800 text-black dark:text-white rounded px-0.5 font-bold shadow-sm">$1</mark>')
}

const performSearch = () => {
  isSearching.value = true
  currentPage.value = 1
  
  const query = searchQuery.value
  if (!query || query.trim() === '') {
    searchResults.value = []
    isSearching.value = false
    return
  }

  const term = matchCase.value ? query : query.toLowerCase()

  // Use setTimeout to not block UI thread completely for huge schemas
  setTimeout(() => {
    const results: any[] = []
    
    for (const item of props.allResults) {
      const matches: any[] = []
      
      const searchInText = (text: string, sourceName: string) => {
        if (!text) return
        const lines = text.split('\n')
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          const searchLine = matchCase.value ? line : line.toLowerCase()
          if (searchLine.includes(term)) {
            matches.push({
              source: sourceName,
              lineNum: i + 1,
              lineText: line.trim()
            })
          }
        }
      }

      if (item.diff?.source) searchInText(item.diff.source, 'SRC')
      if (item.diff?.target) searchInText(item.diff.target, 'TGT')
      
      // Remove duplicates if source and target are identical and both matched same line
      const uniqueMatches = Array.from(new Map(matches.map(m => [`${m.lineNum}-${m.lineText}`, m])).values())

      if (uniqueMatches.length > 0) {
        results.push({
          item,
          matches: uniqueMatches
        })
      }
    }
    
    // Sort results by number of matches
    results.sort((a, b) => b.matches.length - a.matches.length)
    
    searchResults.value = results
    isSearching.value = false
  }, 10)
}

const debouncedSearch = debounce(performSearch, 300)

watch([searchQuery, matchCase], () => {
  isSearching.value = true
  debouncedSearch()
})

const paginatedResults = computed(() => {
  return searchResults.value.slice(0, currentPage.value * pageSize)
})

const handleGlobalKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault()
    searchInputRef.value?.focus()
    searchInputRef.value?.select()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)
  nextTick(() => {
    searchInputRef.value?.focus()
  })
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
})
</script>
