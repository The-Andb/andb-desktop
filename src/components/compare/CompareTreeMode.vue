<template>
  <div class="flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden select-none" @mouseup="stopResize"
    @mouseleave="stopResize">

    <!-- Filter Bar (Professional Redesign) -->
    <div
      class="flex items-center gap-1.5 px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shrink-0 overflow-x-auto no-scrollbar shadow-sm">
      <!-- Type Filters -->
      <div class="flex items-center gap-1.5 pr-3 mr-3 border-r border-gray-100 dark:border-gray-700">
        <button v-for="tOpt in typeOptions" :key="tOpt.id" @click="updateType(tOpt.id)"
          class="w-8 h-8 rounded-xl transition-all flex items-center justify-center border"
          :class="activeType === tOpt.id
            ? 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/20'
            : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'"
          :title="tOpt.label">
          <component :is="tOpt.icon" class="w-4 h-4" />
        </button>
      </div>

      <!-- Status Filters (Premium Pills) -->
      <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button v-for="f in filterOptions" :key="f.id" @click="currentFilter = f.id"
          class="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center shrink-0 border"
          :class="currentFilter === f.id
            ? [f.activeClass, 'border-current shadow-lg shadow-current/5']
            : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'">
          <component :is="f.icon" class="w-3.5 h-3.5 mr-2 opacity-70"
            :class="currentFilter === f.id ? '' : 'grayscale opacity-40'" />
          {{ f.label }}
          <span class="ml-2 opacity-40 font-mono tracking-tighter">{{ getFilterCount(f.id) }}</span>
        </button>
      </div>
    </div>

    <!-- Tree Content -->
    <div class="flex-1 overflow-auto custom-scrollbar p-4 relative min-h-0" @mousemove="handleResize">
      <div v-if="!hasData" class="text-center text-gray-400 py-10 italic">
        {{ $t('compare.treeViewData.noData') }}
      </div>

      <div v-else class="space-y-6">
        <div v-for="category in categories" :key="category.type" class="space-y-1">
          <!-- Category Header (Premium Style) -->
          <div @click="toggleCategory(category.type)" v-show="category.items.length > 0"
            class="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 rounded-xl px-3 py-2.5 transition-all sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-transparent hover:border-gray-100 dark:hover:border-gray-700 shadow-sm hover:shadow-md">
            <div
              class="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center mr-3 shadow-inner border border-black/5 dark:border-white/5">
              <component :is="getCategoryIcon(category.type)" class="w-4 h-4"
                :class="getCategoryColor(category.type)" />
            </div>
            <span class="font-black text-[11px] uppercase tracking-[0.2em] text-gray-900 dark:text-gray-100">{{
              category.type }}</span>
            <span
              class="ml-3 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px] rounded-full font-mono font-bold">{{
                category.items.length }}</span>

            <!-- Diff Count Badge -->
            <div v-if="category.diffCount > 0" class="ml-auto flex items-center">
              <span
                class="text-[9px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-400/10 px-3 py-1 rounded-full border border-orange-100 dark:border-orange-500/20 shadow-sm">
                {{ category.diffCount }} differences
              </span>
            </div>
          </div>

          <!-- Items -->
          <div v-show="!collapsedCategories.has(category.type)" class="relative">
            <div v-for="item in category.items" :key="item.name" @click="emit('select', item)"
              class="group relative flex items-center py-1 cursor-pointer">
              <!-- Row Hover Effect -->
              <div
                class="absolute inset-0 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/10 pointer-events-none rounded transition-colors">
              </div>

              <!-- LEFT SIDE (Source) -->
              <div :style="{ width: leftColWidth + '%' }"
                class="shrink-0 flex items-center pr-8 relative transition-[width] duration-0 ease-linear group/left">
                <div
                  class="flex-1 min-w-0 px-2 flex items-center justify-between text-left group-hover/left:bg-gray-100 dark:group-hover/left:bg-gray-800/50 rounded transition-colors"
                  :class="{ 'bg-orange-50 dark:bg-orange-900/20 ring-1 ring-orange-200 dark:ring-orange-800/50': appStore.compareStack?.source?.name === item.name && hasInSource(item) }">
                  <div class="flex items-center truncate py-1">
                    <template v-if="hasInSource(item)">
                      <component :is="getCategoryIcon(category.type)" class="w-3.5 h-3.5 mr-2 opacity-50 shrink-0" />
                      <span class="truncate font-mono" :class="getSourceClass(item)">{{ item.name }}</span>
                    </template>
                    <template v-else>
                      <span class="text-gray-300 dark:text-gray-600 italic text-[10px] pl-6">{{
                        $t('compare.treeViewData.missingSource') }}</span>
                    </template>
                  </div>

                  <!-- Source Instant Compare Button -->
                  <button v-if="hasInSource(item)" @click.stop="emit('send-to-instant', item, 'source')"
                    class="shrink-0 p-1 rounded-full transition-all flex items-center gap-1.5 mr-1 group/btn" :class="[
                      appStore.compareStack?.source?.name === item.name ? 'opacity-100 bg-orange-500 text-white dark:bg-orange-600 shadow-sm' : 'opacity-0 group-hover/left:opacity-100 text-gray-400 hover:text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                    ]" title="Set as Source Base">
                    <Flame class="w-3.5 h-3.5 transition-colors"
                      :class="appStore.compareStack?.source?.name === item.name ? 'text-white fill-white/20' : 'text-orange-400 group-hover/btn:text-orange-500'" />
                    <span v-if="appStore.compareStack?.source?.name === item.name"
                      class="text-[9px] font-black tracking-widest uppercase pr-1">SRC</span>
                  </button>
                </div>
              </div>

              <!-- CENTER CONNECTOR / STATUS -->
              <div class="shrink-0 w-12 flex justify-center z-10 relative">
                <div
                  class="p-1 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 group/icon transition-all duration-200"
                  :class="canMigrate(item) ? 'cursor-pointer hover:scale-110 hover:shadow-md hover:border-orange-500/50 dark:hover:border-orange-500/50' : ''"
                  @click.stop="handleMigrateClick(item)">
                  <component v-if="canMigrate(item)" :is="Zap"
                    class="w-3.5 h-3.5 text-orange-500 fill-orange-500/20 hidden group-hover/icon:block animate-in zoom-in spin-in-12 duration-300" />
                  <component :is="getStatusIcon(item.status)" class="w-3.5 h-3.5 transition-transform"
                    :class="[getStatusClass(item.status), canMigrate(item) ? 'group-hover/icon:hidden' : '']" />
                </div>

                <!-- Connector Lines -->
                <div v-if="hasInSource(item)"
                  class="absolute right-full top-1/2 w-4 h-px bg-gray-200 dark:bg-gray-700/50 -mr-1">
                </div>
                <div v-if="hasInTarget(item)"
                  class="absolute left-full top-1/2 w-4 h-px bg-gray-200 dark:bg-gray-700/50 -ml-1"></div>
              </div>

              <!-- RIGHT SIDE (Target) -->
              <div class="flex-1 min-w-0 flex items-center pl-4 relative group/right">
                <div
                  class="flex-1 min-w-0 px-2 flex items-center text-left group-hover/right:bg-gray-100 dark:group-hover/right:bg-gray-800/50 rounded transition-colors"
                  :class="{ 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-800/50': appStore.compareStack?.target?.name === item.name && hasInTarget(item) }">
                  <!-- Target Instant Compare Button (Moved closer to center) -->
                  <button v-if="hasInTarget(item)" @click.stop="emit('send-to-instant', item, 'target')"
                    class="shrink-0 p-1 rounded-full transition-all flex items-center gap-1.5 mr-2 ml-1 group/btn"
                    :class="[
                      appStore.compareStack?.target?.name === item.name ? 'opacity-100 bg-blue-500 text-white dark:bg-blue-600 shadow-sm' : 'opacity-0 group-hover/right:opacity-100 text-gray-400 hover:text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                    ]" title="Set as Target Base">
                    <span v-if="appStore.compareStack?.target?.name === item.name"
                      class="text-[9px] font-black tracking-widest uppercase pl-1">TGT</span>
                    <Flame class="w-3.5 h-3.5 transition-colors"
                      :class="appStore.compareStack?.target?.name === item.name ? 'text-white fill-white/20' : 'text-blue-400 group-hover/btn:text-blue-500'" />
                  </button>

                  <div class="flex items-center truncate py-1">
                    <template v-if="hasInTarget(item)">
                      <component :is="getCategoryIcon(category.type)" class="w-3.5 h-3.5 mr-2 opacity-50 shrink-0" />
                      <span class="truncate font-mono" :class="getTargetClass(item)">{{ item.name }}</span>
                    </template>
                    <template v-else>
                      <span class="text-gray-300 dark:text-gray-600 italic text-[10px] pl-4">{{
                        $t('compare.treeViewData.missingTarget') }}</span>
                    </template>
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
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Zap,
  Database,
  AlertCircle,
  XCircle,
  CheckCircle2,
  ArrowRight,
  Sigma,
  Grid3X3,
  Eye,
  Cpu,
  CalendarClock,
  Flame,
  Ban
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const { t } = useI18n()

