<template>
  <div class="flex-1 bg-white dark:bg-gray-950 overflow-hidden flex flex-col relative">
    <!-- Tab Bar -->
    <TabBar 
      v-if="tabs.length > 0"
      :tabs="tabs" 
      :active-tab-id="activeTabId" 
      @select="(id) => emit('select-tab', id)" 
      @close="(id) => emit('close-tab', id)"
    />

    <div v-if="selectedItem" class="flex-1 flex flex-col overflow-hidden">
      <!-- Item Header / Local Actions -->
      <div v-if="selectedItem.type !== 'query'" class="p-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-800 shrink-0 h-14">
        <div class="flex items-center overflow-hidden gap-3">
          <div class="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
            <component :is="getIconForType(selectedItem.type)" class="w-4 h-4" />
          </div>
          <div class="min-w-0">
            <h2 class="font-bold text-gray-900 dark:text-white text-sm truncate">{{ selectedItem.name }}</h2>
            <span class="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{{ selectedItem.type }}</span>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <!-- View Mode Toggle -->
          <div v-if="['tables', 'table'].includes(selectedItem.type)" class="flex items-center bg-gray-100 dark:bg-gray-800/80 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700 mx-2 shadow-inner">
            <button 
                @click="emit('update:viewMode', 'visual')"
                class="px-3 py-1 rounded-md text-[11px] font-bold uppercase transition-all"
                :class="viewMode === 'visual' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' : 'text-gray-400'"
            >
                Visual
            </button>
            <button 
                @click="emit('update:viewMode', 'code')"
                class="px-3 py-1 rounded-md text-[11px] font-bold uppercase transition-all"
                :class="viewMode === 'code' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' : 'text-gray-400'"
            >
                Code
            </button>
          </div>

          <!-- Flame Stack (Instant Compare) -->
          <div class="flex items-center bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 px-1 py-0.5 shadow-sm">
            <button @click="emit('pick-stack', 'source')" :class="[isSource ? 'bg-orange-500 text-white' : 'text-orange-400']" class="p-1 rounded-full"><Flame class="w-3.5 h-3.5" /></button>
            <span v-if="hasSource" class="text-[9px] font-black text-gray-400 mx-0.5 opacity-50">vs</span>
            <button v-if="hasSource" @click="emit('pick-stack', 'target')" :class="[isTarget ? 'bg-blue-500 text-white' : 'text-blue-400']" class="p-1 rounded-full"><Flame class="w-3.5 h-3.5" /></button>
          </div>

          <button @click="emit('snapshot')" class="p-1.5 text-gray-500 hover:text-primary-600"><Camera class="w-4 h-4" /></button>
          <button @click="emit('download')" class="p-1.5 text-gray-500 hover:text-primary-600"><Download class="w-4 h-4" /></button>
        </div>
      </div>

      <!-- Content Renderer -->
      <div class="flex-1 relative overflow-hidden">
        <SchemaDiagram v-if="selectedItem.type === 'diagrams'" :tables="tables" />
        <QueryConsole v-else-if="selectedItem.type === 'query'" :connection="selectedItem.connection" />
        <DDLViewer v-else-if="viewMode === 'code'" :content="formattedDDL" />
        <TableDetailedView 
          v-else-if="detailedData"
          :table-name="selectedItem.name"
          :columns="detailedData.columns"
          :indexes="detailedData.indexes"
          :foreign-keys="detailedData.foreignKeys"
          :options="detailedData.options"
          :partitions="detailedData.partitions"
          :triggers="triggers"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-400 opacity-40">
      <MousePointer2 class="w-16 h-16 text-primary-500/50 mb-6" />
      <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-widest">{{ $t('schema.selectObject') }}</h3>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Flame, Camera, Download, MousePointer2, Grid3X3, Eye, Cpu, Sigma, Zap, CalendarClock, Network, Database } from 'lucide-vue-next'
import TabBar from '@/components/general/TabBar.vue'
import DDLViewer from '@/components/ddl/DDLViewer.vue'
import SchemaDiagram from '@/components/ddl/SchemaDiagram.vue'
import TableDetailedView from '@/components/ddl/TableDetailedView.vue'
import QueryConsole from '@/components/schema/QueryConsole.vue'

const props = defineProps<{
  tabs: any[]
  activeTabId: string | null
  selectedItem: any
  viewMode: 'visual' | 'code'
  formattedDDL: string
  detailedData?: any
  tables: any[]
  isSource: boolean
  isTarget: boolean
  hasSource: boolean
  triggers: any[]
}>()

const emit = defineEmits<{
  'select-tab': [id: string]
  'close-tab': [id: string]
  'update:viewMode': [mode: 'visual' | 'code']
  'pick-stack': [type: 'source' | 'target']
  'snapshot': []
  'download': []
}>()

const typeIcons = {
  tables: Grid3X3,
  views: Eye,
  procedures: Cpu,
  functions: Sigma,
  triggers: Zap,
  events: CalendarClock,
  diagrams: Network
}

const getIconForType = (type: string) => {
  const key = type?.toLowerCase() as keyof typeof typeIcons
  return typeIcons[key] || Database
}
</script>
