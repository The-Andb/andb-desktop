<template>
  <aside 
    :class="[
      'bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 flex flex-col h-full transition-all duration-300 ease-in-out select-none text-sm relative group',
      isCollapsed ? 'w-16' : 'w-72',
      shouldBlur ? 'blur-[2px] opacity-40 grayscale-[0.8] cursor-pointer' : ''
    ]"
    @click="shouldBlur && router.push('/')"
  >
    <!-- Click to Close Overlay (Visual Hint) -->
    <div v-if="shouldBlur" class="absolute inset-0 z-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
       <div class="p-3 rounded-2xl bg-white/90 dark:bg-gray-800/90 shadow-2xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white flex items-center gap-2 scale-90 group-hover:scale-100 transition-transform">
         <X class="w-4 h-4 text-red-500" />
         <span class="text-[10px] font-black uppercase tracking-widest">{{ $t('common.close') }}</span>
       </div>
    </div>

    <!-- Content Wrapper -->
    <div :class="['flex-1 flex flex-col min-h-0', shouldBlur ? 'pointer-events-none' : '']">
      <!-- Navigation Menu (Side Activity Bar style if collapsed, or just top menu) -->
      <!-- Navigation Menu (Dynamic Style) -->
      <nav v-show="!isCollapsed" class="flex-shrink-0 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-200 dark:border-gray-700 p-2 z-10 relative">
        <div class="flex items-center justify-between w-full">
          <div 
            :class="[
              appStore.navStyle === 'horizontal-tabs' 
                ? 'flex items-center gap-1 overflow-x-auto no-scrollbar pb-1.5 -mb-1.5 px-0.5 select-none flex-1 min-w-0' 
                : 'space-y-1 w-full'
            ]"
          >
            <router-link
              v-for="item in visibleNavItems" :key="item.path"
              :to="item.path"
              class="flex items-center rounded-lg transition-all duration-200 group relative"
              :class="[
                appStore.navStyle === 'horizontal-tabs' ? 'py-2 px-3 flex-shrink-0' : 'px-3 py-2',
                $route.path === item.path 
                  ? (appStore.navStyle === 'horizontal-tabs' ? 'text-primary-600 dark:text-primary-400' : 'bg-white dark:bg-gray-800 text-primary-600 dark:text-white shadow-sm ring-1 ring-gray-200 dark:ring-gray-700')
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              ]"
              :title="item.name"
            >
              <div 
                class="rounded-md transition-all duration-300" 
                :class="[
                   appStore.navStyle === 'horizontal-tabs' ? 'p-0.5' : 'p-1.5',
                   $route.path === item.path && appStore.navStyle !== 'horizontal-tabs' ? 'bg-primary-50 dark:bg-primary-900/30' : ''
                ]"
              >
                <component :is="item.icon" :class="appStore.navStyle === 'horizontal-tabs' ? 'w-5 h-5' : 'w-4 h-4'" />
              </div>
              <span v-if="appStore.navStyle !== 'horizontal-tabs'" class="ml-3 font-bold tracking-tight">{{ item.name }}</span>
              <ChevronRight v-if="$route.path === item.path && appStore.navStyle !== 'horizontal-tabs'" class="ml-auto w-3.5 h-3.5 opacity-50" />
              
              <!-- Active Indicator for horizontal mode -->
              <div v-if="appStore.navStyle === 'horizontal-tabs' && $route.path === item.path" class="absolute -bottom-2 left-2 right-2 h-0.5 bg-primary-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.3)]"></div>
            </router-link>
          </div>

          <!-- The More Menu Toggle (Horizontal Mode Only) -->
          <div v-if="appStore.navStyle === 'horizontal-tabs' && appStore.hiddenHorizontalTabs.length > 0" class="relative flex-shrink-0 ml-1 flex items-center">
             <button @click="isMoreMenuOpen = !isMoreMenuOpen" class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors" :class="{ 'bg-gray-200 dark:bg-gray-700': isMoreMenuOpen }" :title="$t('settings.interface.navigation.horizontalDesc')">
               <MoreHorizontal class="w-5 h-5" />
             </button>
             
             <!-- Popover Overlay for clickaway -->
             <div v-if="isMoreMenuOpen" class="fixed inset-0 z-40" @click="isMoreMenuOpen = false"></div>
             
             <!-- Popover Menu -->
             <div v-if="isMoreMenuOpen" class="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 z-50 p-1.5 overflow-hidden flex flex-col gap-0.5 select-none">
               <router-link
                 v-for="item in navItems.filter(i => appStore.hiddenHorizontalTabs.includes(i.path))"
                 :key="item.path"
                 :to="item.path"
                 class="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg gap-3 transition-colors"
                 :class="{ 'bg-primary-50 dark:bg-primary-900/30 text-primary-600': $route.path === item.path }"
                 @click="isMoreMenuOpen = false"
               >
                 <component :is="item.icon" class="w-4 h-4" :class="$route.path === item.path ? 'text-primary-600' : 'text-gray-500 dark:text-gray-400'" />
                 <span class="text-xs font-bold" :class="$route.path === item.path ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'">{{ item.name }}</span>
               </router-link>
             </div>
          </div>
        </div>
      </nav>

      <!-- Explorer Header -->
        <div 
          v-if="!isCollapsed"
          class="flex items-center justify-between px-4 h-16 shrink-0 transition-all duration-300 bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800"
        >
          <div class="flex items-center gap-2">
            <div v-if="route.path === '/compare'" class="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></div>
            <span class="uppercase tracking-[0.2em] font-black text-[10px]">{{ route.path === '/compare' ? 'Context Explorer' : (route.path === '/history' ? $t('navigation.explorer.history') : $t('navigation.explorer.schema')) }}</span>
          </div>
          <div class="flex items-center space-x-1.5">
            <button 
              @click="sidebarStore.requestRefresh()" 
              class="p-1.5 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-900" 
              :title="$t('navigation.actions.refresh')"
            >
              <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
            </button>
            <button 
              @click="appStore.toggleSidebar()" 
              class="p-1.5 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary-500"
              :title="$t('common.collapse')"
            >
              <PanelLeftClose class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      <!-- Tree Content -->
      <div v-show="!isCollapsed" class="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800">
        <!-- Loading State -->
        <div v-if="sidebarStore.loading && sidebarStore.environments.length === 0" class="p-4 space-y-2 opacity-50">
          <div class="h-4 bg-gray-700/20 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
          <div class="h-4 bg-gray-700/20 dark:bg-gray-700 rounded animate-pulse w-1/2"></div>
          <div class="h-4 bg-gray-700/20 dark:bg-gray-700 rounded animate-pulse w-2/3"></div>
        </div>

        <!-- Tree Content (Standard View) -->
        <div v-else-if="!isCompareView" class="pb-4">
          <div v-for="env in displayEnvironments" :key="env.name">
            <!-- Environment Node -->
            <div 
              class="group/env flex items-center h-7 px-2 cursor-pointer text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 border-l-2 border-transparent transition-colors"
              :class="{ 'text-gray-900 dark:text-white': expandedEnvironments.has(env.name), 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10': isSourceEnvironment(env.name) }"
              @click="toggleEnvironment(env.name)"
            >
               <ChevronRight 
                 class="w-3.5 h-3.5 mr-1.5 transition-transform text-gray-400 group-hover/env:text-gray-900 dark:group-hover/env:text-white" 
                 :class="{ 'rotate-90 text-gray-900 dark:text-white': expandedEnvironments.has(env.name) }"
               />
              <component :is="getEnvIcon(env.name)" class="w-3.5 h-3.5 mr-2 text-primary-500" />
              <span class="text-[10px] font-black uppercase tracking-wider truncate flex-1">{{ env.name }}</span>
              <span v-if="isSourceEnvironment(env.name)" class="ml-auto text-primary-600 dark:text-primary-400 font-mono bg-primary-100 dark:bg-primary-400/10 px-1 rounded uppercase font-bold text-[10px]">SRC</span>
            </div>

            <!-- Databases -->
            <div v-if="expandedEnvironments.has(env.name)">
              <div v-for="db in env.databases" :key="db.name" class="relative">
                <div class="absolute left-[19px] top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800"></div>
                
                <div 
                  class="group/db flex items-center h-8 px-2 pl-[22px] cursor-pointer transition-colors border-l-2"
                  :class="[
                    isActiveDatabase(db) 
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-primary-500 font-bold' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent'
                  ]"
                  @click="selectDatabase(env.name, db.name)"
                >
                   <ChevronRight 
                     class="w-3 h-3 mr-1.5 transition-transform text-gray-400 group-hover/db:text-gray-900 dark:group-hover/db:text-white" 
                     :class="{ 'rotate-90 text-gray-900 dark:text-white': expandedDatabases.has(`${env.name}-${db.name}`) }"
                     @click.stop="toggleDatabase(env.name, db.name)"
                   />
                  <Database class="w-3.5 h-3.5 mr-2 text-amber-500" />
                  <span class="text-[12px] font-bold truncate flex-1">{{ getDatabaseDisplayName(db) }}</span>

                  <button @click.stop="refreshDatabase(env.name, db.name)" class="p-1 opacity-0 group-hover/db:opacity-100 hover:bg-white dark:hover:bg-gray-700 rounded shadow-sm text-primary-500 mx-1">
                    <RefreshCw class="w-3 h-3" />
                  </button>
                </div>

                <!-- Categories -->
                <div v-if="expandedDatabases.has(`${env.name}-${db.name}`)" class="relative">
                   <div class="absolute left-[19px] top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800"></div>
                   <div class="absolute left-[41px] top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800"></div>

                   <div v-for="type in ddlTypes" :key="type.key">
                     <div 
                        class="group/cat flex items-center h-7 px-2 pl-[44px] cursor-pointer transition-colors border-l-2 border-transparent"
                        :class="[
                          expandedTypes.has(`${env.name}-${db.name}-${type.key}`) ? 'bg-gray-100/50 dark:bg-gray-800/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                          (db[type.key]?.length || 0) === 0 ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'
                        ]"
                        @click="selectCategory(env.name, db.name, type.key)"
                      >
                        <ChevronRight 
                          v-if="(db[type.key]?.length || 0) > 0"
                          class="w-3 h-3 mr-1.5 transition-transform text-gray-400 group-hover/cat:text-gray-900 dark:group-hover/cat:text-white" 
                          :class="{ 'rotate-90 text-gray-900 dark:text-white': expandedTypes.has(`${env.name}-${db.name}-${type.key}`) }"
                          @click.stop="toggleType(env.name, db.name, type.key)"
                        />
                        <div v-else class="w-3 h-3 mr-1.5 shrink-0"></div>
                        <div class="w-5 h-5 rounded flex items-center justify-center mr-2 border border-black/5 dark:border-white/5 bg-gray-50 dark:bg-gray-800">
                          <component :is="type.icon" class="w-3 h-3" :class="(db[type.key]?.length || 0) === 0 ? 'text-gray-400 grayscale' : type.colorClass" />
                        </div>
                        <span class="text-[10px] font-black truncate flex-1 uppercase tracking-tighter text-gray-500 dark:text-gray-400 group-hover/cat:text-gray-900 dark:group-hover/cat:text-white transition-colors duration-200">{{ type.label }}</span>
                        <div class="flex items-center gap-1.5 ml-auto">
                          <span v-if="(db[type.key]?.length || 0) > 0" class="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500/80 dark:text-gray-400 shadow-inner border border-black/5 dark:border-white/5 tabular-nums">
                            {{ db[type.key]?.length }}
                          </span>
                          <div v-if="getCategoryChangeCount(db, type.key) > 0" class="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-sm shadow-primary-500/50"></div>
                        </div>

                        <button @click.stop="refreshCategory(env.name, db.name, type.key)" class="p-0.5 opacity-0 group-hover/cat:opacity-100 hover:bg-white dark:hover:bg-gray-700 rounded shadow-sm text-primary-500 ml-1.5">
                          <RefreshCw class="w-3 h-3" />
                        </button>
                     </div>

                     <!-- Objects -->
                     <div v-if="expandedTypes.has(`${env.name}-${db.name}-${type.key}`)" class="relative ml-[44px] border-l border-gray-100 dark:border-gray-800 pb-1">
                        <div v-for="item in db[type.key]" :key="item.name"
                          @click.stop="selectObject(env.name, db.name, type.key, item)"
                          class="group/obj flex items-center h-6 pl-4 pr-2 cursor-pointer transition-colors border-l-2 border-transparent"
                          :class="selectedItem?.name === item.name && appStore.selectedConnectionId === db.connectionId ? 'text-primary-600 border-primary-500 bg-primary-50 font-bold' : 'text-gray-500 hover:text-primary-600 hover:bg-primary-50/50'"
                        >
                          <span class="truncate flex-1 font-mono text-[10px]">{{ item.name }}</span>
                          <span v-if="item.updated_at" class="ml-2 text-[8px] opacity-0 group-hover/obj:opacity-40 font-mono">{{ formatTimeAgo(item.updated_at).replace(' ago', '') }}</span>
                        </div>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sync Pair Navigation (Compare View Only) -->
        <div v-if="isCompareView" class="p-3 space-y-1.5 animate-in fade-in slide-in-from-left-4 duration-500">
            <div v-for="pair in availablePairs" :key="pair.id"
              @click="connectionPairsStore.selectPair(pair.id)"
              class="group p-3 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden flex items-center gap-3"
              :class="connectionPairsStore.selectedPairId === pair.id 
                ? 'bg-primary-50 dark:bg-primary-900/15 border-primary-500/30 shadow-sm shadow-primary-500/5' 
                : 'bg-transparent border-transparent hover:bg-gray-100/50 dark:hover:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700'"
            >
              <div v-if="connectionPairsStore.selectedPairId === pair.id" class="absolute left-0 top-3 bottom-3 w-1.5 bg-primary-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
              
              <!-- Icon Container -->
              <div 
                class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300" 
                :class="[
                  connectionPairsStore.selectedPairId === pair.id 
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 group-hover:scale-105' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:text-primary-500 group-hover:bg-white dark:group-hover:bg-gray-700 group-hover:shadow-md'
                ]"
              >
                <component :is="getPairIcon(pair)" class="w-5 h-5 transition-transform duration-300" :class="{ 'group-hover:rotate-6': true }" />
              </div>

              <div class="min-w-0 flex-1">
                <div class="text-[12px] font-black truncate tracking-tighter transition-colors" :class="connectionPairsStore.selectedPairId === pair.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'">{{ pair.name }}</div>
                <div class="text-[9px] font-bold truncate opacity-60 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                   <span class="text-primary-600 dark:text-primary-400 font-extrabold">{{ pair.sourceEnv }}</span>
                   <span class="mx-1 opacity-40">→</span> 
                   <span class="text-emerald-600 dark:text-emerald-400 font-extrabold">{{ pair.targetEnv }}</span>
                </div>
              </div>
            </div>
           <div v-if="availablePairs.length === 0" class="py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-[9px]">No sync pairs configured.</div>
        </div>
      </div>
      
      <!-- Git Sync Status Chip -->
      <div v-if="!isCollapsed && sidebarStore.gitStatus" class="px-3 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/50">
         <div class="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
            <div class="flex items-center gap-2 min-w-0">
               <div class="relative">
                  <GitBranch class="w-3.5 h-3.5 text-primary-500" />
                  <span v-if="sidebarStore.gitStatus.modifiedFiles?.length > 0" class="absolute -top-1 -right-1 w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
               </div>
               <div class="flex flex-col min-w-0">
                  <span class="text-[10px] font-black text-gray-900 dark:text-white leading-none uppercase tracking-tight truncate">{{ sidebarStore.gitStatus.currentBranch }}</span>
                  <span class="text-[9px] text-gray-400 font-bold truncate">
                     {{ sidebarStore.gitStatus.modifiedFiles?.length || 0 }} unsynced changes
                  </span>
               </div>
            </div>
            <button @click="sidebarStore.checkGitStatus()" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-primary-500">
               <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': sidebarStore.gitLoading }" />
            </button>
         </div>
      </div>
      
      <!-- Collapsed Mode Icon Bar -->
      <div v-if="isCollapsed" class="flex flex-col items-center py-4 space-y-4">
        <!-- Expand Button -->
        <button 
          @click="appStore.toggleSidebar()"
          class="p-2 text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors mb-2"
          :title="$t('common.expand')"
        >
          <PanelLeftOpen class="w-5 h-5" />
        </button>

        <router-link v-for="item in navItems" :key="item.path" :to="item.path" class="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 rounded" :title="item.name">
          <component :is="item.icon" class="w-5 h-5" />
        </router-link>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { useConnectionPairsStore } from '@/stores/connectionPairs'
