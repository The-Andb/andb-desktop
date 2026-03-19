<template>
  <header 
     class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 transition-all duration-300 ease-in-out shrink-0"
     :class="appStore.projectManagerMode ? 'py-1 h-10' : 'py-2 h-14'"
  >
    <div class="flex items-center justify-between gap-4 h-full">
      <!-- Left side: Toggle button and title/breadcrumbs -->
      <div class="flex items-center space-x-4 min-w-0 h-full">


        <!-- Logo & Brand -->
        <div class="flex items-center space-x-2 mr-4 cursor-pointer shrink-0 transition-opacity duration-300" 
             @click="handleLogoClick"
        >
          <img 
            src="/icon.png" 
            alt="The Andb" 
            class="rounded shadow-sm transition-all duration-300"
            :class="appStore.projectManagerMode ? 'w-5 h-5' : 'w-6 h-6'"
          />
          <span 
             class="font-black text-gray-900 dark:text-white hidden md:block tracking-tight transition-all duration-300"
             :class="appStore.projectManagerMode ? 'text-sm' : 'text-base'"
          >The Andb</span>
        </div>
        
        <div class="flex flex-col min-w-0 justify-center">
          <h1 
             class="font-black text-gray-900 dark:text-white leading-none truncate transition-all duration-300 uppercase tracking-wider"
             :class="[
               appStore.projectManagerMode ? 'text-xs cursor-pointer hover:text-primary-500' : 'text-sm',
               { 'cursor-pointer hover:text-primary-500': appStore.projectManagerMode }
             ]"
             @click="handleTitleClick"
          >
            {{ headerTitle }}
          </h1>
          <div 
             class="overflow-hidden transition-all duration-300 origin-top"
             :class="appStore.projectManagerMode ? 'h-0 opacity-0' : 'h-auto opacity-100'"
          >
             <Breadcrumbs />
          </div>
        </div>

      </div>

      <!-- Central Toolbar (Contextual Pair or Single Selector) -->
      <div 
         v-if="['/compare', '/schema', '/history'].includes(route.path)" 
         class="hidden lg:flex items-center gap-4 transition-all duration-300"
         :class="{'opacity-0 pointer-events-none scale-95': appStore.projectManagerMode}"
      >
        <!-- Dropdown Portion -->
        <div class="flex items-center space-x-4">
          <!-- PAIR SELECTOR (Contextual by Mode for Compare, otherwise always show) -->
          <div 
            v-if="['/compare', '/schema', '/history'].includes(route.path)"
            class="flex items-center"
          >
            <!-- PAIR DROP DOWN (Always show Auto/Pair context) -->
            <div class="flex items-center space-x-2 animate-in fade-in slide-in-from-left duration-300 relative group">
               <GitCompare v-if="route.path !== '/compare'" class="w-4 h-4 text-indigo-500" />
               <div v-if="route.path === '/compare'" class="flex items-center gap-2 text-primary-500">
                 <GitCompare class="w-4 h-4" />
               </div>
               <div class="relative">
                   <select
                     v-model="selectedPairId"
                     @change="onPairChange"
                     class="w-40 py-1 pl-1 pr-6 border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-primary-500 !bg-transparent text-gray-900 dark:text-white text-sm font-bold focus:ring-0 cursor-pointer appearance-none truncate transition-colors"
                     :class="{'text-gray-400 font-normal': !selectedPairId}"
                     :title="$t('header.pairContext')"
                   >
                     <option value="" disabled class="text-gray-400 bg-white dark:bg-gray-800">{{ $t('header.selectPair') }}</option>
                     <option v-for="pair in availablePairs" :key="pair.id" :value="pair.id" class="bg-white dark:bg-gray-800 font-bold text-gray-900 dark:text-white">
                       {{ pair.name }}
                     </option>
                   </select>
                   <div class="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                        <ChevronDown class="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                   </div>
               </div>
            </div>
          </div>
          
          <!-- SINGLE DB SELECTOR (Available in Schema, History) -->
          <div v-if="route.path !== '/compare'" class="flex items-center space-x-2 animate-in fade-in slide-in-from-right duration-300 relative group">
             <Database class="w-4 h-4 text-primary-500" />
             <div class="relative flex items-center">
                <select
                  v-model="appStore.selectedConnectionId"
                  class="w-40 py-1 pl-1 pr-6 border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 focus:border-primary-500 !bg-transparent text-gray-900 dark:text-white text-sm font-bold focus:ring-0 cursor-pointer !appearance-none truncate transition-colors"
                >
                  <option value="" disabled>{{ $t('header.selectDatabase') }}</option>
                  <option v-for="conn in appStore.filteredConnections" :key="conn.id" :value="conn.id" class="bg-white dark:bg-gray-800">
                    {{ conn.environment }}: {{ conn.database || conn.name }}
                  </option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                  <ChevronDown class="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
             </div>
          </div>
        </div>

        <div class="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2"></div>

        <!-- Unified Action Group -->
        <div class="flex items-center space-x-1">
          <!-- Verify Action (Contextual) -->
          <button
            @click="handleContextualTest"
            class="p-2 rounded-lg transition-all flex items-center group relative border"
            :class="[
              isContextTesting ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800/50 cursor-wait' : '',
              !isContextTesting && contextTestResult === 'success' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50 text-green-600 dark:text-green-400 shadow-sm shadow-green-500/10' : '',
              !isContextTesting && contextTestResult === 'failed' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 shadow-sm shadow-red-500/10' : '',
              !isContextTesting && (contextTestResult === 'idle' || !contextTestResult) ? 'bg-white dark:bg-gray-800 border-transparent hover:border-gray-200 dark:hover:border-gray-700 text-gray-400 hover:text-primary-500' : ''
            ]"
            :disabled="isContextTesting"
            :title="route.path === '/compare' ? $t('header.verifyPair') : $t('header.verifyConnection')"
          >
            <Loader2 v-if="isContextTesting" class="w-4 h-4 animate-spin text-primary-500" />
            <CheckCircle2 v-else-if="contextTestResult === 'success'" class="w-4 h-4" />
            <AlertCircle v-else-if="contextTestResult === 'failed'" class="w-4 h-4" />
            <ShieldCheck v-else class="w-4 h-4" />
          </button>

          <!-- Reload Action -->
          <button
            @click="refresh"
            class="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all group"
            :disabled="isRefreshing"
            :title="$t('header.reload')"
          >
            <RefreshCw class="w-4 h-4 text-gray-400 group-hover:text-primary-500 group-hover:rotate-180 transition-transform duration-500" :class="{ 'animate-spin': isRefreshing }" />
          </button>

          <div class="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>

          <!-- Settings Shortcut (Project Context) -->
          <button
            @click="router.push(route.path === '/compare' ? '/project-settings?cat=pairs' : '/project-settings?cat=connections')"
            class="p-2 text-gray-400 hover:text-primary-500 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-all group"
            :title="route.path === '/compare' ? $t('header.managePairs') : $t('header.manageConnections')"
          >
            <Layers class="w-4 h-4 transition-transform duration-500" />
          </button>
        </div>
      </div>

      <!-- Right side: System Actions -->
      <div class="flex items-center space-x-1 shrink-0">
        <div class="flex items-center space-x-1">
          <!-- Project Selector -->
          <div 
            v-if="!appStore.projectManagerMode && route.path !== '/settings'" 
            class="flex items-center bg-gray-50 dark:bg-white/5 rounded-lg pl-2.5 mr-2 border border-gray-200 dark:border-white/10 transition-all duration-300"
            :class="{'opacity-0 pointer-events-none w-0 overflow-hidden pr-0 mr-0 border-0': appStore.projectManagerMode}"
          >
            <Folder class="w-4 h-4 text-gray-500 mr-2" />
            <div class="relative flex items-center">
              <select 
                v-model="selectedProjectModel"
                class="!bg-transparent border-none text-xs font-bold py-1.5 pl-0 pr-7 focus:ring-0 cursor-pointer text-gray-700 dark:text-gray-200 min-w-[100px] !shadow-none !appearance-none"
              >
                <option v-for="p in projectsStore.projects" :key="p.id" :value="p.id" class="bg-white dark:bg-gray-800">
                  {{ p.name }}
                </option>
                <hr />
                <option value="__NEW__" class="bg-gray-50 dark:bg-gray-900 font-bold text-primary-500">
                  + {{ $t('projects.newProject') || 'New Project' }}
                </option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-1 pointer-events-none">
                <ChevronDown class="h-3.5 w-3.5 text-gray-400" />
              </div>
            </div>
          </div>

          <!-- Project Manager Shortcut (OOP improvement: next to selector) -->
          <button 
            v-if="!appStore.projectManagerMode"
            @click="router.push('/projects')"
            class="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-all mr-2"
            :title="$t('projects.title')"
          >
            <LayoutGridIcon class="w-4.5 h-4.5" />
          </button>

          <ThemeToggle />
          <LanguageToggle />
        </div>

        
        <div class="w-px h-6 bg-gray-200 dark:border-gray-700 mx-2"></div>

        <!-- App Settings -->
        <button
          @click="router.push('/settings')"
          class="p-2 rounded-lg transition-colors"
          :class="route.path === '/settings' 
            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-500' 
            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'"
          :title="$t('common.settings')"
        >
          <Settings class="w-5 h-5" />
        </button>

        <!-- Update Indicator -->
        <button
          v-if="updaterStore.status === 'downloaded' || updaterStore.status === 'available'"
          @click="handleUpdateClick"
          class="p-2 rounded-lg transition-all animate-pulse relative group"
          :class="updaterStore.status === 'downloaded' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'"
          :title="updaterStore.status === 'downloaded' ? 'Update Ready - Click to Restart' : 'New Update Available'"
        >
           <Download class="w-5 h-5" />
           <span class="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 border-2 border-white dark:border-gray-800"></span>
        </button>

        <button
          @click="showAbout = true"
          class="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          :title="$t('header.about')"
        >
          <Info class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- About Modal -->
    <AboutModal :isOpen="showAbout" @close="showAbout = false" />
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { useConnectionPairsStore } from '@/stores/connectionPairs'
import { useProjectsStore } from '@/stores/projects'
import ThemeToggle from './ThemeToggle.vue'

