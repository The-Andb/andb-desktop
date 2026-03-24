<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-base font-semibold text-gray-900 dark:text-white">
        {{ $t('environments.configuration') }}
      </h3>
      <div class="flex items-center gap-2">
        <button
          @click="addEnvironment"
          class="btn btn-primary flex items-center"
        >
          <Plus class="w-4 h-4 mr-2" />
          {{ $t('environments.addEnvironment') }}
        </button>
      </div>
    </div>

    <!-- Environment List -->
    <div class="space-y-4">
      <draggable
        v-model="environments"
        item-key="id"
        class="space-y-4"
        handle=".drag-handle"
      >
        <template #item="{ element: env }">
          <div class="group relative bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-300">
            <div class="flex items-center gap-3">
              <!-- Drag Handle & Toggle -->
              <div class="drag-handle cursor-move p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg shrink-0">
                <GripVertical class="w-4 h-4" />
              </div>
              <input
                type="checkbox"
                :id="`env-${env.id}`"
                :checked="isEnvEnabled(env.id)"
                @change="toggleEnv(env.id, ($event.target as HTMLInputElement).checked)"
                class="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-700 rounded focus:ring-primary-500 shrink-0 cursor-pointer"
              />

              <!-- Content Row -->
              <div class="flex-1 flex flex-col min-w-0 px-3 border-l border-gray-100 dark:border-gray-800 ml-1">
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
              </div>

              <!-- Metadata Badges -->
              <div class="flex items-center gap-2 shrink-0">
                 <span :class="['px-2 py-1 text-[9px] font-black rounded border tracking-widest uppercase', getEnvironmentBadgeClass(env.name)]">
                    {{ getEnvironmentType(env.name) }}
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
              <div class="flex items-center gap-1 shrink-0 border-l border-gray-100 dark:border-gray-800 pl-3 ml-1">
                <button @click="duplicateEnvironment(env)" class="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"><Copy class="w-3.5 h-3.5" /></button>
                <button @click="removeEnvironment(env)" :disabled="isDefaultEnvironment(env.name)" class="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-20 rounded-lg transition-colors"><Trash2 class="w-3.5 h-3.5" /></button>
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
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, GripVertical, Copy, Trash2, Database } from 'lucide-vue-next'
import draggable from 'vuedraggable/src/vuedraggable'
import { useConnectionPairsStore, type Environment } from '@/stores/connectionPairs'
import { useAppStore } from '@/stores/app'
import { useProjectsStore } from '@/stores/projects'

const { t: $t } = useI18n()
const connectionPairsStore = useConnectionPairsStore()
const appStore = useAppStore()

const environments = computed({
  get: () => connectionPairsStore.environments,
  set: (val) => connectionPairsStore.reorderEnvironments(val)
})

const projectsStore = useProjectsStore() // Needs import

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

const emit = defineEmits<{
  showConnectionManager: [envName?: string]
}>()

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

const defaultEnvironments = ['DEV', 'STAGE', 'UAT', 'PROD']

const getEnvironmentType = (name: string) => {
  const upperName = name.toUpperCase()
  if (defaultEnvironments.includes(upperName)) {
    return upperName
  }
  return 'CUSTOM'
}

const getEnvironmentBadgeClass = (name: string) => {
  const type = getEnvironmentType(name)
  switch (type) {
    case 'DEV':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'STAGE':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'UAT':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    case 'PROD':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }
}

const isDefaultEnvironment = (name: string) => {
  return defaultEnvironments.includes(name.toUpperCase())
}

const addEnvironment = () => {
  connectionPairsStore.addEnvironment({
    name: 'CUSTOM',
    description: '',
    enabled: true,
    order: environments.value.length + 1
  })
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
  if (!isDefaultEnvironment(env.name)) {
    connectionPairsStore.removeEnvironment(env.id)
  }
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