import { useSidebarStore } from '@/stores/sidebar'
import { useProjectsStore } from '@/stores/projects'
import { useFeaturesStore } from '@/stores/features'

import { 
  Home, 
  Database,
  GitCompare, 
  History,
  Workflow,
  RefreshCw, 
  ChevronRight,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Box,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Grid3X3,
  Eye,
  Cpu,
  CalendarClock,
  Sigma,
  Settings2,
  Network,
  GitBranch,
  MoreHorizontal
} from 'lucide-vue-next'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const connectionPairsStore = useConnectionPairsStore()
const sidebarStore = useSidebarStore()
const projectsStore = useProjectsStore()
const featuresStore = useFeaturesStore()


const isCollapsed = computed(() => appStore.sidebarCollapsed || isGlobalLayer.value)
const selectedItem = computed(() => (route.path === '/schema' || route.path === '/history') ? (window as any)._andbSelectedObject : null)

const activePair = computed(() => connectionPairsStore.activePair)

const availablePairs = computed(() => connectionPairsStore.availablePairs || [])

const isGlobalLayer = computed(() => {
  const globalRoutes = ['Settings', 'Projects']
  return globalRoutes.includes(String(route.name))
})

const shouldBlur = computed(() => {
  return isGlobalLayer.value
})

// Navigation Items
const navItems = computed(() => {
  const items = [
    { name: t('common.dashboard'), path: '/', icon: Home, visible: true },
    { name: t('common.schema'), path: '/schema', icon: Database, visible: true },
    { name: t('common.compare'), path: '/compare', icon: GitCompare, visible: true },
    { name: t('common.history'), path: '/history', icon: History, visible: true },
    { name: 'Instant Compare', path: '/instant-compare', icon: Workflow, visible: true },
    { name: 'Git Sync', path: '/integrations', icon: GitBranch, visible: true },
    { name: 'ER Diagram', path: '/er-diagram', icon: Network, visible: featuresStore.isEnabled('erDiagram') },
    { name: t('settings.project_settings'), path: '/project-settings', icon: Settings2, visible: true }, 
  ]
  return items.filter(i => i.visible)
})