import LanguageToggle from './LanguageToggle.vue'
import AboutModal from './AboutModal.vue'
import Breadcrumbs from './Breadcrumbs.vue'
import { 
  ShieldCheck, 
  RefreshCw, 
  Settings,
  Info,
  Loader2,
  CheckCircle2,
  AlertCircle,
  GitCompare,
  LayoutGrid as LayoutGridIcon,
  ChevronDown,
  Database,
  Layers,
  Download,
  Folder
} from 'lucide-vue-next'

import { useUpdaterStore } from '@/stores/updater'

const route = useRoute()
const router = useRouter()
const { t: $t } = useI18n()
const appStore = useAppStore()
const connectionPairsStore = useConnectionPairsStore()
const projectsStore = useProjectsStore()
const updaterStore = useUpdaterStore()


// About modal state
// About modal state
const showAbout = ref(false)
const isRefreshing = ref(false)

const handleUpdateClick = () => {
   updaterStore.showModal = true
}

const isContextTesting = computed(() => {
  if (route.path === '/compare') {
    return connectionPairsStore.selectedPair?.status === 'testing'
  } else {
    const conn = appStore.resolvedConnections.find(c => c.id === appStore.selectedConnectionId)
    return (conn?.status as string) === 'testing'
  }
})

const contextTestResult = computed(() => {
  if (route.path === '/compare') {
    return connectionPairsStore.selectedPair?.status
  } else {
    const conn = appStore.resolvedConnections.find(c => c.id === appStore.selectedConnectionId)
    // Map internal status to UI status
    if (conn?.status === 'connected') return 'success'
    if (conn?.status === 'failed') return 'failed'
    return 'idle'
  }
})

