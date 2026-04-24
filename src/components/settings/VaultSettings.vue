<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Cloud, Database, FolderSearch, RefreshCw, Trash2 } from 'lucide-vue-next'

const currentWorkspaceDir = ref('')
const currentDbPath = ref('')

const loadWorkspacePaths = async () => {
  if ((window as any).electronAPI && (window as any).electronAPI.getWorkspaceStatus) {
    const res = await (window as any).electronAPI.getWorkspaceStatus()
    if (res && res.success) {
      currentWorkspaceDir.value = res.path
      currentDbPath.value = res.dbPath
    }
  }
}

const resetWorkspaceDir = async () => {
  if (confirm('Are you sure you want to clear your custom Workspace? The app will revert to using the internal system cache storage.')) {
    if ((window as any).electronAPI && (window as any).electronAPI.resetWorkspaceDir) {
      await (window as any).electronAPI.resetWorkspaceDir()
      currentWorkspaceDir.value = ''
      alert('Workspace cleared. Please restart the app for changes to take full effect.')
    }
  }
}

const pickWorkspaceDir = async () => {
  if ((window as any).electronAPI && (window as any).electronAPI.pickWorkspaceDir) {
    const result = await (window as any).electronAPI.pickWorkspaceDir()

    if (result && result.success && result.path) {
      currentWorkspaceDir.value = result.path
      const actionMsg = result.action === 'linked'
        ? 'Now running out of the existing Workspace vault.'
        : 'Workspace moved successfully.';
      alert(`${actionMsg}\n${result.path}\n\nPlease restart the app for changes to take full effect.`)
    } else if (result && !result.success && !result.canceled) {
      alert('Failed to set workspace: ' + result.error)
    }
  }
}

onMounted(() => {
  loadWorkspacePaths()
})
</script>

<template>
  <div class="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
    <div class="max-w-3xl">
      <!-- Premium Vault Card -->
      <div
        class="relative overflow-hidden p-8 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-sm backdrop-blur-xl">
        <!-- Background Glow Decoration -->
        <div class="absolute -top-24 -right-24 w-64 h-64 bg-primary-500/5 blur-[100px] pointer-events-none"></div>
        <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none">
        </div>

        <div class="relative z-10">
          <div class="flex items-start justify-between gap-4 mb-6">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-lg shadow-black/5 text-primary-500">
                <Cloud class="w-6 h-6" />
              </div>
              <div>
                <h3 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Workspace
                  Vault</h3>
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-70">Portable
                  Encryption & Data Persistence</p>
              </div>
            </div>
            <div
              class="px-3 py-1 bg-primary-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary-500/20">
              Active</div>
          </div>

          <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-8 max-w-xl">
            The Andb stores all your encrypted credentials, custom templates, and environment mappings in a
            unified
            Vault. You can move this vault to any directory (e.g., a Dropbox or iCloud folder) to keep your
            setup
            synced across machines.
          </p>

          <div class="space-y-6">
            <!-- Path Status -->
            <div
              class="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm">
              <div class="flex items-center justify-between mb-3">
                <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vault
                  Location</label>
                <div v-if="currentWorkspaceDir" class="flex items-center gap-1.5 text-primary-500">
                  <div class="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                  <span class="text-[10px] font-bold uppercase tracking-widest">Custom Location</span>
                </div>
                <div v-else class="flex items-center gap-1.5 text-gray-400">
                  <div class="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                  <span class="text-[10px] font-bold uppercase tracking-widest">System Default</span>
                </div>
              </div>
              <div class="font-mono text-[11px] text-gray-600 dark:text-gray-300 break-all bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                {{ currentWorkspaceDir || '~/Library/Application Support/TheAndb (Internal)' }}
              </div>
              <div class="mt-4 flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                <Database class="w-3 h-3" />
                DB File: {{ currentDbPath.split('/').pop() }}
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-wrap items-center gap-3">
              <button @click="pickWorkspaceDir"
                class="px-6 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-xl shadow-black/10">
                <FolderSearch class="w-4 h-4" />
                Move Vault
              </button>
              <button @click="loadWorkspacePaths"
                class="px-6 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm">
                <RefreshCw class="w-4 h-4" />
                Verify
              </button>
              <button v-if="currentWorkspaceDir" @click="resetWorkspaceDir"
                class="px-6 py-3.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2">
                <Trash2 class="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
