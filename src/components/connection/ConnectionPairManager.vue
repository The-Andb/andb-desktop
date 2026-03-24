<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-base font-semibold text-gray-900 dark:text-white">
        {{ $t('connectionPairs.title') }}
      </h3>
      <button
        @click="addConnectionPair"
        class="btn btn-primary flex items-center"
      >
        <Plus class="w-4 h-4 mr-2" />
        {{ $t('connectionPairs.addPair') }}
      </button>
    </div>

    <!-- Connection Pairs List -->
    <div class="space-y-3">
      <div
        v-for="pair in connectionPairs"
        :key="pair.id"
        class="group relative bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300"
      >
        <div class="flex flex-col gap-3">
           <!-- Top Row: Name & Actions -->
           <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/50 pb-2.5">
              <input 
                v-model="pair.name" 
                type="text" 
                class="flex-1 bg-transparent border-none text-xs font-black text-gray-700 dark:text-gray-200 focus:ring-0 p-0 outline-none uppercase tracking-widest placeholder:text-gray-300" 
                :placeholder="$t('connectionPairs.pairNamePlaceholder')"
                @blur="updatePair(pair)"
              />
              
              <div class="flex items-center gap-1 shrink-0 ml-4">
                <button v-if="!isDumpPair(pair)" @click="testPair(pair)" :disabled="!pair.sourceEnv || !pair.targetEnv" class="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-lg"><ShieldQuestion class="w-3.5 h-3.5" /></button>
                <button @click="setAsDefault(pair)" :class="pair.isDefault ? 'text-green-500' : 'text-gray-400 hover:text-green-600'" class="p-1.5 transition-colors rounded-lg"><Star class="w-3.5 h-3.5" :fill="pair.isDefault ? 'currentColor' : 'none'" /></button>
                <button @click="duplicatePair(pair)" class="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg"><Copy class="w-3.5 h-3.5" /></button>
                <button @click="removePair(pair)" class="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg"><Trash2 class="w-3.5 h-3.5" /></button>
              </div>
           </div>

           <!-- Bottom Row: Source -> Target Pickers -->
           <div class="flex items-center gap-3">
              <div class="flex-1 min-w-0 flex flex-col gap-1.5">
                <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest pl-1">{{ $t('connectionPairs.source') }}</span>
                <select 
                  :value="pair.sourceConnectionId" 
                  class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all truncate" 
                  @change="updateSource(pair, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="">{{ $t('connectionPairs.selectConnection') }}</option>
                  <optgroup v-for="env in enabledEnvironments" :key="env.id" :label="env.name">
                    <option v-for="conn in getConnectionsByEnv(env.name)" :key="conn.id" :value="conn.id">{{ conn.name }}</option>
                  </optgroup>
                </select>
              </div>
              
              <div class="mt-4 shrink-0 px-1">
                 <!-- Status graphic mixed with arrow -->
                 <div class="relative w-6 h-6 flex items-center justify-center">
                    <ArrowRight class="w-4 h-4 text-gray-300 dark:text-gray-600 absolute" :class="{'opacity-0': pair.status && pair.status !== 'idle'}" />
                    <div v-if="pair.status && pair.status !== 'idle'" :class="getPairStatusClass(pair)" class="w-2.5 h-2.5 rounded-full absolute shadow-[0_0_8px_rgba(0,0,0,0.1)]"></div>
                 </div>
              </div>

              <div class="flex-1 min-w-0 flex flex-col gap-1.5">
                <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest pl-1">{{ $t('connectionPairs.target') }}</span>
                <select 
                  :value="pair.targetConnectionId" 
                  class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all truncate" 
                  @change="updateTarget(pair, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="">{{ $t('connectionPairs.selectTarget') }}</option>
                  <optgroup v-for="env in enabledEnvironments" :key="env.id" :label="env.name">
                    <option v-for="conn in getConnectionsByEnv(env.name)" :key="conn.id" :value="conn.id">{{ conn.name }}</option>
                  </optgroup>
                </select>
              </div>
           </div>
        </div>
      </div>
    </div>

    <!-- Help Text -->
    <div class="text-sm text-gray-500 dark:text-gray-400">
      <p>• {{ $t('connectionPairs.help.direction') }}</p>
      <p>• {{ $t('connectionPairs.help.default') }}</p>
      <p>• {{ $t('connectionPairs.help.test') }}</p>
      <p>• {{ $t('connectionPairs.help.enabledOnly') }}</p>
    </div>

    <!-- Default Pair Display -->
    <div v-if="defaultPair" class="card p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
      <div class="flex items-center space-x-2">
        <Star class="w-4 h-4 text-primary-600 dark:text-primary-400" />
        <span class="text-sm font-medium text-primary-700 dark:text-primary-300">
          {{ $t('connectionPairs.defaultPairLabel') }} {{ defaultPair.name }}
        </span>
        <span class="text-sm text-primary-600 dark:text-primary-400">
          ({{ defaultPair.sourceEnv }} → {{ defaultPair.targetEnv }})
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus, ArrowRight, ShieldQuestion, Star, Copy, Trash2 } from 'lucide-vue-next'
import { useConnectionPairsStore, type ConnectionPair } from '@/stores/connectionPairs'
import { useAppStore } from '@/stores/app'
import { useProjectsStore } from '@/stores/projects'

