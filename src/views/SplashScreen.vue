<template>
  <div class="fixed inset-0 bg-primary-900 flex items-center justify-center z-50 p-6 overflow-y-auto">
    <!-- Progress simulating path -->
    <div v-if="!showSetup" class="text-center">
      <!-- Logo -->
      <div class="animate-pulse-slow mb-16">
        <div class="flex items-center justify-center gap-4 mb-4">
          <img 
            src="/icon.png" 
            alt="Andb Icon" 
            class="w-20 h-auto"
          />
          <h3 class="text-5xl font-black text-white tracking-tighter">TheAndb</h3>
        </div>
        <p class="text-xl font-bold text-primary-100 tracking-tight opacity-80">Keep Going. Keep Syncing.</p>
      </div>
      <!-- Loading Bar -->
      <div class="w-64 h-1.5 bg-primary-800 rounded-full mx-auto mb-8 overflow-hidden">
        <div 
          class="h-full bg-gradient-to-r from-primary-400 to-white rounded-full transition-all duration-300 animate-loading"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>

      <!-- Status Text -->
      <p class="text-sm text-primary-200 mb-12 animate-fade-in">
        {{ statusText }}
      </p>
      
      <!-- Version & Copyright -->
      <div class="absolute bottom-8 left-0 right-0 text-center space-y-2">
        <p class="text-xs text-primary-300 font-medium">
          Version {{ version }}
        </p>
        <div class="flex flex-col items-center justify-center space-y-1">
          <p class="text-xs text-primary-400 opacity-70">
            © 2024 - 2026 {{ author }}
          </p>
          <p class="text-[10px] text-primary-500 uppercase tracking-widest font-bold">
           Built for Engineers
          </p>
        </div>
      </div>
    </div>

    <!-- First Run Setup -->
    <div v-else class="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl overflow-hidden animate-fade-in flex flex-col md:flex-row shadow-primary-900/50">
      <!-- Left Branding Panel -->
      <div class="md:w-5/12 bg-primary-500 p-8 lg:p-12 text-white flex flex-col justify-between hidden md:flex relative overflow-hidden">
        <div class="absolute -right-20 -top-20 w-64 h-64 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse-slow"></div>
        <div class="absolute -left-20 -bottom-20 w-64 h-64 bg-primary-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse-slow" style="animation-delay: 1.5s"></div>
        
        <div class="relative z-10">
          <img src="/icon.png" alt="Logo" class="w-16 h-16 mb-8 brightness-0 invert drop-shadow-md" />
          <h2 class="text-3xl lg:text-4xl font-black tracking-tight mb-4">Welcome to TheAndb</h2>
          <p class="text-sm text-primary-100 font-medium leading-relaxed opacity-90">
            The local-first intelligent database architect. Fast, native GUI for complete version control.
          </p>
        </div>
        
        <div class="relative z-10 space-y-5 pt-10 mt-auto border-t border-primary-400/50">
          <div class="flex items-center gap-4">
             <div class="w-10 h-10 rounded-xl bg-primary-400/30 flex items-center justify-center text-white shrink-0 shadow-inner border border-primary-400/50">
               <Database class="w-5 h-5"/>
             </div>
             <div>
               <div class="text-[11px] font-black uppercase tracking-widest mb-1">Local Metadata</div>
               <div class="text-[10px] text-primary-100 opacity-80">Safe & isolated from internet</div>
             </div>
          </div>
          <div class="flex items-center gap-4">
             <div class="w-10 h-10 rounded-xl bg-primary-400/30 flex items-center justify-center text-white shrink-0 shadow-inner border border-primary-400/50">
               <FolderGit2 class="w-5 h-5"/>
             </div>
             <div>
               <div class="text-[11px] font-black uppercase tracking-widest mb-1">Git DDL Native</div>
               <div class="text-[10px] text-primary-100 opacity-80">Connect to your local repository</div>
             </div>
          </div>
        </div>
      </div>

      <!-- Right Config Panel -->
      <div class="md:w-7/12 p-8 lg:p-12 flex flex-col">
        <div class="mb-8">
          <h3 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">Workspace Configuration</h3>
          <p class="text-xs text-gray-500 font-medium leading-relaxed">
            Specify where TheAndb should securely store internal settings and where your SQL definitions reside before continuing.
          </p>
        </div>
        
        <div class="space-y-6 flex-1">
          <!-- Workspace Setup -->
          <div class="bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 relative group hover:border-primary-500/50 transition-colors">
            <h4 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-1 flex items-center gap-2">
               <FolderGit2 class="w-4 h-4 text-primary-500"/>
               Workspace Vault Directory
            </h4>
            <p class="text-[11px] text-gray-500 dark:text-gray-400 mb-4 tracking-tight leading-relaxed">
               Select a root folder where your SQL definitions, SQLite metadata, and security keys will be centrally stored. Select an existing vault to <strong class="text-primary-600 dark:text-primary-400">Link Existing Data</strong>, or an empty one to <strong>Start Fresh</strong>.
            </p>
            <div class="flex items-center gap-3">
              <div class="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-xl px-4 py-3 text-[10px] font-mono font-bold text-gray-500 truncate shadow-inner h-[46px] flex items-center">
                 {{ currentWorkspaceDir || 'Not specified (App runs out of internal cache)' }}
              </div>
              <button 
                 @click="pickWorkspaceDir"
                 class="px-6 h-[46px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:text-primary-600 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all shadow-sm active:scale-95 shrink-0"
              >
                 Select Target
              </button>
            </div>
            <div v-if="workspaceMsg" class="absolute -top-3 right-6 bg-green-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-fade-in shadow-sm">
              <span class="flex items-center gap-1"><Check class="w-3 h-3"/> {{ workspaceMsg }}</span>
            </div>
          </div>
        </div>

        <div class="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 flex justify-end">
           <button 
             @click="completeSetup"
             class="w-full md:w-auto px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
           >
             Initialize Workspace
             <ArrowRight class="w-4 h-4" />
           </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'