const isMoreMenuOpen = ref(false)

const visibleNavItems = computed(() => {
  if (appStore.navStyle !== 'horizontal-tabs') return navItems.value
  return navItems.value.filter(item => !appStore.hiddenHorizontalTabs.includes(item.path))
})

// Schema Tree State
const environments = computed(() => sidebarStore.environments)
const loading = computed(() => sidebarStore.loading)

const expandedEnvironments = computed(() => sidebarStore.expandedEnvironments)
const expandedDatabases = computed(() => sidebarStore.expandedDatabases)
const expandedTypes = computed(() => sidebarStore.expandedTypes)

// Search State
const searchQuery = ref('')
const searchFlags = ref({
  caseSensitive: false,
  wholeWord: false,
  regex: false
})
const isSearchActive = computed(() => searchQuery.value.length > 0)


const isCompareView = computed(() => route.path === '/compare')

// Comparison Mapping from Store
const comparisonMap = computed(() => {
  const map: Record<string, any> = {}
  if (sidebarStore.comparisonResults) {
    sidebarStore.comparisonResults.forEach(res => {
      map[`${res.type}-${res.name}`] = res
    })
  }
  return map
})

const getCategoryChangeCount = (db: any, typeKey: string) => {
  if (!sidebarStore.comparisonResults) return 0
  return db[typeKey].filter((item: any) => {
    const res = comparisonMap.value[`${typeKey}-${item.name}`]
    return res && res.status !== 'equal' && res.status !== 'same'
  }).length
}


