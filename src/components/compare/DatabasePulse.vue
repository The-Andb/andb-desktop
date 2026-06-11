<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Brain,
  Search,
  Flame,
  ShieldAlert,
  Clock,
  X,
  AlertCircle
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { useAiChatStore } from '@/stores/aiChat'

const appStore = useAppStore()
const chatStore = useAiChatStore()

const props = defineProps<{
  sourceConnection: any
  targetConnection?: any
}>()

// Current connection state
const selectedConnectionSide = ref<'source' | 'target'>('source')
const currentConnection = computed(() => {
  return selectedConnectionSide.value === 'source' ? props.sourceConnection : props.targetConnection
})

// Polling and lifecycle state
const isPolling = ref(true)
const countdown = ref(3)
const dbVersion = ref('')
const loading = ref(false)
const pulseStats = ref({ threadsRunning: 0, lockWaits: 0 })
const lockTree = ref<any[]>([])
const processList = ref<any[]>([])
const searchQuery = ref('')

// AI Diagnose state (delegated to chatStore)

// Explains and modals
const explainResult = ref<any>(null)
const explainModalTitle = ref('')
const showExplainModal = ref(false)
const showConfirmAnalyzeModal = ref(false)
const pendingQueryToAnalyze = ref('')

// Thread kill confirm
const showKillConfirmModal = ref(false)
const pendingThreadToKill = ref<number | null>(null)

// Inactivity tracking (5 minutes)
let pollingTimer: any = null
let countdownTimer: any = null
const lastActivityTime = ref(Date.now())
const isIdle = ref(false)
const IDLE_TIMEOUT = 5 * 60 * 1000 // 5 minutes

const statusLevel = computed(() => {
  const { threadsRunning, lockWaits } = pulseStats.value
  if (threadsRunning >= 25 || lockWaits >= 3) return 'red'
  if (threadsRunning >= 10 || lockWaits > 0) return 'yellow'
  return 'green'
})

const statusMessage = computed(() => {
  const level = statusLevel.value
  if (level === 'red') return 'CRITICAL BOTTLENECK DETECTED'
  if (level === 'yellow') return 'HIGH DB ACTIVITY / LOCK WAITS PRESENT'
  return 'DATABASE PULSE HEALTHY'
})

// Filtered processlist based on search query
const filteredProcessList = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return processList.value
  return processList.value.filter(p => {
    return (
      String(p.ID).toLowerCase().includes(q) ||
      String(p.USER).toLowerCase().includes(q) ||
      String(p.HOST).toLowerCase().includes(q) ||
      String(p.COMMAND).toLowerCase().includes(q) ||
      String(p.STATE).toLowerCase().includes(q) ||
      String(p.INFO).toLowerCase().includes(q)
    )
  })
})

// Parse MySQL version to check EXPLAIN ANALYZE gate (MySQL 8.0.18+)
const isExplainAnalyzeSupported = computed(() => {
  if (!dbVersion.value) return false
  const match = dbVersion.value.match(/^(\d+)\.(\d+)\.(\d+)/)
  if (!match) return false
  const major = parseInt(match[1], 10)
  const minor = parseInt(match[2], 10)
  const patch = parseInt(match[3], 10)
  if (major > 8) return true
  if (major === 8) {
    if (minor > 0) return true
    if (minor === 0) return patch >= 18
  }
  return false
})

// Helper to determine if a query is a SELECT statement
const isSelectQuery = (sql: string) => {
  if (!sql) return false
  return /^\s*select\b/i.test(sql)
}

const sanitize = (obj: any): any => {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj

  // Handle Array
  if (Array.isArray(obj)) {
    return obj.map(item => sanitize(item))
  }

  // Handle Date
  if (obj instanceof Date) {
    return new Date(obj.getTime())
  }

  // Handle RegExp
  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags)
  }

  // Recursively copy keys of the object to strip Vue 3 reactive proxies
  const sanitized: any = {}
  for (const key of Object.keys(obj)) {
    if (key.startsWith('__v_') || key.startsWith('_$')) {
      continue
    }
    const val = obj[key]
    if (typeof val === 'function' || typeof val === 'symbol') {
      continue
    }
    sanitized[key] = sanitize(val)
  }
  return sanitized
}

