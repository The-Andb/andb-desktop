<template>
  <div class="flex-1 bg-white dark:bg-gray-950 overflow-hidden flex flex-col relative">
    <!-- Tab Bar -->
    <TabBar
      v-if="tabs.length > 0"
      :tabs="tabs"
      :active-tab-id="activeTabId"
      @select="id => emit('select-tab', id)"
      @close="id => emit('close-tab', id)"
      @duplicate="id => emit('duplicate-tab', id)"
      @close-others="id => emit('close-others', id)"
      @close-right="id => emit('close-right', id)"
    />

    <div v-if="selectedItem" class="flex-1 flex flex-col overflow-hidden">
      <!-- Item Header / Local Actions -->
      <div
        v-if="selectedItem.type !== 'query' && selectedItem.type !== 'deep-search'"
        class="px-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-800 shrink-0 h-12"
      >
        <div class="flex items-center overflow-hidden gap-3">
          <div
            class="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
          >
            <component :is="getIconForType(selectedItem.type)" class="w-4 h-4" />
          </div>
          <div class="min-w-0">
            <h2 class="font-bold text-gray-900 dark:text-white text-sm truncate">
              {{ selectedItem.name }}
            </h2>
            <span class="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{{
              selectedItem.type
            }}</span>
          </div>

          <!-- High-visibility Stats in Header (Globally across tabs) -->
          <div
            v-if="['tables', 'table'].includes(selectedItem.type) && !selectedItem.isNew"
            class="flex items-center gap-3 ml-4 pl-4 border-l border-gray-250 dark:border-gray-700 select-none shrink-0"
          >
            <!-- Toggle Button -->
            <button
              @click="toggleTableInfo"
              class="p-1 text-gray-400 hover:text-primary-500 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Toggle Table Information"
            >
              <Info class="w-3.5 h-3.5" :class="{ 'text-primary-500': showTableInfo }" />
            </button>

            <template v-if="showTableInfo">
              <!-- Engine -->
              <span
                v-if="detailedData?.options?.engine"
                class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-[10px] rounded font-mono text-gray-600 dark:text-gray-300 uppercase shrink-0 font-bold border border-gray-200 dark:border-gray-600"
              >
                {{ detailedData.options.engine }}
              </span>

              <!-- Charset -->
              <span
                v-if="detailedData?.options?.charset"
                class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-[10px] rounded font-mono text-gray-600 dark:text-gray-300 uppercase shrink-0 font-bold border border-gray-200 dark:border-gray-600"
              >
                {{ detailedData.options.charset }}
              </span>

              <!-- Stats (Row count / Size) -->
              <template v-if="tableStats">
                <div class="flex flex-col">
                  <span class="text-[9px] text-gray-400 uppercase tracking-tighter leading-none mb-0.5"
                    >Rows</span
                  >
                  <span class="text-[11px] font-bold text-gray-700 dark:text-gray-300 font-mono">{{
                    formatNumber(tableStats.rowCount)
                  }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-[9px] text-gray-400 uppercase tracking-tighter leading-none mb-0.5"
                    >Size</span
                  >
                  <span class="text-[11px] font-bold text-gray-700 dark:text-gray-300 font-mono"
                    >{{ Math.round((tableStats.dataLengthMB + tableStats.indexLengthMB) * 10) / 10 }}
                    <span class="text-[9px] opacity-60">MB</span></span
                  >
                </div>
              </template>
            </template>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- View Mode Toggle (Hidden for visual new table builder) -->
          <div
            v-if="['tables', 'table'].includes(selectedItem.type) && !selectedItem.isNew"
            class="flex items-center bg-gray-100 dark:bg-gray-800/80 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700 mx-2 shadow-inner"
          >
           <button
              @click="emit('update:viewMode', 'data')"
              class="px-3 py-1 rounded-md text-[11px] font-bold uppercase transition-all"
              :class="
                viewMode === 'data'
                  ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                  : 'text-gray-400'
              "
            >
              Data
            </button>
            <button
              @click="emit('update:viewMode', 'visual')"
              class="px-3 py-1 rounded-md text-[11px] font-bold uppercase transition-all"
              :class="
                viewMode === 'visual'
                  ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                  : 'text-gray-400'
              "
            >
              Visual
            </button>
            <button
              @click="emit('update:viewMode', 'code')"
              class="px-3 py-1 rounded-md text-[11px] font-bold uppercase transition-all"
              :class="
                viewMode === 'code'
                  ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                  : 'text-gray-400'
              "
            >
              Code
            </button>
           
          </div>

          <!-- Actions only for existing persistence layers -->
          <template v-if="!selectedItem.isNew">
            <!-- Flame Stack (Instant Compare) -->
            <div
              class="flex items-center bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 px-1 py-0.5 shadow-sm"
            >
              <button
                @click="emit('pick-stack', 'source')"
                :class="[isSource ? 'bg-orange-500 text-white' : 'text-orange-400']"
                class="p-1 rounded-full"
              >
                <Workflow class="w-3.5 h-3.5" />
              </button>
              <span v-if="hasSource" class="text-[9px] font-black text-gray-400 mx-0.5 opacity-50"
                >vs</span
              >
              <button
                v-if="hasSource"
                @click="emit('pick-stack', 'target')"
                :class="[isTarget ? 'bg-blue-500 text-white' : 'text-blue-400']"
                class="p-1 rounded-full"
              >
                <Workflow class="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>

            <button @click="emit('snapshot')" class="p-1.5 text-gray-500 hover:text-primary-600">
              <Camera class="w-4 h-4" />
            </button>
            <button @click="emit('download')" class="p-1.5 text-gray-500 hover:text-primary-600">
              <Download class="w-4 h-4" />
            </button>
          </template>
        </div>
      </div>

      <!-- Content Renderer -->
      <div class="flex-1 relative overflow-hidden">
        <!-- Diagram & Query Tabs -->
        <SchemaDiagram v-if="selectedItem.type === 'diagrams'" :tables="tables" />
        <QueryConsole
          v-else-if="selectedItem.type === 'query'"
          :connection="selectedItem.connection"
          :initial-sql="selectedItem.initialSql"
          :schema-metadata="schemaMetadata"
        />
        <DefinitionSearchPanel
          v-else-if="selectedItem.type === 'deep-search'"
          :connection="connection"
          :initial-query="selectedItem.initialQuery"
          @open-editor="data => emit('open-editor', data)"
        />

        <template v-else-if="['tables', 'table'].includes(selectedItem.type)">
          <TableDataInspector v-if="viewMode === 'data'" :connection="connection" :table-name="selectedItem.name" />
          <DDLViewer v-else-if="viewMode === 'code'" :content="formattedDdl" :navigatable-names="navigatableNames" @navigate-to-definition="word => emit('navigate-to-definition', word)" />
          <TableDetailedView
            v-else-if="detailedData"
            :table-name="selectedItem.name"
            :columns="detailedData.columns"
            :indexes="detailedData.indexes"
            :foreign-keys="detailedData.foreignKeys"
            :options="detailedData.options"
            :partitions="detailedData.partitions"
            :triggers="triggers"
            :is-new="selectedItem.isNew"
            :stats="tableStats"
            @refresh-stats="fetchTableStats"
            @apply-table="sql => emit('apply-table', sql)"
          />
          <!-- Analyzing/Parsing state fallback -->
          <div
            v-else
            class="flex-1 flex flex-col items-center justify-center p-12 text-center h-full absolute inset-0 z-30 bg-white dark:bg-gray-950"
          >
            <Loader2 class="w-8 h-8 text-primary-500 animate-spin mb-4" />
            <h3 class="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-gray-200 mb-1">Analyzing Schema AST</h3>
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Decoding Table Architecture...</p>
          </div>
        </template>

        <!-- Non-Table Items (Views, Functions, Procedures, etc.) Always Fallback to Code View -->
        <DDLViewer v-else :content="formattedDdl" :navigatable-names="navigatableNames" @navigate-to-definition="word => emit('navigate-to-definition', word)" />
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-400 opacity-40"
    >
      <MousePointer2 class="w-16 h-16 text-primary-500/50 mb-6" />
      <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-widest">
        {{ $t('schema.selectObject') }}
      </h3>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Workflow,
  Camera,
  Download,
  MousePointer2,
  Grid3X3,
  Eye,
  Cpu,
  Sigma,
  Zap,
  CalendarClock,
  Network,
  Database,
  Loader2,
  Info
} from 'lucide-vue-next'
import TabBar from '@/components/general/TabBar.vue'
import DDLViewer from '@/components/ddl/DDLViewer.vue'
import SchemaDiagram from '@/components/ddl/SchemaDiagram.vue'
import TableDetailedView from '@/components/ddl/TableDetailedView.vue'
import QueryConsole from '@/components/schema/QueryConsole.vue'
import TableDataInspector from '@/components/schema/TableDataInspector.vue'
import DefinitionSearchPanel from '@/components/schema/DefinitionSearchPanel.vue'
import Andb from '@/utils/andb'

