<template>
  <div class="flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden select-none">
    <!-- Tree Content -->
    <div class="flex-1 overflow-auto custom-scrollbar p-2">
      <div v-if="results.length === 0" class="text-center text-gray-400 py-10 italic text-xs">
        No schema objects found
      </div>

      <div v-else class="space-y-1">
        <!-- Pinned: Interactive ERD (Hide during search) -->
        <div
          v-if="!results.some(r => r.matches?.length > 0) && results.some(r => r.type === 'diagrams')"
          @click="emit('select', { name: 'Interactive ERD', type: 'diagrams' })"
          class="group flex items-center py-1.5 px-2 cursor-pointer rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors mb-1"
          :class="{ 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400': selectedItemName === 'Interactive ERD' }"
        >
          <Network class="w-3.5 h-3.5 mr-2 text-primary-500 shrink-0" />
          <span class="truncate font-bold text-[10px] uppercase tracking-widest text-primary-600 dark:text-primary-400">Interactive ERD</span>
        </div>
        <div v-if="!results.some(r => r.matches?.length > 0) && results.some(r => r.type === 'diagrams')" class="h-px bg-gray-100 dark:bg-gray-800 mb-1" />
        <div v-for="category in categories" :key="category.type" class="space-y-0.5">
          <!-- Category Header -->
          <div 
            @click="toggleCategory(category.type)"
            v-show="category.items.length > 0"
            class="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2 py-1.5 transition-colors sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm"
          >
            <ChevronRight 
              class="w-3.5 h-3.5 mr-1.5 transition-transform text-gray-400"
              :class="{ 'rotate-90': !collapsedCategories.has(category.type) }"
            />
            <component :is="getCategoryIcon(category.type)" class="w-3.5 h-3.5 mr-2" :class="getCategoryColor(category.type)" />
            <span class="font-bold text-[10px] uppercase tracking-widest text-gray-600 dark:text-gray-300">{{ category.type }}</span>
            <span class="ml-auto px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 text-[9px] rounded-full font-mono">{{ category.items.length }}</span>
          </div>

          <!-- Items -->
          <div v-show="!collapsedCategories.has(category.type)" class="pl-4 border-l border-gray-100 dark:border-gray-800 ml-3.5 mt-0.5 space-y-0.5">
            <div v-for="item in category.items" :key="item.name" 
              @click="emit('select', item)"
              class="group relative flex items-center py-1.5 px-2 cursor-pointer rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
              :class="{ 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400': selectedItemName === item.name }"
            >
              <component :is="getCategoryIcon(category.type)" class="w-3.5 h-3.5 mr-2.5 opacity-50 shrink-0" />
              <div class="flex-1 min-w-0 flex flex-col">
                <div class="flex items-center justify-between w-full">
                  <span class="truncate font-mono" :class="selectedItemName === item.name ? 'font-bold' : ''" :style="{ fontSize: appStore.fontSizes.ddlName + 'px' }">{{ item.name }}</span>
                  <span v-if="item.matches?.length > 0" class="ml-2 px-1 py-0.5 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-[8px] font-black rounded-sm border border-primary-200 dark:border-primary-800">
                    {{ item.matches.length }}
                  </span>
                  <span v-else-if="item.updated_at" class="text-[9px] text-gray-400 shrink-0 ml-auto opacity-40 group-hover:opacity-100 transition-opacity">
                    {{ formatTimeAgo(item.updated_at).replace(' ago', '') }}
                  </span>
                </div>
                
                <!-- Search Snippets -->
                <div v-if="item.matches?.length > 0" class="mt-1.5 space-y-1.5 ml-1 border-l-2 border-gray-100 dark:border-gray-800 pl-2 pb-0.5">
                  <div v-for="(match, mIdx) in item.matches.slice(0, 3)" :key="mIdx" 
                    @click.stop="handleSnippetClick($event, item, match.line)"
                    class="text-[10px] leading-tight hover:bg-primary-500/5 dark:hover:bg-primary-400/5 rounded p-0.5 transition-colors group/snippet"
                    :class="[
                      { '!bg-primary-500/20 dark:!bg-primary-400/30 !text-primary-700 dark:!text-primary-300 ring-1 ring-primary-500/30': selectedItemName === item.name && activeSearchLine === match.line },
                      { 'is-navigating': isNavigating }
                    ]"
                  >
                    <div class="flex items-start gap-1.5 text-gray-400 font-mono">
                      <span class="shrink-0 opacity-50 group-hover/snippet:opacity-100 transition-opacity">{{ match.line }}:</span>
                      <span class="text-gray-600 dark:text-gray-400 break-all line-clamp-2 italic" v-html="highlightText(match.content)"></span>
                    </div>
                  </div>
                  <div v-if="item.matches.length > 3" class="text-[9px] text-gray-400 font-bold uppercase tracking-widest pl-1">
                    + {{ item.matches.length - 3 }} more matches
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { 
  ChevronRight, 
  Database,
  Grid3X3,
  Eye,
  Cpu,
  CalendarClock,
  Zap,
  Sigma,
  Network
} from 'lucide-vue-next'

