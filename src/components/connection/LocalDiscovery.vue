<template>
  <div class="fixed inset-0 z-[60]" @click.self="$emit('close')">
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/40 backdrop-blur-md transition-all duration-300"
      @click="$emit('close')"
    ></div>

    <!-- Panel -->
    <div
      class="absolute top-0 right-0 bottom-0 w-full max-w-2xl bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
    >
      <!-- Header -->
      <div
        class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center shadow-inner relative overflow-hidden group"
          >
            <div class="absolute inset-0 bg-gradient-to-tr from-primary-500/20 to-violet-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Zap class="w-5 h-5 text-primary-600 dark:text-primary-400 animate-pulse" />
          </div>
          <div>
            <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
              Auto-Discover Local Databases
            </h3>
            <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest opacity-60 mt-0.5">
              Locate Docker, Configs, Ports, and SQLite files
            </p>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Main Content / Scanning State -->
      <div class="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        <!-- Radar / Progress Indicator -->
        <div v-if="scanning" class="flex flex-col items-center justify-center py-12 space-y-4">
          <div class="relative w-24 h-24 flex items-center justify-center">
            <!-- Ripple waves -->
            <div class="absolute inset-0 border-2 border-primary-500/30 rounded-full animate-ping"></div>
            <div class="absolute inset-2 border border-violet-500/20 rounded-full animate-pulse"></div>
            <div class="w-16 h-16 rounded-full bg-gradient-to-tr from-primary-500 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-primary-500/20">
              <Zap class="w-8 h-8 animate-bounce" />
            </div>
          </div>
          <div class="text-center">
            <h4 class="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">Scanning Environments...</h4>
            <p class="text-[10px] text-gray-400 font-medium mt-1">Inspecting ports, containers, configurations, and folders</p>
          </div>
        </div>

        <div v-else class="space-y-6">
          <!-- Quick Status banner -->
          <div class="p-4 bg-gradient-to-r from-primary-500/10 to-violet-500/10 rounded-2xl border border-primary-500/20 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center text-primary-500">
                <CheckCircle2 class="w-5 h-5" />
              </div>
              <div>
                <h5 class="text-xs font-black uppercase text-gray-900 dark:text-white">Scan Complete</h5>
                <p class="text-[10px] text-gray-400 font-bold mt-0.5">Found {{ totalFound }} potential database endpoints</p>
              </div>
            </div>
            <button @click="startScan" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-primary-500/10">
              Rescan
            </button>
          </div>

          <!-- Docker Containers Section -->
          <div v-if="report.docker.length > 0" class="space-y-3">
            <div class="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-400">
              <Layers class="w-4 h-4 text-blue-500" />
              Docker Containers ({{ report.docker.length }})
            </div>
            <div class="grid grid-cols-1 gap-3">
              <div
                v-for="c in report.docker"
                :key="c.containerId"
                class="p-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-blue-500/40 transition-all flex items-center justify-between"
              >
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-gray-900 dark:text-white">{{ c.name }}</span>
                    <span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tight bg-blue-50 dark:bg-blue-950/40 text-blue-500">{{ c.type }}</span>
                  </div>
                  <div class="text-[9px] font-mono text-gray-400 mt-1">
                    Image: {{ c.image }} | Ports:
                    <span v-for="p in c.ports" :key="p.public">{{ p.public }}->{{ p.private }} </span>
                  </div>
                </div>
                <button
                  v-if="isExisted(c.type, c.name.replace(/^\//, ''), '127.0.0.1', c.ports[0]?.public || 3306)"
                  disabled
                  class="px-4 py-2 bg-gray-100 dark:bg-gray-800/40 text-gray-400 dark:text-gray-500 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-not-allowed border border-gray-200 dark:border-gray-700/60"
                >
                  Existed
                </button>
                <button
                  v-else
                  @click="importDocker(c)"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                  Import
                </button>
              </div>
            </div>
          </div>

          <!-- Active Ports Section -->
          <div v-if="report.ports.length > 0" class="space-y-3">
            <div class="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-400">
              <HardDrive class="w-4 h-4 text-emerald-500" />
              Local Active Ports ({{ report.ports.length }})
            </div>
            <div class="grid grid-cols-1 gap-3">
              <div
                v-for="p in report.ports"
                :key="p.port"
                class="p-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-emerald-500/40 transition-all flex items-center justify-between"
              >
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-gray-900 dark:text-white">Port :{{ p.port }}</span>
                    <span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tight bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500">{{ p.type }}</span>
                  </div>
                  <div class="text-[9px] font-mono text-gray-400 mt-1">
                    Local active connection listening on port {{ p.port }}
                  </div>
                </div>
                <button
                  v-if="isExisted(p.type, `Local ${p.type.toUpperCase()} :${p.port}`, '127.0.0.1', p.port)"
                  disabled
                  class="px-4 py-2 bg-gray-100 dark:bg-gray-800/40 text-gray-400 dark:text-gray-500 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-not-allowed border border-gray-200 dark:border-gray-700/60"
                >
                  Existed
                </button>
                <button
                  v-else
                  @click="importPort(p)"
                  class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                  Import
                </button>
              </div>
            </div>
          </div>

          <!-- Configuration Files Section -->
          <div v-if="report.configs.length > 0" class="space-y-3">
            <div class="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-400">
              <Terminal class="w-4 h-4 text-violet-500" />
              Workspace Configs ({{ report.configs.length }})
            </div>
            <div class="grid grid-cols-1 gap-3">
              <div
                v-for="c in report.configs"
                :key="c.file"
                class="p-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-violet-500/40 transition-all flex items-center justify-between"
              >
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-gray-900 dark:text-white">Found in {{ c.file }}</span>
                    <span class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tight bg-violet-50 dark:bg-violet-950/40 text-violet-500">{{ c.type }}</span>
                  </div>
                  <div class="text-[9px] font-mono text-gray-400 mt-1 max-w-sm truncate" :title="c.connectionString || c.host">
                    {{ c.connectionString || `${c.host}:${c.port} (${c.user})` }}
                  </div>
                </div>
                <button
                  v-if="isExisted(c.type, `${c.file} ${c.type.toUpperCase()}`, c.host || '127.0.0.1', c.port || (c.type === 'postgres' ? 5432 : 3306))"
                  disabled
                  class="px-4 py-2 bg-gray-100 dark:bg-gray-800/40 text-gray-400 dark:text-gray-500 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-not-allowed border border-gray-200 dark:border-gray-700/60"
                >
                  Existed
                </button>
                <button
                  v-else
                  @click="importConfig(c)"
                  class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                  Import
                </button>
              </div>
            </div>
          </div>

          <!-- SQLite Files Section -->
          <div v-if="report.sqliteFiles.length > 0" class="space-y-3">
            <div class="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-400">
              <HardDrive class="w-4 h-4 text-amber-500" />
              SQLite Databases ({{ report.sqliteFiles.length }})
            </div>
            <div class="grid grid-cols-1 gap-3">
              <div
                v-for="f in report.sqliteFiles"
                :key="f.path"
                class="p-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-amber-500/40 transition-all flex items-center justify-between"
              >
                <div class="min-w-0 flex-1 pr-4">
                  <div class="text-xs font-bold text-gray-900 dark:text-white truncate" :title="f.path">{{ f.path.split('/').pop() }}</div>
                  <div class="text-[9px] font-mono text-gray-400 mt-1 truncate" :title="f.path">
                    {{ f.path }} | {{ formatBytes(f.size) }}
                  </div>
                </div>
                <button
                  v-if="isExisted('sqlite', f.path.split('/').pop().replace(/\.\w+$/, ''), f.path, 0)"
                  disabled
                  class="px-4 py-2 bg-gray-100 dark:bg-gray-800/40 text-gray-400 dark:text-gray-500 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-not-allowed shrink-0 border border-gray-200 dark:border-gray-700/60"
                >
                  Existed
                </button>
                <button
                  v-else
                  @click="importSqlite(f)"
                  class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all shrink-0"
                >
                  Import
                </button>
              </div>
            </div>
          </div>

          <!-- No endpoints discovered state -->
          <div
            v-if="totalFound === 0"
            class="flex flex-col items-center justify-center text-center py-16 opacity-65"
          >
            <Cloud class="w-12 h-12 text-gray-400 mb-3" />
            <h4 class="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">No local endpoints found</h4>
            <p class="text-[10px] text-gray-500 mt-1 max-w-xs">
              Try running docker-compose or ensure databases are running on their default ports.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  X,
  Zap,
  Layers,
  HardDrive,
  Terminal,
  CheckCircle2,
  Cloud
} from 'lucide-vue-next'
import { useConnectionTemplatesStore } from '@/stores/connectionTemplates'

