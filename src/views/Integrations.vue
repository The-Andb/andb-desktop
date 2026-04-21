<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { CheckCircle2, AlertCircle, GitBranch, Lock, Folder, Save, Upload, HelpCircle, ExternalLink } from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notification'
import { useSidebarStore } from '@/stores/sidebar'
import { useProjectsStore } from '@/stores/projects'
import { generatePrUrl } from '@/utils/pr-helper'

const notificationStore = useNotificationStore()
const sidebarStore = useSidebarStore()
const projectsStore = useProjectsStore()

const currentProjectId = computed(() => projectsStore.selectedProjectId)

const cliStatus = ref<'checking' | 'detected' | 'not_found'>('checking')
const internalBinaryPath = ref('')
const mcpBinaryPath = ref('')

const gitConfig = ref({
  remoteUrl: '',
  branch: '', // Legacy
  workBranch: '',
  baseBranch: 'main',
  username: '',
  token: '',
  storagePath: '',
  autoSync: false,
  autoCommit: true
})

const showTokenGuide = ref(false)
const gitGuides = {
  github: [
    { text: 'Go to Settings > Developer settings', url: 'https://github.com/settings/apps' },
    { text: 'Personal access tokens > Tokens (classic)', icon: 'key' },
    { text: 'Generate new token (classic)', icon: 'plus' },
    { text: 'Select "repo" scope', icon: 'check' }
  ],
  gitlab: [
    { text: 'User Settings > Access Tokens', url: 'https://gitlab.com/-/profile/personal_access_tokens' },
    { text: 'Add new token', icon: 'plus' },
    { text: 'Select "api" or "read_repository" scopes', icon: 'check' }
  ]
}

const commitMessage = ref('')
const isPreviewing = ref(false)

const gitStatus = computed(() => sidebarStore.gitStatus)
const gitLoading = computed(() => sidebarStore.gitLoading)

const checkCliStatus = async () => {
  cliStatus.value = 'checking'
  try {
    const isDetected = await window.electronAPI?.cli?.checkPath()
    cliStatus.value = isDetected ? 'detected' : 'not_found'
  } catch (error) {
    console.error('Failed to check CLI status', error)
    cliStatus.value = 'not_found'
  }
}

const loadPaths = async () => {
  try {
    internalBinaryPath.value = await window.electronAPI?.cli?.getBinaryPath() || '/path/to/andb'
    mcpBinaryPath.value = await window.electronAPI?.mcp?.getMcpPath() || '/path/to/mcp/dist/index.js'
  } catch (error) {
    console.error('Failed to load internal paths', error)
  }
}

const loadGitConfig = async () => {
  if (!currentProjectId.value) return
  try {
    // Priority 1: Load from project settings
    let data = (projectsStore.currentProject?.settings as any)?.gitConfig
    
    // Priority 2: Fallback to standalone storage
    if (!data) {
      const res = await window.electronAPI?.storage?.get(`git_config_${currentProjectId.value}`)
      if (res?.success && res.data) {
        data = res.data
      }
    }

    if (data) {
      // Decrypt token if present and secure
      if (data.token && (data.token.startsWith('SEC:') || data.token.startsWith('ENC:'))) {
        try {
          const decryptedTokenRes = await window.electronAPI?.security?.decryptToken(data.token)
          if (decryptedTokenRes?.success && decryptedTokenRes.data) {
            data.token = decryptedTokenRes.data
          }
        } catch (e) {
          console.error('Failed to decrypt token', e)
        }
      }
      
      gitConfig.value = { 
        ...gitConfig.value, 
        ...data,
        // Heuristic: If workBranch is missing but branch is present, migrate it
        workBranch: data.workBranch || data.branch || gitConfig.value.workBranch,
        baseBranch: data.baseBranch || 'main'
      }
    } else {
      // Reset if no config for this project
      gitConfig.value = {
        remoteUrl: '',
        branch: '',
        workBranch: '',
        baseBranch: 'main',
        username: '',
        token: '',
        storagePath: '',
        autoSync: false,
        autoCommit: true
      }
    }
  } catch (error) {
    console.error('Failed to load git config', error)
  }
}