const filteredEnvironments = computed(() => {
  let envs = environments.value
  
  if (route.path === '/compare' && activePair.value?.sourceEnv) {
    envs = environments.value.filter(env => env.name.toUpperCase() === activePair.value?.sourceEnv?.toUpperCase())
  }

  // Use the order from connectionPairsStore.environments
  return [...envs].sort((a, b) => {
    const envA = connectionPairsStore.environments.find(e => e.name.toUpperCase() === a.name.toUpperCase())
    const envB = connectionPairsStore.environments.find(e => e.name.toUpperCase() === b.name.toUpperCase())
    
    const orderA = envA ? envA.order : 999
    const orderB = envB ? envB.order : 999
    
    if (orderA !== orderB) return orderA - orderB
    return a.name.localeCompare(b.name)
  })
})

const displayEnvironments = computed(() => {
  const envs = filteredEnvironments.value
  if (!isSearchActive.value) return envs

  const q = searchQuery.value
  const { caseSensitive, wholeWord, regex } = searchFlags.value

  let filterFn: (name: string) => boolean

  if (regex) {
    try {
      const re = new RegExp(q, caseSensitive ? '' : 'i')
      filterFn = (name: string) => re.test(name)
    } catch (e) {
      filterFn = () => false
    }
  } else {
    const searchVal = caseSensitive ? q : q.toLowerCase()
    filterFn = (name: string) => {
      const itemVal = caseSensitive ? name : name.toLowerCase()
      if (wholeWord) {
        return itemVal === searchVal
      }
      return itemVal.includes(searchVal)
    }
  }

  // Deep filter
  const result: any[] = []
  
  envs.forEach(env => {
    const filteredDatabases: any[] = []
    
    env.databases.forEach((db: any) => {
      const filteredDb = { ...db }
      let dbHasMatch = false
      
      // Also check if DB name itself matches (optional, but good for UX)
      // if (filterFn(db.name)) dbHasMatch = true
      
      ddlTypes.value.forEach(type => {
        const items = db[type.key] || []
        const filteredItems = items.filter((item: any) => filterFn(item.name))
        filteredDb[type.key] = filteredItems
        if (filteredItems.length > 0) {
          dbHasMatch = true
          // Auto-expand if search matches
          expandedEnvironments.value.add(env.name)
          expandedDatabases.value.add(`${env.name}-${db.name}`)
          expandedTypes.value.add(`${env.name}-${db.name}-${type.key}`)
        }
      })
      
      if (dbHasMatch) {
        filteredDatabases.push(filteredDb)
      }
    })
    
    if (filteredDatabases.length > 0) {
      result.push({ ...env, databases: filteredDatabases })
    }
  })
  
  return result
})

