<template>
  <MainLayout :title="$t('settings.title')">
    <main class="flex h-full bg-white dark:bg-gray-950 overflow-hidden">
      <!-- Sidebar Navigation -->
      <aside class="w-72 border-r border-gray-100 dark:border-gray-800 flex flex-col shrink-0">
        <div class="p-8">
          <h1 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{{ $t('settings.title')
            }}</h1>
          <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 opacity-60">{{
            $t('settings.subtitle') }}</p>
        </div>

        <nav class="flex-1 overflow-y-auto px-4 space-y-1.5 custom-scrollbar">
          <button v-for="cat in appSettings" :key="cat.id" @click="activeCategory = cat.id"
            class="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden text-left"
            :class="activeCategory === cat.id
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20 active:scale-95'
              : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'">
            <component :is="cat.icon" class="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
            <span class="text-xs font-bold uppercase tracking-widest leading-tight block">{{ cat.label }}</span>
            <div v-if="activeCategory === cat.id"
              class="absolute inset-0 bg-white/10 translate-x-[-100%] animate-[shimmer_3s_infinite] pointer-events-none">
            </div>
          </button>
        </nav>

        <div class="p-6 border-t border-gray-100 dark:border-gray-800">
          <button @click="resetToDefaults"
            class="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors text-[10px] font-black uppercase tracking-widest">
            <Trash2 class="w-4 h-4" />
            {{ $t('settings.resetData') }}
          </button>
        </div>
      </aside>

      <!-- Category Detail Pane -->
      <div class="flex-1 overflow-y-auto p-10 custom-scrollbar">
        <div
          :class="activeCategory === 'templates' || activeCategory === 'environments' ? 'w-full' : 'max-w-6xl mx-auto'">
          
          <AISettings v-if="activeCategory === 'ai'" />
          <InterfaceSettings v-if="activeCategory === 'interface'" />
          <TerminalSettings v-if="activeCategory === 'terminal'" />
          
          <div v-if="activeCategory === 'templates'" class="h-full flex flex-col">
            <ConnectionTemplateManager class="flex-1 min-h-0" />
          </div>

          <div v-if="activeCategory === 'environments'" class="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div class="flex items-center gap-4 mb-8">
              <div class="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shadow-inner">
                <Database class="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Master Environments</h2>
                <p class="text-xs text-gray-500 font-medium uppercase tracking-widest opacity-70">Define the global topology of your infrastructure</p>
              </div>
            </div>
            <div class="w-full">
              <EnvironmentManager mode="global" />
            </div>
          </div>

          <EngineSettings v-if="activeCategory === 'engine'" />
          <VaultSettings v-if="activeCategory === 'vault'" />
          <SecuritySettings v-if="activeCategory === 'security'" />

          <div v-if="activeCategory === 'backup'" class="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <BackupManager />
          </div>

          <UpdateSettings v-if="activeCategory === 'update'" />
        </div>
      </div>
    </main>

    <!-- Reset Data Confirmation Modal (Pro Style) -->
    <div v-if="showResetModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300"
        @click="showResetModal = false"></div>

      <div
        class="relative bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        <!-- Modal Header -->
        <div class="px-8 pt-8 pb-4 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center shadow-inner">
              <Trash2 class="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{{
                $t('settings.resetModal.title') }}</h3>
              <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-60">{{
                $t('settings.resetModal.subtitle') }}</p>
            </div>
          </div>
          <button @click="showResetModal = false"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="px-8 py-6">
          <p class="text-xs font-medium text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
            {{ $t('settings.resetModal.warning').split('{irreversible}')[0] }}<span
              class="font-black text-red-500 underline decoration-2 underline-offset-2">{{
                $t('settings.resetModal.irreversible') }}</span>.
          </p>

          <div class="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 mb-6">
            <h4 class="text-[9px] font-black text-red-700 dark:text-red-400 uppercase tracking-[0.2em] mb-4">{{
              $t('settings.resetModal.purgedListTitle') }}</h4>
            <div class="grid grid-cols-1 gap-3">
              <div class="flex items-center gap-3">
                <div
                  class="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-gray-400">
                  <Database class="w-4 h-4" />
                </div>
                <span class="text-[11px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest">{{
                  $t('settings.resetModal.cachedSchemas') }}</span>
              </div>
              <div class="flex items-center gap-3">
                <div
                  class="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-gray-400">
                  <GitCompare class="w-4 h-4" />
                </div>
                <span class="text-[11px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest">{{
                  $t('settings.resetModal.comparisonResults') }}</span>
              </div>
              <div class="flex items-center gap-3">
                <div
                  class="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-gray-400">
                  <FileCode class="w-4 h-4" />
                </div>
                <span class="text-[11px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest">{{
                  $t('settings.resetModal.generatedAlters') }}</span>
              </div>
              <div class="flex items-center gap-3">
                <div
                  class="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-gray-400">
                  <Activity class="w-4 h-4" />
                </div>
                <span class="text-[11px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest">{{
                  $t('settings.resetModal.migrationHistory') }}</span>
              </div>
            </div>
          </div>

          <div
            class="flex items-start gap-3 p-4 bg-primary-50 dark:bg-primary-950/20 rounded-xl border border-primary-100/50 dark:border-primary-900/50">
            <div class="p-1 bg-white dark:bg-gray-800 rounded-md text-primary-500 shadow-sm">
              <RotateCcw class="w-3 h-3" />
            </div>
            <p
              class="text-[10px] text-primary-700 dark:text-primary-300 font-bold uppercase leading-relaxed tracking-tight">
              {{ $t('settings.resetModal.preservationNote') }}
            </p>
          </div>
        </div>

        <!-- Modal Footer -->
        <div
          class="px-8 py-6 bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4">
          <button @click="showResetModal = false"
            class="flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            {{ $t('settings.resetModal.cancel') }}
          </button>
          <button @click="confirmResetData"
            class="flex-[1.5] py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            :disabled="isResetting">
            <RotateCcw v-if="isResetting" class="w-3.5 h-3.5 animate-spin" />
            <span v-if="isResetting">{{ $t('settings.resetModal.purging') }}</span>
            <span v-else>{{ $t('settings.resetModal.confirm') }}</span>
          </button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, markRaw } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  MonitorSmartphone,
  Database,
  Cloud,
  Trash2,
  X,
  FileCode,
  Activity,
  DownloadCloud,
  LayoutTemplate,
  Shield,
  RotateCcw,
  GitCompare,
  Cpu,
  Terminal,
  Sparkles
} from 'lucide-vue-next'