const saveGitConfig = async () => {
  if (!currentProjectId.value) return
  try {
    // 1. Secure Sensitive Data
    const configToSave = { ...gitConfig.value }
    if (configToSave.token && !configToSave.token.startsWith('SEC:')) {
      const encryptRes = await window.electronAPI?.security?.encryptToken(configToSave.token)
      if (encryptRes?.success && encryptRes.data) {
        configToSave.token = encryptRes.data
      }
    }

    // 2. Update Project Settings (Centralized Source of Truth)
    projectsStore.updateProject(currentProjectId.value, {
      settings: {
        ...(projectsStore.currentProject?.settings || {}),
        gitConfig: configToSave
      } as any
    })

    // 3. Fallback Storage for backward compatibility
    await window.electronAPI?.storage?.set(`git_config_${currentProjectId.value}`, configToSave)
    
    notificationStore.add({
      type: 'success',
      title: 'Configuration Saved',
      message: `Git settings for "${projectsStore.currentProject?.name}" updated successfully.`
    })
    checkGitStatus()
  } catch (error) {
    console.error('Failed to save git config', error)
  }
}

const checkGitStatus = async () => {
  await sidebarStore.checkGitStatus()
}

const gitPull = async () => {
  try {
    notificationStore.add({
      type: 'info',
      title: 'Pulling Changes',
      message: `Rebasing ${gitConfig.value.workBranch} from ${gitConfig.value.baseBranch}...`
    })

    const res = await window.electronAPI?.andbExecute({
      sourceConnection: {} as any,
      targetConnection: {} as any,
      operation: 'git-pull' as any,
      options: { 
        config: gitConfig.value,
        env: 'DEV', // Context irrelevant for pull but needed for bridge
        db: 'default'
      }
    })

    if (res?.success) {
      notificationStore.add({
        type: 'success',
        title: 'Sync Complete',
        message: 'Local branch rebased successfully.'
      })
      checkGitStatus()
    }
  } catch (error: any) {
    notificationStore.add({
      type: 'error',
      title: 'Pull Failed',
      message: error.message
    })
  }
}

const proposePr = () => {
  const url = generatePrUrl(
    gitConfig.value.remoteUrl, 
    gitConfig.value.workBranch, 
    gitConfig.value.baseBranch
  )
  if (url) {
    window.open(url, '_blank')
  } else {
    notificationStore.add({
      type: 'warning',
      title: 'Cannot Generate PR URL',
      message: 'Please check your Remote URL and branch settings.'
    })
  }
}

const gitSync = async () => {
  try {
    notificationStore.add({
      type: 'info',
      title: 'Status Check',
      message: 'Checking for schema changes...'
    })

    const res = await window.electronAPI?.andbExecute({
      sourceConnection: {} as any,
      targetConnection: {} as any,
      operation: 'git-status' as any,
      options: { 
        config: gitConfig.value,
        env: 'DEV',
        db: 'preflow_41'
      }
    }) as any

    if (res?.success && (res?.modifiedFiles?.length > 0 || res?.untrackedFiles?.length > 0)) {
      commitMessage.value = res.suggestedMessage
      isPreviewing.value = true
    } else if (res?.success) {
      notificationStore.add({
        type: 'info',
        title: 'No Changes',
        message: 'Database schema is already in sync with Git.'
      })
    }
  } catch (error: any) {
    notificationStore.add({
      type: 'error',
      title: 'Status Check Failed',
      message: error.message
    })
  }
}

const confirmGitSync = async () => {
  isPreviewing.value = false
  try {
    notificationStore.add({
      type: 'info',
      title: 'Sync Started',
      message: 'Committing and pushing changes...'
    })

    const res = await window.electronAPI?.andbExecute({
      sourceConnection: {} as any,
      targetConnection: {} as any,
      operation: 'git-sync' as any,
      options: { 
        config: gitConfig.value,
        env: 'DEV',
        db: 'preflow_41',
        message: commitMessage.value
      }
    })

    if (res?.success) {
      notificationStore.add({
        type: 'success',
        title: 'Sync Complete',
        message: 'Database schema successfully mirrored and pushed to Git.'
      })
      checkGitStatus()
    } else {
      notificationStore.add({
        type: 'error',
        title: 'Sync Failed',
        message: res?.error || 'Unknown error occurred during Git sync.'
      })
    }
  } catch (error: any) {
    notificationStore.add({
      type: 'error',
      title: 'Sync Failed',
      message: error.message
    })
  }
}