// Fetch database metadata version
const fetchDbVersion = async () => {
  if (!currentConnection.value) return
  try {
    const result = await window.electronAPI.invoke('andb-get-server-info', { connection: sanitize(currentConnection.value) })
    if (result && result.version) {
      dbVersion.value = result.version
    } else {
      const queryResult = await window.electronAPI.invoke('andb-execute', {
        sourceConnection: sanitize(currentConnection.value),
        operation: 'executeQuery',
        options: { sql: 'SELECT VERSION() AS version' }
      })
      if (queryResult.success && queryResult.data && queryResult.data[0]) {
        dbVersion.value = queryResult.data[0].version
      }
    }
  } catch (err) {
    console.error('Failed to get DB version', err)
  }
}

// Pull metrics from core
const fetchMetrics = async (showLoadingIndicator = false) => {
  if (!currentConnection.value || isIdle.value) return
  if (showLoadingIndicator) loading.value = true
  try {
    // 1. Get Pulse Stats
    const statsRes = await window.electronAPI.monitorPulse(sanitize(currentConnection.value))
    if (statsRes) {
      pulseStats.value = statsRes
    }

    // 2. If warning/critical, or manual diagnose is active, fetch snapshot
    const snapshotRes = await window.electronAPI.monitorSnapshot(sanitize(currentConnection.value))
    if (snapshotRes) {
      lockTree.value = snapshotRes.lockTree || []
      processList.value = snapshotRes.processList || []
    }
  } catch (err) {
    console.error('Database Pulse Poll error:', err)
  } finally {
    loading.value = false
  }
}

// Polling control
const startPolling = () => {
  stopPolling()
  isIdle.value = false
  isPolling.value = true
  countdown.value = 3
  
  fetchMetrics(true)

  pollingTimer = setInterval(() => {
    // Inactivity timeout check
    if (Date.now() - lastActivityTime.value > IDLE_TIMEOUT) {
      isIdle.value = true
      isPolling.value = false
      stopPolling()
      return
    }
    fetchMetrics()
  }, 3000)

  countdownTimer = setInterval(() => {
    if (countdown.value > 1) {
      countdown.value--
    } else {
      countdown.value = 3
    }
  }, 1000)
}

