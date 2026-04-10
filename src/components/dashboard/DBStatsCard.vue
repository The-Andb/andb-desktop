<template>
  <div class="bg-white dark:bg-gray-800 rounded-[2rem] p-8 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
    <!-- Background Gradient Deco -->
    <div class="absolute -right-20 -top-20 w-40 h-40 bg-primary-500/5 rounded-full blur-3xl group-hover:bg-primary-500/10 transition-colors duration-500"></div>
    
    <div class="relative z-10">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Database Metrics</h3>
          <p class="text-xs font-bold text-gray-500">{{ subtitle }}</p>
        </div>
        <button 
          @click="$emit('refresh')"
          :disabled="loading"
          class="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all active:scale-90"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <div v-for="item in displayStats" :key="item.label" class="space-y-1">
          <div class="flex items-center gap-2">
            <component :is="item.icon" class="w-3.5 h-3.5 text-gray-400" />
            <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">{{ item.label }}</span>
          </div>
          <div class="flex items-baseline gap-1">
            <span class="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{{ item.value }}</span>
            <span class="text-[9px] font-bold text-gray-400 uppercase">{{ item.unit }}</span>
          </div>
        </div>
      </div>

      <!-- Server Info Footer -->
      <div v-if="serverInfo" class="mt-8 pt-6 border-t border-gray-50 dark:border-gray-700/50 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
            <Server class="w-4 h-4 text-gray-500" />
          </div>
          <div>
            <div class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Version</div>
            <div class="text-[11px] font-bold text-gray-700 dark:text-gray-300">{{ serverInfo.version || 'Unknown' }}</div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Engine</div>
          <div class="text-[11px] font-bold text-primary-500">{{ serverInfo.engine || 'Relational' }}</div>
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
  Server
} from 'lucide-vue-next'

const props = defineProps<{
  stats: any[]
  serverInfo?: any
  loading?: boolean
  subtitle?: string
}>()

defineEmits(['refresh'])

const displayStats = computed(() => {
  const findStat = (type: string) => props.stats.find(s => s.type === type)?.count || 0
  
  return [
    { label: 'Tables', value: findStat('table'), icon: Table, unit: 'count' },
    { label: 'Views', value: findStat('view'), icon: Eye, unit: 'count' },
    { label: 'Routines', value: findStat('routine'), icon: Code2, unit: 'count' },
    { label: 'Storage', value: findStat('total_size') || '0', icon: Database, unit: 'MB' }
  ]
})
</script>