const props = defineProps<{
  results: any[]
  sourceName: string
  targetName: string
  activeType: string
  targetIsStatic?: boolean
  treeExpandCmd?: { action: 'expand' | 'collapse' | '', ts: number }
}>()

const emit = defineEmits<{
  (e: 'migrate', item: any): void
  (e: 'select', item: any): void
  (e: 'update:activeType', type: string): void
  (e: 'send-to-instant', item: any, slot: 'source' | 'target'): void
}>()

const updateType = (type: string) => {
  emit('update:activeType', type)
}

const typeOptions = [
  { id: 'all', label: 'All Types', icon: Database },
  { id: 'tables', label: 'Tables', icon: Grid3X3 },
  { id: 'views', label: 'Views', icon: Eye },
  { id: 'procedures', label: 'Procedures', icon: Cpu },
  { id: 'functions', label: 'Functions', icon: Sigma },
  { id: 'triggers', label: 'Triggers', icon: Zap }
]

const collapsedCategories = ref(new Set<string>())

watch(() => props.treeExpandCmd, (cmd) => {
  if (!cmd) return
  if (cmd.action === 'expand') {
    collapsedCategories.value.clear()
  } else if (cmd.action === 'collapse') {
    // Collect all valid category types
    ['tables', 'views', 'procedures', 'functions', 'triggers'].forEach(c => collapsedCategories.value.add(c))
  }
})
const leftColWidth = ref(45) // Percentage
const isResizing = ref(false)

