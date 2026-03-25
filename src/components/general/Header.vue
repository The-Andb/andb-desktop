<template>
  <header 
     class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2 h-14 transition-all duration-300 ease-in-out shrink-0"
  >
    <div class="flex items-center justify-between gap-4 h-full">
      <!-- Left side: Toggle button and title/breadcrumbs -->
      <div class="flex items-center space-x-2 min-w-0 h-full">

        <!-- Logo & Brand -->
        <div class="flex items-center space-x-2 cursor-pointer shrink-0 transition-opacity duration-300" 
             @click="handleLogoClick"
        >
          <img 
            src="/icon.png" 
            alt="TheAndb" 
            class="rounded shadow-sm transition-all duration-300 w-6 h-6"
          />
          <span 
             class="font-black text-gray-900 dark:text-white hidden md:block tracking-tight transition-all duration-300 text-base"
          >TheAndb</span>
        </div>

        <!-- Separator -->
        <div class="text-gray-300 dark:text-gray-600 font-bold mx-1">/</div>

        <!-- Project Manager Shortcut -->
        <button 
          @click="router.push('/projects')"
          class="p-1.5 text-gray-500 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all mr-1"
          :class="route.path === '/projects' ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : ''"
          :title="$t('projects.title')"
        >
          <LayoutGridIcon class="w-4 h-4" />
        </button>

        <!-- Project Display (Dashboard Style) -->
        <div 
          v-if="route.path !== '/settings'" 
          class="relative flex flex-col justify-center min-w-[120px] max-w-[200px] h-10 group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg px-2 transition-all -ml-1 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
        >
          <!-- Hidden Native Select -->
          <select 
            v-model="selectedProjectModel"
            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 -webkit-appearance-none"
            title="Switch Project"
          >
            <option v-for="p in projectsStore.projects" :key="p.id" :value="p.id">
              {{ p.name }}
            </option>
            <option value="__NEW__" class="font-bold text-primary-500">
              + {{ $t('projects.newProject') || 'New Project' }}
            </option>
          </select>

          <!-- Visible Label -->
          <div class="flex items-center justify-between w-full text-gray-900 dark:text-gray-100 transition-colors">
            <div class="flex items-center min-w-0">
              <Folder class="w-4 h-4 text-primary-500 shrink-0 mr-1.5" />
              <span class="font-extrabold text-sm tracking-tight truncate leading-none mt-px">
                {{ currentProjectName }}
              </span>
            </div>
            <!-- Hover marker -->
            <ChevronDown class="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0" />
          </div>

          <!-- Subtitle -->
          <span class="text-[8px] font-black text-gray-400/80 dark:text-gray-500 uppercase tracking-widest leading-none ml-[22px] mt-0.5">
            Project Dashboard
          </span>
        </div>

        <!-- Unified Connection / Sync Pair Selector removed per user request to use Sidebar -->

      </div>

      <!-- Right side: System Actions -->
      <div class="flex items-center space-x-1 shrink-0">
        <div class="flex items-center space-x-1">
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
import { 
  Settings,
  Info,
  LayoutGrid as LayoutGridIcon,
  ChevronDown,
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
const showAbout = ref(false)

const currentProjectName = computed(() => {
  const p = projectsStore.projects.find(p => p.id === projectsStore.selectedProjectId)
  return p ? p.name : 'Unknown Project'
})

const handleUpdateClick = () => {
   updaterStore.showModal = true
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
   router.push('/')
}


// Keyboard shortcuts moved to App.vue for better global handling
</script>