const stopPolling = () => {
  isPolling.value = false
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

const togglePolling = () => {
  if (isPolling.value) {
    stopPolling()
  } else {
    lastActivityTime.value = Date.now()
    startPolling()
  }
}

// Activity logging to reset inactivity timer
const recordActivity = () => {
  lastActivityTime.value = Date.now()
  if (isIdle.value) {
    startPolling()
  }
}

// Page visibility listener
const handleVisibilityChange = () => {
  if (document.hidden) {
    stopPolling()
  } else if (isPolling.value) {
    startPolling()
  }
}

// Thread Kill Logic
const confirmKillThread = (threadId: number) => {
  pendingThreadToKill.value = threadId
  showKillConfirmModal.value = true
}

const executeKillThread = async () => {
  if (pendingThreadToKill.value === null || !currentConnection.value) return
  loading.value = true
  try {
    await window.electronAPI.monitorKill(
      sanitize(currentConnection.value),
      pendingThreadToKill.value
    )
    
    // Immediate refresh
    await fetchMetrics(true)
  } catch (err: any) {
    alert(`Failed to kill thread: ${err.message}`)
  } finally {
    loading.value = false
    showKillConfirmModal.value = false
    pendingThreadToKill.value = null
  }
}

// Explain and Explain Analyze Logic
const runExplain = async (sql: string) => {
  if (!currentConnection.value) return
  loading.value = true
  explainModalTitle.value = 'Quick EXPLAIN Result'
  try {
    const result = await window.electronAPI.invoke('andb-execute', {
      sourceConnection: sanitize(currentConnection.value),
      operation: 'executeQuery',
      options: { sql: `EXPLAIN ${sql}` }
    })
    explainResult.value = result.success ? result.data : [{ Error: result.error }]
    showExplainModal.value = true
  } catch (e: any) {
    explainResult.value = [{ Error: e.message }]
    showExplainModal.value = true
  } finally {
    loading.value = false
  }
}

const triggerExplainAnalyze = (sql: string) => {
  pendingQueryToAnalyze.value = sql
  showConfirmAnalyzeModal.value = true
}

const runExplainAnalyze = async () => {
  if (!currentConnection.value) return
  showConfirmAnalyzeModal.value = false
  loading.value = true
  explainModalTitle.value = 'EXPLAIN ANALYZE Execution Result'
  try {
    const result = await window.electronAPI.invoke('andb-execute', {
      sourceConnection: sanitize(currentConnection.value),
      operation: 'executeQuery',
      options: { sql: `EXPLAIN ANALYZE ${pendingQueryToAnalyze.value}` }
    })
    explainResult.value = result.success ? result.data : [{ Error: result.error }]
    showExplainModal.value = true
  } catch (e: any) {
    explainResult.value = [{ Error: e.message }]
    showExplainModal.value = true
  } finally {
    loading.value = false
  }
}

// AI Diagnosis logic
const runAIDiagnose = async () => {
  if (chatStore.isLoading) return

  // 1. Open global AI sidebar Panel
  appStore.layoutSettings.aiPanel = true

  // 2. Set loading state
  chatStore.isLoading = true

  // 3. Start a new conversation for this diagnosis
  chatStore.newConversation()

  const snapshotSummary = `MySQL Database Live Snapshot:
- Active Threads: ${pulseStats.value.threadsRunning}
- Lock Waits: ${pulseStats.value.lockWaits}`

  // 4. Add the user request to the store so the user sees it in the chat bubble
  await chatStore.addMessage('user', `Please diagnose this database live snapshot for bottleneck issues.

${snapshotSummary}`)

  try {
    const systemPrompt = `You are an expert DBA analyzing a MySQL database live snapshot.
Here is the current state of the database:

- Active Threads: ${pulseStats.value.threadsRunning}
- Lock Waits: ${pulseStats.value.lockWaits}

Lock Tree Blocking Graph:
${JSON.stringify(lockTree.value, null, 2)}

Active Process List:
${JSON.stringify(processList.value.map(p => ({
  id: p.ID,
  user: p.USER,
  host: p.HOST,
  db: p.DB,
  command: p.COMMAND,
  time: p.TIME,
  state: p.STATE,
  query: p.INFO,
  has_active_trx: p.has_active_trx,
  trx_started: p.trx_started
})), null, 2)}

Please diagnose:
1. What is causing the bottleneck? Is there a root blocker or a query in a heavy state?
2. Are there any idle transactions (threads command Sleep but retaining locks)?
3. What are the specific actions to resolve it (e.g. killing a specific thread, adding an index, rewriting a query)?

Provide a concise response in 3-4 bullet points, highlight thread IDs and specific SQL commands clearly. Be direct and precise.`

    const result = await window.electronAPI.aiAsk(systemPrompt)
    if (result.success && result.data && result.data.content) {
      chatStore.addMessage('ai', result.data.content)
    } else {
      chatStore.addMessage('error', 'Failed to retrieve AI diagnostic report. Make sure Gemini API Key is configured in settings.')
    }
  } catch (err: any) {
    chatStore.addMessage('error', `Diagnosis Error: ${err.message}`)
  } finally {
    chatStore.isLoading = false
    nextTick(() => {
      const chatContainer = document.querySelector('.ai-chat-container')
      if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight
    })
  }
}

// Listeners and Watchers
watch(currentConnection, () => {
  fetchDbVersion()
  startPolling()
})

onMounted(() => {
  fetchDbVersion()
  startPolling()
  window.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  stopPolling()
  window.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <div 
    class="flex-1 flex overflow-hidden relative"
    @mousemove="recordActivity"
    @click="recordActivity"
    @keydown="recordActivity"
  >
    <!-- Left Main Monitoring View -->
    <div class="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-6 bg-gray-50/30 dark:bg-gray-900/30">
      
      <!-- Top controls & Switcher -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 class="text-lg font-black uppercase tracking-widest text-gray-900 dark:text-white flex items-center gap-2">
            <Sigma class="w-5 h-5 text-primary-500" />
            Database Pulse Monitor
          </h2>
          <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
            MySQL Version: {{ dbVersion || 'Scanning...' }}
          </p>
        </div>

        <!-- Connection and Polling Controls -->
        <div class="flex items-center flex-wrap gap-3">
          <!-- Connection Side selector if Target is present -->
          <div v-if="targetConnection" class="flex bg-gray-200/50 dark:bg-gray-800/80 p-0.5 rounded-xl border border-gray-200/50 dark:border-gray-700/50 text-[10px] font-bold uppercase">
            <button
              @click="selectedConnectionSide = 'source'"
              class="px-3 py-1.5 rounded-lg transition-all"
              :class="selectedConnectionSide === 'source' ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-400 hover:text-gray-200'"
            >
              Source DB
            </button>
            <button
              @click="selectedConnectionSide = 'target'"
              class="px-3 py-1.5 rounded-lg transition-all"
              :class="selectedConnectionSide === 'target' ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-400 hover:text-gray-200'"
            >
              Target DB
            </button>
          </div>

          <!-- Play/Pause polling button -->
          <button
            @click="togglePolling"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200"
            :class="isPolling ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'"
          >
            <component :is="isPolling ? Pause : Play" class="w-3.5 h-3.5" />
            {{ isPolling ? `Pause (${countdown}s)` : 'Resume Poll' }}
          </button>

          <!-- Refresh button -->
          <button
            @click="fetchMetrics(true)"
            :disabled="loading"
            class="p-2 bg-gray-200/50 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all"
            title="Manual Diagnostic Run"
          >
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
          </button>
        </div>
      </div>

      <!-- Warning Indicator Banner -->
      <div 
        class="mb-6 p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between"
        :class="{
          'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400': statusLevel === 'green',
          'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400': statusLevel === 'yellow',
          'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400': statusLevel === 'red'
        }"
      >
        <div class="flex items-center gap-3">
          <div 
            class="w-3 h-3 rounded-full animate-pulse"
            :class="{
              'bg-green-500': statusLevel === 'green',
              'bg-amber-500': statusLevel === 'yellow',
              'bg-red-500': statusLevel === 'red'
            }"
          ></div>
          <div>
            <h3 class="text-xs font-black uppercase tracking-wider">{{ statusMessage }}</h3>
            <p class="text-[10px] font-bold uppercase tracking-wider opacity-70 mt-0.5">
              Running Threads: {{ pulseStats.threadsRunning }} | Locked Threads Waiting: {{ pulseStats.lockWaits }}
            </p>
          </div>
        </div>

        <button
          @click="runAIDiagnose"
          :disabled="chatStore.isLoading"
          class="flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-primary-500/20 active:scale-95"
        >
          <component :is="chatStore.isLoading ? RefreshCw : Brain" class="w-3.5 h-3.5" :class="{ 'animate-spin': chatStore.isLoading }" />
          {{ chatStore.isLoading ? 'Diagnosing...' : 'AI Diagnose' }}
        </button>
      </div>

      <!-- Idle Inactivity Warning Overlay -->
      <div 
        v-if="isIdle" 
        class="mb-6 p-4 bg-gray-200/50 dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider"
      >
        <span class="flex items-center gap-2">
          <Clock class="w-4 h-4 text-amber-500 animate-pulse" />
          Polling stopped automatically after 5 minutes of inactivity to protect DB resources.
        </span>
        <button 
          @click="startPolling"
          class="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-primary-500/25"
        >
          Restart Polling
        </button>
      </div>

      <!-- Lock Tree / Blocking Chains Panel -->
      <div class="bg-white/40 dark:bg-gray-900/40 backdrop-blur-md border border-gray-100 dark:border-gray-800 rounded-3xl p-6 mb-6">
        <h3 class="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ShieldAlert class="w-4 h-4 text-red-500 animate-pulse" v-if="lockTree.length > 0" />
          <CheckCircle2 class="w-4 h-4 text-green-500" v-else />
          Transaction Blocking Chains (Lock Tree)
        </h3>

        <!-- Empty lock state -->
        <div v-if="lockTree.length === 0" class="py-8 text-center text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          No blocking locks found. Database transactions are running smoothly.
        </div>

        <!-- Render Lock Tree Chains -->
        <div v-else class="space-y-4">
          <div 
            v-for="(chain, i) in lockTree" 
            :key="i"
            class="p-4 bg-red-500/5 dark:bg-red-950/10 border border-red-500/10 rounded-2xl"
          >
            <!-- Blocker Thread -->
            <div class="flex items-start justify-between gap-4 pb-3 border-b border-red-500/10">
              <div class="flex-1">
                <span class="px-2 py-0.5 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest rounded-md mr-2">
                  Root Blocker
                </span>
                <span class="text-xs font-bold text-gray-900 dark:text-white">
                  Thread ID: {{ chain.blocking_thread_id }}
                </span>
                <span class="text-[10px] font-bold uppercase tracking-wider ml-3 text-red-400" v-if="chain.blocking_state === 'Sleep'">
                  🔴 Idle Transaction
                </span>
                <span class="text-[10px] font-bold uppercase tracking-wider ml-3 text-amber-500" v-else>
                  State: {{ chain.blocking_state || 'Executing' }}
                </span>

                <pre class="mt-2 text-[11px] font-mono p-2 bg-black/60 text-emerald-400 rounded-lg whitespace-pre-wrap truncate max-h-20">
                  {{ chain.blocking_query || '-- (Idle transaction holding lock)' }}
                </pre>
              </div>

              <button
                @click="confirmKillThread(chain.blocking_thread_id)"
                class="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
              >
                Kill
              </button>
            </div>

            <!-- Waiting Thread -->
            <div class="flex items-start justify-between gap-4 pt-3 pl-6 relative">
              <div class="absolute left-2 top-0 bottom-4 w-0.5 bg-red-500/20"></div>
              <div class="absolute left-2 top-1/2 w-3 h-0.5 bg-red-500/20"></div>
              
              <div class="flex-1">
                <span class="px-2 py-0.5 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-md mr-2">
                  Waiting Thread
                </span>
                <span class="text-xs font-bold text-gray-900 dark:text-white">
                  Thread ID: {{ chain.waiting_thread_id }}
                </span>

                <pre class="mt-2 text-[11px] font-mono p-2 bg-black/60 text-amber-400 rounded-lg whitespace-pre-wrap truncate max-h-20">
                  {{ chain.waiting_query || 'N/A' }}
                </pre>
              </div>

              <button
                @click="confirmKillThread(chain.waiting_thread_id)"
                class="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
              >
                Kill
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Smart Processlist Section -->
      <div class="bg-white/40 dark:bg-gray-900/40 backdrop-blur-md border border-gray-100 dark:border-gray-800 rounded-3xl p-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 class="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white flex items-center gap-2">
            <Flame class="w-4 h-4 text-amber-500" />
            Smart Processlist
          </h3>

          <!-- Search input filter -->
          <div class="relative w-full sm:max-w-xs">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Search class="w-4 h-4" />
            </span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search Thread, User, Query..."
              class="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:ring-0 focus:border-primary-500 outline-none"
            />
          </div>
        </div>

        <!-- Processes Table -->
        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-gray-100 dark:border-gray-800 text-[10px] font-black uppercase tracking-wider text-gray-400">
                <th class="pb-3 pr-4">ID</th>
                <th class="pb-3 pr-4">User</th>
                <th class="pb-3 pr-4">Host</th>
                <th class="pb-3 pr-4">DB</th>
                <th class="pb-3 pr-4">Command</th>
                <th class="pb-3 pr-4">Time (s)</th>
                <th class="pb-3 pr-4">State</th>
                <th class="pb-3 pr-4">Query</th>
                <th class="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800/50 text-xs font-semibold text-gray-600 dark:text-gray-300">
              <tr 
                v-for="proc in filteredProcessList" 
                :key="proc.ID"
                class="hover:bg-gray-150/10"
              >
                <!-- Thread ID -->
                <td class="py-3.5 pr-4 font-bold text-gray-900 dark:text-white">{{ proc.ID }}</td>
                <!-- User -->
                <td class="py-3.5 pr-4 max-w-[80px] truncate" :title="proc.USER">{{ proc.USER }}</td>
                <!-- Host -->
                <td class="py-3.5 pr-4 max-w-[100px] truncate" :title="proc.HOST">{{ proc.HOST }}</td>
                <!-- DB -->
                <td class="py-3.5 pr-4 text-primary-500">{{ proc.DB || '--' }}</td>
                
                <!-- Command with Idle Transaction highlight -->
                <td class="py-3.5 pr-4">
                  <span 
                    v-if="proc.COMMAND === 'Sleep' && proc.has_active_trx === 1"
                    class="px-2 py-0.5 bg-red-500/10 text-red-500 rounded text-[9px] font-black uppercase tracking-wider border border-red-500/10"
                  >
                    🔴 Idle Trx
                  </span>
                  <span v-else class="capitalize">{{ proc.COMMAND }}</span>
                </td>
                
                <!-- Time -->
                <td class="py-3.5 pr-4">{{ proc.TIME }}s</td>
                
                <!-- State with Heavy Resource Highlights -->
                <td class="py-3.5 pr-4">
                  <span 
                    v-if="['creating sort index', 'copying to tmp table', 'locked', 'searching rows'].includes(String(proc.STATE).toLowerCase())"
                    class="text-red-500 font-bold animate-pulse"
                  >
                    {{ proc.STATE }}
                  </span>
                  <span v-else>{{ proc.STATE || '--' }}</span>
                </td>
                
                <!-- SQL query snippet -->
                <td class="py-3.5 pr-4 max-w-[200px] truncate font-mono text-[11px]" :title="proc.INFO">
                  <code>{{ proc.INFO || '--' }}</code>
                </td>

                <!-- Row Diagnostics Actions -->
                <td class="py-3.5 text-right whitespace-nowrap space-x-1.5">
                  <template v-if="proc.INFO">
                    <!-- Quick EXPLAIN -->
                    <button
                      @click="runExplain(proc.INFO)"
                      class="px-2.5 py-1 bg-gray-200/50 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg text-[9px] font-bold uppercase transition-all"
                    >
                      EXPLAIN
                    </button>

                    <!-- EXPLAIN ANALYZE (MySQL 8.0.18+) -->
                    <span 
                      class="inline-block"
                      :title="!isExplainAnalyzeSupported ? 'Requires MySQL 8.0.18+' : !isSelectQuery(proc.INFO) ? 'Only SELECT queries allowed' : 'Execute query plan analysis'"
                    >
                      <button
                        @click="triggerExplainAnalyze(proc.INFO)"
                        :disabled="!isExplainAnalyzeSupported || !isSelectQuery(proc.INFO)"
                        class="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase transition-all"
                        :class="isExplainAnalyzeSupported && isSelectQuery(proc.INFO) 
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20' 
                          : 'bg-gray-100 dark:bg-gray-950 text-gray-400 cursor-not-allowed'"
                      >
                        ANALYZE
                      </button>
                    </span>
                  </template>

                  <!-- Kill Thread action -->
                  <button
                    @click="confirmKillThread(proc.ID)"
                    class="p-1 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-lg transition-all"
                    title="Terminate query thread"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>

              <!-- Empty processes state -->
              <tr v-if="filteredProcessList.length === 0">
                <td colspan="9" class="py-6 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                  No active queries match your search query.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>



    <!-- Modal: EXPLAIN Result View -->
    <div
      v-if="showExplainModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div class="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 class="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">
            {{ explainModalTitle }}
          </h3>
          <button @click="showExplainModal = false" class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="flex-1 overflow-auto custom-scrollbar p-6 bg-gray-50/50 dark:bg-gray-950/20">
          <!-- Render raw object list table for EXPLAIN outputs -->
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-800 text-[10px] uppercase font-bold text-gray-400">
                  <th class="pb-2 pr-4" v-for="key in Object.keys(explainResult?.[0] || {})" :key="key">{{ key }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-150 dark:divide-gray-800/50">
                <tr v-for="(row, idx) in explainResult" :key="idx" class="text-gray-600 dark:text-gray-300">
                  <td class="py-2.5 pr-4 whitespace-nowrap" v-for="(val, key) in row" :key="key">
                    {{ val === null ? 'NULL' : val }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Confirmation for EXPLAIN ANALYZE -->
    <div
      v-if="showConfirmAnalyzeModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-amber-500/20 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div class="p-6 pb-4">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20 text-amber-500">
              <AlertTriangle class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">
                EXPLAIN ANALYZE Safety Confirmation
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                Unlike standard <code class="bg-gray-100 dark:bg-gray-850 px-1 py-0.5 rounded">EXPLAIN</code>, executing <code class="bg-gray-100 dark:bg-gray-850 px-1 py-0.5 rounded">EXPLAIN ANALYZE</code> <strong>actually executes the query</strong> to measure exact timing. 
              </p>
              <p class="text-xs text-red-500 dark:text-red-400 font-bold mt-2">
                ⚠️ Warning: If the database is currently hanging or this query is extremely slow, running it again may worsen the database bottleneck.
              </p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-end gap-3">
          <button 
            @click="showConfirmAnalyzeModal = false"
            class="px-4 py-2 bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-gray-200 dark:border-gray-700"
          >
            Cancel
          </button>
          <button 
            @click="runExplainAnalyze"
            class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20"
          >
            I Understand, Execute
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Confirmation for Thread Termination -->
    <div
      v-if="showKillConfirmModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-red-500/20 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div class="p-6 pb-4">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20 text-red-500">
              <AlertCircle class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">
                Kill Connection Thread ID: {{ pendingThreadToKill }}
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                Are you sure you want to terminate this thread connection? This will force-abort any active query or uncommitted transaction associated with thread ID <strong>{{ pendingThreadToKill }}</strong>.
              </p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-end gap-3">
          <button 
            @click="showKillConfirmModal = false"
            class="px-4 py-2 bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-gray-200 dark:border-gray-700"
          >
            Cancel
          </button>
          <button 
            @click="executeKillThread"
            class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/20"
          >
            Force Terminate Thread
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.25);
  border-radius: 9999px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.45);
}
</style>
