<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-base font-semibold text-gray-900 dark:text-white">
        {{ mode === 'global' ? $t('environments.global_configuration', 'Global Master List') : $t('environments.project_selection', 'Project Environments') }}
      </h3>
      <div v-if="mode === 'global'" class="flex items-center gap-2 relative">
        <div v-if="showSuggestions" class="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl z-[100] p-2 animate-in fade-in zoom-in-95 duration-200">
           <div class="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 mb-1">Suggestions</div>
           <div class="max-h-64 overflow-y-auto custom-scrollbar">
              <button 
                v-for="s in SUGGESTED_ENVIRONMENTS" 
                :key="s.name"
                @click="addFromSuggestion(s)"
                class="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group flex items-center justify-between"
              >
                <div>
                   <div class="text-xs font-bold text-gray-900 dark:text-white">{{ s.name }}</div>
                   <div class="text-[10px] text-gray-500 dark:text-gray-400 truncate opacity-0 group-hover:opacity-100 transition-opacity">{{ s.description }}</div>
                </div>
                <Zap class="w-3 h-3 text-primary-500" />
              </button>
           </div>
           <div class="mt-1 pt-1 border-t border-gray-100 dark:border-gray-800">
              <button @click="addEnvironment" class="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-[10px] font-bold text-primary-600 uppercase tracking-widest flex items-center gap-2">
                 <Plus class="w-3 h-3" /> Custom Environment
              </button>
           </div>
        </div>
        <button
          @click="showSuggestions = !showSuggestions"
          class="px-4 py-2 bg-primary-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary-500/20 active:scale-95 flex items-center gap-2 transition-all"
        >
          <Plus class="w-4 h-4" />
          {{ $t('environments.addEnvironment') }}
          <ChevronDown :class="['w-3 h-3 transition-transform', { 'rotate-180': showSuggestions }]" />
        </button>
      </div>
      <div v-else class="flex items-center gap-2">
         <button @click="emit('switchToGlobal')" class="text-[10px] font-bold text-primary-500 hover:underline uppercase tracking-widest flex items-center gap-1.5">
            <Settings class="w-3.5 h-3.5" /> {{ $t('environments.manage_global', 'Manage Global Env') }}
         </button>
      </div>
    </div>

    <!-- Environment List -->
    <div class="space-y-2">
      <draggable
        v-model="environments"
        item-key="id"
        class="space-y-2"
        :disabled="mode !== 'global'"
        handle=".drag-handle"
      >
        <template #item="{ element: env }">
          <div class="group relative px-2 py-3 hover:bg-gray-100/30 dark:hover:bg-gray-800/30 transition-all duration-300 border-b border-gray-100 dark:border-gray-800/40 last:border-none">
            <div class="flex items-center gap-4">
              <!-- Drag Handle & Toggle -->
              <div v-if="mode === 'global'" class="drag-handle cursor-move p-1 text-gray-300 hover:text-gray-500 dark:hover:text-gray-400 rounded transition-colors shrink-0">
                <GripVertical class="w-4 h-4" />
              </div>
              <div v-if="mode === 'project'" class="flex items-center justify-center w-5 h-5 shrink-0">
                 <input
                  type="checkbox"
                  :id="`env-${env.id}`"
                  :checked="isEnvEnabled(env.id)"
                  @change="toggleEnv(env.id, ($event.target as HTMLInputElement).checked)"
                  class="w-4 h-4 text-primary-600 border-gray-200 dark:border-gray-700 rounded focus:ring-4 focus:ring-primary-500/10 shrink-0 cursor-pointer accent-primary-500"
                />
              </div>

              <!-- Content Row -->
              <div class="flex-1 flex flex-col min-w-0">
                  <template v-if="mode === 'global'">
                    <input
                      v-model="env.name"
                      type="text"
                      class="w-full bg-transparent border-none text-[13px] font-black text-gray-900 dark:text-white focus:ring-0 p-0 outline-none placeholder:text-gray-300 uppercase tracking-tight"
                      :placeholder="$t('environments.manager.namePlaceholder')"
                      @blur="updateEnvironment(env)"
                    />
                    <input
                      v-model="env.description"
                      type="text"
                      class="w-full bg-transparent border-none text-[11px] text-gray-400 dark:text-gray-500 font-medium focus:ring-0 p-0 mt-0.5 outline-none placeholder:text-gray-300/30"
                      :placeholder="$t('environments.manager.descPlaceholder')"
                      @blur="updateEnvironment(env)"
                    />
                  </template>
                  <template v-else>
                     <div class="text-[13px] font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ env.name }}</div>
                     <div class="text-[11px] text-gray-400 dark:text-gray-500 font-medium truncate">{{ env.description || 'Global Master Environment' }}</div>
                  </template>
              </div>

              <!-- Metadata Badges -->
              <div class="flex items-center gap-3 shrink-0">
                 <div :class="['w-2 h-2 rounded-full', getEnvironmentStatusDot(env.name)]" :title="env.name"></div>
                 <button 
                    @click="showConnectionManager(env.name)"
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg transition-colors group/btn"
                    title="View Connections"
                 >
                    <Database class="w-3.5 h-3.5 group-hover/btn:text-primary-500 transition-colors" />
                    <span class="text-[10px] font-black uppercase tracking-widest">{{ getConnectionCount(env.name) }}</span>
                 </button>
              </div>

              <!-- Actions -->
              <div v-if="mode === 'global'" class="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button @click="duplicateEnvironment(env)" class="p-2 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"><Copy class="w-4 h-4" /></button>
                <button @click="removeEnvironment(env)" class="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"><Trash2 class="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </template>
      </draggable>
    </div>

    <!-- Help Text -->
    <div class="text-sm text-gray-500 dark:text-gray-400">
      <p>• {{ $t('environments.manager.help.dragDrop') }}</p>
      <p>• {{ $t('environments.manager.help.enableDisable') }}</p>
      <p>• {{ $t('environments.manager.help.defaults') }}</p>
      <p>• {{ $t('environments.manager.help.sequence') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, GripVertical, Copy, Trash2, Database, ChevronDown, Zap, Settings } from 'lucide-vue-next'
import draggable from 'vuedraggable/src/vuedraggable'
import { useConnectionPairsStore, SUGGESTED_ENVIRONMENTS, type Environment } from '@/stores/connectionPairs'
import { useAppStore } from '@/stores/app'
import { useProjectsStore } from '@/stores/projects'

const { t: $t } = useI18n()
const connectionPairsStore = useConnectionPairsStore()
const appStore = useAppStore()

const props = defineProps<{
  mode: 'global' | 'project'
}>()

const emit = defineEmits<{
  showConnectionManager: [envName?: string],
  switchToGlobal: []
}>()

const environments = computed({
  get: () => connectionPairsStore.environments,
  set: (val) => connectionPairsStore.reorderEnvironments(val)
})

const showSuggestions = ref(false)

const projectsStore = useProjectsStore()

const isEnvEnabled = (envId: string) => {
  const project = projectsStore.currentProject
  if (project && project.enabledEnvironmentIds) {
    return project.enabledEnvironmentIds.includes(envId)
  }
  // Fallback to global definition if no project context (though unlikely in settings)
  const env = environments.value.find(e => e.id === envId)
  return env ? env.enabled : false
}

const toggleEnv = (envId: string, isChecked: boolean) => {
  connectionPairsStore.toggleProjectEnvironment(envId, isChecked)
}


const showConnectionManager = (envName?: string) => {
  emit('showConnectionManager', envName)
}

const getConnectionCount = (environmentName: string) => {
  const project = projectsStore.currentProject
  if (!project) return 0
  return appStore.resolvedConnections.filter(conn => 
    conn.environment === environmentName && project.connectionIds.includes(conn.id)
  ).length
}

const getEnvironmentStatusDot = (name: string) => {
  const n = name.toUpperCase()
  if (n.includes('PROD') || n.includes('LIVE')) return 'bg-rose-500'
  if (n.includes('STAGE') || n.includes('PRE')) return 'bg-amber-500'
  if (n.includes('DEV') || n.includes('LOCAL')) return 'bg-blue-500'
  if (n.includes('TEST') || n.includes('QA') || n.includes('UAT')) return 'bg-purple-500'
  if (n.includes('DEMO')) return 'bg-primary-500'
  return 'bg-gray-400'
}

const addEnvironment = () => {
  connectionPairsStore.addEnvironment({
    name: 'CUSTOM',
    description: '',
    enabled: true,
    order: environments.value.length + 1
  })
  showSuggestions.value = false
}

const addFromSuggestion = (suggestion: any) => {
  // Check if already exists
  if (environments.value.some(e => e.name.toUpperCase() === suggestion.name)) {
     showSuggestions.value = false
     return
  }
  
  connectionPairsStore.addEnvironment({
    name: suggestion.name,
    description: suggestion.description,
    enabled: true,
    order: environments.value.length + 1
  })
  showSuggestions.value = false
}

const duplicateEnvironment = (env: Environment) => {
  connectionPairsStore.addEnvironment({
    name: `${env.name}_COPY`,
    description: env.description,
    enabled: env.enabled,
    order: environments.value.length + 1
  })
}

const removeEnvironment = (env: Environment) => {
  connectionPairsStore.removeEnvironment(env.id)
}

const updateEnvironment = (env: Environment) => {
  // Validate environment name
  if (!env.name.trim()) {
    env.name = 'CUSTOM'
  }
  
  // Ensure unique names
  const duplicates = environments.value.filter(e => 
    e.name.toUpperCase() === env.name.toUpperCase() && e.id !== env.id
  )
  if (duplicates.length > 0) {
    env.name = `${env.name}_${Date.now()}`
  }
  
  // Update in store
  connectionPairsStore.updateEnvironment(env.id, {
    name: env.name,
    description: env.description,
    enabled: env.enabled
  })
}

// Removed onDragEnd as v-model handles it via setter

// Expose environments for parent component
defineExpose({
  environments: computed(() => environments.value),
  getEnabledEnvironments: () => connectionPairsStore.enabledEnvironments
})
</script>

<style scoped>
.drag-handle:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.dark .drag-handle:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
