<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useProjectsStore } from '@/stores/projects'
import {
  Plus,
  Search,
  MoreVertical,
  Database,
  GitCompare,
  Clock,
  Trash2,
  Edit3,
  ChevronRight,
  LayoutGrid,
  List as LayoutList,
  Copy,
  Play,
  Loader,
  Check,
  X,
  Terminal,
  Shield,
  ShieldAlert,
  Package,
  Cpu,
  Zap,
  Cloud,
  Activity,
  HardDrive,
  Globe,
  Rocket,
  Server,
  Layers,
  Component as ComponentIcon
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { useConnectionPairsStore } from '@/stores/connectionPairs'
import BulkDeleteConfirmModal from './BulkDeleteConfirmModal.vue'
import ProjectIconPicker from './ProjectIconPicker.vue'

const appStore = useAppStore()
const connectionPairsStore = useConnectionPairsStore()

const projectsStore = useProjectsStore()

const defaultCliProjectId = ref('')
onMounted(async () => {
  try {
    const settings = await (window.electronAPI?.storage as any)?.getUserSettings()
    if (settings?.default_cli_project_id) {
      defaultCliProjectId.value = settings.default_cli_project_id
    }
  } catch (e) {
    console.error('Failed to load default CLI project', e)
  }
})

const viewMode = ref<'grid' | 'list'>('list')
const searchQuery = ref('')
const filteredProjects = computed(() => {
  if (!searchQuery.value) return projectsStore.projects
  const query = searchQuery.value.toLowerCase()
  return projectsStore.projects.filter(p =>
    p.name.toLowerCase().includes(query) ||
    p.description.toLowerCase().includes(query)
  )
})

const selectableProjects = computed(() => {
  return filteredProjects.value
})

const emit = defineEmits<{
  (e: 'open', id: string): void
  (e: 'create'): void
  (e: 'delete', id: string): void
  (e: 'rename', id: string, newName: string): void
  (e: 'duplicate', id: string): void
  (e: 'toggle-protect', id: string): void
}>()

const renamingId = ref<string | null>(null)
const renamingName = ref('')
const renameInput = ref<HTMLInputElement | null>(null)

const startRename = (project: any) => {
  renamingId.value = project.id
  renamingName.value = project.name
  nextTick(() => {
    renameInput.value?.focus()
    renameInput.value?.select()
  })
}

const confirmRename = () => {
  if (renamingId.value && renamingName.value.trim()) {
    emit('rename', renamingId.value, renamingName.value.trim())
    renamingId.value = null
  }
}

const cancelRename = () => {
  renamingId.value = null
  renamingName.value = ''
}

import { formatDate } from '@/utils/date'

const activeMenuId = ref<string | null>(null)
const activeIconPickerId = ref<string | null>(null)

const toggleMenu = (id: string) => {
  activeMenuId.value = activeMenuId.value === id ? null : id
  activeIconPickerId.value = null
}

const toggleIconPicker = (id: string) => {
  activeIconPickerId.value = activeIconPickerId.value === id ? null : id
  activeMenuId.value = null
}

const updateProjectIcon = (projectId: string, data: { icon: string, color: string }) => {
  projectsStore.updateProject(projectId, { icon: data.icon, color: data.color })
  activeIconPickerId.value = null
}

const iconMap: Record<string, any> = {
  Database, Package, Cpu, Zap, Terminal, Cloud, Shield, Activity, HardDrive, Globe, Rocket, Server, Layers, Component: ComponentIcon
}

const isDemoSettingUp = ref(false)
const handleSetupDemo = async () => {
  if (isDemoSettingUp.value) return
  isDemoSettingUp.value = true
  try {
    await projectsStore.setupDemo()
    emit('open', projectsStore.selectedProjectId!)
  } catch (error) {
    console.error('Failed to setup demo:', error)
  } finally {
    isDemoSettingUp.value = false
  }
}

// Selection Logic
const selectedIds = ref<string[]>([])
const isSelectionMode = computed(() => selectedIds.value.length > 0)

const toggleSelection = (id: string) => {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter(i => i !== id)
  } else {
    selectedIds.value.push(id)
  }
}

const toggleSelectAll = () => {
  if (selectedIds.value.length === selectableProjects.value.length) {
    selectedIds.value = []
  } else {
    selectedIds.value = selectableProjects.value.map(p => p.id)
  }
}