const currentFilter = ref('modified')
const filterOptions = computed(() => [
  { id: 'all', label: t('compare.treeViewData.filter.all'), activeClass: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200', icon: Database },
  { id: 'new', label: t('compare.treeViewData.filter.new'), activeClass: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', icon: ArrowRight },
  { id: 'modified', label: t('compare.treeViewData.filter.modified'), activeClass: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', icon: AlertCircle },
  { id: 'identical', label: t('compare.treeViewData.filter.identical'), activeClass: 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400', icon: CheckCircle2 },
  { id: 'deprecated', label: t('compare.treeViewData.filter.deprecated'), activeClass: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400', icon: XCircle },
  { id: 'excluded', label: t('compare.treeViewData.filter.excluded', 'Excluded'), activeClass: 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300', icon: Ban }
])

const handleResize = (e: MouseEvent) => {
  if (!isResizing.value) return

  // Calculate percentage based on mouse X position relative to container width
  const container = e.currentTarget as HTMLElement
  const rect = container.getBoundingClientRect()
  const x = e.clientX - rect.left
  const percent = (x / rect.width) * 100

  // Clamp between 20% and 80%
  leftColWidth.value = Math.max(20, Math.min(80, percent))
}

const stopResize = () => {
  isResizing.value = false
  document.body.style.cursor = ''
}

const hasData = computed(() => props.results && props.results.length > 0)

const getFilterCount = (filterId: string) => {
  if (!props.results) return 0

  let baseItems = props.results
  if (props.activeType !== 'all') {
    baseItems = baseItems.filter(r => r.type === props.activeType)
  }

  if (filterId === 'all') return baseItems.length

  return baseItems.filter(item => {
    const s = item.status?.toLowerCase()
    if (filterId === 'new') return s === 'new' || s === 'missing_in_target'
    if (filterId === 'modified') return s === 'modified' || s === 'different' || s === 'updated'
    if (filterId === 'identical') return s === 'equal' || s === 'same' || s === 'identical'
    if (filterId === 'deprecated') return s === 'deprecated' || s === 'missing_in_source'
    if (filterId === 'excluded') return s === 'excluded' || s === 'ignored'
    return false
  }).length
}

const categories = computed(() => {
  const cats = ['tables', 'views', 'procedures', 'functions', 'triggers']
  return cats.map(type => {
    // 0. Filter by type (if activeType is not all)
    if (props.activeType !== 'all' && type !== props.activeType) {
      return { type, items: [], diffCount: 0 }
    }

    // 1. Get items for this category
    let items = props.results.filter(r => r.type === type)

    // 2. Filter items based on current filter
    if (currentFilter.value !== 'all') {
      items = items.filter(item => {
        const s = item.status?.toLowerCase()
        if (currentFilter.value === 'new') return s === 'new' || s === 'missing_in_target'
        if (currentFilter.value === 'modified') return s === 'modified' || s === 'different' || s === 'updated'
        if (currentFilter.value === 'identical') return s === 'equal' || s === 'same' || s === 'identical'
        if (currentFilter.value === 'deprecated') return s === 'deprecated' || s === 'missing_in_source'
        if (currentFilter.value === 'excluded') return s === 'excluded' || s === 'ignored'
        return false
      })
    }

    const diffCount = items.filter(r => {
      const s = r.status?.toLowerCase()
      return s !== 'equal' && s !== 'same' && s !== 'identical'
    }).length

    return {
      type,
      items,
      diffCount
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

const handleMigrateClick = (item: any) => {
  if (canMigrate(item)) {
    emit('migrate', item)
  }
}

const canMigrate = (item: any) => {
  if (props.targetIsStatic) return false
  const s = item.status?.toLowerCase()
  return s !== 'equal' && s !== 'same' && s !== 'excluded' && s !== 'ignored'
}

// Helpers
const getCategoryIcon = (type: string) => {
  switch (type) {
    case 'tables': return Grid3X3
    case 'views': return Eye
    case 'procedures': return Cpu
    case 'functions': return Sigma
    case 'triggers': return Zap
    case 'events': return CalendarClock
    default: return Database
  }
}

const getCategoryColor = (type: string) => {
  switch (type) {
    case 'tables': return 'text-blue-500'
    case 'views': return 'text-indigo-500'
    case 'procedures': case 'functions': return 'text-purple-500'
    case 'triggers': return 'text-amber-500'
    case 'events': return 'text-cyan-500'
    default: return 'text-gray-500'
  }
}

const hasInSource = (item: any) => {
  return item.status !== 'missing_in_source' && item.status !== 'deprecated'
}

const hasInTarget = (item: any) => {
  return item.status !== 'missing_in_target' && item.status !== 'new'
}

const getSourceClass = (item: any) => {
  if (item.status === 'modified' || item.status === 'different') return 'text-amber-600 dark:text-amber-400 font-bold'
  if (item.status === 'new' || item.status === 'missing_in_target') return 'text-emerald-600 dark:text-emerald-400 font-bold'
  return 'text-gray-700 dark:text-gray-300'
}

const getTargetClass = (item: any) => {
  if (item.status === 'modified' || item.status === 'different') return 'text-amber-600 dark:text-amber-400 font-bold'
  if (item.status === 'deprecated' || item.status === 'missing_in_source') return 'text-rose-600 dark:text-rose-400 font-bold'
  return 'text-gray-700 dark:text-gray-300'
}

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'equal': case 'same': return CheckCircle2
    case 'new': case 'missing_in_target': return ArrowRight
    case 'deprecated': case 'missing_in_source': return XCircle
    case 'excluded': case 'ignored': return Ban
    case 'modified': case 'different': case 'updated': return AlertCircle
    default: return AlertCircle
  }
}

const getStatusClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'equal': case 'same': return 'text-teal-500 dark:text-teal-400'
    case 'new': case 'missing_in_target': return 'text-orange-500 dark:text-orange-400'
    case 'deprecated': case 'missing_in_source': return 'text-rose-500 dark:text-rose-400'
    case 'excluded': case 'ignored': return 'text-gray-500 dark:text-gray-400'
    case 'modified': case 'different': case 'updated': return 'text-amber-500 dark:text-amber-400'
    default: return 'text-gray-400'
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
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}
</style>