// DDL Types Mapping
const ddlTypes = computed(() => [
  { key: 'tables', label: t('navigation.ddl.tables'), icon: Grid3X3, colorClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-50 dark:bg-blue-900/30' },
  { key: 'views', label: t('navigation.ddl.views'), icon: Eye, colorClass: 'text-indigo-600 dark:text-indigo-400', bgClass: 'bg-indigo-50 dark:bg-indigo-900/30' },
  { key: 'procedures', label: t('navigation.ddl.procedures'), icon: Cpu, colorClass: 'text-purple-600 dark:text-purple-400', bgClass: 'bg-purple-50 dark:bg-purple-900/30' },
  { key: 'functions', label: t('navigation.ddl.functions'), icon: Sigma, colorClass: 'text-purple-600 dark:text-purple-400', bgClass: 'bg-purple-50 dark:bg-purple-900/30' },
  { key: 'triggers', label: t('navigation.ddl.triggers'), icon: Zap, colorClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-50 dark:bg-amber-900/30' },
  { key: 'events', label: t('navigation.ddl.events'), icon: CalendarClock, colorClass: 'text-cyan-600 dark:text-cyan-400', bgClass: 'bg-cyan-50 dark:bg-cyan-900/30' }
])

// Actions
const isSourceEnvironment = (envName: string) => {
  return activePair.value?.sourceEnv === envName
}

const getEnvIcon = (envName: string) => {
  const name = envName.toUpperCase()
  if (name.includes('PROD')) return ShieldAlert
  if (name.includes('UAT')) return ShieldCheck
  if (name.includes('STAGE')) return Activity
  return Box
}


const isActiveDatabase = (db: any) => {
  return db.connectionId === appStore.selectedConnectionId
}

const toggleEnvironment = (envName: string) => {
  if (expandedEnvironments.value.has(envName)) {
    expandedEnvironments.value.delete(envName)
  } else {
    expandedEnvironments.value.add(envName)
  }
}

const toggleDatabase = (envName: string, dbName: string) => {
  const key = `${envName}-${dbName}`
  if (expandedDatabases.value.has(key)) {
    expandedDatabases.value.delete(key)
  } else {
    expandedDatabases.value.add(key)
  }
}

const toggleType = (envName: string, dbName: string, type: string) => {
  const key = `${envName}-${dbName}-${type}`
  if (expandedTypes.value.has(key)) {
    expandedTypes.value.delete(key)
  } else {
    expandedTypes.value.add(key)
  }
}

const selectObject = async (env: string, db: string, type: string, item: any) => {
  // Update global selected connection first to ensure context is correct
  const envData = displayEnvironments.value.find((e: any) => e.name === env)
  if (envData) {
     const dbData = envData.databases.find((d: any) => d.name === db)
     if (dbData && dbData.connectionId) {
        appStore.selectedConnectionId = dbData.connectionId
     }
  }

  const isNavigationNeeded = !['/schema', '/history'].includes(route.path)
  if (isNavigationNeeded) {
    await router.push('/schema')
  }
  
  // Small delay to ensure component is mounted
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('object-selected', { 
      detail: { env, db, type, name: item.name } 
    }))
  }, isNavigationNeeded ? 200 : 0)
}

