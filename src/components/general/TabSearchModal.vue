<template>
  <div
    class="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
    @click="close"
  >
    <!-- Modal Box -->
    <div
      class="w-full max-w-lg bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[500px] animate-in fade-in zoom-in-95 duration-200"
      @click.stop
    >
      <!-- Search Input Header -->
      <div
        class="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0"
      >
        <Search class="w-4 h-4 text-gray-400 shrink-0" />
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          placeholder="Search open tabs or recently closed..."
          class="bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none w-full font-medium"
          @keydown.down.prevent="onArrowDown"
          @keydown.up.prevent="onArrowUp"
          @keydown.enter.prevent="onEnter"
          @keydown.esc.prevent="close"
        />
        <div
          class="flex items-center gap-1 bg-gray-200/50 dark:bg-gray-800 px-2 py-1 rounded-md text-[9px] font-black text-gray-400 tracking-wider uppercase shrink-0 select-none border border-gray-200/20 shadow-sm"
        >
          <span>⇧</span><span>⌘</span><span>A</span>
        </div>
      </div>

      <!-- Scrollable Results Section -->
      <div class="flex-1 overflow-y-auto p-2 space-y-2 no-scrollbar min-h-[100px]">
        <!-- Combined Filtered List -->
        <div v-if="combinedList.length > 0" class="space-y-3">
          <!-- Open Tabs Section -->
          <div v-if="filteredOpenTabs.length > 0" class="space-y-1">
            <div
              class="px-2 pb-1 text-[9px] font-black text-gray-400 tracking-widest uppercase select-none"
            >
              Open Tabs
            </div>
            <div
              v-for="(item, index) in filteredOpenTabs"
              :key="item.id"
              class="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer select-none transition-all duration-200"
              :class="
                getCombinedIndex('open', index) === activeIndex
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25 scale-[1.01]'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/80 text-gray-700 dark:text-gray-300'
              "
              @mouseenter="activeIndex = getCombinedIndex('open', index)"
              @click="selectTab(item)"
            >
              <!-- Icon -->
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-300"
                :class="
                  getCombinedIndex('open', index) === activeIndex
                    ? 'bg-white/20 border-white/10 text-white'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-primary-500'
                "
              >
                <component :is="getIconForType(item.type)" class="w-4 h-4" />
              </div>

              <!-- Labels -->
              <div class="flex-1 min-w-0 text-left">
                <div
                  class="text-xs font-black tracking-tight truncate leading-none mb-1"
                  :class="
                    getCombinedIndex('open', index) === activeIndex
                      ? 'text-white'
                      : 'text-gray-900 dark:text-white'
                  "
                >
                  {{ item.name }}
                </div>
                <div
                  class="text-[9px] font-bold tracking-wider uppercase opacity-60 leading-none"
                  :class="
                    getCombinedIndex('open', index) === activeIndex
                      ? 'text-white/80'
                      : 'text-gray-400'
                  "
                >
                  {{ item.type }}
                </div>
              </div>

              <!-- Quick Close Button -->
              <button
                @click.stop="closeTab(item.id)"
                class="p-1 rounded-md transition-all shrink-0 hover:scale-105"
                :class="
                  getCombinedIndex('open', index) === activeIndex
                    ? 'text-white/70 hover:text-white hover:bg-white/10'
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'
                "
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Recently Closed Section -->
          <div v-if="filteredClosedTabs.length > 0" class="space-y-1">
            <div
              class="px-2 pb-1 text-[9px] font-black text-gray-400 tracking-widest uppercase select-none"
            >
              Recently Closed
            </div>
            <div
              v-for="(item, index) in filteredClosedTabs"
              :key="item.id"
              class="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer select-none transition-all duration-200"
              :class="
                getCombinedIndex('closed', index) === activeIndex
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25 scale-[1.01]'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/80 text-gray-700 dark:text-gray-300'
              "
              @mouseenter="activeIndex = getCombinedIndex('closed', index)"
              @click="reopenTab(item)"
            >
              <!-- Icon -->
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-300"
                :class="
                  getCombinedIndex('closed', index) === activeIndex
                    ? 'bg-white/20 border-white/10 text-white'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400'
                "
              >
                <component :is="getIconForType(item.type)" class="w-4 h-4" />
              </div>

              <!-- Labels -->
              <div class="flex-1 min-w-0 text-left">
                <div
                  class="text-xs font-black tracking-tight truncate leading-none mb-1 line-through opacity-70"
                  :class="
                    getCombinedIndex('closed', index) === activeIndex
                      ? 'text-white'
                      : 'text-gray-700 dark:text-gray-300'
                  "
                >
                  {{ item.name }}
                </div>
                <div
                  class="text-[9px] font-bold tracking-wider uppercase opacity-60 leading-none"
                  :class="
                    getCombinedIndex('closed', index) === activeIndex
                      ? 'text-white/80'
                      : 'text-gray-400'
                  "
                >
                  {{ item.type }}
                </div>
              </div>

              <!-- Quick Restore Indicator -->
              <CornerDownLeft
                class="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-all mr-1"
                :class="
                  getCombinedIndex('closed', index) === activeIndex ? 'text-white' : 'text-gray-400'
                "
              />
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-else
          class="flex flex-col items-center justify-center py-12 px-4 text-center text-gray-400"
        >
          <Search class="w-8 h-8 text-gray-300 dark:text-gray-700 mb-2 shrink-0 animate-pulse" />
          <div class="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
            No results found
          </div>
          <div class="text-[10px] text-gray-400 mt-1">
            Try searching for a different tab name or type
          </div>
        </div>
      </div>

      <!-- Bottom Keyboard Shortcuts Guide -->
      <div
        class="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 text-[10px] text-gray-400 font-bold shrink-0 select-none"
      >
        <div class="flex items-center gap-3">
          <span class="flex items-center gap-1"
            ><span
              class="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded font-mono border border-gray-200/20 shadow-sm"
              >↑↓</span
            >
            navigate</span
          >
          <span class="flex items-center gap-1"
            ><span
              class="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded font-mono border border-gray-200/20 shadow-sm"
              >Enter</span
            >
            select</span
          >
        </div>
        <div class="flex items-center gap-1">
          <span
            class="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded font-mono border border-gray-200/20 shadow-sm"
            >Esc</span
          >
          close switcher
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import {
  Search,
  X,
  CornerDownLeft,
  Grid3X3,
  Eye,
  Cpu,
  Sigma,
  Zap,
  CalendarClock,
  Network,
  Database,
  Terminal
} from 'lucide-vue-next'