import { Check, Database, FolderGit2, ArrowRight } from 'lucide-vue-next'

const router = useRouter()
const { t } = useI18n()
const settingsStore = useSettingsStore()

// App metadata from package.json
const version = __APP_VERSION__
const author = 'TheAndb'

// Loading state
const progress = ref(0)
const statusText = ref(t('splash.status.init'))
const showSetup = ref(false)

const currentWorkspaceDir = ref('')
const workspaceMsg = ref('')

const statusMessages = [
  t('splash.status.init'),
  t('splash.status.loadingDrivers'),
  t('splash.status.checkingConnections'),
  t('splash.status.preparingWorkspace'),
  t('splash.status.ready')
]

const loadWorkspacePath = async () => {
  if ((window as any).electronAPI) {
    if ((window as any).electronAPI.getWorkspaceStatus) {
      const res = await (window as any).electronAPI.getWorkspaceStatus()
      if (res && res.success && res.path) {
         currentWorkspaceDir.value = res.path
      }
    }
  }
}

const pickWorkspaceDir = async () => {
    if ((window as any).electronAPI && (window as any).electronAPI.pickWorkspaceDir) {
        const result = await (window as any).electronAPI.pickWorkspaceDir()
        if (result && result.success && result.path) {
            currentWorkspaceDir.value = result.path
            workspaceMsg.value = result.action === 'linked' ? 'Linked Existing Vault' 
              : result.action === 'overwrote' ? 'Overwrote Data' 
              : 'Relocated Successfully';
            setTimeout(() => { workspaceMsg.value = '' }, 3000)
        } else if (result && !result.success && !result.canceled) {
            alert('Failed to set workspace: ' + result.error)
        }
    }
}

const completeSetup = async () => {
  settingsStore.settings.setupCompleted = true
  
  if ((window as any).electronAPI) {
    // Hard reboot Electron to allow the Core Engine side to re-index the newly configured SQLite / Projects paths
    const result = await (window as any).electronAPI.invoke('relaunch-app')
    
    // --- E2E TEST FIX ---
    // In test mode, relaunch is bypassed to keep the Playwright connection active.
    // We must manually navigate to the dashboard to allow the test to continue.
    if (result && result.skipped) {
      setTimeout(() => {
        router.push('/')
      }, 100)
    }
  } else {
    // Dev fallback
    setTimeout(() => {
      router.push('/')
    }, 100)
  }
}

const simulateLoading = () => {
  let currentStep = 0
  const interval = setInterval(() => {
    progress.value += 20
    
    if (currentStep < statusMessages.length) {
      statusText.value = statusMessages[currentStep]
      currentStep++
    }

    if (progress.value >= 100) {
      clearInterval(interval)
      setTimeout(() => {
        router.push('/')
      }, 100)
    }
  }, 400)
}

onMounted(async () => {
  // Give settings a split second to hydrate from window IPC
  setTimeout(async () => {
    await loadWorkspacePath()
    
    // Ignore DEV bypass if we want to test setup wizard properly
    // if (import.meta.env.DEV) {
    //   router.push('/')
    //   return
    // }

    if (!settingsStore.settings.setupCompleted) {
      // It's the first run
      showSetup.value = true
    } else {
      simulateLoading()
    }
  }, 150)
})
</script>

<style scoped>
@keyframes pulse-slow {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

@keyframes loading {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-pulse-slow {
  animation: pulse-slow 3s ease-in-out infinite;
}

.animate-loading {
  animation: loading 1.5s ease-in-out infinite;
}

.animate-fade-in {
  animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