const handleContextualTest = async () => {
  if (route.path === '/compare') {
    const selectedPair = connectionPairsStore.selectedPair
    if (selectedPair) {
      await connectionPairsStore.testConnectionPair(selectedPair.id)
    }
  } else {
    if (appStore.selectedConnectionId) {
      await appStore.testConnection(appStore.selectedConnectionId)
    }
  }
}

// Initialize store
onMounted(() => {
  // Auto-pick source for schema explorer if nothing selected
  if (route.path === '/schema' && !appStore.selectedConnectionId && connectionPairsStore.activePair) {
    appStore.selectedConnectionId = connectionPairsStore.activePair.source?.id || ''
  }
  // Auto-pick first pair if none selected and on compare route
  if (['/compare'].includes(route.path) && !connectionPairsStore.selectedPairId && availablePairs.value.length > 0) {
    connectionPairsStore.setSelectedPair(availablePairs.value[0].id)
  }
})

// Watch for route changes to apply auto-pick logic
watch(() => route.path, (newPath) => {
  if (['/schema', '/history'].includes(newPath) && !appStore.selectedConnectionId && connectionPairsStore.activePair) {
    appStore.selectedConnectionId = connectionPairsStore.activePair.source?.id || ''
  }
  // Auto-pick first pair if none selected when navigating to compare routes
  if (['/compare'].includes(newPath) && !connectionPairsStore.selectedPairId && availablePairs.value.length > 0) {
    connectionPairsStore.setSelectedPair(availablePairs.value[0].id)
  }
})


