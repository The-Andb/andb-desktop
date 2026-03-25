<template>
  <div class="h-screen flex flex-col pt-0 bg-gray-50 dark:bg-gray-900" :style="{ fontFamily: appStore.fontFamilies.general }">
    <Header />
    <div class="flex-1 flex overflow-hidden">
      <Sidebar />
      <main class="flex-1 flex overflow-hidden bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
        <!-- Settings Category Sidebar -->
        <div class="w-64 border-r border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 backdrop-blur-md flex flex-col shrink-0">
          <div class="p-8 pb-4">
            <h1 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2 mb-1">
              <Layers class="w-5 h-5 text-indigo-500" />
              {{ $t('settings.project_settings') }}
            </h1>
            <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest opacity-60">{{ projectsStore.currentProject?.name }}</p>
          </div>
          
          <div class="flex-1 overflow-y-auto px-4 py-2 space-y-6">
            <!-- Project Settings -->
            <div class="space-y-1">
               <h3 class="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 opacity-50">{{ $t('settings.sections.project') }}</h3>
              <button 
                v-for="cat in projectSettings" :key="cat.id"
                @click="activeCategory = cat.id"
                class="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden"
                :class="activeCategory === cat.id 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 active:scale-95' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'"
              >
                <component :is="cat.icon" class="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                <span class="text-[11px] font-bold uppercase tracking-widest">{{ cat.label }}</span>
                <div v-if="activeCategory === cat.id" class="absolute inset-0 bg-white/10 translate-x-[-100%] animate-[shimmer_3s_infinite] pointer-events-none"></div>
              </button>
            </div>
          </div>

          <!-- Bottom Actions -->
          <div class="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
            <button @click="resetToDefaults" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all border border-transparent hover:border-red-200/50 dark:hover:border-red-900/50">
              <RotateCcw class="w-3.5 h-3.5" />
              {{ $t('settings.reset') }}
            </button>
          </div>
        </div>
        
        <!-- Category Detail Pane -->
        <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div :class="activeCategory === 'env_pairs' ? 'w-full max-w-7xl mx-auto' : 'max-w-4xl mx-auto'">
            
            <!-- ENVIRONMENTS & PAIRS SECTION -->
            <div v-if="activeCategory === 'env_pairs'" class="animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div class="flex items-center gap-4 mb-8">
                <div class="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shadow-inner">
                  <GitCompare class="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ $t('settings.env_pairs.title', 'Environments & Sync Pairs') }}</h2>
                  <p class="text-xs text-gray-500 font-medium uppercase tracking-widest opacity-70">{{ $t('settings.env_pairs.subtitle', 'Build your infrastructure topology and migration paths') }}</p>
                </div>
              </div>
              
              <!-- 50/50 Split View -->
              <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                <!-- Left Column: Environments -->
                <div class="bg-white/50 dark:bg-gray-900/50 rounded-[2rem] p-6 lg:p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
                   <EnvironmentManager @show-connection-manager="activeCategory = 'connections'" />
                </div>
                
                <!-- Right Column: Sync Pairs -->
                <div class="bg-white/50 dark:bg-gray-900/50 rounded-[2rem] p-6 lg:p-8 border border-gray-100 dark:border-gray-800 shadow-sm relative">
                   <ConnectionPairManager />
                </div>
              </div>
            </div>

            <!-- CONNECTIONS SECTION -->
            <div v-if="activeCategory === 'connections'" class="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div class="flex items-center gap-4 mb-12">
                <div class="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shadow-inner">
                  <Link2 class="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ $t('settings.connections.title') }}</h2>
                  <p class="text-xs text-gray-500 font-medium uppercase tracking-widest opacity-70">{{ $t('settings.connections.subtitle') }}</p>
                </div>
              </div>
              <ConnectionManager />
            </div>



            <!-- ENGINE SECTION (PROJECT LEVEL) -->
            <div v-if="activeCategory === 'engine'" class="animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div class="flex items-center gap-4 mb-12">
                <div class="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shadow-inner">
                  <Cpu class="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h2 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ $t('settings.engine.title') }}</h2>
                  <p class="text-xs text-gray-500 font-medium uppercase tracking-widest opacity-70">{{ $t('settings.engine.subtitle') }}</p>
                </div>
              </div>

               <div class="space-y-6">
                  <!-- Text Normalization -->
                  <div class="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all shadow-sm relative overflow-hidden">
                    <div class="flex items-start gap-4 relative z-10">
                      <div class="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                        <Type class="w-6 h-6" />
                      </div>
                      <div class="flex-1 w-full">
                        <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-1">{{ $t('settings.engine.domainNormalization.title', 'Text Replace Rules (Normalization)') }}</h3>
                        <p class="text-[11px] text-gray-500 mb-5 max-w-2xl leading-relaxed">
                          Ignore superficial environment differences (e.g. changing <code>flo_dev_db</code> back to <code>flo_uat_db</code>, or stripping static emails) before running structural comparisons. The engine runs a Find & Replace on the SQL strings.
                        </p>
                        
                        <div class="flex flex-col sm:flex-row items-center gap-3">
                          <div class="flex-1 w-full space-y-1.5 relative">
                            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Find (Regex / Text)</label>
                            <div class="relative">
                              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input 
                                 :value="projectsStore.currentProject?.settings?.domainNormalization?.pattern"
                                 @input="updateProjectSetting('domainNormalization', 'pattern', ($event.target as HTMLInputElement).value)"
                                 type="text"
                                 class="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-700"
                                 placeholder="e.g. _dev_|_test_"
                              />
                            </div>
                          </div>
                          
                          <ArrowRight class="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0 mt-6 hidden sm:block" />
                          
                          <div class="flex-1 w-full space-y-1.5 relative">
                            <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Replace With</label>
                            <div class="relative">
                              <Wand2 class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input 
                                 :value="projectsStore.currentProject?.settings?.domainNormalization?.replacement"
                                 @input="updateProjectSetting('domainNormalization', 'replacement', ($event.target as HTMLInputElement).value)"
                                 type="text"
                                 class="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-700"
                                 placeholder="e.g. _prod_"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Migration Exclusions -->
                  <div class="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:border-red-500/30 dark:hover:border-red-500/30 transition-all shadow-sm relative overflow-hidden">
                    <div class="flex items-start gap-4 relative z-10">
                      <div class="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl shrink-0">
                        <Ban class="w-6 h-6" /> 
                      </div>
                      <div class="flex-1 w-full">
                        <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-1">{{ $t('settings.engine.migrationExclusions.title', 'Skip Objects (Exclusions)') }}</h3>
                        <p class="text-[11px] text-gray-500 mb-5 max-w-2xl leading-relaxed">
                          Protect test tables or legacy backup views from ever being deployed. If an object's name matches this regex, TheAndb strictly ignores it during migrations.
                        </p>
                        
                        <div class="space-y-1.5">
                          <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Exclude Pattern (Regex)</label>
                          <div class="relative">
                              <ShieldAlert class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input 
                                 :value="projectsStore.currentProject?.settings?.isNotMigrateCondition"
                                 @input="updateProjectSetting('isNotMigrateCondition', null, ($event.target as HTMLInputElement).value)"
                                 type="text"
                                 class="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-700"
                                 placeholder="e.g. ^temp_|backup$|test_"
                              />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
               </div>
            </div>

          </div>
        </div>


    <!-- Reset Data Confirmation Modal (Pro Style) -->
    <div v-if="showResetModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        class="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300"
        @click="showResetModal = false"
      ></div>
      
      <div class="relative bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        <!-- Modal Header -->
        <div class="px-8 pt-8 pb-4 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center shadow-inner">
              <Trash2 class="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ $t('settings.resetModal.title') }}</h3>
              <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-60">{{ $t('settings.resetModal.subtitle') }}</p>
            </div>
          </div>
          <button @click="showResetModal = false" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <!-- Modal Body -->
        <div class="px-8 py-6">
          <p class="text-xs font-medium text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
            {{ $t('settings.resetModal.warning').split('{irreversible}')[0] }}<span class="font-black text-red-500 underline decoration-2 underline-offset-2">{{ $t('settings.resetModal.irreversible') }}</span>.
          </p>
          
          <div class="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 mb-6">
            <h4 class="text-[9px] font-black text-red-700 dark:text-red-400 uppercase tracking-[0.2em] mb-4">{{ $t('settings.resetModal.purgedListTitle') }}</h4>
            <div class="grid grid-cols-1 gap-3">
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-gray-400">
                   <Database class="w-4 h-4" />
                </div>
                <span class="text-[11px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest">{{ $t('settings.resetModal.cachedSchemas') }}</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-gray-400">
                   <GitCompare class="w-4 h-4" />
                </div>
                <span class="text-[11px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest">{{ $t('settings.resetModal.comparisonResults') }}</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-gray-400">
                   <FileCode class="w-4 h-4" />
                </div>
                <span class="text-[11px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest">{{ $t('settings.resetModal.generatedAlters') }}</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-gray-400">
                   <Activity class="w-4 h-4" />
                </div>
                <span class="text-[11px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest">{{ $t('settings.resetModal.migrationHistory') }}</span>
              </div>
            </div>
          </div>
          
           <div class="flex items-start gap-3 p-4 bg-primary-50 dark:bg-primary-950/20 rounded-xl border border-primary-100/50 dark:border-primary-900/50">
             <div class="p-1 bg-white dark:bg-gray-800 rounded-md text-primary-500 shadow-sm">
               <RotateCcw class="w-3 h-3" />
             </div>
             <p class="text-[10px] text-primary-700 dark:text-primary-300 font-bold uppercase leading-relaxed tracking-tight">
               {{ $t('settings.resetModal.preservationNote') }}
             </p>
           </div>
        </div>
        
        <!-- Modal Footer -->
        <div class="px-8 py-6 bg-gray-50/50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4">
          <button 
            @click="showResetModal = false" 
            class="flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {{ $t('settings.resetModal.cancel') }}
          </button>
          <button 
            @click="confirmResetData" 
            class="flex-[1.5] py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            :disabled="isResetting"
          >
            <RotateCcw v-if="isResetting" class="w-3.5 h-3.5 animate-spin" />
            <span v-if="isResetting">{{ $t('settings.resetModal.purging') }}</span>
            <span v-else>{{ $t('settings.resetModal.confirm') }}</span>
          </button>
        </div>
      </div>
    </div>
    </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { 
  Layers,
  Link2, 
  GitCompare, 
  Database,
  Trash2,
  X,
  FileCode,
  Activity,
  RotateCcw,
  Cpu,
  Type,
  ArrowRight,
  Wand2,
  Ban,
  ShieldAlert,
  Search
} from 'lucide-vue-next'
import Header from '@/components/general/Header.vue'
import Sidebar from '@/components/general/Sidebar.vue'
import EnvironmentManager from '@/components/connection/EnvironmentManager.vue'
import ConnectionPairManager from '@/components/connection/ConnectionPairManager.vue'
import ConnectionManager from '@/components/connection/ConnectionManager.vue'
import { useConnectionPairsStore } from '@/stores/connectionPairs'
import { useAppStore } from '@/stores/app'
import { useProjectsStore } from '@/stores/projects' 
import { useOperationsStore } from '@/stores/operations'

