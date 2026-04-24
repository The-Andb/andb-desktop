<template>
  <div class="flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden select-none">
    <!-- Tree Content with Virtual Scroller -->
    <div class="flex-1 overflow-hidden relative p-1">
      <div v-if="results.length === 0" class="text-center text-gray-400 py-10 italic text-xs">
        No schema objects found
      </div>

      <DynamicScroller
        v-else
        :items="flattenedItems"
        :min-item-size="28"
        class="h-full custom-scrollbar"
        key-field="id"
      >
        <template v-slot="{ item, index, active }">
          <DynamicScrollerItem
            :item="item"
            :active="active"
            :size-dependencies="[
              item.isExpanded,
              item.data?.matches?.length,
              item.data?.matchedColumns?.length,
              columnSearchActive
            ]"
            :data-index="index"
          >
            <!-- Category Header -->
            <div 
              v-if="item.type === 'category'"
              @click="toggleCategory(item.categoryId)"
              class="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2 py-1.5 transition-colors sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm"
            >
              <ChevronRight 
                class="w-3 h-3 mr-1.5 transition-transform text-gray-400"
                :class="{ 'rotate-90': !collapsedCategories.has(item.categoryId) }"
              />
              <component :is="getCategoryIcon(item.categoryId)" class="w-3 h-3 mr-2" :class="getCategoryColor(item.categoryId)" />
              <span class="font-bold text-[9px] uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ item.categoryId }}</span>
              <span class="ml-auto px-1 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-400 text-[8px] rounded font-mono">{{ item.count }}</span>
            </div>

            <!-- Schema Item -->
            <div v-else
              @click="emit('select', item.data)"
              class="group relative flex items-center py-1 px-2 ml-4 border-l border-gray-100 dark:border-gray-800 cursor-pointer rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
              :class="[
                { 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400': selectedItemName === item.data.name && appStore.compareStack?.source?.name !== item.data.name && appStore.compareStack?.target?.name !== item.data.name },
                { 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200/50 dark:border-orange-800/50 shadow-sm': appStore.compareStack?.source?.name === item.data.name },
                { 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50 shadow-sm': appStore.compareStack?.target?.name === item.data.name }
              ]"
            >
              <component :is="getCategoryIcon(item.categoryId)" class="w-3 h-3 mr-2 opacity-50 shrink-0" />
              <div class="flex-1 min-w-0 flex flex-col">
                <div class="flex items-center justify-between w-full">
                  <span class="truncate font-mono text-[11px]" 
                        :class="[
                          selectedItemName === item.data.name ? 'font-bold' : '',
                          appStore.compareStack?.source?.name === item.data.name ? 'text-orange-900 dark:text-orange-100 font-bold' : '',
                          appStore.compareStack?.target?.name === item.data.name ? 'text-blue-900 dark:text-blue-100 font-bold' : '',
                          getTableColorClass(item.data)
                        ]" 
                        >{{ item.data.name }}</span>
                  <div class="flex items-center">
                    <span v-if="item.data.matches?.length > 0" class="px-1 py-0.5 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-[8px] font-black rounded-sm border border-primary-200 dark:border-primary-800">
                      {{ item.data.matches.length }}
                    </span>
                    <div v-else-if="item.data.updated_at" class="relative flex items-center h-full">
                      <span class="text-[9px] text-gray-400 opacity-40 group-hover:opacity-0 transition-opacity" 
                            :class="{ 'opacity-0': appStore.compareStack?.source?.name === item.data.name || appStore.compareStack?.target?.name === item.data.name }">
                        {{ formatTimeAgo(item.data.updated_at).replace(' ago', '') }}
                      </span>
                    </div>
                    
                    <!-- Send to Instant Buttons -->
                    <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center px-0.5 bg-white/90 dark:bg-gray-800/90 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow p-0.5"
                         :class="(appStore.compareStack?.source?.name === item.data.name || appStore.compareStack?.target?.name === item.data.name) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'">
                      
                      <button 
                        v-if="appStore.compareStack?.source?.name === item.data.name"
                        @click.stop="emit('send-to-instant', item.data, 'source')"
                        class="p-1 rounded-full bg-orange-500 text-white dark:bg-orange-600 transition-all shadow-sm"
                      >
                        <Flame class="w-3 h-3 text-white" />
                      </button>

                      <button 
                        v-else-if="appStore.compareStack?.target?.name === item.data.name"
                        @click.stop="emit('send-to-instant', item.data, 'target')"
                        class="p-1 rounded-full bg-blue-500 text-white dark:bg-blue-600 transition-all shadow-sm"
                      >
                        <Flame class="w-3 h-3 text-white" />
                      </button>

                      <template v-else>
                        <button 
                          v-if="!appStore.compareStack?.source"
                          @click.stop="emit('send-to-instant', item.data, 'source')"
                          class="p-1 rounded-full text-orange-400/60 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all animate-pulse"
                        >
                          <Flame class="w-3 h-3" />
                        </button>
                        
                        <button 
                          v-else-if="!appStore.compareStack?.target"
                          @click.stop="emit('send-to-instant', item.data, 'target')"
                          class="p-1 rounded-full text-blue-400/60 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all animate-pulse"
                        >
                          <Flame class="w-3 h-3" />
                        </button>
                      </template>
                    </div>
                  </div>
                </div>
                
                <!-- Expanded Metadata (Variable Height) -->
                <div v-if="columnSearchActive && (item.data.matchedColumns?.length || item.data.matchedIndexes?.length || item.data.matchedForeignKeys?.length)" class="mt-1.5 space-y-1 ml-1 border-l-2 border-primary-100 dark:border-primary-900/30 pl-2 pb-0.5">
                  <div v-for="col in item.data.matchedColumns" :key="'col-'+col.name"
                    @click.stop="emit('select-column', { item: item.data, columnName: col.name })"
                    class="group/item flex items-center gap-1.5 py-0.5 px-1 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
                  >
                    <div class="flex items-center gap-1 min-w-0">
                      <Key v-if="col.pk" class="w-2.5 h-2.5 text-yellow-500 fill-yellow-500 shrink-0" />
                      <Circle v-else class="w-2 h-2 text-blue-400 opacity-50 shrink-0" />
                      <span class="text-[10px] font-mono font-bold text-gray-700 dark:text-gray-300 truncate" v-html="highlightPlain(col.name)"></span>
                    </div>
                    <span class="text-[9px] text-primary-600/60 dark:text-primary-400/60 font-mono uppercase truncate">{{ col.type }}</span>
                  </div>
                </div>

                <div v-if="item.data.matches?.length > 0 && !columnSearchActive" class="mt-1.5 space-y-1.5 ml-1 border-l-2 border-gray-100 dark:border-gray-800 pl-2 pb-0.5">
                  <div v-for="(match, mIdx) in item.data.matches.slice(0, 3)" :key="mIdx" 
                    @click.stop="handleSnippetClick($event, item.data, match.line)"
                    class="text-[10px] leading-tight hover:bg-primary-500/5 dark:hover:bg-primary-400/5 rounded p-0.5 transition-colors group/snippet"
                    :class="[{ '!bg-primary-500/20 dark:!bg-primary-400/30 !text-primary-700 dark:!text-primary-300 ring-1 ring-primary-500/30': selectedItemName === item.data.name && activeSearchLine === match.line }]"
                  >
                    <div class="flex items-start gap-1.5 text-gray-400 font-mono">
                      <span class="shrink-0 opacity-50">{{ match.line }}:</span>
                      <span class="text-gray-600 dark:text-gray-400 break-all line-clamp-2 italic" v-html="highlightText(match.content)"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DynamicScrollerItem>
        </template>
      </DynamicScroller>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { 
  Network,
  Flame,
  Key,
  Circle,
  Search,
  Grid3X3,
  Eye,
  Cpu,
  Sigma,
  Zap,
  CalendarClock,
  Database,
  ChevronRight
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
  stats?: Record<string, any>
  columnSearchActive?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', item: any): void
  (e: 'navigateTo', payload: { item: any, line: number }): void
  (e: 'navigate-to-definition', name: string): void
  (e: 'send-to-instant', item: any, slot: 'source' | 'target'): void
  (e: 'select-column', payload: { item: any, columnName: string }): void
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

// Auto-expand all when search results contain matches or column search is active
watch(() => [props.results, props.columnSearchActive], ([newResults, colActive]) => {
  const hasMatches = (newResults as any[]).some(r => r.matches?.length > 0 || r.matchedColumns?.length > 0)
  if (hasMatches || colActive) {
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

const flattenedItems = computed(() => {
  const list: any[] = []
  
  // 1. Add Diagrams/Pinned items if needed (Simplified for now)
  if (!props.results.some(r => r.matches?.length > 0) && props.results.some(r => r.type === 'diagrams')) {
    list.push({
      id: 'pinned-erd',
      type: 'pinned',
      name: 'Interactive ERD',
      categoryId: 'diagrams'
    })
  }

  // 2. Flatten categories and items
  const cats = ['tables', 'views', 'procedures', 'functions', 'triggers', 'events']
  cats.forEach(type => {
    const items = props.results.filter(r => r.type === type)
    if (items.length === 0) return

    // Add Category Header
    list.push({
      id: `cat-${type}`,
      type: 'category',
      categoryId: type,
      count: items.length
    })

    // Add Items if not collapsed
    if (!collapsedCategories.value.has(type)) {
      items.forEach(item => {
        list.push({
          id: `item-${type}-${item.name}`,
          type: 'item',
          categoryId: type,
          data: item
        })
      })
    }
  })

  return list
})

const toggleCategory = (type: string) => {
  if (collapsedCategories.value.has(type)) {
    collapsedCategories.value.delete(type)
  } else {
    collapsedCategories.value.add(type)
  }
  // Force reactivity for the computed flattenedItems
  collapsedCategories.value = new Set(collapsedCategories.value)
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

const highlightPlain = (text: string) => {
  if (!props.searchTerm || !props.searchTerm.trim()) return text
  try {
    const escaped = props.searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`(${escaped})`, 'gi')
    return text.replace(re, '<span class="bg-primary-500/30 text-primary-900 dark:text-primary-100 rounded-sm px-0.5">$1</span>')
  } catch (e) {
    return text
  }
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

const getTableColorClass = (item: any) => {
  if (item.type !== 'tables' && item.type !== 'table') return ''
  // Don't color if it's selected as source or target to maintain readability of selection states
  if (appStore.compareStack?.source?.name === item.name || appStore.compareStack?.target?.name === item.name) return ''
  
  const tableStats = props.stats?.[item.name]
  if (!tableStats) return ''
  
  const rows = tableStats.rowCount || 0
  if (rows <= 100000) return 'text-emerald-500'
  if (rows <= 5000000) return 'text-orange-500'
  return 'text-red-500'
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