// Watch for pair changes to update auto-pick
watch(() => connectionPairsStore.selectedPairId, (newId) => {
  if (newId) {
    // Reset status
    const pair = connectionPairsStore.connectionPairs.find(p => p.id === newId)
    if (pair) {
      pair.status = 'idle'
      // If we are in schema/history view, update the selection to match the new pair's source
      if (['/schema', '/history'].includes(route.path) && connectionPairsStore.activePair) {
        appStore.selectedConnectionId = connectionPairsStore.activePair.source?.id || ''
      }
    }
  }
})

const selectedPairId = computed({
  get: () => connectionPairsStore.selectedPairId,
  set: (value) => connectionPairsStore.setSelectedPair(value)
})

const availablePairs = computed(() => connectionPairsStore.availablePairs)

// Watch for available pairs changes to auto-select if empty
watch(availablePairs, (pairs) => {
   if (['/compare'].includes(route.path) && !connectionPairsStore.selectedPairId && pairs.length > 0) {
      connectionPairsStore.setSelectedPair(pairs[0].id)
   }
}, { immediate: true })

const selectedProjectModel = computed({
  get: () => projectsStore.selectedProjectId,
  set: (val: string) => {
    if (val === '__NEW__') {
       const newProject = projectsStore.addProject({
          name: 'New Project',
          description: '',
          connectionIds: [],
          pairIds: [],
          enabledEnvironmentIds: ['DEV', 'STAGE', 'UAT', 'PROD']
       })
       projectsStore.selectProject(newProject.id)
    } else {
      projectsStore.selectProject(val)
    }
  }
})

const handleLogoClick = () => {
   if (appStore.projectManagerMode) {
      router.push('/projects')
   } else {
      router.push('/')
   }
}

const handleTitleClick = () => {
   if (appStore.projectManagerMode) {
      router.push('/projects')
   }
}

const headerTitle = computed(() => {
   return currentPageTitle.value
})

const currentPageTitle = computed(() => {
  const routeNames: Record<string, string> = {
    '/': $t('common.dashboard'),
    '/schema': $t('common.schema'),
    '/compare': $t('common.compare'),
    '/settings': $t('common.settings'),
    '/projects': $t('projects.title')
  }
  return routeNames[route.path] || $t('common.dashboard')
})




const onPairChange = () => {
}

const refresh = async () => {
  isRefreshing.value = true
  try {
    // Refresh connection pairs and app connections
    await Promise.all([
      connectionPairsStore.reloadData(),
      appStore.reloadData()
    ])
  } finally {
    // Artificial delay for feel
    setTimeout(() => {
      isRefreshing.value = false
    }, 800)
  }
}

// Keyboard shortcuts moved to App.vue for better global handling
</script>