import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const appStore = useAppStore()

const connectionPairsStore = useConnectionPairsStore()
const projectsStore = useProjectsStore()
const operationsStore = useOperationsStore()
const route = useRoute()

const categories = computed(() => {
  const projectCats = [
    { id: 'env_pairs', label: t('settings.categories.env_pairs', 'Env & Sync Pairs'), icon: GitCompare },
    { id: 'connections', label: t('settings.categories.connections'), icon: Link2 },
    { id: 'engine', label: t('settings.categories.engine'), icon: Cpu }
  ]
  
  return projectCats.map(c => ({ ...c, type: 'project' }))
})

const projectSettings = computed(() => categories.value)
const activeCategory = ref('connections') // Default to connections

// Handle deep linking from query params
const handleDeepLink = (query: any) => {
  if (query.cat && categories.value.find(c => c.id === query.cat)) {
    activeCategory.value = query.cat as string
  }
  // Support 'tab' alias as used in dashboard (e.g. settings?tab=connections)
  if (query.tab && categories.value.find(c => c.id === query.tab)) {
    activeCategory.value = query.tab as string
  }
}

// Watch for project changes to reset state
watch(() => projectsStore.selectedProjectId, () => {
  activeCategory.value = 'connections'
})

onMounted(() => {
  handleDeepLink(route.query)
})

