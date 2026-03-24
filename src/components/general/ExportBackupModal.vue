<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center">
    <!-- Overlay -->
    <div class="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" @click="close"></div>

    <!-- Modal Content -->
    <div class="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      <!-- Header -->
      <div class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-gray-800/20">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
            <Download class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ $t('backup.export.title') }}</h3>
            <p class="text-[11px] text-gray-500 font-medium">Select exactly which configurations you want to backup</p>
          </div>
        </div>
        <button @click="close" class="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex-1 flex flex-col items-center justify-center p-12">
        <Loader2 class="w-8 h-8 animate-spin text-primary-500 mb-4" />
        <p class="text-sm font-bold text-gray-400 animate-pulse">Analyzing Workspace...</p>
      </div>

      <!-- Tree View Body -->
      <div v-else class="flex-1 overflow-y-auto p-2 bg-gray-50/30 dark:bg-gray-900/30">
        <!-- Settings Block -->
        <label class="group flex items-start gap-3 p-4 hover:bg-white dark:hover:bg-gray-800 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700 shadow-sm hover:shadow-md mb-2">
          <input type="checkbox" v-model="selection.settings" class="mt-1 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-900 transition-all cursor-pointer" />
          <div>
            <div class="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Settings class="w-4 h-4 text-gray-400" />
              Global Settings & Preferences
            </div>
            <p class="text-xs text-gray-500 mt-1">Application theme, language, and global behaviors.</p>
          </div>
        </label>

        <!-- Connections Block -->
        <div class="mb-2 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <label class="flex items-center gap-3 p-4 bg-gray-50/80 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <input type="checkbox" :checked="isAllConnectionsSelected" :indeterminate="isIndeterminate(selection.connections, data.connections)" @change="toggleGroup('connections')" class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-900 cursor-pointer" />
            <div class="font-black text-xs text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <Database class="w-4 h-4 text-primary-500" /> 
              Database Connections ({{ data.connections.length }})
            </div>
          </label>
          <div class="divide-y divide-gray-100 dark:divide-gray-800/50 max-h-48 overflow-y-auto">
            <label v-for="conn in data.connections" :key="conn.id" class="flex items-center gap-3 p-3 pl-12 hover:bg-gray-50 dark:hover:bg-gray-800/80 cursor-pointer transition-colors group">
              <input type="checkbox" :value="conn.id" v-model="selection.connections" class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-900 cursor-pointer" />
              <div class="flex-1">
                <span class="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-primary-600 transition-colors">{{ conn.name }}</span>
                <span class="text-[10px] ml-2 font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{{ conn.type }}</span>
              </div>
            </label>
            <div v-if="data.connections.length === 0" class="p-4 pl-12 text-xs text-gray-400 italic">No connections found.</div>
          </div>
        </div>

        <!-- Environments Block -->
        <div class="mb-2 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <label class="flex items-center gap-3 p-4 bg-gray-50/80 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <input type="checkbox" :checked="isAllEnvsSelected" :indeterminate="isIndeterminate(selection.environments, data.environments)" @change="toggleGroup('environments')" class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-900 cursor-pointer" />
            <div class="font-black text-xs text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <Layers class="w-4 h-4 text-amber-500" /> 
              Environments ({{ data.environments.length }})
            </div>
          </label>
          <div class="divide-y divide-gray-100 dark:divide-gray-800/50 max-h-48 overflow-y-auto">
            <label v-for="env in data.environments" :key="env.id" class="flex items-center gap-3 p-3 pl-12 hover:bg-gray-50 dark:hover:bg-gray-800/80 cursor-pointer transition-colors group">
              <input type="checkbox" :value="env.id" v-model="selection.environments" class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-900 cursor-pointer" />
              <div class="flex-1">
                <span class="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-amber-600 transition-colors">{{ env.name }}</span>
              </div>
            </label>
            <div v-if="data.environments.length === 0" class="p-4 pl-12 text-xs text-gray-400 italic">No environments found.</div>
          </div>
        </div>

        <!-- Connection Pairs Block -->
        <div class="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <label class="flex items-center gap-3 p-4 bg-gray-50/80 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <input type="checkbox" :checked="isAllPairsSelected" :indeterminate="isIndeterminate(selection.connectionPairs, data.connectionPairs)" @change="toggleGroup('connectionPairs')" class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-900 cursor-pointer" />
            <div class="font-black text-xs text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <GitMerge class="w-4 h-4 text-purple-500" /> 
              Compare Configurations ({{ data.connectionPairs.length }})
            </div>
          </label>
          <div class="divide-y divide-gray-100 dark:divide-gray-800/50 max-h-48 overflow-y-auto">
            <label v-for="pair in data.connectionPairs" :key="pair.id" class="flex items-center gap-3 p-3 pl-12 hover:bg-gray-50 dark:hover:bg-gray-800/80 cursor-pointer transition-colors group">
              <input type="checkbox" :value="pair.id" v-model="selection.connectionPairs" class="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-900 cursor-pointer" />
              <div class="flex-1">
                <span class="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-purple-600 transition-colors">{{ pair.name }}</span>
              </div>
            </label>
            <div v-if="data.connectionPairs.length === 0" class="p-4 pl-12 text-xs text-gray-400 italic">No configurations found.</div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div v-if="!isLoading" class="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
        <div class="text-[11px] font-bold text-gray-500 uppercase tracking-widest bg-gray-200 dark:bg-gray-900 px-3 py-1.5 rounded-lg">
          {{ totalSelected }} Items Selected
        </div>
        <div class="flex items-center gap-3">
          <button @click="close" class="px-5 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Cancel</button>
          <button @click="executeExport" class="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2" :disabled="totalSelected === 0">
            <Download class="w-4 h-4" /> Export Now
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Download, X, Settings, Database, Layers, GitMerge, Loader2 } from 'lucide-vue-next'
import backup, { type BackupSelectionConfig, type BackupData } from '@/utils/backup'

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close', 'success'])