import { getNavigatableWord, highlightLinks } from '@/utils/navigation'

import { useAppStore } from '@/stores/app'
const appStore = useAppStore()

const props = defineProps<{
  results: any[]
  selectedItemName?: string
  searchTerm?: string
  focusType?: string
  expandCmd?: { action: 'expand' | 'collapse', ts: number } | null
  activeSearchLine?: number | null
  navigatableNames?: string[]
}>()

const emit = defineEmits<{
  (e: 'select', item: any): void
  (e: 'navigateTo', payload: { item: any, line: number }): void
  (e: 'navigate-to-definition', name: string): void
}>()

const collapsedCategories = ref(new Set<string>())

// Toggle category when sidebar triggers focusType
watch(() => props.focusType, (type) => {
  if (type && type !== 'all') {
    if (collapsedCategories.value.has(type)) {
      collapsedCategories.value.delete(type) // was collapsed → expand
    } else {
      collapsedCategories.value.add(type)    // was expanded → collapse
    }
    // Force reactivity
    collapsedCategories.value = new Set(collapsedCategories.value)
  }
})

// Auto-expand all when search results contain matches
watch(() => props.results, (newResults) => {
  const hasMatches = newResults.some(r => r.matches?.length > 0)
  if (hasMatches) {
    collapsedCategories.value = new Set()
  }
}, { immediate: true })

// Expand-all / Collapse-all from header buttons
watch(() => props.expandCmd, (cmd) => {
  if (!cmd) return
  const allTypes = ['tables', 'views', 'procedures', 'functions', 'triggers', 'events']
  if (cmd.action === 'expand') {
    collapsedCategories.value = new Set()
  } else {
    collapsedCategories.value = new Set(allTypes)
  }
})

const isNavigating = ref(false)

const handleGlobalKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Meta' || e.key === 'Control') isNavigating.value = true
}
const handleGlobalKeyup = (e: KeyboardEvent) => {
  if (e.key === 'Meta' || e.key === 'Control') isNavigating.value = false
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('keyup', handleGlobalKeyup)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('keyup', handleGlobalKeyup)
})

const categories = computed(() => {
  const cats = ['tables', 'views', 'procedures', 'functions', 'triggers', 'events']
  return cats.map(type => {
    const items = props.results.filter(r => r.type === type)
    return {
      type,
      items
    }
  }).filter(c => c.items.length > 0)
})

const toggleCategory = (type: string) => {
  if (collapsedCategories.value.has(type)) {
    collapsedCategories.value.delete(type)
  } else {
    collapsedCategories.value.add(type)
  }
}

const highlightText = (text: string) => {
  let processed = text
  
  // 1. Highlight Search Term
  if (props.searchTerm && props.searchTerm.trim()) {
    try {
      const escaped = props.searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const re = new RegExp(`(${escaped})`, 'gi')
      processed = processed.replace(re, '<span class="bg-primary-500/30 text-primary-900 dark:text-primary-100 rounded-sm px-0.5">$1</span>')
    } catch (e) {}
  }

  // 2. Highlight Navigatable Identifiers
  return highlightLinks(processed, props.navigatableNames || [])
}

const handleSnippetClick = (event: MouseEvent, item: any, line: number) => {
  const word = getNavigatableWord(event, props.navigatableNames || [])
  if (word) {
    emit('navigate-to-definition', word)
  } else {
    emit('navigateTo', { item, line })
  }
}

// Helpers
const getCategoryIcon = (type: string) => {
  switch(type) {
    case 'tables': return Grid3X3
    case 'views': return Eye
    case 'procedures': return Cpu
    case 'functions': return Sigma
    case 'triggers': return Zap
    case 'events': return CalendarClock
    case 'diagrams': return Network
    default: return Database
  }
}

const getCategoryColor = (type: string) => {
   switch(type) {
    case 'tables': return 'text-blue-500'
    case 'views': return 'text-indigo-500'
    case 'procedures': case 'functions': return 'text-purple-500'
    case 'triggers': return 'text-amber-500'
    default: return 'text-gray-500'
  }
}

// Utility for time ago formatting
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
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.3); border-radius: 2px; }
.is-navigating :deep(.nav-link) {
  cursor: pointer;
}
.is-navigating :deep(.nav-link:hover) {
  text-decoration: underline;
  text-decoration-color: var(--primary-500);
  text-underline-offset: 4px;
}
</style>