const props = defineProps<{
  connection?: any
  tabs: any[]
  activeTabId: string | null
  selectedItem: any
  viewMode: 'visual' | 'code' | 'data'
  formattedDdl?: string
  detailedData?: any
  tables: any[]
  isSource: boolean
  isTarget: boolean
  hasSource: boolean
  triggers: any[]
  navigatableNames?: string[]
  schemaMetadata?: { tables: string[], columns: Record<string, string[]> }
}>()

// Table stats logic
const tableStats = ref<any>(null)

const showTableInfo = ref(localStorage.getItem('andb_show_table_info') !== 'false')

const toggleTableInfo = () => {
  showTableInfo.value = !showTableInfo.value
  localStorage.setItem('andb_show_table_info', String(showTableInfo.value))
}

const formatNumber = (num: number) => {
  if (num === undefined || num === null) return '0'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

const fetchTableStats = async () => {
  if (!props.connection || !props.selectedItem || props.selectedItem.isNew || !['tables', 'table'].includes(props.selectedItem.type)) {
    tableStats.value = null
    return
  }
  try {
    const stats = await Andb.getTableStats(props.connection)
    const list = Array.isArray(stats) ? stats : (stats as any)?.data || []
    tableStats.value = list.find((s: any) => s.tableName === props.selectedItem.name) || null
  } catch (err) {
    console.warn('Failed to fetch table stats:', err)
    tableStats.value = null
  }
}

watch(
  () => [props.selectedItem?.name, props.connection],
  () => {
    fetchTableStats()
  },
  { immediate: true }
)

const emit = defineEmits<{
  'select-tab': [id: string]
  'close-tab': [id: string]
  'duplicate-tab': [id: string]
  'close-others': [id: string]
  'close-right': [id: string]
  'update:viewMode': [mode: 'visual' | 'code' | 'data']
  'pick-stack': [type: 'source' | 'target']
  snapshot: []
  download: []
  'apply-table': [sql: string]
  'navigate-to-definition': [word: string]
  'open-editor': [data: { sql: string; title: string }]
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