const emit = defineEmits(['close', 'imported'])
const templatesStore = useConnectionTemplatesStore()

const scanning = ref(true)
const report = ref<{
  ports: any[]
  docker: any[]
  configs: any[]
  sqliteFiles: any[]
}>({
  ports: [],
  docker: [],
  configs: [],
  sqliteFiles: []
})

const totalFound = computed(() => {
  return report.value.ports.length +
    report.value.docker.length +
    report.value.configs.length +
    report.value.sqliteFiles.length
})

onMounted(() => {
  startScan()
})

const startScan = async () => {
  scanning.value = true
  try {
    const res = await (window as any).electronAPI.discoverLocalDatabases()
    if (res && res.success !== false) {
      report.value = {
        ports: res.ports || [],
        docker: res.docker || [],
        configs: res.configs || [],
        sqliteFiles: res.sqliteFiles || []
      }
    }
  } catch (e) {
    console.error('Local discovery failed:', e)
  } finally {
    scanning.value = false
  }
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const isExisted = (type: string, name: string, host: string, port: number) => {
  return templatesStore.templates.some(t => {
    if (t.name.toLowerCase() === name.toLowerCase()) return true
    if (type === 'sqlite') {
      return t.type === 'sqlite' && t.host === host
    } else {
      return t.type === type && t.host === host && Number(t.port) === Number(port)
    }
  })
}

const saveTemplate = async (connData: any) => {
  try {
    await templatesStore.addTemplate(connData)
    emit('imported')
  } catch (e: any) {
    if (e.message !== 'DUPLICATE_CONNECTION') {
      alert(e.message || 'An error occurred.')
    }
  }
}

const importDocker = async (container: any) => {
  const primaryPort = container.ports[0]?.public || 3306

  const connData = {
    name: container.name.replace(/^\//, ''),
    environment: 'LOCAL',
    database: container.type === 'postgres' ? 'postgres' : 'mysql',
    type: container.type,
    host: '127.0.0.1',
    port: primaryPort,
    username: container.type === 'postgres' ? 'postgres' : 'root',
    password: ''
  }

  await saveTemplate(connData as any)
}

const importPort = async (p: any) => {
  const connData = {
    name: `Local ${p.type.toUpperCase()} :${p.port}`,
    environment: 'LOCAL',
    database: p.type === 'postgres' ? 'postgres' : 'mysql',
    type: p.type,
    host: '127.0.0.1',
    port: p.port,
    username: p.type === 'postgres' ? 'postgres' : 'root',
    password: ''
  }

  await saveTemplate(connData as any)
}

const importConfig = async (config: any) => {
  const connData = {
    name: `${config.file} ${config.type.toUpperCase()}`,
    environment: 'LOCAL',
    database: config.database || 'default',
    type: config.type,
    host: config.host || '127.0.0.1',
    port: config.port || (config.type === 'postgres' ? 5432 : 3306),
    username: config.user || 'root',
    password: config.password || ''
  }

  await saveTemplate(connData as any)
}

const importSqlite = async (file: any) => {
  const connData = {
    name: file.path.split('/').pop().replace(/\.\w+$/, ''),
    environment: 'LOCAL',
    database: 'default',
    type: 'sqlite' as const,
    host: file.path,
    port: 0,
    username: '',
    password: ''
  }

  await saveTemplate(connData as any)
}
</script>

