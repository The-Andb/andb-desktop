<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Cloud, Database, FolderSearch, RefreshCw, Trash2, ArrowUpCircle, Folder, FileText, AlertTriangle, ChevronDown } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notification'
import { useProjectsStore } from '@/stores/projects'

const currentWorkspaceDir = ref('')
const currentDbPath = ref('')
const actualActiveDir = ref('')
const folderTree = ref<any[]>([])
const isFallback = ref(false)
const fallbackReason = ref('')
const isTreeExpanded = ref(false)

const notificationStore = useNotificationStore()
const projectsStore = useProjectsStore()

const loadWorkspacePaths = async (showToast = false) => {
  if ((window as any).electronAPI && (window as any).electronAPI.getWorkspaceStatus) {
    const res = await (window as any).electronAPI.getWorkspaceStatus()
    if (res && res.success) {
      currentWorkspaceDir.value = res.path
      currentDbPath.value = res.dbPath
      actualActiveDir.value = res.actualPath || ''
      folderTree.value = res.tree || []
      isFallback.value = !!res.isFallback
      fallbackReason.value = res.fallbackReason || ''

      if (showToast) {
        if (res.isFallback) {
          // Critical UI warning only if user expects a custom workspace but path failed
          if (res.path && res.actualPath !== res.path) {
            notificationStore.add({
              type: 'warning',
              title: 'Vault Location Conflict',
              message: 'Custom vault path missing! Active runtime fell back to system directory.'
            })
            isTreeExpanded.value = true
          } else {
            notificationStore.add({
              type: 'success',
              title: 'Default Vault Active',
              message: 'Workspace running correctly in standard sandbox storage.'
            })
          }
        } else {
          notificationStore.add({
            type: 'success',
            title: 'Workspace Vault Verified',
            message: `Your vault is active and properly mapped to: ${res.path || 'System Default'}`
          })
        }
      }
    }
  }
}