watch(() => route.query, (newQuery) => {
  handleDeepLink(newQuery)
})

const showResetModal = ref(false)
const isResetting = ref(false)

const resetToDefaults = () => {
  showResetModal.value = true
}

const confirmResetData = async () => {
  isResetting.value = true
  try {
     if ((window as any).electronAPI && (window as any).electronAPI.andbClearStorage) {
         await (window as any).electronAPI.andbClearStorage()
     } else {
         await new Promise(resolve => setTimeout(resolve, 800))
     }
     
     // Reload app data
     await Promise.all([
       appStore.reloadData(),
       connectionPairsStore.reloadData(),
       operationsStore.clearOperations(),
       operationsStore.loadOperations()
     ])
     
     showResetModal.value = false
  } catch (error: any) {
    if (window.electronAPI) {
      window.electronAPI.log.send('error', 'Failed to reset data in settings', error.message)
    }
    alert('Failed to reset data.')
  } finally {
    isResetting.value = false
  }
}

const updateProjectSetting = (category: string, key: string | null, value: string) => {
  if (!projectsStore.currentProject) return

  const settings = { ...(projectsStore.currentProject.settings || {}) }
  
  if (category === 'domainNormalization') {
     const currentNorm = settings.domainNormalization || { pattern: '', replacement: '' }
     settings.domainNormalization = {
        pattern: currentNorm.pattern,
        replacement: currentNorm.replacement,
        [key!]: value
     }
  } else if (category === 'isNotMigrateCondition') {
     settings.isNotMigrateCondition = value
  } else if (category === 'projectBaseDir') {
     settings.projectBaseDir = value
  }

  projectsStore.updateProject(projectsStore.currentProject.id, { settings })
}

</script>


<style scoped>
@keyframes shimmer {
  0% { transform: translateX(-100%) skewX(-15deg); }
  100% { transform: translateX(200%) skewX(-15deg); }
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e7eb; /* gray-200 */
  border-radius: 9999px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #1f2937; /* gray-800 */
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #d1d5db; /* gray-300 */
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #374151; /* gray-700 */
}
</style>
