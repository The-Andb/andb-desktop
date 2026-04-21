<template>
  <div class="h-screen flex flex-col pt-0 bg-white dark:bg-gray-900" :style="{ fontFamily: appStore.fontFamilies.general }">
    <!-- Global Header -->
    <Header />

    <div class="flex-1 flex overflow-hidden" :class="{ 'flex-row-reverse': appStore.layoutSettings.sidebarPosition === 'right' }">
      <!-- Global Sidebar -->
      <div 
        v-if="appStore.layoutSettings.sidebar"
        :style="{ width: displaySidebarWidth + 'px', borderRightWidth: (displaySidebarWidth === 0 || appStore.layoutSettings.sidebarPosition === 'right') ? '0' : '1px', borderLeftWidth: (appStore.layoutSettings.sidebarPosition === 'right' && displaySidebarWidth !== 0) ? '1px' : '0' }" 
        class="shrink-0 relative transition-all duration-300 ease-in-out border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
      >
        <Sidebar ref="sidebarRef" style="width: 100%" />
        <!-- Sidebar Resizer -->
        <div 
          @mousedown="startSidebarResize"
          class="absolute top-0 w-1 h-full cursor-col-resize hover:bg-primary-400/50 transition-colors z-20"
          :class="appStore.layoutSettings.sidebarPosition === 'right' ? 'left-0' : 'right-0'"
        ></div>
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white dark:bg-gray-950 relative">
        <!-- Toolbar Row (Operational context) -->
        <div v-if="appStore.layoutSettings.toolbar && ($slots.toolbar || isGlobalLayer)" class="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 shrink-0 bg-white dark:bg-gray-950/50 backdrop-blur-md z-10 transition-all duration-300">
          <div v-if="$slots.toolbar" class="flex-1 flex items-center min-w-0">
            <slot name="toolbar"></slot>
          </div>

          <!-- Close Global Layer (Settings/Project Manager) -->
          <div v-if="isGlobalLayer" class="flex items-center ml-2 pl-2 border-l border-gray-200 dark:border-gray-700 shrink-0">
            <button 
              @click="closeGlobalLayer" 
              data-testid="close-settings"
              class="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-transparent shrink-0"
              :title="$t('navigation.closeGlobal')"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Breadcrumbs Row -->
        <div v-if="appStore.layoutSettings.breadcrumbs && $slots.breadcrumbs" class="bg-gray-100/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 px-6 py-2 flex items-center gap-2 shrink-0 overflow-x-auto no-scrollbar">
          <slot name="breadcrumbs"></slot>
        </div>

        <!-- Content & Console Split -->
        <div class="flex-1 flex flex-col overflow-hidden relative">
          

          <!-- Page Content -->
          <main 
            class="flex-1 flex overflow-hidden relative"
            :style="{ height: consoleStore.isVisible ? `calc(100% - ${consoleStore.height}px)` : '100%' }"
          >
            <slot></slot>
          </main>

          <!-- Console Resizer -->
          <div 
            v-if="consoleStore.isVisible"
            @mousedown="startConsoleResize"
            class="h-1 cursor-row-resize bg-gray-200 dark:bg-gray-700 hover:bg-primary-500 transition-colors z-30 w-full shrink-0"
          ></div>

          <!-- Multi-Task Progress Bar (above console) -->
          <div v-if="appStore.isSchemaFetching && progressList.length > 0" class="shrink-0 flex flex-col bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40 transition-all duration-500 overflow-hidden">
            <div class="flex flex-col">
              <!-- Progress Items List -->
              <div v-for="(p, id) in visibleProgresses" :key="id" 
                   class="flex items-center gap-3 px-4 h-6 hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors group border-b border-gray-200/50 dark:border-gray-700/30 last:border-0">
                
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <div class="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0"></div>
                  <!-- Aligned Label -->
                  <div class="flex items-center gap-1 px-1 text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-tighter shrink-0 group-hover:text-primary-500 transition-colors w-[112px]">
                    <span class="w-[48px] text-right truncate">{{ p.connectionName || 'GLOBAL' }}</span>
                    <span class="text-gray-300 dark:text-gray-600 font-thin opacity-50">></span>
                    <span class="w-[50px] truncate">{{ p.type?.toUpperCase()?.replace(/S$/, '') }}</span>
                  </div>
                  <div class="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
                    <div 
                      class="h-full bg-primary-500 transition-all duration-300 ease-out rounded-full shadow-[0_0_8px_rgba(59,130,246,0.3)] relative overflow-hidden" 
                      :style="{ width: `${Math.min(100, Math.max(0, (p.current / p.total) * 100))}%` }"
                    >
                    </div>
                  </div>
                </div>

                <span class="text-[10px] font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 shrink-0 tabular-nums min-w-[80px] text-right truncate">
                   {{ p.current }}/{{ p.total }}
                </span>
              </div>

              <!-- Adaptive Controls Toolbar -->
              <div class="h-6 flex items-center justify-between px-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-4">
                  <!-- Collapse/Normal/Expand Modes -->
                  <div class="flex items-center gap-1 border-r border-gray-200 dark:border-gray-700 pr-3">
                    <button 
                      @click="progressDisplayMode = 'collapsed'"
                      :class="['p-0.5 rounded transition-colors', progressDisplayMode === 'collapsed' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40' : 'text-gray-400 hover:text-gray-600']"
                      title="Collapsed View (1 bar)"
                    >
                      <ChevronDown class="w-3.5 h-3.5" />
                    </button>
                    <button 
                      @click="progressDisplayMode = 'normal'"
                      :class="['p-0.5 rounded transition-colors', progressDisplayMode === 'normal' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40' : 'text-gray-400 hover:text-gray-600']"
                      title="Normal View (3 bars)"
                    >
                      <LayoutList class="w-3.5 h-3.5" />
                    </button>
                    <button 
                      @click="progressDisplayMode = 'expanded'"
                      :class="['p-0.5 rounded transition-colors', progressDisplayMode === 'expanded' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40' : 'text-gray-400 hover:text-gray-600']"
                      title="Expanded View (Show All)"
                    >
                      <Maximize2 class="w-3 h-3" />
                    </button>
                  </div>

                  <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    {{ progressList.length }} Active Task{{ progressList.length > 1 ? 's' : '' }}
                  </span>
                </div>

                <!-- Expand All / Show Less Action -->
                <button 
                  v-if="progressList.length > (progressDisplayMode === 'collapsed' ? 1 : 3)"
                  @click="toggleExpansion"
                  class="flex items-center gap-2 text-[10px] font-black text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 transition-colors uppercase tracking-[0.2em]"
                >
                  <component :is="progressDisplayMode === 'expanded' ? ChevronUp : Layers" class="w-3 h-3" />
                  {{ progressDisplayMode === 'expanded' ? 'Show Less' : `+ ${progressList.length - (progressDisplayMode === 'collapsed' ? 1 : 3)} More` }}
                </button>
              </div>
            </div>
          </div>
          <!-- Console Panel -->
          <div 
            v-if="consoleStore.isVisible" 
            class="shrink-0 bg-gray-900 border-t border-gray-700" 
            :style="{ height: consoleStore.height + 'px' }"
          >
            <ConsoleOutput :logs="consoleStore.logs" @clear="consoleStore.clearLogs()" @close="consoleStore.setVisibility(false)" />
          </div>

        </div>
      </div>
    </div>
    
    <Notification ref="notificationRef" />
    <CompareStackBar />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Header from '@/components/general/Header.vue'
