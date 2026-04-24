<template>
  <div class="h-full w-full bg-white dark:bg-gray-950 flex flex-col overflow-hidden">
    <!-- Main Toolbar (Premium Style) -->
    <div class="flex-none h-14 px-4 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
      <div class="flex items-center gap-3">
        <button 
          @click="handleExecute(false)" 
          :disabled="isLoading || !sql.trim()"
          class="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-500 disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white text-[11px] font-black uppercase tracking-[0.15em] rounded-md shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
        >
          <Play v-if="!isLoading" class="w-3.5 h-3.5 fill-current" />
          <Loader2 v-else class="w-3.5 h-3.5 animate-spin" />
          {{ isLoading ? 'Running...' : 'Run Query' }}
        </button>

        <div class="h-6 w-[1px] bg-gray-200 dark:bg-gray-700 mx-2"></div>

        <div class="flex items-center gap-1">
          <button @click="formatSql" class="flex items-center gap-2 px-3 py-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors group">
            <AlignLeft class="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span class="text-[10px] font-bold uppercase tracking-widest">Format SQL</span>
          </button>
          
          <button @click="handleExplain" class="flex items-center gap-2 px-3 py-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors group">
            <Zap class="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            <span class="text-[10px] font-bold uppercase tracking-widest">Explain Plan</span>
          </button>

          <button @click="copySql" class="flex items-center gap-2 px-3 py-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors group">
            <Save class="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span class="text-[10px] font-bold uppercase tracking-widest">Save Snippet</span>
          </button>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <span>Export As:</span>
          <div class="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
            <button @click="downloadCsv(activeSession!)" class="px-3 py-1 hover:bg-gray-50 dark:hover:bg-gray-700 border-r border-gray-200 dark:border-gray-700 transition-colors">CSV</button>
            <button @click="copyResultsAsJson(activeSession!)" class="px-3 py-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">JSON</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Editor Section -->
    <div class="flex-none relative bg-white dark:bg-[#1e1e1e] overflow-hidden" :style="{ height: editorHeight + 'px' }">
      <MonacoEditor 
        ref="monacoRef"
        v-model="sql"
        language="sql"
        @execute="handleExecute(false)"
        @executeNew="handleExecute(true)"
        :options="{
          lineNumbers: 'on',
          glyphMargin: false,
          folding: true,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 3,
          fontSize: 13,
          fontFamily: 'JetBrains Mono, monospace',
          minimap: { enabled: false }
        }"
      />
    </div>

    <!-- Resizer Handle -->
    <div 
      class="h-1.5 cursor-row-resize hover:bg-primary-500/50 transition-colors z-10 bg-gray-100 dark:bg-gray-800 flex items-center justify-center group"
      @mousedown="startEditorResize"
    >
      <div class="w-12 h-[2px] bg-gray-300 dark:bg-gray-600 rounded-full group-hover:bg-white transition-colors"></div>
    </div>

    <!-- Results Pane -->
    <div class="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-950 relative">
      <!-- Result Selector Tabs -->
      <div class="flex-none px-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div class="flex items-center overflow-x-auto no-scrollbar gap-1 py-2">
          <div 
            v-for="(session, idx) in sessions" 
            :key="session.id"
            @click="activeSessionId = session.id"
            class="group flex items-center gap-2 px-4 py-1.5 rounded-md cursor-pointer transition-all whitespace-nowrap relative"
            :class="[
              activeSessionId === session.id 
                ? 'text-primary-500 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            ]"
          >
            <span class="text-[10px] font-black uppercase tracking-[0.1em]">{{ session.name }}</span>
            <button 
              v-if="!session.isPinned"
              @click.stop="closeSession(session.id)" 
              class="p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
            >
              <X class="w-3 h-3" />
            </button>
          </div>
          <button @click="handleExecute(true)" class="p-2 text-gray-400 hover:text-primary-500 transition-colors" title="New Query Tab">
            <Plus class="w-4 h-4" />
          </button>
        </div>
        
        <div v-if="activeSession" class="flex items-center gap-6">
          <div class="flex border-b-2 border-transparent">
            <button class="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-primary-500 border-b-2 border-primary-500">Data Grid</button>
            <button class="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors">Query Info</button>
            <button class="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors">Chart</button>
          </div>
        </div>
      </div>

      <!-- Active Content -->
      <div v-if="activeSession" class="flex-1 flex flex-col min-h-0 overflow-hidden">
        <!-- Result Content (Virtual Scroller) -->
        <div v-if="!activeSession.isError && activeSession.results" class="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-950">
          <!-- Sticky Header -->
          <div class="flex-none bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center z-20 shadow-sm overflow-hidden">
            <div class="w-12 px-4 py-3 text-[9px] font-black uppercase text-gray-400 tracking-tighter shrink-0 border-r border-gray-200 dark:border-gray-800 text-center">#</div>
            <div class="flex-1 flex overflow-hidden divide-x divide-gray-200 dark:divide-gray-800">
              <div 
                v-for="(header, i) in getColumnHeaders(activeSession)" 
                :key="header"
                class="px-4 py-3 text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-widest relative group overflow-hidden shrink-0"
                :style="{ width: resizer.columnWidths.value[i] + 'px' }"
              >
                <span class="truncate block">{{ header }}</span>
                <div 
                  class="resize-handle" 
                  :class="{ 'resizing': resizer.activeColumnIndex.value === i }"
                  @mousedown="resizer.handleMouseDown(i, $event)"
                ></div>
              </div>
            </div>
          </div>

          <!-- Virtual Body -->
          <RecycleScroller
            class="flex-1 custom-scrollbar"
            :items="activeSession.results.map((r, i) => ({ ...r, _v_id: i }))"
            :item-size="32"
            key-field="_v_id"
            v-slot="{ item, index }"
          >
            <div class="flex items-center border-b border-gray-100 dark:border-gray-800 hover:bg-primary-500/[0.03] transition-colors group text-[11px] font-mono h-[32px]">
              <div class="w-12 px-4 text-gray-400 text-center border-r border-gray-100 dark:border-gray-800 opacity-50 shrink-0">{{ index + 1 }}</div>
              <div class="flex-1 flex overflow-hidden divide-x divide-gray-100 dark:divide-gray-800 h-full">
                <div 
                  v-for="(header, i) in getColumnHeaders(activeSession)" 
                  :key="header" 
                  class="px-4 flex items-center truncate text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white shrink-0"
                  :style="{ width: resizer.columnWidths.value[i] + 'px' }"
                >
                  <span :class="{ 'text-emerald-500 font-bold': typeof item[header] === 'number' }">
                    {{ formatValue(item[header]) }}
                  </span>
                </div>
              </div>
            </div>
          </RecycleScroller>
        </div>

        <!-- Error/Empty handled similarly... -->
      </div>
      
      <!-- Placeholder if no active session -->
      <div v-else class="flex-1 flex flex-col items-center justify-center text-gray-400/50 italic">
        <Database class="w-12 h-12 mb-4 opacity-20" />
        <p class="text-sm tracking-tight font-medium">Ready to execute SQL on <span class="text-primary-500 font-bold">{{ connection.name }}</span></p>
      </div>
    </div>

    <!-- Technical Status Bar -->
    <div class="flex-none h-8 px-4 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2">
          <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          <span class="text-gray-400">{{ connection.name }}</span>
        </div>
        <div class="flex items-center gap-4 text-gray-400/60">
          <span>{{ connection.host }}:{{ connection.port }}</span>
          <span>UTF-8</span>
          <span class="text-primary-500">{{ connection.type }}Dialect</span>
        </div>
      </div>
      
      <div v-if="activeSession" class="flex items-center gap-6">
        <div class="flex items-center gap-1.5">
          <span class="text-gray-400/40">ROWS:</span>
          <span class="text-emerald-500">{{ activeSession.results?.length || 0 }} fetched</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="text-gray-400/40">EXEC TIME:</span>
          <span class="text-primary-500">{{ activeSession.executionTime }}ms</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  Play, Loader2, Terminal, Database, AlertCircle, 
  CheckCircle2, X, Plus, Pin, PinOff, 
  Table2, Trash2, Download, Copy, ClipboardCheck, 
  FileJson as ClipboardJson, Zap, AlignLeft, Save
} from 'lucide-vue-next'
import { Andb } from '@/utils/andb'
import { useTableResizer } from '@/composables/useTableResizer'
import MonacoEditor from '@/components/general/MonacoEditor.vue'
import type { DatabaseConnection } from '@/stores/app'

