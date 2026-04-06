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
            <Settings class="w-3.5 h-3.5" /> {{ $t('environments.manage_global', 'Manage Global List') }}
         </button>
      </div>
    </div>

    <!-- Environment List -->
    <div class="space-y-4">
      <draggable
        v-model="environments"
        item-key="id"
        class="space-y-4"
        :disabled="mode !== 'global'"
        handle=".drag-handle"
      >
        <template #item="{ element: env }">
          <div class="group relative bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-300">
            <div class="flex items-center gap-3">
              <!-- Drag Handle & Toggle -->
              <div v-if="mode === 'global'" class="drag-handle cursor-move p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg shrink-0">
                <GripVertical class="w-4 h-4" />
              </div>
              <input
                v-if="mode === 'project'"
                type="checkbox"
                :id="`env-${env.id}`"
                :checked="isEnvEnabled(env.id)"
                @change="toggleEnv(env.id, ($event.target as HTMLInputElement).checked)"
                class="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-700 rounded focus:ring-primary-500 shrink-0 cursor-pointer"
              />

              <!-- Content Row -->
              <div class="flex-1 flex flex-col min-w-0 px-3 border-l border-gray-100 dark:border-gray-800 ml-1">
                  <template v-if="mode === 'global'">
                    <input
                      v-model="env.name"
                      type="text"
                      class="w-full bg-transparent border-none text-sm font-bold text-gray-900 dark:text-white focus:ring-0 p-0 outline-none placeholder:text-gray-400"
                      :placeholder="$t('environments.manager.namePlaceholder')"
                      @blur="updateEnvironment(env)"
                    />
                    <input
                      v-model="env.description"
                      type="text"
                      class="w-full bg-transparent border-none text-[11px] text-gray-500 dark:text-gray-400 focus:ring-0 p-0 mt-0.5 outline-none placeholder:text-gray-300/50"
                      :placeholder="$t('environments.manager.descPlaceholder')"
                      @blur="updateEnvironment(env)"
                    />
                  </template>
                  <template v-else>
                     <div class="text-sm font-bold text-gray-900 dark:text-white">{{ env.name }}</div>
                     <div class="text-[11px] text-gray-500 dark:text-gray-400 truncate">{{ env.description }}</div>
                  </template>
              </div>

              <!-- Metadata Badges -->
              <div class="flex items-center gap-2 shrink-0">
                 <span :class="['px-2 py-1 text-[9px] font-black rounded border tracking-widest uppercase transition-colors', getEnvironmentBadgeClass(env.name)]">
                    {{ env.name }}
                 </span>
                 <button 
                    @click="showConnectionManager(env.name)"
                    class="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 rounded border border-gray-200 dark:border-gray-700 transition-colors"
                    title="View Connections"
                 >
                    <Database class="w-3 h-3" />
                    <span class="text-[9px] font-bold">{{ getConnectionCount(env.name) }}</span>
                 </button>
              </div>

              <!-- Actions -->
              <div v-if="mode === 'global'" class="flex items-center gap-1 shrink-0 border-l border-gray-100 dark:border-gray-800 pl-3 ml-1">
                <button @click="duplicateEnvironment(env)" class="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"><Copy class="w-3.5 h-3.5" /></button>
                <button @click="removeEnvironment(env)" class="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"><Trash2 class="w-3.5 h-3.5" /></button>
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

const getEnvironmentBadgeClass = (name: string) => {
  const n = name.toUpperCase()
  if (n.includes('PROD') || n.includes('LIVE')) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/50'
  if (n.includes('STAGE') || n.includes('PRE')) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'
  if (n.includes('DEV') || n.includes('LOCAL')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/50'
  if (n.includes('TEST') || n.includes('QA') || n.includes('UAT')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800/50'
  if (n.includes('DEMO')) return 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400 border-primary-200 dark:border-primary-800/50'
  return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700'
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