const selectDatabase = async (env: string, db: string) => {
  toggleDatabase(env, db)
  
  // Update global selected connection
  const envData = displayEnvironments.value.find((e: any) => e.name === env)
  if (envData) {
     const dbData = envData.databases.find((d: any) => d.name === db)
     if (dbData && dbData.connectionId) {
        appStore.selectedConnectionId = dbData.connectionId
     }
  }

  if (route.path === '/compare') {
    window.dispatchEvent(new CustomEvent('category-selected', { detail: { env, db, type: 'all' } }))
  } else {
    const isNavigationNeeded = !['/schema', '/history'].includes(route.path)
    if (isNavigationNeeded) {
      await router.push('/schema')
    }
    // Small delay to ensure component is mounted and listener attached if we navigated
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('category-selected', { detail: { env, db, type: 'all' } }))
    }, isNavigationNeeded ? 200 : 0)
  }
}

const selectCategory = async (env: string, db: string, type: string) => {
  toggleType(env, db, type)
  if (route.path === '/compare') {
    window.dispatchEvent(new CustomEvent('category-selected', { detail: { env, db, type } }))
  } else {
    const isNavigationNeeded = !['/schema', '/history'].includes(route.path)
    if (isNavigationNeeded) {
      await router.push('/schema')
    }
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('category-selected', { detail: { env, db, type } }))
    }, isNavigationNeeded ? 200 : 0)
  }
}