import Sidebar from '@/components/general/Sidebar.vue'
import ConsoleOutput from '@/components/general/ConsoleOutput.vue'
import Notification from '@/components/general/Notification.vue'
import CompareStackBar from '@/components/compare/CompareStackBar.vue'
import { PanelBottom, X, Layers, ChevronDown, ChevronUp, LayoutList, Maximize2 } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { useConsoleStore } from '@/stores/console'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const consoleStore = useConsoleStore()
const { t: $t } = useI18n()

const isGlobalLayer = computed(() => {
  const globalRoutes = ['Settings', 'Projects']
  return globalRoutes.includes(String(route.name))
})

const isMainOperationTab = computed(() => {
  const mainRoutes = ['Dashboard', 'Schema', 'Compare', 'History']
  return mainRoutes.includes(String(route.name))
})

const closeGlobalLayer = () => {
  router.push('/')
}

// Sidebar Resizing
const isCollapsed = computed(() => appStore.sidebarCollapsed)
const sidebarWidth = ref(280)
const displaySidebarWidth = computed(() => {
  return isCollapsed.value ? 64 : sidebarWidth.value
})
const isResizingSidebar = ref(false)

const startSidebarResize = () => {
  if (isCollapsed.value) return
  isResizingSidebar.value = true
  document.addEventListener('mousemove', handleSidebarResize)
  document.addEventListener('mouseup', stopSidebarResize)
  document.body.style.cursor = 'col-resize'
}

const handleSidebarResize = (e: MouseEvent) => {
  if (isResizingSidebar.value) {
    const delta = appStore.layoutSettings.sidebarPosition === 'right' 
      ? window.innerWidth - e.clientX - (window.innerWidth - sidebarWidth.value) // Simplified, but let's be precise
      : e.clientX
    
    // For simplicity when resizing from right, we use direct calculation
    if (appStore.layoutSettings.sidebarPosition === 'right') {
      sidebarWidth.value = Math.max(160, Math.min(480, window.innerWidth - e.clientX))
    } else {
      sidebarWidth.value = Math.max(160, Math.min(480, e.clientX))
    }
  }
}

const stopSidebarResize = () => {
  isResizingSidebar.value = false
  document.removeEventListener('mousemove', handleSidebarResize)
  document.removeEventListener('mouseup', stopSidebarResize)
  document.body.style.cursor = ''
}

// Console Resizing
const isResizingConsole = ref(false)

const startConsoleResize = () => {
  isResizingConsole.value = true
  document.addEventListener('mousemove', handleConsoleResize)
  document.addEventListener('mouseup', stopConsoleResize)
  document.body.style.cursor = 'row-resize'
}

const handleConsoleResize = (e: MouseEvent) => {
  if (isResizingConsole.value) {
    const containerHeight = window.innerHeight
    const newHeight = Math.max(100, Math.min(containerHeight * 0.8, containerHeight - e.clientY))
    consoleStore.setHeight(newHeight)
  }
}

const stopConsoleResize = () => {
  isResizingConsole.value = false
  document.removeEventListener('mousemove', handleConsoleResize)
  document.removeEventListener('mouseup', stopConsoleResize)
  document.body.style.cursor = ''
}

// Adaptive Progress State
const progressDisplayMode = ref<'collapsed' | 'normal' | 'expanded'>('normal')
const progressList = computed(() => 
  Object.entries(appStore.schemaFetchProgresses)
    .map(([id, p]) => ({ id, ...p }))
    .filter(p => p.current < p.total)
)

const visibleProgresses = computed(() => {
  if (progressDisplayMode.value === 'collapsed') return progressList.value.slice(0, 1)
  if (progressDisplayMode.value === 'expanded') return progressList.value
  return progressList.value.slice(0, 3)
})

const toggleExpansion = () => {
  if (progressDisplayMode.value === 'expanded') {
    progressDisplayMode.value = 'normal'
  } else {
    progressDisplayMode.value = 'expanded'
  }
}

</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 4px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
}
</style>