onMounted(() => {
  loadPaths()
  checkCliStatus()
  loadGitConfig()
  setTimeout(checkGitStatus, 500)
})

watch(currentProjectId, () => {
  loadGitConfig()
  checkGitStatus()
})
</script>

<template>
  <MainLayout>
    <template #toolbar>
      <div class="flex items-center justify-between w-full h-full px-2 text-gray-400">
        <div class="flex items-center gap-2 uppercase tracking-widest text-[10px] font-black">
           Integrations
        </div>
      </div>
    </template>

    <template #breadcrumbs>
      <div class="flex items-center gap-2">
         <GitBranch class="w-3.5 h-3.5 text-gray-400" />
         <span class="text-[11px] font-black uppercase tracking-widest text-gray-900 dark:text-white">Git Sync & Integrations</span>
      </div>
    </template>
    <div class="flex-1 overflow-y-auto p-6">
      <div class="max-w-5xl mx-auto w-full pb-12">
      <div class="mb-8">
        <h1 class="text-3xl font-black text-gray-900 dark:text-white mb-2">Git Sync</h1>
        <p class="text-gray-500 dark:text-gray-400">Version control your Schema DDL natively with Git.</p>
      </div>

      <div class="grid grid-cols-1 gap-8">
        <!-- Git Versioning (Hybrid Model) -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-primary-100 dark:border-primary-900/30 overflow-hidden shadow-md shadow-primary-500/5 transition-all hover:shadow-lg hover:shadow-primary-500/10">
          <div class="p-6 border-b border-gray-200 dark:border-gray-700 bg-primary-50/30 dark:bg-primary-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                <GitBranch class="w-5 h-5" />
              </div>
              <div>
                <h2 class="text-lg font-bold text-gray-900 dark:text-white">Git Versioning (Hybrid)</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">Mirror SQLite state to human-readable SQL files in Git.</p>
              </div>
            </div>
            
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap"
                   :class="gitStatus?.isRepo ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'">
                <div v-if="gitLoading" class="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin mr-1"></div>
                <CheckCircle2 v-else-if="gitStatus?.isRepo" class="w-4 h-4" />
                <AlertCircle v-else class="w-4 h-4" />
                {{ gitStatus?.isRepo ? 'Git Ready' : 'Not Initialized' }}
              </div>
            </div>
          </div>
          
          <div class="p-6">
             <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                <!-- Config Form -->
                <div class="space-y-4">
                  <div class="space-y-1">
                    <label class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                       Repository URL
                    </label>
                    <input v-model="gitConfig.remoteUrl" type="text" placeholder="https://github.com/owner/repo.git" 
                           class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div class="space-y-1">
                        <label class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                           <GitBranch class="w-3 h-3" /> Work Branch
                        </label>
                        <input v-model="gitConfig.workBranch" type="text" placeholder="andb-work/user" 
                               class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                      </div>
                      <div class="space-y-1">
                        <label class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                           <GitBranch class="w-3 h-3" /> Base Branch
                        </label>
                        <input v-model="gitConfig.baseBranch" type="text" placeholder="main" 
                               class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                      </div>
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                       <Folder class="w-3 h-3" /> Local Path
                    </label>
                    <input v-model="gitConfig.storagePath" type="text" placeholder="/db" 
                           class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                  </div>

                  <div class="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
                    <h3 class="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Lock class="w-4 h-4 text-orange-500" /> Credentials
                    </h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div class="space-y-1">
                        <label class="text-xs font-bold text-gray-400 uppercase tracking-wider">Username</label>
                        <input v-model="gitConfig.username" type="text" placeholder="git-username" 
                               class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm outline-none transition-all" />
                      </div>
                      <div class="space-y-1">
                        <div class="flex items-center justify-between">
                          <label class="text-xs font-bold text-gray-400 uppercase tracking-wider">Token / PAT</label>
                          <button @click="showTokenGuide = !showTokenGuide" class="text-[10px] font-bold text-primary-500 hover:text-primary-600 flex items-center gap-1 transition-colors">
                            <HelpCircle class="w-3 h-3" />
                            How to get a token?
                          </button>
                        </div>
                        <input v-model="gitConfig.token" type="password" placeholder="••••••••••••" 
                               class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all duration-200" />
                      </div>
                    </div>

                    <!-- Token Help Guide -->
                    <div v-if="showTokenGuide" class="p-4 bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 rounded-xl space-y-4 animate-in slide-in-from-top-2 duration-200">
                       <div class="flex items-center justify-between border-b border-primary-100 dark:border-primary-900/30 pb-2">
                          <h4 class="text-xs font-black text-primary-700 dark:text-primary-400 uppercase tracking-widest">Git PAT Instructions</h4>
                          <button @click="showTokenGuide = false" class="p-1 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded">
                             <Lock class="w-3 h-3 text-primary-500" />
                          </button>
                       </div>
                       
                       <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <!-- GitHub -->
                          <div class="space-y-2">
                             <div class="flex items-center gap-2 text-[10px] font-bold text-gray-600 dark:text-gray-300">
                                <span class="w-4 h-4 rounded-full bg-black text-white flex items-center justify-center text-[8px]">GH</span>
                                GITHUB
                             </div>
                             <ul class="space-y-1.5">
                                <li v-for="(step, idx) in gitGuides.github" :key="idx" class="text-[10px] text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                                   <span class="mt-1 w-1 h-1 rounded-full bg-primary-400 shrink-0"></span>
                                   <div class="flex-1">
                                      {{ step.text }}
                                      <a v-if="step.url" :href="step.url" target="_blank" class="text-primary-500 hover:underline inline-flex items-center ml-1">
                                         link <ExternalLink class="w-2 h-2 ml-0.5" />
                                      </a>
                                   </div>
                                </li>
                             </ul>
                          </div>

                          <!-- GitLab -->
                          <div class="space-y-2">
                             <div class="flex items-center gap-2 text-[10px] font-bold text-gray-600 dark:text-gray-300">
                                <span class="w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center text-[8px]">GL</span>
                                GITLAB
                             </div>
                             <ul class="space-y-1.5">
                                <li v-for="(step, idx) in gitGuides.gitlab" :key="idx" class="text-[10px] text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                                   <span class="mt-1 w-1 h-1 rounded-full bg-primary-400 shrink-0"></span>
                                   <div class="flex-1">
                                      {{ step.text }}
                                      <a v-if="step.url" :href="step.url" target="_blank" class="text-primary-500 hover:underline inline-flex items-center ml-1">
                                         link <ExternalLink class="w-2 h-2 ml-0.5" />
                                      </a>
                                   </div>
                                </li>
                             </ul>
                          </div>
                       </div>
                    </div>
                  </div>

                    <div class="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 pt-6 mt-2 border-t border-gray-100 dark:border-gray-800">
                      <div class="flex items-center gap-4">
                        <button @click="saveGitConfig" class="flex items-center justify-center gap-2 px-5 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-gray-500/20 active:scale-[0.98] transition-all duration-200">
                           <Save class="w-4 h-4" /> Save
                        </button>
                        
                        <label class="flex items-center gap-2 cursor-pointer group">
                          <div class="relative">
                            <input type="checkbox" v-model="gitConfig.autoCommit" class="sr-only peer">
                            <div class="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-primary-500 transition-colors"></div>
                            <div class="absolute left-1 top-1 w-3 h-3 bg-white rounded-full peer-checked:translate-x-5 transition-transform"></div>
                          </div>
                          <span class="text-xs font-bold text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors uppercase tracking-tight">Auto-Commit</span>
                        </label>
                      </div>

                      <button @click="gitSync" :disabled="gitLoading" 
                              class="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-600/30 transition-all duration-200 disabled:opacity-50 active:scale-[0.98]">
                         <Upload v-if="!gitLoading" class="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
                         <div v-else class="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                         Sync & Push
                      </button>
                    </div>

                    <!-- Commit Preview Overlay (Phase 1) -->
                    <div v-if="isPreviewing" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                       <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                          <div class="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                             <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                   <GitBranch class="w-5 h-5" />
                                </div>
                                <div>
                                   <h3 class="font-bold text-gray-900 dark:text-white">Review Git Commit</h3>
                                   <p class="text-xs text-gray-500 dark:text-gray-400">Semantic message generated from AST diff.</p>
                                </div>
                             </div>
                             <div class="text-xs font-mono bg-orange-100 dark:bg-orange-900/30 text-orange-600 px-2 py-1 rounded">
                                {{ gitStatus?.modifiedFiles?.length || 0 }} changes
                             </div>
                          </div>
                          
                          <div class="p-6 space-y-4">
                             <div class="space-y-2">
                                <label class="text-xs font-bold text-gray-400 uppercase tracking-wider">Commit Message</label>
                                <textarea v-model="commitMessage" rows="3" 
                                          class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"></textarea>
                             </div>

                             <div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                                <h4 class="text-[10px] font-bold text-gray-400 uppercase mb-2">Impacted Objects</h4>
                                <div class="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-2">
                                   <span v-for="file in [...(gitStatus?.modifiedFiles || []), ...(gitStatus?.untrackedFiles || [])]" 
                                         class="px-2 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[10px] font-mono text-gray-600 dark:text-gray-400">
                                      {{ file.split('/').pop() }}
                                   </span>
                                </div>
                             </div>
                          </div>

                          <div class="p-4 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
                             <button @click="isPreviewing = false" class="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">
                                Cancel
                             </button>
                             <button @click="confirmGitSync" class="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition-all">
                                Confirm & Sync
                             </button>
                          </div>
                       </div>
                    </div>
                </div>

                <!-- Info/Status -->
                <div class="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
                   <h3 class="text-sm font-bold text-gray-900 dark:text-white mb-4">Why use Hybrid Git?</h3>
                   <ul class="space-y-3">
                      <li class="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                         <div class="shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-[10px] font-bold">1</div>
                         <div><strong>Real Diffs:</strong> Each database object is stored as an individual <code>.sql</code> file, resulting in perfect Git history.</div>
                      </li>
                      <li class="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                         <div class="shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-[10px] font-bold">2</div>
                         <div><strong>Zero Lag:</strong> SQLite handles the UI operations instantly, while Git manages the long-term proof of work.</div>
                      </li>
                      <li class="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                         <div class="shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-[10px] font-bold">3</div>
                         <div><strong>Team Sync:</strong> Push your schema changes to a shared repository for code reviews and team parity.</div>
                      </li>
                   </ul>

                    <div v-if="gitStatus?.behind > 0" class="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl flex gap-3 animate-pulse">
                      <AlertCircle class="w-5 h-5 text-orange-600 shrink-0" />
                      <div>
                        <h4 class="text-sm font-bold text-orange-800 dark:text-orange-400">Drift Detected (Behind Remote)</h4>
                        <p class="text-xs text-orange-700 dark:text-orange-500 mt-1">
                          Git remote is ahead by <strong>{{ gitStatus.behind }}</strong> commits. 
                          We recommend pulling changes before making new local exports to avoid conflicts.
                        </p>
                      </div>
                    </div>

                    <div v-if="gitStatus" class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
                       <div class="flex justify-between text-sm">
                          <span class="text-gray-500">Current Branch:</span>
                          <span class="font-mono text-primary-600 font-bold tracking-tight">{{ gitStatus.currentBranch }}</span>
                       </div>
                       <div class="flex justify-between text-sm">
                          <span class="text-gray-500">Local Changes:</span>
                          <span class="font-bold" :class="gitStatus.modifiedFiles?.length > 0 ? 'text-orange-500' : 'text-green-500'">
                            {{ gitStatus.modifiedFiles?.length || 0 }} modified
                          </span>
                       </div>
                       <div class="flex justify-between text-sm">
                          <span class="text-gray-500">Sync Status:</span>
                          <div class="flex items-center gap-2">
                              <button v-if="gitStatus.behind > 0" 
                                      @click="gitPull"
                                      class="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-[10px] font-bold hover:bg-orange-200 transition-colors">
                                 Pull & Rebase
                              </button>
                              <button v-if="gitStatus.ahead > 0" 
                                      @click="proposePr"
                                      class="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded text-[10px] font-bold hover:bg-primary-200 transition-colors">
                                 Propose change (PR)
                              </button>
                              <span v-if="gitStatus.ahead > 0" class="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-[10px] font-bold">Ahead: {{ gitStatus.ahead }}</span>
                              <span v-if="gitStatus.behind > 0" class="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-[10px] font-bold">Behind: {{ gitStatus.behind }}</span>
                              <span v-if="gitStatus.ahead === 0 && gitStatus.behind === 0" class="text-green-600 font-bold">In Sync</span>
                          </div>
                       </div>
                    </div>
                </div>
             </div>
          </div>
        </div>



      </div>
    </div>
  </div>
  </MainLayout>
</template>
