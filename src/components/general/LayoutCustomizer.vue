<script setup lang="ts">
import { ref } from 'vue'
import {
  X, PanelLeft, PanelTop, PanelBottom, PanelRight, Check,
  Zap, MousePointer2, Layers, LayoutDashboard, ArrowRightLeft, RotateCcw,
  Navigation, PanelLeftClose, LayoutTemplate, History, Bot
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { useConsoleStore } from '@/stores/console'
import { useRouter } from 'vue-router'

const appStore = useAppStore()
const consoleStore = useConsoleStore()
const router = useRouter()
const showLayoutMenu = ref(false)

const resetLayout = () => {
  appStore.layoutSettings = {
    sidebar: true,
    breadcrumbs: true,
    toolbar: true,
    sidebarPosition: 'left',
    aiPanel: false,
    aiPanelPosition: 'right',
    aiPanelWidth: 320
  }
  consoleStore.isVisible = false
}

const swapSidebar = () => {
  appStore.layoutSettings.sidebarPosition = appStore.layoutSettings.sidebarPosition === 'left' ? 'right' : 'left'
}

const swapAiPanel = () => {
  appStore.layoutSettings.aiPanelPosition = appStore.layoutSettings.aiPanelPosition === 'left' ? 'right' : 'left'
}

const swapSidebarAndAi = () => {
  const oldSidebar = appStore.layoutSettings.sidebarPosition
  appStore.layoutSettings.sidebarPosition = appStore.layoutSettings.aiPanelPosition
  appStore.layoutSettings.aiPanelPosition = oldSidebar
}
</script>

<template>
  <div
    class="relative flex items-center bg-gray-100/50 dark:bg-gray-800/40 p-1 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-md shadow-sm">
    <!-- Main Toggle -->
    <button @click="showLayoutMenu = !showLayoutMenu"
      class="w-8 h-8 rounded-xl transition-all flex items-center justify-center relative group"
      :class="showLayoutMenu ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-gray-400 hover:text-primary-600 hover:bg-white dark:hover:bg-gray-700'"
      title="Customize Layout">
      <LayoutDashboard class="w-4 h-4 transition-transform group-hover:scale-110" />
      <div v-if="appStore.layoutSettings.sidebar && consoleStore.isVisible"
        class="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary-500 rounded-full border border-white dark:border-gray-900 animate-pulse">
      </div>
    </button>

    <!-- Separator -->
    <div class="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1.5 opacity-50"></div>

    <!-- Appearance Controls (Row) -->
    <div class="flex items-center gap-1 px-0.5">
      <button @click="appStore.layoutSettings.sidebar = !appStore.layoutSettings.sidebar"
        class="w-7 h-7 rounded-lg transition-all duration-200 flex items-center justify-center relative group"
        :class="appStore.layoutSettings.sidebar ? 'bg-white dark:bg-gray-700 text-primary-500 shadow-sm border border-gray-100 dark:border-gray-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'"
        title="Toggle Sidebar">
        <PanelLeft class="w-3.5 h-3.5" />
      </button>
      <button @click="consoleStore.toggleVisibility()"
        class="w-7 h-7 rounded-lg transition-all duration-200 flex items-center justify-center relative group"
        :class="consoleStore.isVisible ? 'bg-white dark:bg-gray-700 text-primary-500 shadow-sm border border-gray-100 dark:border-gray-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'"
        title="Toggle Console">
        <PanelBottom class="w-3.5 h-3.5" />
      </button>
      <button @click="appStore.layoutSettings.aiPanel = !appStore.layoutSettings.aiPanel"
        class="w-7 h-7 rounded-lg transition-all duration-200 flex items-center justify-center relative group"
        :class="appStore.layoutSettings.aiPanel ? 'bg-white dark:bg-gray-700 text-primary-500 shadow-sm border border-gray-100 dark:border-gray-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'"
        title="Toggle AI Panel">
        <Bot class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Dropdown (VS Code Inspired Premium Menu) -->
    <div v-if="showLayoutMenu"
      class="absolute right-0 top-full mt-3 w-80 bg-white dark:bg-gray-950 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-gray-900 dark:text-white">
      <!-- Header -->
      <div
        class="px-4 py-3 border-b border-gray-100 dark:border-gray-800/50 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
        <div class="flex items-center gap-2">
          <LayoutDashboard class="w-3.5 h-3.5 text-primary-500" />
          <span class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">View
            Layout</span>
        </div>
        <button @click="showLayoutMenu = false"
          class="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <div class="p-1.5 space-y-0.5">
        <!-- Visibility Group (Row Layout) -->
        <div
          class="px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-400/60 flex items-center gap-2 mb-1">
          <span class="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
          Appearance Panels
        </div>

        <div class="grid grid-cols-5 gap-1 px-1.5 pb-2">
          <!-- Sidebar Toggle -->
          <button @click="appStore.layoutSettings.sidebar = !appStore.layoutSettings.sidebar"
            class="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all border group/panel"
            :class="appStore.layoutSettings.sidebar ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-800 shadow-inner' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'"
            title="Sidebar (⌘B)">
            <component :is="appStore.layoutSettings.sidebarPosition === 'left' ? PanelLeft : PanelRight"
              class="w-4 h-4 transition-transform group-hover/panel:scale-110"
              :class="appStore.layoutSettings.sidebar ? 'text-primary-500' : 'text-gray-400'" />
            <span class="text-[8px] font-black uppercase tracking-tighter"
              :class="appStore.layoutSettings.sidebar ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'">Sidebar</span>
          </button>

          <!-- Console Toggle -->
          <button @click="consoleStore.toggleVisibility()"
            class="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all border group/panel"
            :class="consoleStore.isVisible ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-800 shadow-inner' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'"
            title="Console (⌘J)">
            <PanelBottom class="w-4 h-4 transition-transform group-hover/panel:scale-110"
              :class="consoleStore.isVisible ? 'text-primary-500' : 'text-gray-400'" />
            <span class="text-[8px] font-black uppercase tracking-tighter"
              :class="consoleStore.isVisible ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'">Console</span>
          </button>

          <!-- Toolbar Toggle -->
          <button @click="appStore.layoutSettings.toolbar = !appStore.layoutSettings.toolbar"
            class="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all border group/panel"
            :class="appStore.layoutSettings.toolbar ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-800 shadow-inner' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'"
            title="Toolbar (⌥⌘M)">
            <PanelTop class="w-4 h-4 transition-transform group-hover/panel:scale-110"
              :class="appStore.layoutSettings.toolbar ? 'text-primary-500' : 'text-gray-400'" />
            <span class="text-[8px] font-black uppercase tracking-tighter"
              :class="appStore.layoutSettings.toolbar ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'">Toolbar</span>
          </button>

          <!-- Breadcrumbs Toggle -->
          <button @click="appStore.layoutSettings.breadcrumbs = !appStore.layoutSettings.breadcrumbs"
            class="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all border group/panel"
            :class="appStore.layoutSettings.breadcrumbs ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-800 shadow-inner' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'"
            title="Path (⌥⌘P)">
            <Navigation class="w-4 h-4 transition-transform group-hover/panel:scale-110"
              :class="appStore.layoutSettings.breadcrumbs ? 'text-primary-500' : 'text-gray-400'" />
            <span class="text-[8px] font-black uppercase tracking-tighter"
              :class="appStore.layoutSettings.breadcrumbs ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'">Bread</span>
          </button>

          <!-- AI Panel Toggle -->
          <button @click="appStore.layoutSettings.aiPanel = !appStore.layoutSettings.aiPanel"
            class="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all border group/panel"
            :class="appStore.layoutSettings.aiPanel ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-800 shadow-inner' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'"
            title="AI Assistant">
            <Bot class="w-4 h-4 transition-transform group-hover/panel:scale-110"
              :class="appStore.layoutSettings.aiPanel ? 'text-primary-500' : 'text-gray-400'" />
            <span class="text-[8px] font-black uppercase tracking-tighter"
              :class="appStore.layoutSettings.aiPanel ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'">AI</span>
          </button>
        </div>

        <!-- Position Group -->
        <div class="h-px bg-gray-100 dark:bg-gray-800/50 mx-2 my-1.5"></div>
        <div
          class="px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-400/60 flex items-center gap-2 mb-1">
          <span class="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
          Organization
        </div>

        <!-- Swap Sidebar -->
        <button @click="swapSidebar"
          class="w-full px-3 py-2 flex items-center justify-between rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group/item">
          <div class="flex items-center gap-3">
            <PanelLeft class="w-4 h-4 text-gray-400 group-hover/item:text-primary-500 transition-colors" />
            <span class="text-[11px] font-bold text-gray-700 dark:text-gray-300">Move Sidebar {{
              appStore.layoutSettings.sidebarPosition === 'left' ? 'Right' : 'Left' }}</span>
          </div>
          <span
            class="text-[9px] font-mono text-gray-300 dark:text-gray-600 tracking-tighter opacity-0 group-hover/item:opacity-100 transition-opacity">⌥⌘S</span>
        </button>

        <!-- Swap AI -->
        <button @click="swapAiPanel"
          class="w-full px-3 py-2 flex items-center justify-between rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group/item">
          <div class="flex items-center gap-3">
            <PanelRight class="w-4 h-4 text-gray-400 group-hover/item:text-primary-500 transition-colors" />
            <span class="text-[11px] font-bold text-gray-700 dark:text-gray-300">Move AI Panel {{
              appStore.layoutSettings.aiPanelPosition === 'left' ? 'Right' : 'Left' }}</span>
          </div>
        </button>

        <!-- SWAP SIDEBAR & AI -->
        <button @click="swapSidebarAndAi"
          class="w-full px-3 py-2 flex items-center justify-between rounded-xl bg-primary-500/5 hover:bg-primary-500/10 border border-primary-500/10 transition-all group/item">
          <div class="flex items-center gap-3">
            <ArrowRightLeft class="w-4 h-4 text-primary-500" />
            <span class="text-[11px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-tighter">Swap
              Sidebar & AI Assistant</span>
          </div>
        </button>

        <!-- Appearance Group -->
        <div class="h-px bg-gray-100 dark:bg-gray-800/50 mx-2 my-1.5"></div>
        <div
          class="px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-400/60 flex items-center gap-2 mb-1">
          <span class="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
          Visual Density
        </div>

        <div class="grid grid-cols-3 gap-1 px-1.5 pb-2">
          <button v-for="style in ['full', 'minimal', 'icons'] as const" :key="style"
            @click="appStore.buttonStyle = style"
            class="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all border group/btn" :class="appStore.buttonStyle === style
              ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-800 shadow-inner'
              : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'">
            <component :is="style === 'full' ? Zap : style === 'minimal' ? MousePointer2 : Layers"
              class="w-4 h-4 transition-transform group-hover/btn:scale-110"
              :class="appStore.buttonStyle === style ? 'text-primary-500' : 'text-gray-400'" />
            <span class="text-[8px] font-black uppercase tracking-tighter"
              :class="appStore.buttonStyle === style ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'">{{
                style }}</span>
          </button>
        </div>

        <!-- Footer Actions -->
        <div class="border-t border-gray-100 dark:border-gray-800/50 pt-1 mt-1">
          <button @click="router.push('/settings?cat=interface')"
            class="w-full px-3 py-2 flex items-center gap-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group/item">
            <LayoutTemplate class="w-4 h-4 text-gray-400 group-hover/item:text-primary-500 transition-colors" />
            <span class="text-[11px] font-bold text-gray-700 dark:text-gray-300">Advanced Interface Settings</span>
          </button>

          <button @click="resetLayout"
            class="w-full px-3 py-2 flex items-center gap-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-all group/reset">
            <RotateCcw class="w-4 h-4 text-gray-400 group-hover/reset:text-red-500 transition-colors" />
            <span class="text-[11px] font-bold text-gray-700 dark:text-gray-300 group-hover/reset:text-red-600">Reset
              Workspace Layout</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(100%);
  }
}
</style>