const connectionPairsStore = useConnectionPairsStore()
const appStore = useAppStore()
const route = useRoute()
const router = useRouter()

// Handle deep linking for actions
onMounted(() => {
  if (route.query.action === 'new') {
    addConnectionPair()
    // Optional: Clear query param
    router.replace({ query: { ...route.query, action: undefined } })
  }
})

const connectionPairs = computed(() => connectionPairsStore.availablePairs)
const enabledEnvironments = computed(() => connectionPairsStore.enabledEnvironments)
const connections = computed(() => appStore.resolvedConnections)

const defaultPair = computed(() => connectionPairsStore.defaultPair)

const getConnectionsByEnv = (envName: string) => {
  const projectsStore = useProjectsStore()
  const project = projectsStore.currentProject
  if (!project) return []

  return connections.value.filter(c => 
    c.environment === envName && 
    project.connectionIds.includes(c.id)
  )
}

const addConnectionPair = () => {
  connectionPairsStore.addConnectionPair({
    name: 'New Pair',
    sourceEnv: '',
    targetEnv: '',
    sourceConnectionId: '',
    targetConnectionId: '',
    description: '',
    isDefault: false,
    status: 'idle'
  })
}

const duplicatePair = (pair: ConnectionPair) => {
  connectionPairsStore.addConnectionPair({
    name: `${pair.name}_COPY`,
    sourceEnv: pair.sourceEnv,
    targetEnv: pair.targetEnv,
    sourceConnectionId: pair.sourceConnectionId,
    targetConnectionId: pair.targetConnectionId,
    description: pair.description,
    isDefault: false,
    status: 'idle'
  })
}

const removePair = (pair: ConnectionPair) => {
  connectionPairsStore.removeConnectionPair(pair.id)
}

const setAsDefault = (pair: ConnectionPair) => {
  connectionPairsStore.setDefaultPair(pair.id)
}

const testPair = async (pair: ConnectionPair) => {
  if (!pair.sourceEnv || !pair.targetEnv) return
  await connectionPairsStore.testConnectionPair(pair.id)
}

const updatePair = (pair: ConnectionPair) => {
  // Validate pair
  if (!pair.name.trim()) {
    pair.name = 'New Pair'
  }
  
  // Ensure unique names
  const duplicates = connectionPairs.value.filter(p => 
    p.name === pair.name && p.id !== pair.id
  )
  if (duplicates.length > 0) {
    pair.name = `${pair.name}_${Date.now()}`
  }
  
  // Update in store
  connectionPairsStore.updateConnectionPair(pair.id, {
    name: pair.name,
    sourceEnv: pair.sourceEnv,
    targetEnv: pair.targetEnv,
    sourceConnectionId: pair.sourceConnectionId,
    targetConnectionId: pair.targetConnectionId,
    description: pair.description
  })
}

const updateSource = (pair: ConnectionPair, connectionId: string) => {
  const connection = connections.value.find(c => c.id === connectionId)
  if (connection) {
    pair.sourceConnectionId = connectionId
    pair.sourceEnv = connection.environment
    updatePair(pair)
  }
}

const updateTarget = (pair: ConnectionPair, connectionId: string) => {
  const connection = connections.value.find(c => c.id === connectionId)
  if (connection) {
    pair.targetConnectionId = connectionId
    pair.targetEnv = connection.environment
    updatePair(pair)
  }
}

const isDumpPair = (pair: ConnectionPair) => {
  const source = connections.value.find(c => c.id === pair.sourceConnectionId)
  const target = connections.value.find(c => c.id === pair.targetConnectionId)
  return source?.type === 'dump' || target?.type === 'dump'
}

const getPairStatusClass = (pair: ConnectionPair) => {
  switch (pair.status) {
    case 'testing':
      return 'bg-yellow-500'
    case 'success':
      return 'bg-green-500'
    case 'failed':
      return 'bg-red-500'
    default:
      return 'bg-gray-400'
  }
}

// Removed getPairStatusText as it's no longer used

// Expose methods and data for parent component
defineExpose({
  connectionPairs: computed(() => connectionPairs.value),
  defaultPair,
  getDefaultPair: () => connectionPairsStore.defaultPair,
  getPairsBySource: (sourceEnv: string) => connectionPairsStore.getPairsBySource(sourceEnv),
  getPairsByTarget: (targetEnv: string) => connectionPairsStore.getPairsByTarget(targetEnv)
})
</script>