const isBulkDeleteModalOpen = ref(false)
const projectsToDelete = computed(() => {
  return projectsStore.projects.filter(p => selectedIds.value.includes(p.id) && !p.isProtected)
})

const handleBulkDelete = () => {
  if (selectedIds.value.length === 0) return

  // Bulk delete logic (respecting protection)
  const targets = projectsToDelete.value
  if (targets.length === 0) {
    selectedIds.value = []
    return
  }

  isBulkDeleteModalOpen.value = true
}

const confirmBulkDelete = () => {
  const targets = projectsToDelete.value
  targets.forEach(p => projectsStore.removeProject(p.id))
  selectedIds.value = []
  isBulkDeleteModalOpen.value = false
}

const clearSelection = () => {
  selectedIds.value = []
}

// Close menu when clicking outside (simple version)
const closeMenu = () => {
  activeMenuId.value = null
  activeIconPickerId.value = null
}

const getValidConnectionCount = (project: any) => {
  if (!project.connectionIds) return 0
  return project.connectionIds.filter((id: string) => appStore.connections.some(c => c.id === id)).length
}

const getValidPairCount = (project: any) => {
  // 1. Count custom pairs (explicitly linked)
  const customCount = (project.pairIds || []).filter((id: string) => 
    connectionPairsStore.connectionPairs.some(p => p.id === id)
  ).length

  // 2. Count potential auto-pairs based on environments
  // We need to see how many sequential paths exist within this project's environments
  const envIds = project.enabledEnvironmentIds || []
  if (envIds.length < 2) return customCount

  const sortedEnvs = [...connectionPairsStore.environments]
    .filter(env => envIds.includes(env.id))
    .sort((a, b) => a.order - b.order)

  let autoCount = 0
  for (let i = 0; i < sortedEnvs.length - 1; i++) {
    const source = sortedEnvs[i]
    const target = sortedEnvs[i + 1]
    
    // Only count as auto-pair if there isn't a custom one already covering this path
    const hasCustom = connectionPairsStore.connectionPairs.some(p => 
      project.pairIds?.includes(p.id) && p.sourceEnv === source.id && p.targetEnv === target.id
    )
    if (!hasCustom) autoCount++
  }

  return customCount + autoCount
}
</script>