const props = defineProps<{
  tabs: any[]
  activeTabId: string | null
  recentlyClosedTabs: any[]
}>()

const emit = defineEmits<{
  close: []
  select: [id: string]
  'close-tab': [id: string]
  'reopen-tab': [tab: any]
}>()

const searchQuery = ref('')
const activeIndex = ref(0)
const searchInput = ref<HTMLInputElement | null>(null)

// Map tab types to beautiful icons
const typeIcons = {
  tables: Grid3X3,
  views: Eye,
  procedures: Cpu,
  functions: Sigma,
  triggers: Zap,
  events: CalendarClock,
  diagrams: Network,
  query: Terminal
}

const getIconForType = (type: string) => {
  const key = type?.toLowerCase() as keyof typeof typeIcons
  return typeIcons[key] || Database
}

// Filter open tabs based on query
const filteredOpenTabs = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return props.tabs
  return props.tabs.filter(
    t => t.name.toLowerCase().includes(query) || t.type.toLowerCase().includes(query)
  )
})

// Filter recently closed tabs based on query
const filteredClosedTabs = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return props.recentlyClosedTabs
  return props.recentlyClosedTabs.filter(
    t => t.name.toLowerCase().includes(query) || t.type.toLowerCase().includes(query)
  )
})

// Combined flat list representing both sections sequentially for keyboard navigation
const combinedList = computed(() => {
  const list: Array<{ source: 'open' | 'closed'; tab: any }> = []
  filteredOpenTabs.value.forEach(t => list.push({ source: 'open', tab: t }))
  filteredClosedTabs.value.forEach(t => list.push({ source: 'closed', tab: t }))
  return list
})

// Calculate combined flat index of an item in a section
const getCombinedIndex = (source: 'open' | 'closed', localIndex: number) => {
  if (source === 'open') return localIndex
  return filteredOpenTabs.value.length + localIndex
}

// Watchers
onMounted(async () => {
  searchQuery.value = ''
  activeIndex.value = 0
  await nextTick()
  searchInput.value?.focus()
})

watch(combinedList, newList => {
  // Ensure activeIndex is bounded correctly when search updates combinedList
  if (activeIndex.value >= newList.length) {
    activeIndex.value = Math.max(0, newList.length - 1)
  }
})

// Navigation methods
const onArrowDown = () => {
  if (combinedList.value.length === 0) return
  activeIndex.value = (activeIndex.value + 1) % combinedList.value.length
}

const onArrowUp = () => {
  if (combinedList.value.length === 0) return
  activeIndex.value =
    (activeIndex.value - 1 + combinedList.value.length) % combinedList.value.length
}

const onEnter = () => {
  if (combinedList.value.length === 0) return
  const activeItem = combinedList.value[activeIndex.value]
  if (activeItem.source === 'open') {
    selectTab(activeItem.tab)
  } else {
    reopenTab(activeItem.tab)
  }
}

const selectTab = (tab: any) => {
  emit('select', tab.id)
  emit('close')
}

const closeTab = (id: string) => {
  emit('close-tab', id)
}

const reopenTab = (tab: any) => {
  emit('reopen-tab', tab)
  emit('close')
}

const close = () => {
  emit('close')
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