const refreshDatabase = (env: string, db: string) => {
  window.dispatchEvent(new CustomEvent('database-refresh-requested', { detail: { env, db } }))
}

const refreshCategory = (env: string, db: string, type: string) => {
  window.dispatchEvent(new CustomEvent('category-refresh-requested', { detail: { env, db, type } }))
}

const getDatabaseDisplayName = (db: any) => {
  const conn = appStore.getConnectionById(db.connectionId)
  if (!conn) return db.name
  if (conn.type === 'dump') return conn.name
  return db.name || conn.name
}

const getPairIcon = (pair: any) => {
  if (pair.name.toLowerCase().includes('prod')) return ShieldAlert
  if (pair.name.toLowerCase().includes('uat')) return ShieldCheck
  if (pair.name.toLowerCase().includes('stage')) return Activity
  return GitCompare
}

const formatTimeAgo = (dateString: string) => {
  if (!dateString) return t('schema.never')
  try {
    let utcString = dateString
    if (!dateString.endsWith('Z')) {
      utcString = dateString.replace(' ', 'T') + 'Z'
    }
    
    const date = new Date(utcString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    
    if (diffSec < 0) return t('common.timeAgo.justNow')
    if (diffSec < 60) return t('common.timeAgo.justNow')
    if (diffSec < 3600) return t('common.timeAgo.minAgo', { n: Math.floor(diffSec / 60) })
    if (diffSec < 86400) return t('common.timeAgo.hourAgo', { n: Math.floor(diffSec / 3600), s: Math.floor(diffSec / 3600) > 1 ? 's' : '' })
    return date.toLocaleDateString()
  } catch (e) {
    return dateString
  }
}

const refreshSchemas = async (force = false) => {
  try {
    const result = await sidebarStore.loadSchemas(force)
    if (!result) return

    const conns = appStore.filteredConnections || [] // Connections for current project
    
    // Group by environment
    const envMap = new Map<string, any>()
    
    // 1. Initialize with configured connections so they always appear
    conns.forEach((c: any) => {
      if (!envMap.has(c.environment)) {
        envMap.set(c.environment, { name: c.environment, databases: [] })
      }
      const env = envMap.get(c.environment)
      if (!env.databases.find((db: any) => db.name === c.database)) {
        env.databases.push({
          name: c.database,
          connectionId: c.id,
          tables: [],
          views: [],
          procedures: [],
          functions: [],
          triggers: [],
          events: [],
          totalCount: 0,
          lastUpdated: null
        })
      }
    })
    
    // 2. Merge with results from SQLite - ONLY for connections in the current project
    if (result && Array.isArray(result)) {
      console.log('[Sidebar] Processing Schema Result:', { 
         totalEnvs: result.length, 
         connsCount: conns.length,
         conns: conns.map(c => ({ id: c.id, name: c.name, db: c.database, type: c.type, env: c.environment }))
      })

      result.forEach((remoteEnv: any) => {
        remoteEnv.databases.forEach((remoteDb: any) => {
          // Find matching connection in current project scope
          // Improved Logic:
          // 1. Can we match by Connection ID if available in remoteEnv? (Usually remote only has name/db)
          // 2. Normalize and check empty DB names for Dump files
          
          const projectConn = conns.find((c: any) => {
             const envMatch = (c.environment || '').toLowerCase() === (remoteEnv.name || '').toLowerCase()
             
             // 1. Strict ID Match (if remoteDb has connectionId, which it often doesn't from backend, but let's check)
             if (remoteDb.connectionId && c.id === remoteDb.connectionId) return true;

             // 2. Dump File Logic:
             // Dump connections can have empty database names or names like 'demo_source'.
             // We relax the check: if connection is Dump type and environment matches, we assume it's the one (since we project-scope queries usually)
             
             if (c.type === 'dump' && envMatch) {
                // If remoteDb key provided host/path, use it!
                // Inspecting keys during dev to confirm availability
                if ((remoteDb as any).host && c.host) {
                   // Compare normalized paths
                   return (remoteDb as any).host.trim() === c.host.trim()
                }

                // Fallback: If remoteDb.name is empty OR matches cached name OR matches connection name
                const cDbName = (c.database || '').toLowerCase()
                const cName = (c.name || '').toLowerCase()
                const rDbName = (remoteDb.name || '').toLowerCase()
                
                const isMatch = cDbName === rDbName || rDbName === '' || cName === rDbName
                
                if (isMatch) console.log('[Sidebar] Dump Match Found (Weak):', { cName: c.name, rDbName, cHost: c.host })
                return isMatch
             }

             // 3. Standard Logic
             return envMatch && (c.database || '').toLowerCase() === (remoteDb.name || '').toLowerCase()
          })
          
          if (!projectConn) {
             console.warn('[Sidebar] Unmatched Schema:', remoteEnv.name, remoteDb.name)
          }

          if (projectConn) {
            let localEnv = envMap.get(remoteEnv.name)
            if (!localEnv) {
               localEnv = { name: remoteEnv.name, databases: [] }
               envMap.set(remoteEnv.name, localEnv)
            }
            
            let localDb = localEnv.databases.find((db: any) => 
               db.name === remoteDb.name || 
               (db.connectionId === projectConn.id) ||
               ((db.name || '').toLowerCase() === (remoteDb.name || '').toLowerCase())
            )
            
            // Critical Fix: If localDb exists (created from config), merge data.
            // If it doesn't exist (unexpected), create it.
            
            if (localDb) {
              // Found configured connection, merge actual counts/data
              // Use Object.assign to update reactive object in place
              Object.assign(localDb, {
                 tables: remoteDb.tables,
                 views: remoteDb.views,
                 procedures: remoteDb.procedures,
                 functions: remoteDb.functions,
                 triggers: remoteDb.triggers,
                 events: remoteDb.events,
                 totalCount: remoteDb.totalCount || 0
                 // Do NOT overwrite name or connectionId as local config is source of truth
              })
            } else {
              // Should have been created in Step 1, but added here for safety
              localEnv.databases.push({ ...remoteDb, connectionId: projectConn.id })
            }
          }
        })
      })
    }
    
    const finalEnvs = Array.from(envMap.values())
    sidebarStore.setEnvironments(finalEnvs)
    
    // Auto-expand all environments by default to show connections
    finalEnvs.forEach((env: any) => expandedEnvironments.value.add(env.name))
  } catch (error: any) {
    if (window.electronAPI) {
      window.electronAPI.log.send('error', 'Failed to load schemas in sidebar', error.message)
    }
  }
}


// Watch for active pair changes to auto-expand
watch(activePair, (newPair) => {
  if (newPair?.sourceEnv) {
    expandedEnvironments.value.add(newPair.sourceEnv)
  }
}, { immediate: true })

watch(() => appStore.resolvedConnections, () => {
  refreshSchemas(false) // Use cache if available, don't force re-parse
}, { deep: true })


watch(() => sidebarStore.refreshKey, () => {
  refreshSchemas(false) // Triggered when individual category/object fetched, update from cache
})

watch(() => sidebarStore.refreshRequestKey, () => {
  refreshSchemas(true) // Force full fetch from DB
})

watch(() => projectsStore.selectedProjectId, () => {
  refreshSchemas(false) // Just regroup the connections
})



onMounted(() => {
  refreshSchemas(false)
  sidebarStore.checkGitStatus()
})

defineExpose({
  refreshSchemas
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5); /* gray-400 */
  border-radius: 4px;
}
@media (prefers-color-scheme: dark) {
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
  }
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(107, 114, 128, 0.8); /* gray-500 */
}
@media (prefers-color-scheme: dark) {
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