import MainLayout from '@/layouts/MainLayout.vue'
import BackupManager from '@/components/general/BackupManager.vue'
import ConnectionTemplateManager from '@/components/connection/ConnectionTemplateManager.vue'
import EnvironmentManager from '@/components/connection/EnvironmentManager.vue'

// Sub-components
import AISettings from '@/components/settings/AISettings.vue'
import InterfaceSettings from '@/components/settings/InterfaceSettings.vue'
import TerminalSettings from '@/components/settings/TerminalSettings.vue'
import EngineSettings from '@/components/settings/EngineSettings.vue'
import VaultSettings from '@/components/settings/VaultSettings.vue'
import SecuritySettings from '@/components/settings/SecuritySettings.vue'
import UpdateSettings from '@/components/settings/UpdateSettings.vue'

import { useConnectionPairsStore } from '@/stores/connectionPairs'
import { useAppStore } from '@/stores/app'
import { useOperationsStore } from '@/stores/operations'
import { useConsoleStore } from '@/stores/console'

const { t } = useI18n()
const appStore = useAppStore()
const route = useRoute()
const connectionPairsStore = useConnectionPairsStore()
const operationsStore = useOperationsStore()

const activeCategory = ref<string>('interface')

const categories = computed(() => [
  { id: 'interface', label: t('settings.categories.interface'), icon: markRaw(MonitorSmartphone) },
  { id: 'environments', label: t('settings.categories.environments', 'Master Environments'), icon: markRaw(Database) },
  { id: 'vault', label: 'Workspace Vault', icon: markRaw(Cloud) },
  { id: 'templates', label: t('settings.categories.connections'), icon: markRaw(LayoutTemplate) },
  { id: 'engine', label: 'Engine', icon: markRaw(Cpu) },
  { id: 'terminal', label: 'CLI & MCP', icon: markRaw(Terminal) },
  { id: 'security', label: t('settings.categories.security'), icon: markRaw(Shield) },
  { id: 'backup', label: t('settings.categories.backup'), icon: markRaw(Database) },
  { id: 'ai', label: 'AI Assistant', icon: markRaw(Sparkles) },
  { id: 'update', label: t('settings.categories.update'), icon: markRaw(DownloadCloud) }
])

const appSettings = computed(() => categories.value)

// Deep linking
const handleDeepLink = (query: any) => {
  const cat = query.cat || query.tab
  if (cat && categories.value.find(c => c.id === cat)) {
    activeCategory.value = cat as string
  }
}

onMounted(() => {
  handleDeepLink(route.query)
})

watch(() => route.query, (newQuery) => {
  handleDeepLink(newQuery)
})

// Reset Logic
const showResetModal = ref(false)
const isResetting = ref(false)

const resetToDefaults = () => {
  showResetModal.value = true
}

const confirmResetData = async () => {
  isResetting.value = true
  try {
    if ((window as any).electronAPI && (window as any).electronAPI.andbClearStorage) {
      const res = await (window as any).electronAPI.andbClearStorage()
      const consoleStore = useConsoleStore()
      if (res.success && res.data) {
        const { ddl, comparison, snapshot, migration } = res.data
        consoleStore.addLog('APPLICATION DATA RESET COMPLETED', 'warn')
        consoleStore.addLog(`- Deleted ${ddl || 0} DDL records`, 'info')
        consoleStore.addLog(`- Deleted ${comparison || 0} Comparison records`, 'info')
        consoleStore.addLog(`- Deleted ${snapshot || 0} Snapshot records`, 'info')
        consoleStore.addLog(`- Deleted ${migration || 0} Migration records`, 'info')
        consoleStore.setVisibility(true)
      }
    }

    await Promise.all([
      appStore.reloadData(),
      connectionPairsStore.reloadData(),
      operationsStore.clearOperations(),
      operationsStore.loadOperations()
    ])

    showResetModal.value = false
  } catch (error: any) {
    alert('Failed to reset data.')
  } finally {
    isResetting.value = false
  }
}
</script>

<style scoped>
@keyframes shimmer {
  0% { transform: translateX(-100%) skewX(-15deg); }
  100% { transform: translateX(200%) skewX(-15deg); }
}

.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 9999px; }
.dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #1f2937; }
</style>
