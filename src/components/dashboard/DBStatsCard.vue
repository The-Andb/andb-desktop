<template>
  <div
    class="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-primary-500/10 p-6 border border-gray-100 dark:border-gray-700 transition-all duration-300 relative overflow-hidden">
    <!-- Background Sparkle -->
    <div
      class="absolute -right-4 -top-4 w-24 h-24 bg-primary-500/5 rounded-full blur-2xl group-hover:bg-primary-500/10 transition-colors duration-500">
    </div>

    <div class="flex items-center justify-between mb-6 relative z-10">
      <div class="flex items-center gap-4">
        <div
          class="p-3 bg-primary-500/10 text-primary-500 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-sm border border-primary-500/10">
          <Activity class="w-6 h-6" />
        </div>
        <div>
          <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">{{ title || 'Database Intelligence' }}</h3>
          <p class="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{{ subtitle || 'Live Health Overview' }}</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button @click="$emit('refresh')" :disabled="loading"
          class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-primary-500 transition-all active:scale-90">
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
      </div>
    </div>

    <!-- Main Metrics -->
    <div class="grid grid-cols-2 gap-4 mb-6 relative z-10">
      <div
        class="bg-gray-50/50 dark:bg-gray-900/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700/50 hover:border-primary-500/20 transition-colors">
        <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Total Rows</span>
        <div class="flex items-baseline gap-1">
          <span class="text-xl font-black text-gray-900 dark:text-white">{{ formatNumber(totalRows) }}</span>
          <span class="text-[9px] font-bold text-primary-500/60 uppercase">Records</span>
        </div>
      </div>
      <div
        class="bg-gray-50/50 dark:bg-gray-900/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700/50 hover:border-primary-500/20 transition-colors">
        <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Total Size</span>
        <div class="flex items-baseline gap-1">
          <span class="text-xl font-black text-gray-900 dark:text-white">{{ formattedSize.value }}</span>
          <span class="text-[9px] font-bold text-primary-500/60 uppercase">{{ formattedSize.unit }}</span>
        </div>
      </div>
    </div>

    <!-- Distribution / Stats -->
    <div class="space-y-3 relative z-10">
      <div v-if="engineCounts" class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <span>Engine Distribution</span>
          <span class="text-primary-500">{{ totalTables }} Tables</span>
        </div>
        <div class="flex h-1.5 w-full bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
          <div v-for="(count, engine, index) in engineCounts" :key="engine"
            :style="{ width: (count / totalTables * 100) + '%' }" :class="[
              index === 0 ? 'bg-primary-500' :
                index === 1 ? 'bg-blue-500' :
                  index === 2 ? 'bg-purple-500' : 'bg-gray-400'
            ]" class="h-full first:rounded-l-full last:rounded-r-full border-r border-white/10 last:border-0"
            :title="`${engine}: ${count}`"></div>
        </div>
        <div class="flex flex-wrap gap-x-3 gap-y-1">
          <div v-for="(count, engine, index) in engineCounts" :key="engine" class="flex items-center gap-1.5">
            <div class="w-1.5 h-1.5 rounded-full" :class="[
              index === 0 ? 'bg-primary-500' :
                index === 1 ? 'bg-blue-500' :
                  index === 2 ? 'bg-purple-500' : 'bg-gray-400'
            ]"></div>
            <span class="text-[9px] font-bold text-gray-500 uppercase">{{ engine }} ({{ count }})</span>
          </div>
        </div>
      </div>

      <!-- Server Info Badge -->
      <div v-if="serverInfo"
        class="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700/50 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Cpu class="w-3.5 h-3.5 text-gray-400" />
          <span class="text-[10px] font-mono text-gray-500">{{ serverInfo.version }}</span>
        </div>
        <div v-if="serverInfo.hasInstantDDL"
          class="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/20">
          <Zap class="w-3 h-3" />
          <span class="text-[8px] font-black uppercase tracking-widest">Instant DDL</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Activity, RefreshCw, Cpu, Zap } from 'lucide-vue-next'

const props = defineProps<{
  title?: string
  subtitle?: string
  loading?: boolean
  stats: any[]
  serverInfo?: any
}>()

defineEmits(['refresh'])

const totalTables = computed(() => props.stats?.length || 0)

const totalRows = computed(() => {
  if (!Array.isArray(props.stats)) return 0
  return props.stats.reduce((sum, s) => sum + (s.rowCount || 0), 0)
})

const totalSize = computed(() => {
  if (!Array.isArray(props.stats)) return 0
  const data = props.stats.reduce((sum, s) => sum + (s.dataLengthMB || 0), 0) || 0
  const index = props.stats.reduce((sum, s) => sum + (s.indexLengthMB || 0), 0) || 0
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
    const engine = s.engine || 'Unknown'
    counts[engine] = (counts[engine] || 0) + 1
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