<template>
  <div class="h-full flex flex-col bg-gray-50/30 dark:bg-gray-900/30 p-8 overflow-y-auto custom-scrollbar"
    @click="closeMenu">
    <!-- Bulk Delete Modal -->
    <BulkDeleteConfirmModal :is-open="isBulkDeleteModalOpen" :projects="projectsToDelete"
      @close="isBulkDeleteModalOpen = false" @confirm="confirmBulkDelete" />
    <!-- Header Area -->
    <div class="max-w-7xl mx-auto w-full mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div class="space-y-2">
        <h1 class="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
          Your Projects
        </h1>
        <p class="text-gray-500 dark:text-gray-400 font-medium tracking-wide flex items-center gap-2">
          Organize and switch between your database environments
          <span
            class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-black rounded-full border border-emerald-100 dark:border-emerald-800/30 tracking-[0.1em] leading-none shrink-0 whitespace-nowrap ml-2">
            {{ projectsStore.projects.length }} PROJECT{{ projectsStore.projects.length > 1 ? 'S' : '' }} TOTAL
          </span>
        </p>
      </div>

      <div class="flex items-center gap-4">
        <!-- View Toggle -->
        <div
          class="flex items-center bg-white dark:bg-gray-800 p-1 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mr-2">

          <button @click="viewMode = 'list'" class="p-2 rounded-xl transition-all"
            :class="viewMode === 'list' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'"
            title="List View">
            <LayoutList class="w-4 h-4" />
          </button>

          <button @click="viewMode = 'grid'" class="p-2 rounded-xl transition-all"
            :class="viewMode === 'grid' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'"
            title="Grid View">
            <LayoutGrid class="w-4 h-4" />
          </button>
        </div>

        <!-- Search Bar -->
        <div class="relative group">
          <Search
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
          <input v-model="searchQuery" type="text" placeholder="Search projects..."
            class="pl-10 pr-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all w-64 md:w-80 shadow-sm" />
        </div>


        <button @click="emit('create')"
          class="whitespace-nowrap shrink-0 group relative flex items-center justify-center gap-2.5 px-7 py-3 rounded-2xl font-black text-[11px] tracking-[0.1em] text-white overflow-hidden transition-all duration-500 active:scale-95 shadow-[0_8px_20px_-6px_var(--primary-500,rgba(14,165,233,0.5))] hover:shadow-[0_14px_25px_-8px_var(--primary-500,rgba(14,165,233,0.7))] hover:-translate-y-0.5">
          <div
            class="absolute inset-0 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-700 transition-transform duration-500 group-hover:scale-105">
          </div>
          <div class="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20"></div>
          <div
            class="absolute -top-10 -left-10 w-20 h-20 bg-white/20 blur-xl rounded-full group-hover:bg-white/30 transition-colors">
          </div>
          <Plus
            class="w-4 h-4 stroke-[3.5px] relative z-10 group-hover:rotate-90 group-hover:scale-110 transition-all duration-500 drop-shadow-md" />
          <span class="relative z-10 drop-shadow-md">New Project</span>
        </button>
      </div>
    </div>

    <!-- Bulk Action Toolbar -->
    <div v-if="isSelectionMode"
      class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-6 py-4 rounded-3xl shadow-2xl border border-white/10 flex items-center gap-8 animate-in slide-in-from-bottom-10 duration-500">
      <div class="flex items-center gap-3 border-r border-white/10 pr-6">
        <button @click="toggleSelectAll"
          class="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-xl transition-all text-[10px] font-black tracking-widest text-primary-400"
          :title="selectedIds.length === selectableProjects.length ? 'Deselect All' : 'Select All'">
          <div class="w-5 h-5 rounded border-2 border-primary-500 flex items-center justify-center bg-transparent">
            <Check v-if="selectedIds.length === selectableProjects.length"
              class="w-3 h-3 text-primary-500 stroke-[4px]" />
          </div>
          {{ selectedIds.length === selectableProjects.length ? 'None' : 'All' }}
        </button>
        <div class="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center font-black text-sm">
          {{ selectedIds.length }}
        </div>
        <div class="flex flex-col">
          <span class="text-[10px] font-black tracking-widest text-primary-400">Selected</span>
          <span class="text-xs font-bold">{{ selectedIds.length }} Project{{ selectedIds.length > 1 ? 's' : '' }}</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button @click="handleBulkDelete"
          class="flex items-center gap-2 px-4 py-2 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl transition-all font-bold text-xs tracking-wider">
          <Trash2 class="w-4 h-4" />
          Delete Selected
        </button>
      </div>

      <button @click="clearSelection" class="p-2 hover:bg-white/10 rounded-xl transition-all text-gray-400">
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- Content Area (Conditional View) -->
    <div class="max-w-7xl mx-auto w-full pb-20">

      <!-- GRID VIEW -->
      <div v-if="viewMode === 'grid'"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
        <div v-for="project in filteredProjects" :key="project.id"
          class="group relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-[2.5rem] p-7 transition-all duration-500 cursor-pointer shadow-sm hover:shadow-2xl active:scale-[0.98]"
          :style="{ '--project-accent': project.color || '#6366f1' }"
          :class="[
            selectedIds.includes(project.id)
              ? 'ring-2 ring-[var(--project-accent)] bg-white/80 dark:bg-gray-800/80 border-[var(--project-accent)]/40 shadow-[0_0_40px_-10px_var(--project-accent)] scale-[1.02]'
              : 'hover:shadow-[var(--project-accent)]/10 hover:border-[var(--project-accent)]/40 hover:-translate-y-1',
            (activeMenuId === project.id || activeIconPickerId === project.id) ? 'z-[60]' : 'z-10'
          ]" @click="isSelectionMode ? toggleSelection(project.id) : emit('open', project.id)">
          
          <!-- Protected Corner Ribbon (Grid) -->
          <div v-if="project.isProtected" class="absolute top-0 left-0 w-24 h-24 overflow-hidden rounded-tl-[2.5rem] pointer-events-none z-50">
            <div class="absolute top-[18px] left-[-28px] w-[120px] bg-amber-500 text-white text-[8px] font-black py-1 shadow-lg transform -rotate-45 flex items-center justify-center gap-1.5 tracking-[0.2em] uppercase">
              <Shield class="w-2.5 h-2.5" />
              Protected
            </div>
          </div>
          
          <!-- Quick Open Overlay (Hover) -->
          <div class="absolute inset-0 bg-[var(--project-accent)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"></div>
          
          <!-- Selection Checkbox (Grid) -->
          <div v-if="project.name !== 'TheAndb System'" class="absolute top-5 left-5 z-40 transition-all duration-300 opacity-100 scale-100">
            <button @click.stop="toggleSelection(project.id)"
              class="w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all bg-white dark:bg-gray-800"
              :class="[
                selectedIds.includes(project.id)
                  ? 'bg-[var(--project-accent)] border-[var(--project-accent)] shadow-[0_0_15px_var(--project-accent)]'
                  : 'border-gray-200 dark:border-gray-600 hover:border-[var(--project-accent)] shadow-sm'
              ]">
              <Check v-if="selectedIds.includes(project.id)"
                class="w-4 h-4 text-white stroke-[5px] animate-in zoom-in-50 duration-200" />
            </button>
          </div>

          <!-- Glow Effect -->
          <div class="absolute -right-20 -top-20 w-64 h-64 bg-[var(--project-accent)] opacity-[0.03] group-hover:opacity-[0.08] rounded-full blur-[80px] transition-opacity duration-1000"></div>

          <!-- Header -->
          <div class="flex items-start justify-between mb-8 relative z-30">
            <div
              @click.stop="toggleIconPicker(project.id)"
              class="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 cursor-pointer border border-white/20"
              :style="{ backgroundColor: project.color || '#6366f1', color: 'white' }">
              <component :is="iconMap[project.icon || 'Database'] || Database" class="w-7 h-7" />
            </div>

            <div class="relative">
              <button @click.stop="toggleMenu(project.id)"
                class="p-2.5 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-2xl text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all">
                <MoreVertical class="w-5 h-5" />
              </button>

              <!-- Menus -->
              <div v-if="activeIconPickerId === project.id" class="absolute left-0 top-full mt-2 z-[60]">
                <ProjectIconPicker 
                  :selected-icon="project.icon" 
                  :selected-color="project.color"
                  @select="data => updateProjectIcon(project.id, data)"
                />
              </div>

              <div v-if="activeMenuId === project.id"
                class="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                <button @click.stop="startRename(project)"
                  class="w-full px-6 py-3 text-left flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Edit3 class="w-4 h-4" /> Rename Project
                </button>
                <button @click.stop="emit('duplicate', project.id)"
                  class="w-full px-6 py-3 text-left flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Copy class="w-4 h-4" /> Duplicate Project
                </button>
                <button @click.stop="emit('toggle-protect', project.id)"
                  class="w-full px-6 py-3 text-left flex items-center gap-3 text-sm font-bold transition-colors"
                  :class="project.isProtected ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'">
                  <ShieldAlert v-if="project.isProtected" class="w-4 h-4" />
                  <Shield v-else class="w-4 h-4" />
                  {{ project.isProtected ? 'Unprotect Project' : 'Protect Project' }}
                </button>
                <div class="h-px bg-gray-100 dark:bg-gray-700 my-1 mx-4"></div>
                <button @click.stop="!project.isProtected && emit('delete', project.id)" :disabled="project.isProtected"
                  class="w-full px-6 py-3 text-left flex items-center gap-3 text-sm font-bold transition-colors"
                  :class="project.isProtected ? 'text-gray-400 opacity-50 cursor-not-allowed' : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'">
                  <Trash2 class="w-4 h-4" /> Delete Project
                </button>
              </div>
            </div>
          </div>

          <!-- Info -->
          <div class="space-y-2 mb-8 relative z-10">
            <h3 v-if="renamingId !== project.id"
              class="text-2xl font-black text-gray-900 dark:text-white leading-tight flex items-center gap-2">
              {{ project.name }}
              <span v-if="project.isActive" class="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></span>
            </h3>
            <div v-else class="relative z-50">
              <input ref="renameInput" v-model="renamingName" @click.stop @keyup.enter="confirmRename"
                @keyup.esc="cancelRename" @blur="confirmRename"
                class="w-full px-4 py-2 bg-white dark:bg-gray-800 border-2 border-[var(--project-accent)] rounded-2xl text-xl font-black text-gray-900 dark:text-white outline-none shadow-2xl shadow-[var(--project-accent)]/10" />
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 font-medium line-clamp-2 min-h-[3rem] tracking-tight leading-relaxed">
              {{ project.description || 'Enterprise-grade database cluster orchestration.' }}
            </p>
          </div>

          <!-- Stats Overlay Style -->
          <div
            class="flex items-center gap-3 text-[10px] font-black tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-8 relative z-10 text-left">
            <div
              class="flex items-center gap-2 bg-gray-100/50 dark:bg-gray-900/50 px-4 py-2 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 group-hover:bg-white dark:group-hover:bg-gray-800 transition-all duration-300">
              <Database class="w-4 h-4 text-[var(--project-accent)]" />
              <span class="text-gray-900 dark:text-white">{{ getValidConnectionCount(project) }}</span>
            </div>
            <div
              class="flex items-center gap-2 bg-gray-100/50 dark:bg-gray-900/50 px-4 py-2 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 group-hover:bg-white dark:group-hover:bg-gray-800 transition-all duration-300">
              <GitCompare class="w-4 h-4 text-[var(--project-accent)]" />
              <span class="text-gray-900 dark:text-white">{{ getValidPairCount(project) }}</span>
            </div>
          </div>

          <!-- Footer with Last Opened -->
          <div
            class="pt-7 border-t border-gray-100/50 dark:border-gray-700/50 flex items-center justify-between text-[10px] font-black text-gray-400 tracking-widest relative z-10">
            <div class="flex flex-col gap-1">
              <div v-if="project.lastOpenedAt" class="flex items-center gap-1.5 text-[var(--project-accent)] font-black">
                <Play class="w-3 h-3 fill-current" />
                Opened {{ formatDate(project.lastOpenedAt) }}
              </div>
              <div v-else class="flex items-center gap-1.5 opacity-60">
                <Clock class="w-3.5 h-3.5" />
                Updated {{ formatDate(project.updatedAt) }}
              </div>
            </div>

            <div
              class="flex items-center gap-2 text-[var(--project-accent)] transition-all duration-300 font-black group-hover:scale-110 active:scale-95">
              EXPLORE
              <ChevronRight class="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </div>
        </div>

        <!-- Add New Project Card (Alternative) -->
        <div @click="emit('create')"
          class="group bg-gray-100/30 dark:bg-gray-800/20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 hover:bg-white dark:hover:bg-gray-800/50 hover:border-primary-500/50 transition-all duration-300 cursor-pointer min-h-[260px]">
          <div
            class="w-16 h-16 rounded-3xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-gray-400 group-hover:text-primary-500 group-hover:scale-110 transition-all duration-300">
            <Plus class="w-8 h-8 stroke-[3px]" />
          </div>
          <div class="text-center group-hover:translate-y-1 transition-transform">
            <div class="text-sm font-black text-gray-900 dark:text-white tracking-widest mb-1">Add New Project
            </div>
            <div class="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wide">Start a fresh project cluster</div>
          </div>
        </div>

        <!-- Try Live Demo Card -->
        <div @click="handleSetupDemo"
          class="group bg-orange-500/5 dark:bg-orange-500/10 border-2 border-dashed border-orange-200 dark:border-orange-900/30 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 hover:bg-orange-500/10 dark:hover:bg-orange-500/20 hover:border-orange-500/50 transition-all duration-300 cursor-pointer min-h-[260px]">
          <div
            class="w-16 h-16 rounded-3xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-orange-500 group-hover:scale-110 transition-all duration-300">
            <Play v-if="!isDemoSettingUp" class="w-8 h-8 fill-orange-500/20" />
            <Loader v-else class="w-8 h-8 animate-spin" />
          </div>
          <div class="text-center group-hover:translate-y-1 transition-transform">
            <div class="text-sm font-black text-gray-900 dark:text-white tracking-widest mb-1">{{ $t('common.liveDemo') }}</div>
            <div class="text-xs font-bold text-orange-500/70 tracking-wide">Try Andb with sample SQL dumps</div>
          </div>
        </div>
      </div>

      <!-- LIST VIEW -->
      <div v-else class="flex flex-col gap-4 animate-in fade-in duration-500">
        <div v-for="project in filteredProjects" :key="project.id"
          class="group relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-3xl p-5 flex items-center gap-6 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl active:scale-[0.99]"
          :style="{ '--project-accent': project.color || '#6366f1' }"
          :class="[
            selectedIds.includes(project.id)
              ? 'ring-2 ring-[var(--project-accent)] bg-white/80 dark:bg-gray-800/80 border-[var(--project-accent)]/40 shadow-[0_0_30px_-10px_var(--project-accent)]'
              : 'hover:border-[var(--project-accent)]/40 hover:bg-white/60 dark:hover:bg-gray-800/60 shadow-sm',
            (activeMenuId === project.id || activeIconPickerId === project.id) ? 'z-[60]' : 'z-10'
          ]" @click="isSelectionMode ? toggleSelection(project.id) : emit('open', project.id)">
          
          <!-- Protected Corner Ribbon (List) -->
          <div v-if="project.isProtected" class="absolute top-0 left-0 w-20 h-20 overflow-hidden rounded-tl-3xl pointer-events-none z-50">
            <div class="absolute top-[14px] left-[-24px] w-[100px] bg-amber-500 text-white text-[7px] font-black py-0.5 shadow-lg transform -rotate-45 flex items-center justify-center gap-1 tracking-[0.2em] uppercase">
              <Shield class="w-2 h-2" />
              Protected
            </div>
          </div>
          
          <!-- Selection Checkbox (List) -->
          <div v-if="project.name !== 'TheAndb System'" class="shrink-0 w-7 z-40 transition-all duration-300 opacity-100">
            <button @click.stop="toggleSelection(project.id)"
              class="w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all bg-white dark:bg-gray-800"
              :class="[
                selectedIds.includes(project.id)
                  ? 'bg-[var(--project-accent)] border-[var(--project-accent)] shadow-[0_0_10px_var(--project-accent)]'
                  : 'border-gray-200 dark:border-gray-600 hover:border-[var(--project-accent)] shadow-sm'
              ]">
              <Check v-if="selectedIds.includes(project.id)"
                class="w-4 h-4 text-white stroke-[5px] animate-in zoom-in-50 duration-200" />
            </button>
          </div>

          <div
            @click.stop="toggleIconPicker(project.id)"
            class="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-2 transition-all duration-500 border border-white/20 relative z-10"
            :style="{ backgroundColor: project.color || '#6366f1', color: 'white' }">
            <component :is="iconMap[project.icon || 'Database'] || Database" class="w-7 h-7" />
          </div>

          <!-- Icon Picker Popover (List) -->
          <div v-if="activeIconPickerId === project.id" class="absolute left-20 top-full mt-1 z-[60]">
             <ProjectIconPicker 
              :selected-icon="project.icon" 
              :selected-color="project.color"
              @select="data => updateProjectIcon(project.id, data)"
            />
          </div>

          <div class="flex-1 min-w-0 relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <!-- Name & Desc -->
            <div class="md:col-span-5 space-y-1">
              <h3 v-if="renamingId !== project.id"
                class="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2 truncate">
                {{ project.name }}
                <span v-if="project.isActive" class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)] animate-pulse"></span>
                <span v-if="defaultCliProjectId === project.id" title="CLI Default Target"
                  class="px-2 py-0.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[8px] tracking-widest font-black rounded-md flex items-center gap-1 ml-2 shrink-0">
                  <Terminal class="w-3 h-3" />
                  CLI
                </span>
              </h3>
              <div v-else class="relative z-50">
                <input ref="renameInput" v-model="renamingName" @click.stop @keyup.enter="confirmRename"
                  @keyup.esc="cancelRename" @blur="confirmRename"
                  class="w-full px-4 py-1.5 bg-white dark:bg-gray-800 border-2 border-[var(--project-accent)] rounded-2xl text-lg font-black text-gray-900 dark:text-white outline-none shadow-2xl shadow-[var(--project-accent)]/10" />
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 font-medium truncate tracking-tight">
                {{ project.description || 'Database cluster orchestration platform.' }}
              </p>
            </div>

            <!-- Stats -->
            <div class="md:col-span-4 flex items-center gap-4">
              <div
                class="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 px-3 py-2 rounded-xl border border-gray-100 dark:border-gray-700 text-[10px] font-black uppercase text-gray-400 tracking-widest group-hover:bg-white dark:group-hover:bg-gray-800 transition-all">
                <Database class="w-4 h-4 text-[var(--project-accent)]" />
                <span class="text-gray-900 dark:text-white">{{ getValidConnectionCount(project) }}</span>
              </div>
              <div
                class="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 px-3 py-2 rounded-xl border border-gray-100 dark:border-gray-700 text-[10px] font-black text-gray-400 tracking-widest group-hover:bg-white dark:group-hover:bg-gray-800 transition-all">
                <GitCompare class="w-4 h-4 text-[var(--project-accent)]" />
                <span class="text-gray-900 dark:text-white">{{ getValidPairCount(project) }}</span>
              </div>
            </div>

            <!-- Meta info -->
            <div class="md:col-span-3 flex items-center justify-between">
              <div class="flex flex-col text-left">
                <span v-if="project.lastOpenedAt" class="text-[9px] font-black text-[var(--project-accent)] tracking-widest mb-1">Last Open</span>
                <span v-else class="text-[9px] font-black text-gray-400 tracking-widest mb-1">Last Update</span>
                <span class="text-[10px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <component :is="project.lastOpenedAt ? Play : Clock" class="w-3.5 h-3.5" :class="{'fill-current': !!project.lastOpenedAt}" />
                  {{ formatDate(project.lastOpenedAt || project.updatedAt) }}
                </span>
              </div>

              <div
                class="flex items-center gap-2 text-[var(--project-accent)] font-black text-[10px] tracking-widest transition-all duration-300 group-hover:scale-105 active:scale-95">
                ENTER
                <ChevronRight class="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </div>
          </div>

          <!-- Inline Actions -->
          <div
            class="relative z-30 ml-4 shrink-0 flex items-center gap-2 opacity-20 sm:opacity-50 group-hover:opacity-100 transition-all">
            <button @click.stop="toggleMenu(project.id)"
              class="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-2xl transition-all"
              title="Project Settings">
              <MoreVertical class="w-5 h-5" />
            </button>
            
            <div v-if="activeMenuId === project.id"
                class="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                <button @click.stop="startRename(project)"
                  class="w-full px-6 py-3 text-left flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Edit3 class="w-4 h-4" /> Rename
                </button>
                <button @click.stop="emit('duplicate', project.id)"
                  class="w-full px-6 py-3 text-left flex items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Copy class="w-4 h-4" /> Duplicate
                </button>
                <button @click.stop="emit('toggle-protect', project.id)"
                  class="w-full px-6 py-3 text-left flex items-center gap-3 text-sm font-bold transition-colors"
                  :class="project.isProtected ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'">
                  <ShieldAlert v-if="project.isProtected" class="w-4 h-4" />
                  <Shield v-else class="w-4 h-4" />
                  {{ project.isProtected ? 'Unprotect' : 'Protect' }}
                </button>
                <div class="h-px bg-gray-100 dark:bg-gray-700 my-1 mx-4"></div>
                <button @click.stop="!project.isProtected && emit('delete', project.id)" :disabled="project.isProtected"
                  class="w-full px-6 py-3 text-left flex items-center gap-3 text-sm font-bold transition-colors"
                  :class="project.isProtected ? 'text-gray-400 opacity-50 cursor-not-allowed' : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'">
                  <Trash2 class="w-4 h-4" /> Delete
                </button>
              </div>
          </div>
        </div>

        <button @click="emit('create')"
          class="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex items-center justify-center gap-3 text-gray-400 hover:text-primary-500 hover:border-primary-500 hover:bg-white dark:hover:bg-gray-800/20 transition-all duration-300 font-black text-xs tracking-[0.2em]">
          <Plus class="w-4 h-4 stroke-[3px]" />
          Add New Project
        </button>

        <button @click="handleSetupDemo"
          class="w-full py-4 bg-orange-500/5 dark:bg-orange-500/10 border-2 border-dashed border-orange-200 dark:border-orange-900/30 rounded-2xl flex items-center justify-center gap-3 text-orange-500 hover:bg-orange-500/10 dark:hover:bg-orange-500/20 hover:border-orange-500/50 transition-all duration-300 font-black text-xs tracking-[0.2em]">
          <Play v-if="!isDemoSettingUp" class="w-4 h-4 fill-orange-500/20" />
          <Loader v-else class="w-4 h-4 animate-spin" />
          {{ $t('common.liveDemo') }}
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 99px;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.05);
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.5);
}

.ease-spring {
  transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
</style>