interface ResultSession {
  id: string
  name: string
  sql: string
  results: any[] | null
  executionTime: number
  isError: boolean
  error?: string
  isPinned: boolean
  timestamp: number
}

const props = defineProps<{
  connection: DatabaseConnection
  initialSql?: string
}>()

const sql = ref(props.initialSql || '')
const sessions = ref<ResultSession[]>([])
const activeSessionId = ref<string | null>(null)
const isLoading = ref(false)
const selectedText = ref('')
const editorHeight = ref(300)
const monacoRef = ref<any>(null)

const formatSql = () => {
  monacoRef.value?.format()
}

const activeSession = computed(() => 
  sessions.value.find(s => s.id === activeSessionId.value)
)

const getColumnHeaders = (session: ResultSession) => {
  if (!session.results || session.results.length === 0) return []
  return Object.keys(session.results[0])
}

const resizer = useTableResizer('query-results', Array(50).fill(150))

const formatValue = (val: any): string => {
  if (val === null) return 'NULL'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

const copySql = () => {
  if (!sql.value.trim()) return
  navigator.clipboard.writeText(sql.value)
  // We could add a toast here
}

const downloadCsv = (session: ResultSession) => {
  if (!session.results || session.results.length === 0) return
  
  const headers = getColumnHeaders(session)
  const csvContent = [
    headers.join(','),
    ...session.results.map(row => 
      headers.map(header => {
        let val = row[header]
        if (val === null) return 'NULL'
        if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`
        return String(val)
      }).join(',')
    )
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${session.name}_${new Date().toISOString()}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const copyResultsAsJson = (session: ResultSession) => {
  if (!session.results) return
  navigator.clipboard.writeText(JSON.stringify(session.results, null, 2))
}

const handleExecute = async (newTab: boolean = false) => {
  if (!sql.value.trim() || isLoading.value) return
  
  isLoading.value = true
  const startTime = Date.now()
  const querySql = sql.value.trim()
  
  try {
    const data = await Andb.executeQuery(props.connection, querySql)
    const time = Date.now() - startTime
    
    addResultSession({
      sql: querySql,
      results: Array.isArray(data) ? data : [data],
      executionTime: time,
      isError: false
    }, newTab)
    
  } catch (err: any) {
    addResultSession({
      sql: querySql,
      results: null,
      executionTime: Date.now() - startTime,
      isError: true,
      error: err.message
    }, newTab)
  } finally {
    isLoading.value = false
  }
}

const handleExplain = async () => {
  if (!sql.value.trim() || isLoading.value) return
  const explainSql = `EXPLAIN ${sql.value.trim()}`
  
  isLoading.value = true
  const startTime = Date.now()
  
  try {
    const data = await Andb.executeQuery(props.connection, explainSql)
    addResultSession({
      sql: explainSql,
      results: Array.isArray(data) ? data : [data],
      executionTime: Date.now() - startTime,
      isError: false,
      name: 'Explain'
    }, true) // Always new tab for explain
  } catch (err: any) {
    addResultSession({
      sql: explainSql,
      results: null,
      executionTime: Date.now() - startTime,
      isError: true,
      error: err.message,
      name: 'Explain Error'
    }, true)
  } finally {
    isLoading.value = false
  }
}

const addResultSession = (data: Partial<ResultSession>, forceNew: boolean = false) => {
  // If not forceNew, and current session is not pinned, overwrite it
  if (!forceNew && activeSession.value && !activeSession.value.isPinned) {
    const session = activeSession.value
    session.sql = data.sql || ''
    session.results = data.results || null
    session.executionTime = data.executionTime || 0
    session.isError = data.isError || false
    session.error = data.error
    session.timestamp = Date.now()
    return
  }

  // Otherwise create new
  const id = `session-${Date.now()}`
  const count = sessions.value.length + 1
  const newSession: ResultSession = {
    id,
    name: data.name || `Result ${count}`,
    sql: data.sql || '',
    results: data.results || null,
    executionTime: data.executionTime || 0,
    isError: data.isError || false,
    error: data.error,
    isPinned: false,
    timestamp: Date.now()
  }
  
  sessions.value.push(newSession)
  activeSessionId.value = id
}

const togglePin = (session: ResultSession) => {
  session.isPinned = !session.isPinned
}

const closeSession = (id: string) => {
  const idx = sessions.value.findIndex(s => s.id === id)
  if (idx !== -1) {
    const isClosingActive = activeSessionId.value === id
    sessions.value.splice(idx, 1)
    
    if (isClosingActive && sessions.value.length > 0) {
      activeSessionId.value = sessions.value[Math.max(0, idx - 1)].id
    } else if (sessions.value.length === 0) {
      activeSessionId.value = null
    }
  }
}

const clearAllSessions = () => {
  sessions.value = sessions.value.filter(s => s.isPinned)
  if (sessions.value.length === 0) {
    activeSessionId.value = null
  } else if (!sessions.value.find(s => s.id === activeSessionId.value)) {
    activeSessionId.value = sessions.value[0].id
  }
}

// Editor Resizing Logic
let isResizing = false
const startEditorResize = (e: MouseEvent) => {
  isResizing = true
  document.addEventListener('mousemove', handleResizeMove)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'row-resize'
}

const handleResizeMove = (e: MouseEvent) => {
  if (!isResizing) return
  const newHeight = e.clientY - 140 // Offset for header/tabs
  if (newHeight > 100 && newHeight < window.innerHeight - 200) {
    editorHeight.value = newHeight
  }
}

const stopResize = () => {
  isResizing = false
  document.removeEventListener('mousemove', handleResizeMove)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
}

onMounted(() => {
  // Monaco handles focus internally
})

onUnmounted(() => {
  stopResize()
})
</script>

<style scoped>
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

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