const isLoading = ref(true)
const data = ref<BackupData>({ version: '', timestamp: '', connections: [], environments: [], connectionPairs: [], settings: null })

const selection = ref<BackupSelectionConfig>({
  connections: [],
  connectionPairs: [],
  environments: [],
  settings: true
})

watch(() => props.isOpen, async (open) => {
  if (open) {
    isLoading.value = true
    try {
      // Pull everything natively from DB to show in Tree
      data.value = await backup.create()
      
      // Auto-select everything by default to mimic general export behavior seamlessly
      selection.value = {
        connections: data.value.connections.map(c => c.id),
        connectionPairs: data.value.connectionPairs.map(p => p.id),
        environments: data.value.environments.map(e => e.id),
        settings: true
      }
    } finally {
      isLoading.value = false
    }
  }
})

// Computation logic for Tree indeterminate checkboxes
const isAllConnectionsSelected = computed(() => data.value.connections.length > 0 && selection.value.connections.length === data.value.connections.length)
const isAllEnvsSelected = computed(() => data.value.environments.length > 0 && selection.value.environments.length === data.value.environments.length)
const isAllPairsSelected = computed(() => data.value.connectionPairs.length > 0 && selection.value.connectionPairs.length === data.value.connectionPairs.length)

const isIndeterminate = (selArr: string[], origArr: any[]) => {
  return selArr.length > 0 && selArr.length < origArr.length
}

const toggleGroup = (group: 'connections' | 'environments' | 'connectionPairs') => {
  if (selection.value[group].length === data.value[group].length) {
    selection.value[group] = [] // Unselect all
  } else {
    selection.value[group] = data.value[group].map((item: any) => item.id) // Select all
  }
}

const totalSelected = computed(() => {
  let count = selection.value.connections.length + selection.value.environments.length + selection.value.connectionPairs.length
  if (selection.value.settings) count += 1
  return count
})

const close = () => {
  emit('close')
}

const executeExport = async () => {
  try {
    await backup.download(selection.value)
    emit('success')
  } catch (error) {
    console.error('Export failed:', error)
  }
}
</script>