const resetWorkspaceDir = async () => {
  if (
    confirm(
      'Are you sure you want to clear your custom Workspace? The app will revert to using the internal system cache storage.'
    )
  ) {
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
      const actionMsg =
        result.action === 'linked'
          ? 'Now running out of the existing Workspace vault.'
          : 'Workspace moved successfully.'
      alert(
        `${actionMsg}\n${result.path}\n\nPlease restart the app for changes to take full effect.`
      )
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
        class="relative overflow-hidden p-8 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-sm backdrop-blur-xl"
      >
        <!-- Background Glow Decoration -->
        <div
          class="absolute -top-24 -right-24 w-64 h-64 bg-primary-500/5 blur-[100px] pointer-events-none"
        ></div>
        <div
          class="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none"
        ></div>

        <div class="relative z-10">
          <div class="flex items-start justify-between gap-4 mb-6">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-lg shadow-black/5 text-primary-500"
              >
                <Cloud class="w-6 h-6" />
              </div>
              <div>
                <h3
                  class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight"
                >
                  Workspace Vault
                </h3>
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-70">
                  Portable Encryption & Data Persistence
                </p>
              </div>
            </div>
            <div
              class="px-3 py-1 bg-primary-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary-500/20"
            >
              Active
            </div>
          </div>

          <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-8 max-w-xl">
            The Andb stores all your encrypted credentials, custom templates, and environment
            mappings in a unified Vault. You can move this vault to any directory (e.g., a Dropbox
            or iCloud folder) to keep your setup synced across machines.
          </p>

          <!-- Vault Internal Folder Architecture Card -->
          <div class="mb-8 border border-gray-200/60 dark:border-gray-800 rounded-[1.25rem] bg-white dark:bg-gray-900/40 overflow-hidden shadow-sm select-none">
            <div class="bg-gray-50 dark:bg-gray-800/50 px-5 py-3 border-b border-gray-200/60 dark:border-gray-800 flex items-center justify-between">
              <div class="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <FolderSearch class="w-3.5 h-3.5 text-primary-500" />
                Vault Folder Architecture
              </div>
              <span class="text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md">
                Enforced: /projects/...
              </span>
            </div>
            <div class="p-5 font-mono text-[11px] leading-[1.6] text-gray-600 dark:text-gray-400 bg-gray-50/30 dark:bg-transparent">
              <div class="flex items-center gap-2 text-primary-500 font-extrabold">
                <span>📂</span> <span>Vault Root Directory/</span>
              </div>
              <div class="flex items-center gap-2 ml-4 text-gray-400/60">
                <span>├──</span> <span class="text-slate-600 dark:text-slate-300">📄 andb-storage.db</span> 
                <span class="ml-auto text-[9px] text-gray-400 italic font-sans">Master key/config database</span>
              </div>
              <div class="flex items-center gap-2 ml-4 text-gray-400/60">
                <span>├──</span> <span class="text-amber-500 font-bold">📂 projects/</span>
                <span class="ml-auto text-[9px] text-amber-500 font-bold font-sans">Isolated Container Layer</span>
              </div>
              <div class="flex items-center gap-2 ml-[34px] text-gray-400/50">
                <span>│   └──</span> <span class="text-slate-700 dark:text-slate-200 font-bold">📂 project_name/</span>
              </div>
              <div class="flex items-center gap-2 ml-[54px] text-gray-400/40">
                <span>│       ├──</span> <span class="text-slate-600 dark:text-slate-300">📂 db/</span>
                <span class="ml-auto text-[9px] text-gray-400 italic font-sans">DDL schema exports & snapshots</span>
              </div>
              <div class="flex items-center gap-2 ml-[54px] text-gray-400/40">
                <span>│       └──</span> <span class="text-slate-600 dark:text-slate-300">📂 map-migrate/</span>
                <span class="ml-auto text-[9px] text-gray-400 italic font-sans">Generated alter-sync SQLs</span>
              </div>
              <div class="flex items-center gap-2 ml-4 text-gray-400/60">
                <span>├──</span> <span class="text-slate-600 dark:text-slate-300">📂 security/</span>
                <span class="ml-auto text-[9px] text-gray-400 italic font-sans">Local keys & identity certificates</span>
              </div>
              <div class="flex items-center gap-2 ml-4 text-gray-400/60">
                <span>└──</span> <span class="text-slate-600 dark:text-slate-300">📂 backups/</span>
                <span class="ml-auto text-[9px] text-gray-400 italic font-sans">Automated disaster recovery</span>
              </div>
            </div>
          </div>

          <div class="space-y-6">
            <!-- Path Status -->
            <div
              class="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm"
            >
              <div class="flex items-center justify-between mb-3">
                <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest"
                  >Vault Location</label
                >
                <div v-if="currentWorkspaceDir" class="flex items-center gap-1.5 text-primary-500">
                  <div class="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                  <span class="text-[10px] font-bold uppercase tracking-widest"
                    >Custom Location</span
                  >
                </div>
                <div v-else class="flex items-center gap-1.5 text-gray-400">
                  <div class="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                  <span class="text-[10px] font-bold uppercase tracking-widest"
                    >System Default</span
                  >
                </div>
              </div>
              <div
                class="font-mono text-[11px] text-gray-600 dark:text-gray-300 break-all bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800"
              >
                {{ currentWorkspaceDir || '~/Library/Application Support/TheAndb (Internal)' }}
              </div>
              <div class="mt-4 flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                <Database class="w-3 h-3" />
                DB File: {{ currentDbPath.split('/').pop() }}
              </div>

              <!-- Premium Verified Folder Tree Map -->
              <div v-if="folderTree && folderTree.length > 0" class="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div 
                  class="flex items-center justify-between cursor-pointer select-none group"
                  @click="isTreeExpanded = !isTreeExpanded"
                >
                  <div class="flex items-center gap-2 text-[10px] font-black text-gray-400 group-hover:text-primary-500 uppercase tracking-widest transition-colors">
                    <FolderSearch class="w-3.5 h-3.5" />
                    Vault Directory Map
                  </div>
                  <div class="flex items-center gap-2">
                    <span v-if="isFallback && currentWorkspaceDir" class="px-2 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1 animate-pulse">
                      <AlertTriangle class="w-2.5 h-2.5" />
                      Fallback Active
                    </span>
                    <ChevronDown :class="['w-4 h-4 text-gray-400 transition-transform duration-200', isTreeExpanded ? 'rotate-180' : '']" />
                  </div>
                </div>

                <div 
                  v-if="isTreeExpanded" 
                  class="mt-4 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800/50 rounded-xl p-4 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300"
                >
                  <div v-if="isFallback && currentWorkspaceDir" class="mb-4 p-3 bg-rose-500/5 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-xl text-[11px]">
                    <div class="flex items-start gap-2 text-rose-600 dark:text-rose-400 font-bold">
                      <AlertTriangle class="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <div class="uppercase font-black text-[10px] tracking-widest mb-1">Location Conflict Detected</div>
                        <p class="font-medium leading-relaxed opacity-90">{{ fallbackReason }}</p>
                      </div>
                    </div>
                    <div class="mt-2 pt-2 border-t border-rose-500/10 font-mono text-[10px] text-gray-500 dark:text-gray-400 break-all leading-tight">
                      Active Fallback Path: <span class="text-rose-500">{{ actualActiveDir }}</span>
                    </div>
                  </div>

                  <div class="font-mono text-[11px] text-gray-600 dark:text-gray-300 max-h-[260px] overflow-y-auto space-y-1 pr-2 thin-scrollbar">
                    <div v-for="(node, idx) in folderTree" :key="idx" 
                         class="flex items-center gap-2 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 py-1 px-2 rounded-md transition-all"
                         :style="{ paddingLeft: `${(node.depth * 16) + 8}px` }"
                    >
                      <Folder v-if="node.type === 'directory'" class="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <FileText v-else class="w-3.5 h-3.5 text-sky-500 shrink-0 opacity-80" />
                      
                      <span :class="[node.type === 'directory' ? 'font-black text-gray-800 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400']">
                        {{ node.name }}
                      </span>
                      
                      <span v-if="node.size !== undefined" class="ml-auto text-[9px] text-gray-400 font-medium opacity-60 select-none">
                        {{ (node.size / 1024).toFixed(1) }} KB
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-wrap items-center gap-3">
              <button
                @click="pickWorkspaceDir"
                class="px-6 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-xl shadow-black/10"
              >
                <FolderSearch class="w-4 h-4" />
                Move Vault
              </button>
              <button
                @click="loadWorkspacePaths(true)"
                class="px-6 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
              >
                <RefreshCw class="w-4 h-4" />
                Verify
              </button>
              <button
                v-if="currentWorkspaceDir"
                @click="resetWorkspaceDir"
                class="px-6 py-3.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
              >
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
