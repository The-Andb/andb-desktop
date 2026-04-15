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

        <div 
          v-if="route.path !== '/settings'" 
          class="relative flex flex-col justify-center min-w-[130px] max-w-[220px] h-10 group cursor-pointer hover:bg-white dark:hover:bg-gray-800/80 rounded-xl px-3 transition-all -ml-1 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm"
          @click="isProjectPickerOpen = !isProjectPickerOpen"
        >
          <!-- Visible Label -->
          <div class="flex items-center justify-between w-full text-gray-900 dark:text-gray-100 transition-colors">
            <div class="flex items-center min-w-0">
              <div 
                v-if="currentProject"
                class="w-5 h-5 rounded-md flex items-center justify-center text-white mr-2 shadow-sm transition-transform group-hover:scale-110"
                :style="{ backgroundColor: currentProject.color || '#6366f1' }"
              >
                <component :is="projectIconMap[currentProject.icon || 'Database']" class="w-3 h-3" />
              </div>
              <Folder v-else class="w-4 h-4 text-primary-500 shrink-0 mr-1.5" />
              <span class="font-black text-sm tracking-tight truncate leading-none mt-px text-left">
                {{ currentProjectName }}
              </span>
            </div>
            <ChevronDown class="w-3.5 h-3.5 text-gray-400 group-hover:text-primary-500 transition-all ml-2 shrink-0" :class="{ 'rotate-180': isProjectPickerOpen }" />
          </div>

          <!-- Subtitle -->
          <span class="text-[8px] font-black text-gray-400 dark:text-gray-500 tracking-widest leading-none ml-[28px] mt-0.5 opacity-60 text-left">
            Project context
          </span>

          <!-- CUSTOM DROPDOWN -->
          <div v-if="isProjectPickerOpen" class="fixed inset-0 z-[90]" @click.stop="isProjectPickerOpen = false"></div>
          <div 
            v-if="isProjectPickerOpen" 
            class="absolute top-full left-0 mt-2 w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 z-[100] p-2 animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <div class="space-y-1">
              <button 
                v-for="p in projectsStore.projects" 
                :key="p.id"
                @click.stop="selectProject(p.id)"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 group/item relative overflow-hidden"
                :class="projectsStore.selectedProjectId === p.id 
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'"
              >
                <div 
                  class="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover/item:scale-110"
                  :style="{ backgroundColor: projectsStore.selectedProjectId === p.id ? 'rgba(255,255,255,0.2)' : (p.color || '#6366f1'), color: 'white' }"
                >
                  <component :is="projectIconMap[p.icon || 'Database']" class="w-4 h-4" />
                </div>
                <div class="flex flex-col items-start min-w-0 text-left">
                  <span class="text-xs font-black tracking-tight truncate w-full">{{ p.name }}</span>
                  <span v-if="p.lastOpenedAt" class="text-[9px] font-bold opacity-60 tracking-wider">Opened {{ formatDate(p.lastOpenedAt) }}</span>
                </div>
                <div v-if="projectsStore.selectedProjectId === p.id" class="ml-auto">
                    <Play class="w-3 h-3 fill-current" />
                </div>
              </button>

              <div class="h-px bg-gray-100 dark:bg-gray-800 mx-2 my-1"></div>

              <button 
                @click.stop="selectProject('__NEW__')"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs transition-all"
              >
                <div class="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Plus class="w-4 h-4" />
                </div>
                {{ $t('projects.newProject') || 'New Project' }}
              </button>
            </div>
          </div>
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
  Folder,
  Plus,
  Play
} from 'lucide-vue-next'

import { useUpdaterStore } from '@/stores/updater'
import { projectIconMap } from '@/utils/projectIcons'
import { formatDate } from '@/utils/date'

const route = useRoute()
const router = useRouter()
const { t: $t } = useI18n()
const appStore = useAppStore()
const connectionPairsStore = useConnectionPairsStore()
const projectsStore = useProjectsStore()
const updaterStore = useUpdaterStore()

const isProjectPickerOpen = ref(false)
const showAbout = ref(false)

const currentProject = computed(() => {
  return projectsStore.projects.find(p => p.id === projectsStore.selectedProjectId)
})

const currentProjectName = computed(() => {
  return currentProject.value ? currentProject.value.name : 'Unknown Project'
})

const selectProject = (id: string | '__NEW__') => {
  if (id === '__NEW__') {
     const newProject = projectsStore.addProject({
        name: 'New Project',
        description: '',
        connectionIds: [],
        pairIds: [],
        enabledEnvironmentIds: ['DEV', 'STAGE', 'PROD']
     })
     projectsStore.selectProject(newProject.id)
  } else {
    projectsStore.selectProject(id)
  }
  isProjectPickerOpen.value = false
}

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

const handleLogoClick = () => {
   router.push('/')
}


// Keyboard shortcuts moved to App.vue for better global handling
</script>
