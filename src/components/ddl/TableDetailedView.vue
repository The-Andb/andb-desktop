<template>
  <div class="h-full w-full bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-3 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-2" v-if="options">
        <span v-if="options?.engine" class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-[10px] rounded font-mono text-gray-500 uppercase">{{ options.engine }}</span>
        <span v-if="options?.charset" class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-[10px] rounded font-mono text-gray-500 uppercase">{{ options.charset }}</span>
        <p v-if="options?.comment" class="text-xs text-gray-400 italic">{{ options.comment }}</p>
      </div>
      <div v-else></div>
      <div class="flex items-center gap-3">
        <div class="text-right">
          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{{ columns?.length || 0 }} Columns</p>
          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{{ indexes?.length || 0 }} Indexes</p>
        </div>
      </div>
    </div>

    <!-- Tabs Content -->
    <TabGroup as="div" :selectedIndex="activeTab" @change="activeTab = $event" class="flex-1 flex flex-col overflow-hidden" v-if="columns && indexes">
      <TabList class="flex px-4 pt-2 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 space-x-1 shrink-0">
        <Tab v-for="tab in tabs" :key="tab.name" v-slot="{ selected }">
          <button
            class="px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 outline-none"
            :class="[
              selected 
                ? 'text-primary-600 border-primary-500 bg-white dark:bg-gray-900 rounded-t-lg' 
                : 'text-gray-500 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
            ]"
          >
            <div class="flex items-center gap-2">
              <component :is="tab.icon" class="w-3.5 h-3.5" />
              {{ tab.name }}
              <span v-if="tab.count !== undefined" class="ml-1 text-[10px] opacity-60">({{ tab.count }})</span>
            </div>
          </button>
        </Tab>
      </TabList>

      <TabPanels class="flex-1 overflow-auto relative">
        <!-- Columns Tab -->
        <TabPanel class="h-full outline-none">
          <table class="w-full text-left border-collapse table-fixed">
            <thead class="bg-gray-50 dark:bg-gray-800 sticky top-0 z-20 font-bold text-[10px] uppercase text-gray-500 dark:text-gray-400 tracking-wider">
              <tr>
                <th 
                  v-for="(header, i) in ['#', 'Column', 'Data Type', 'PK', 'NN', 'UQ', 'AI', 'Default', 'Comment']" 
                  :key="header"
                  class="px-6 py-3 border-b border-gray-200 dark:border-gray-700 relative group overflow-hidden"
                  :title="header === 'PK' ? 'Primary Key' : header === 'NN' ? 'Not Null' : header === 'UQ' ? 'Unique' : header === 'AI' ? 'Auto Increment' : ''"
                  :style="{ width: colResizer.columnWidths.value[i] + 'px' }"
                  :class="[
                    ['PK', 'NN', 'UQ', 'AI'].includes(header) ? 'text-center h-full' : '',
                  ]"
                >
                  <span class="truncate block">{{ header }}</span>
                  <div 
                    class="resize-handle" 
                    :class="{ 'resizing': colResizer.activeColumnIndex.value === i }"
                    @mousedown="colResizer.handleMouseDown(i, $event)"
                  ></div>
                </th>
              </tr>
            </thead>
            <tbody class="text-xs divide-y divide-gray-100 dark:divide-gray-800 font-mono">
              <tr v-for="(col, idx) in columns" :key="col.name" class="hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors">
                <td class="px-6 py-3 text-gray-400 text-center">{{ idx + 1 }}</td>
                <td class="px-6 py-3 font-bold text-gray-900 dark:text-gray-100 truncate">
                  <div class="flex items-center gap-2 truncate">
                    <Key v-if="col.pk" class="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0" />
                    <Circle v-else class="w-2 h-2 text-blue-400 opacity-50 shrink-0" />
                    <span class="truncate">{{ col.name }}</span>
                  </div>
                </td>
                <td class="px-6 py-3 text-blue-600 dark:text-blue-400 font-bold uppercase truncate">{{ col.type }}</td>
                <td class="px-3 py-3 text-center">
                  <div class="w-3 h-3 rounded-sm mx-auto" :class="col.pk ? 'bg-yellow-500' : 'bg-gray-200 dark:bg-gray-700'"></div>
                </td>
                <td class="px-3 py-3 text-center">
                  <div class="w-3 h-3 rounded-sm mx-auto" :class="col.notNull ? 'bg-primary-500' : 'border border-gray-300 dark:border-gray-600'"></div>
                </td>
                <td class="px-3 py-3 text-center">
                  <div class="w-3 h-3 rounded-sm mx-auto" :class="col.unique ? 'bg-primary-500' : 'border border-gray-300 dark:border-gray-600'"></div>
                </td>
                <td class="px-3 py-3 text-center">
                  <div class="w-3 h-3 rounded-sm mx-auto" :class="col.autoIncrement ? 'bg-primary-500' : 'border border-gray-300 dark:border-gray-600'"></div>
                </td>
                <td class="px-6 py-3 text-gray-500 italic truncate">{{ col.default || 'NULL' }}</td>
                <td class="px-6 py-3 text-gray-400 truncate">{{ col.comment }}</td>
              </tr>
            </tbody>
          </table>
        </TabPanel>

        <!-- Indexes Tab -->
        <TabPanel class="h-full outline-none">
          <table class="w-full text-left border-collapse table-fixed">
            <thead class="bg-gray-50 dark:bg-gray-800 sticky top-0 z-20 font-bold text-[10px] uppercase text-gray-500 dark:text-gray-400 tracking-wider">
              <tr>
                <th 
                  v-for="(header, i) in ['Index Name', 'Type', 'Columns', 'Definition']" 
                  :key="header"
                  class="px-6 py-3 border-b border-gray-200 dark:border-gray-700 relative group overflow-hidden"
                  :style="{ width: idxResizer.columnWidths.value[i] + 'px' }"
                >
                  <span class="truncate block">{{ header }}</span>
                  <div 
                    class="resize-handle" 
                    :class="{ 'resizing': idxResizer.activeColumnIndex.value === i }"
                    @mousedown="idxResizer.handleMouseDown(i, $event)"
                  ></div>
                </th>
              </tr>
            </thead>
            <tbody class="text-xs divide-y divide-gray-100 dark:divide-gray-800 font-mono">
              <tr v-for="idx in indexes" :key="idx.name" class="hover:bg-primary-50/30 dark:hover:bg-primary-900/10">
                <td class="px-6 py-3 font-bold text-gray-900 dark:text-white truncate">
                  <div class="flex items-center gap-2 truncate">
                    <Search class="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span class="truncate">{{ idx.name }}</span>
                  </div>
                </td>
                <td class="px-6 py-3 truncate">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap" :class="idx.type === 'PRIMARY KEY' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'">
                    {{ idx.type }}
                  </span>
                </td>
                <td class="px-6 py-3 text-primary-600 truncate">{{ idx.columns }}</td>
                <td class="px-6 py-3 text-gray-400 text-[10px] truncate">{{ idx.definition }}</td>
              </tr>
              <tr v-if="!indexes || indexes.length === 0">
                <td colspan="4" class="px-6 py-12 text-center text-gray-400 italic">No indexes defined</td>
              </tr>
            </tbody>
          </table>
        </TabPanel>

        <!-- Foreign Keys Tab -->
        <TabPanel class="h-full outline-none">
          <table class="w-full text-left border-collapse table-fixed">
            <thead class="bg-gray-50 dark:bg-gray-800 sticky top-0 z-20 font-bold text-[10px] uppercase text-gray-500 dark:text-gray-400 tracking-wider">
              <tr>
                <th 
                  v-for="(header, i) in ['FK Name', 'Columns', 'References', 'On Update/Delete']" 
                  :key="header"
                  class="px-6 py-3 border-b border-gray-200 dark:border-gray-700 relative group overflow-hidden"
                  :style="{ width: fkResizer.columnWidths.value[i] + 'px' }"
                >
                  <span class="truncate block">{{ header }}</span>
                  <div 
                    class="resize-handle" 
                    :class="{ 'resizing': fkResizer.activeColumnIndex.value === i }"
                    @mousedown="fkResizer.handleMouseDown(i, $event)"
                  ></div>
                </th>
              </tr>
            </thead>
            <tbody class="text-xs divide-y divide-gray-100 dark:divide-gray-800 font-mono">
              <tr v-for="fk in foreignKeys" :key="fk.name" class="hover:bg-primary-50/30 dark:hover:bg-primary-900/10">
                <td class="px-6 py-3 font-bold text-gray-900 dark:text-white truncate">{{ fk.name }}</td>
                <td class="px-6 py-3 truncate">{{ fk.localColumns }}</td>
                <td class="px-6 py-3 truncate">
                  <div class="flex items-center gap-1">
                    <span class="text-primary-600 font-bold">{{ fk.referencedTable }}</span>
                    <span class="text-gray-400">({{ fk.referencedColumns }})</span>
                  </div>
                </td>
                <td class="px-6 py-3 text-gray-400 text-[10px]">{{ fk.onUpdate || 'CASCADE' }} / {{ fk.onDelete || 'CASCADE' }}</td>
              </tr>
              <tr v-if="!foreignKeys || foreignKeys.length === 0">
                <td colspan="4" class="px-6 py-12 text-center text-gray-400 italic">No foreign keys defined</td>
              </tr>
            </tbody>
          </table>
        </TabPanel>

        <!-- Triggers Tab -->
        <TabPanel class="h-full outline-none flex bg-gray-50/30 dark:bg-gray-900/30">
          <!-- Left Sidebar: Timing/Event List -->
          <div class="w-48 xl:w-64 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-900 shrink-0">
            <div class="px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 font-bold text-[10px] text-gray-500 uppercase tracking-wider flex justify-between items-center">
              <span>Trigger Timing / Event</span>
            </div>
            <div class="flex-1 overflow-y-auto w-full">
              <div class="text-xs font-mono font-bold">
                <template v-for="timingEvent in ['BEFORE INSERT', 'AFTER INSERT', 'BEFORE UPDATE', 'AFTER UPDATE', 'BEFORE DELETE', 'AFTER DELETE']" :key="timingEvent">
                  <div 
                    @click="selectedTriggerEvent = timingEvent"
                    class="px-4 py-2 text-left cursor-pointer border-b border-gray-50 dark:border-gray-800/50 transition-colors flex justify-between items-center group"
                    :class="selectedTriggerEvent === timingEvent ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'"
                  >
                    <span>{{ timingEvent }}</span>
                    <!-- Plus icon indicates click to add (if we had create functionality), or just show a dot if trigger exists -->
                    <div v-if="getTriggerForEvent(timingEvent)" class="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_4px_rgba(var(--color-primary-500),0.5)]"></div>
                    <Plus v-else class="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                  </div>
                </template>
              </div>
            </div>
          </div>
          
          <!-- Right Content: Trigger Definition -->
          <div class="flex-1 flex flex-col min-h-0 relative">
            <div v-if="selectedTrigger" class="flex-1 flex flex-col h-full bg-white dark:bg-gray-950">
               <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
                 <div class="flex items-center gap-3">
                   <Zap class="w-4 h-4 text-orange-500" />
                   <h4 class="font-bold text-sm text-gray-900 dark:text-white">{{ selectedTrigger.name }}</h4>
                 </div>
                 <span class="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-bold rounded uppercase">{{ selectedTrigger.timing }} {{ selectedTrigger.event }}</span>
               </div>
               <div class="flex-1 overflow-hidden relative">
                 <DDLViewer 
                    v-if="selectedTrigger.ddl || selectedTrigger.content"
                    :content="selectedTrigger.ddl || selectedTrigger.content" 
                    :font-size="appStore.fontSizes.code" 
                    :font-family="appStore.fontFamilies.code"
                    class="h-full border-0 absolute inset-0"
                 />
                 <div v-else class="p-6 text-gray-500 italic text-sm">No definition body provided by parser.</div>
               </div>
            </div>
            
            <div v-else class="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-400 italic bg-gray-50/30 dark:bg-gray-900/20">
              <ZapOff class="w-12 h-12 mb-3 opacity-20" />
              <p>No trigger defined for <span class="font-bold text-gray-500 dark:text-gray-300">{{ selectedTriggerEvent }}</span></p>
              <p class="text-[10px] mt-2 opacity-60">Select an event from the list to view its trigger definition.</p>
            </div>
          </div>
        </TabPanel>

        <!-- Partitions Tab -->
        <TabPanel class="h-full outline-none flex flex-col bg-gray-50/50 dark:bg-gray-800">
          <div v-if="parsedPartitions" class="flex-1 flex flex-col min-h-0">
            <!-- Workbench Style Header -->
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0 text-[11px]">
              <div class="flex items-center gap-2 mb-4">
                <input type="checkbox" checked disabled class="rounded border-gray-300 dark:border-gray-600 text-primary-500 bg-gray-100 dark:bg-gray-700">
                <span class="font-bold text-gray-900 dark:text-gray-200">Enable Partitioning</span>
              </div>
              
              <div class="grid grid-cols-[auto_1fr_auto] gap-x-6 gap-y-3 items-center w-full max-w-4xl">
                <!-- Partition By -->
                <div class="flex items-center gap-2 justify-end">
                  <span class="text-gray-600 dark:text-gray-400 font-bold whitespace-nowrap">Partition by:</span>
                  <select disabled class="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 min-w-[120px] text-gray-900 dark:text-gray-200 focus:outline-none appearance-none font-mono">
                    <option>{{ parsedPartitions.type }}</option>
                  </select>
                </div>
                <!-- Parameters -->
                <div class="flex items-center gap-2">
                  <span class="text-gray-600 dark:text-gray-400 whitespace-nowrap">Parameters:</span>
                  <input type="text" readonly :value="parsedPartitions.expression" class="flex-1 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 w-full text-gray-900 dark:text-gray-200 focus:outline-none font-mono">
                </div>
                <!-- Partition Count -->
                <div class="flex items-center gap-2 justify-end">
                  <span class="text-gray-600 dark:text-gray-400 whitespace-nowrap">Partition Count:</span>
                  <input type="text" readonly :value="parsedPartitions.count" class="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 w-16 text-center text-gray-900 dark:text-gray-200 focus:outline-none font-mono">
                </div>

                <!-- Subpartition By -->
                <div class="flex items-center gap-2 justify-end">
                  <span class="text-gray-600 dark:text-gray-400 font-bold whitespace-nowrap">Subpartition by:</span>
                  <select disabled class="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 min-w-[120px] text-gray-900 dark:text-gray-200 focus:outline-none appearance-none font-mono">
                    <option>{{ parsedPartitions.subpartitionType }}</option>
                  </select>
                </div>
                <!-- Sub Parameters -->
                <div class="flex items-center gap-2">
                  <span class="text-gray-600 dark:text-gray-400 whitespace-nowrap">Parameters:</span>
                  <input type="text" readonly :value="parsedPartitions.subpartitionExpression" class="flex-1 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 w-full text-gray-900 dark:text-gray-200 focus:outline-none font-mono">
                </div>
                <!-- Subpartition Count -->
                <div class="flex items-center gap-2 justify-end">
                  <span class="text-gray-600 dark:text-gray-400 whitespace-nowrap">Subpartition Count:</span>
                  <input type="text" readonly :value="parsedPartitions.subpartitionCount" class="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 w-16 text-center text-gray-900 dark:text-gray-200 focus:outline-none font-mono">
                </div>
              </div>
            </div>

            <!-- Workbench Style Data Grid -->
            <div class="flex-1 overflow-auto bg-white dark:bg-gray-800">
              <table class="w-full text-left border-collapse text-[11px] whitespace-nowrap table-fixed">
                <thead class="bg-gray-100 dark:bg-gray-900 sticky top-0 z-10 shadow-[0_1px_0_rgba(0,0,0,0.1)] dark:shadow-[0_1px_0_rgba(255,255,255,0.05)]">
                  <tr>
                    <th 
                      v-for="(header, i) in ['Partition', 'Values', 'Data Directory', 'Index Directory', 'Min Rows', 'Max Rows', 'Comment']" 
                      :key="header"
                      class="px-4 py-2 font-normal text-gray-500 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 relative group overflow-hidden"
                      :style="{ width: partResizer.columnWidths.value[i] + 'px' }"
                    >
                      <span class="truncate block">{{ header }}</span>
                      <div 
                        class="resize-handle" 
                        :class="{ 'resizing': partResizer.activeColumnIndex.value === i }"
                        @mousedown="partResizer.handleMouseDown(i, $event)"
                      ></div>
                    </th>
                  </tr>
                </thead>
                <tbody class="font-mono divide-y divide-gray-100 dark:divide-gray-700">
                  <tr v-for="part in parsedPartitions.partitions" :key="part.name" class="hover:bg-primary-50/50 dark:hover:bg-primary-900/20 text-gray-800 dark:text-gray-200">
                    <td class="px-4 py-1.5 border-r border-gray-100 dark:border-gray-700 truncate">{{ part.name }}</td>
                    <td class="px-4 py-1.5 border-r border-gray-100 dark:border-gray-700 truncate">{{ part.values }}</td>
                    <td class="px-4 py-1.5 border-r border-gray-100 dark:border-gray-700 text-gray-500 truncate">{{ part.dataDir }}</td>
                    <td class="px-4 py-1.5 border-r border-gray-100 dark:border-gray-700 text-gray-500 truncate">{{ part.indexDir }}</td>
                    <td class="px-4 py-1.5 border-r border-gray-100 dark:border-gray-700 text-gray-500 truncate">{{ part.minRows }}</td>
                    <td class="px-4 py-1.5 border-r border-gray-100 dark:border-gray-700 text-gray-500 truncate">{{ part.maxRows }}</td>
                    <td class="px-4 py-1.5 text-gray-500 truncate">{{ part.comment }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-else class="flex flex-col items-center justify-center p-12 text-center text-gray-400 italic bg-gray-50/30 dark:bg-gray-900/20 h-full">
            <Layers class="w-12 h-12 mb-3 opacity-20" />
            <p>This table is not partitioned.</p>
          </div>
        </TabPanel>
      </TabPanels>
    </TabGroup>

    <!-- Footer Status -->
    <div class="px-6 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        <span class="flex items-center gap-1.5"><Key class="w-3 h-3 text-yellow-500" /> PK: Primary Key</span>
        <span class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 bg-primary-500 rounded-sm"></div> NN: Not Null</span>
      </div>
      <p class="text-[10px] font-bold text-gray-400">MySQL Workbench Mode</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue'
import { 
  Key, Circle, Search, Zap, ZapOff, Layers, ListTree, Plus
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { useTableResizer } from '@/composables/useTableResizer'
import DDLViewer from './DDLViewer.vue'

const appStore = useAppStore()

// Initialize resizers for each table
// Columns tab: #, Column, Data Type, PK, NN, UQ, AI, Default, Comment
const colResizer = useTableResizer('detailed-view-cols', [50, 200, 150, 40, 40, 40, 40, 150, 250])
// Indexes tab: Index Name, Type, Columns, Definition
const idxResizer = useTableResizer('detailed-view-idxs', [200, 100, 200, 400])
// Foreign Keys tab: FK Name, Columns, References, On Update/Delete
const fkResizer = useTableResizer('detailed-view-fks', [200, 150, 250, 200])
// Partitions tab: Partition, Values, Data Dir, Index Dir, Min Rows, Max Rows, Comment
const partResizer = useTableResizer('detailed-view-parts', [150, 200, 150, 150, 80, 80, 200])

const props = defineProps<{
  tableName: string
  columns: any[]
  indexes: any[]
  foreignKeys: any[]
  options: any
  partitions: string | null
  triggers: any[] // All triggers from schema for cross-referencing
}>()

const activeTab = ref(0)
const selectedTriggerEvent = ref('BEFORE INSERT') // Default selection for Triggers tab

// Reset state when switching tables
watch(() => props.tableName, () => {
  activeTab.value = 0
  selectedTriggerEvent.value = 'BEFORE INSERT'
})

const tableTriggers = computed(() => {
  if (!props.triggers) return []
  return props.triggers.filter(t => {
    // Simple table name heuristics
    const upDDL = (t.ddl || t.content || '').toUpperCase()
    const upTableName = props.tableName.toUpperCase()
    return upDDL.includes(`ON \`${upTableName}\``) || upDDL.includes(`ON ${upTableName}`)
  }).map(t => {
    // Normalize timing and event if not fully parsed
    let timing = (t.timing || '').toUpperCase()
    let event = (t.event || '').toUpperCase()
    
    // Attempt fallback parsing from DDL if missing
    if (!timing || !event) {
        const upDDL = (t.ddl || t.content || '').toUpperCase()
        if (upDDL.includes('BEFORE INSERT')) { timing = 'BEFORE'; event = 'INSERT' }
        else if (upDDL.includes('AFTER INSERT')) { timing = 'AFTER'; event = 'INSERT' }
        else if (upDDL.includes('BEFORE UPDATE')) { timing = 'BEFORE'; event = 'UPDATE' }
        else if (upDDL.includes('AFTER UPDATE')) { timing = 'AFTER'; event = 'UPDATE' }
        else if (upDDL.includes('BEFORE DELETE')) { timing = 'BEFORE'; event = 'DELETE' }
        else if (upDDL.includes('AFTER DELETE')) { timing = 'AFTER'; event = 'DELETE' }
    }
    
    return { ...t, timing, event }
  })
})

const getTriggerForEvent = (timingEventStr: string) => {
    // Split "BEFORE INSERT" into timing and event
    const parts = timingEventStr.split(' ')
    const timing = parts[0]
    const event = parts[1]
    
    return tableTriggers.value.find(t => t.timing === timing && t.event === event)
}

const selectedTrigger = computed(() => {
    return getTriggerForEvent(selectedTriggerEvent.value)
})

const parsedPartitions = computed(() => {
  if (!props.partitions) return null;
  const ddl = props.partitions;
  
  const result = {
    type: 'Unknown',
    expression: '',
    count: 0,
    subpartitionType: 'Disabled',
    subpartitionExpression: '',
    subpartitionCount: 0,
    partitions: [] as Array<{
      name: string;
      values: string;
      dataDir: string;
      indexDir: string;
      minRows: string;
      maxRows: string;
      comment: string;
    }>
  };

  const typeMatch = ddl.match(/PARTITION\s+BY\s+([A-Z\s]+?)\s*\((.*?)\)/i);
  if (typeMatch) {
    result.type = typeMatch[1].trim().toUpperCase();
    result.expression = typeMatch[2].trim();
  }
  
  const countMatch = ddl.match(/PARTITIONS\s+(\d+)/i);
  if (countMatch && !ddl.substring(0, countMatch.index).includes('SUBPARTITION')) {
     result.count = parseInt(countMatch[1]);
  }

  const subTypeMatch = ddl.match(/SUBPARTITION\s+BY\s+([A-Z\s]+?)\s*\((.*?)\)/i);
  if (subTypeMatch) {
     result.subpartitionType = subTypeMatch[1].trim().toUpperCase();
     result.subpartitionExpression = subTypeMatch[2].trim();
  }

  const subCountMatch = ddl.match(/SUBPARTITIONS\s+(\d+)/i);
  if (subCountMatch) {
     result.subpartitionCount = parseInt(subCountMatch[1]);
  }

  // Split partition list (using lookahead for 'PARTITION')
  const partitionBlocks = ddl.split(/(?=PARTITION\s+[a-zA-Z0-9_$]+)/i);
  
  partitionBlocks.forEach(block => {
      // Ignore the wrapper block
      if (block.toUpperCase().trim().startsWith('PARTITION BY')) return;

      const nameMatch = block.match(/PARTITION\s+([a-zA-Z0-9_$]+)/i);
      if (!nameMatch) return;
      const name = nameMatch[1];
      
      let values = '';
      const lessThanMatch = block.match(/VALUES\s+LESS\s+THAN\s*\((.*?)\)/i) || block.match(/VALUES\s+LESS\s+THAN\s+(MAXVALUE)/i);
      const inMatch = block.match(/VALUES\s+IN\s*\((.*?)\)/i);

      if (lessThanMatch) {
          values = lessThanMatch[1] ? lessThanMatch[1].trim() : 'MAXVALUE';
      } else if (inMatch) {
          values = inMatch[1].trim();
      }

      const dataDirMatch = block.match(/DATA\s+DIRECTORY\s*=?\s*'([^']+)'/i);
      const indexDirMatch = block.match(/INDEX\s+DIRECTORY\s*=?\s*'([^']+)'/i);
      const minRowsMatch = block.match(/MIN_ROWS\s*=?\s*(\d+)/i);
      const maxRowsMatch = block.match(/MAX_ROWS\s*=?\s*(\d+)/i);
      const commentMatch = block.match(/COMMENT\s*=?\s*'([^']+)'/i);

      result.partitions.push({
          name,
          values,
          dataDir: dataDirMatch ? dataDirMatch[1] : '',
          indexDir: indexDirMatch ? indexDirMatch[1] : '',
          minRows: minRowsMatch ? minRowsMatch[1] : '',
          maxRows: maxRowsMatch ? maxRowsMatch[1] : '',
          comment: commentMatch ? commentMatch[1] : ''
      });
  });

  if (result.count === 0 && result.partitions.length > 0) {
      result.count = result.partitions.length;
  }

  return result;
});

const tabs = computed(() => [
  { name: 'Columns', icon: ListTree, count: props.columns?.length || 0 },
  { name: 'Indexes', icon: Search, count: props.indexes?.length || 0 },
  { name: 'Foreign Keys', icon: Key, count: props.foreignKeys?.length || 0 },
  { name: 'Triggers', icon: Zap, count: tableTriggers.value.length },
  { name: 'Partitions', icon: Layers, count: props.partitions ? 1 : 0 }
])
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  background-color: transparent;
  transition: background-color 0.2s;
  z-index: 30;
}

.resize-handle:hover, 
.resize-handle.resizing {
  background-color: theme('colors.primary.500');
  opacity: 0.5;
}

/* Ensure content truncate in table cells */
td.truncate {
  max-width: 0;
}
</style>
