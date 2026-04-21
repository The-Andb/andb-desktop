<template>
  <div class="group bg-white dark:bg-gray-800 rounded-[2rem] p-8 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
    <!-- Background Sparkle Deco -->
    <div class="absolute -right-20 -top-20 w-48 h-48 bg-primary-500/5 rounded-full blur-3xl group-hover:bg-primary-500/10 transition-colors duration-500"></div>
    <div class="absolute -left-10 -bottom-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors duration-500"></div>

    <div class="relative z-10">
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-4">
          <div class="p-3 bg-primary-500/10 text-primary-500 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm border border-primary-500/10 overflow-hidden relative">
             <div class="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-transparent"></div>
             <Activity class="w-6 h-6 relative z-10" />
          </div>
          <div>
            <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">Database Intelligence</h3>
            <p class="text-xs font-bold text-gray-500">{{ subtitle }}</p>
          </div>
        </div>
        <button 
          @click="$emit('refresh')"
          :disabled="loading"
          class="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all active:scale-90"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
      </div>

      <!-- Object Distribution (High Level) -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div v-for="item in displayStats" :key="item.label" class="space-y-1 p-3 bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl border border-gray-100/50 dark:border-gray-700/50">
          <div class="flex items-center gap-2">
            <component :is="item.icon" class="w-3.5 h-3.5 text-gray-400" />
            <span class="text-[8px] font-black text-gray-400 uppercase tracking-widest">{{ item.label }}</span>
          </div>
          <div class="flex items-baseline gap-1">
            <span class="text-lg font-black text-gray-900 dark:text-white tracking-tight">{{ item.value }}</span>
            <span class="text-[8px] font-bold text-gray-400 uppercase">{{ item.unit }}</span>
          </div>
        </div>
      </div>

      <!-- row count & sizes (analytical) -->
       <div class="grid grid-cols-2 gap-6 mb-8">
        <div class="relative">
          <div class="flex items-center gap-2 mb-2">
            <LayoutGrid class="w-3.5 h-3.5 text-indigo-500/60" />
            <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Total Records</span>
          </div>
          <div class="flex items-baseline gap-1">
            <span class="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{{ formatNumber(totalRows) }}</span>
            <span class="text-[10px] font-bold text-primary-500/60 uppercase">Rows</span>
          </div>
        </div>
        <div class="relative">
          <div class="flex items-center gap-2 mb-2">
            <Database class="w-3.5 h-3.5 text-emerald-500/60" />
            <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Storage Size</span>
          </div>
          <div class="flex items-baseline gap-1">
            <span class="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{{ formattedSize.value }}</span>
            <span class="text-[10px] font-bold text-primary-500/60 uppercase">{{ formattedSize.unit }}</span>
          </div>
        </div>
      </div>

      <!-- distribution / engine -->
      <div v-if="engineCounts" class="space-y-3 pt-6 border-t border-gray-50 dark:border-gray-700/50">
        <div class="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-gray-400">
          <span>Engine Distribution</span>
          <span class="text-primary-500">{{ totalTables }} Tables config</span>
        </div>
        <div class="flex h-2 w-full bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden shadow-inner">
          <div v-for="(count, engine, index) in engineCounts" :key="engine"
            :style="{ width: (count / totalTables * 100) + '%' }" :class="[
              index === 0 ? 'bg-primary-500' :
                index === 1 ? 'bg-blue-500' :
                  index === 2 ? 'bg-purple-500' : 'bg-gray-400'
            ]" class="h-full first:rounded-l-full last:rounded-r-full border-r border-white/10 last:border-0"
            :title="`${engine}: ${count}`"></div>
        </div>
      </div>

      <!-- Server Info Footer -->
      <div v-if="serverInfo" class="mt-8 pt-6 border-t border-gray-50 dark:border-gray-700/50 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700 shadow-sm relative group/srv">
            <Server class="w-5 h-5 text-gray-500 group-hover/srv:scale-110 transition-transform" />
          </div>
          <div>
            <div class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Version Context</div>
            <div class="text-[11px] font-black text-gray-700 dark:text-gray-300 font-mono">{{ serverInfo.version || 'Unknown' }}</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Engine Mode</div>
          <div class="flex items-center gap-1.5 justify-end">
            <Zap v-if="serverInfo.hasInstantDDL" class="w-3 h-3 text-emerald-500 animate-pulse fill-emerald-500" />
            <div class="text-xs font-black text-primary-500 uppercase tracking-widest">{{ serverInfo.engine || 'Relational' }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  Table, 
  Eye, 
  Code2, 
  Database,
  RefreshCw,
  Server,
  Activity,
  Cpu,
  Zap,
  LayoutGrid
} from 'lucide-vue-next'

const props = defineProps<{
  stats: any[]
  serverInfo?: any
  loading?: boolean
  subtitle?: string
}>()

defineEmits(['refresh'])

// High-level object counts
const displayStats = computed(() => {
  const findStat = (type: string) => props.stats.find(s => s.type === type)?.count || 0
  
  return [
    { label: 'Tables', value: findStat('table'), icon: Table, unit: 'count' },
    { label: 'Views', value: findStat('view'), icon: Eye, unit: 'count' },
    { label: 'Routines', value: findStat('routine'), icon: Code2, unit: 'count' },
    { label: 'Storage', value: formattedSize.value.value, icon: Database, unit: formattedSize.value.unit }
  ]
})

// Analytical metrics
const totalTables = computed(() => {
    // If stats contains table objects, find their count
    const tableStat = props.stats.find(s => s.type === 'table')
    if (tableStat) return tableStat.count
    // Fallback if stats is an array of tables directly (HEAD behavior)
    return props.stats.filter(s => !s.type).length || 0
})

const totalRows = computed(() => {
  if (!Array.isArray(props.stats)) return 0
  return props.stats.reduce((sum, s) => sum + (s.rowCount || 0), 0)
})

const totalSize = computed(() => {
  if (!Array.isArray(props.stats)) return 0
  const data = props.stats.reduce((sum, s) => sum + (s.dataLengthMB || 0), 0) || 0
  const index = props.stats.reduce((sum, s) => sum + (s.indexLengthMB || 0), 0) || 0
  
  // Also check if we have a total_size stat from AI branch
  const totalStat = props.stats.find(s => s.type === 'total_size')
  if (totalStat) return parseFloat(totalStat.count)
  
  return data + index
})

const formattedSize = computed(() => {
  const size = totalSize.value
  if (size >= 1024 * 1024) {
    return { value: (size / (1024 * 1024)).toFixed(1), unit: 'TB' }
  } else if (size >= 1024) {
    return { value: (size / 1024).toFixed(1), unit: 'GB' }
  }
  return { value: size.toFixed(1), unit: 'MB' }
})

const engineCounts = computed(() => {
  if (!Array.isArray(props.stats)) return null
  const counts: Record<string, number> = {}
  props.stats.forEach(s => {
    // Only process if it's a table object (lacks 'type' property from AI branch aggregator)
    if (!s.type) {
        const engine = s.engine || 'Unknown'
        counts[engine] = (counts[engine] || 0) + 1
    }
  })
  return Object.keys(counts).length > 0 ? counts : null
})

const formatNumber = (n: number) => {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}
</script>
