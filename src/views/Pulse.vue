<template>
  <MainLayout>
    <template #toolbar>
      <div class="flex items-center justify-between w-full h-full gap-4">
        <!-- DB Selector in Toolbar -->
        <div class="flex items-center gap-3">
          <label class="text-[10px] font-black uppercase tracking-wider text-gray-400 select-none">
            Active Connection:
          </label>
          <select
            v-model="selectedConnectionId"
            class="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 outline-none focus:border-primary-500 shadow-sm cursor-pointer"
          >
            <option value="" disabled>-- Select Database Connection --</option>
            <option v-for="conn in projectConnections" :key="conn.id" :value="conn.id">
              {{ conn.name }} ({{ conn.environment }} · {{ conn.database }})
            </option>
          </select>
        </div>
      </div>
    </template>

    <template #breadcrumbs>
      <div class="flex items-center gap-3 w-full">
        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
          <Activity class="w-3.5 h-3.5 text-primary-500 opacity-60" />
          <span class="text-[11px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400">
            Table Pulse
          </span>
        </div>
        <ChevronRight class="w-3 h-3 text-gray-300 dark:text-gray-700" />
        <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Live Project Monitor
        </span>
      </div>
    </template>

    <div class="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-950 overflow-hidden relative">
      <template v-if="selectedConnection">
        <!-- Live Polling Database Pulse component -->
        <DatabasePulse :sourceConnection="selectedConnection" />
      </template>

      <!-- Connection Selector Empty State -->
      <div v-else class="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div class="w-48 h-48 bg-primary-500/5 dark:bg-primary-500/10 rounded-full flex items-center justify-center mb-8 relative border border-primary-500/10 shadow-inner">
          <div class="absolute inset-0 rounded-full bg-primary-500/5 animate-ping opacity-30"></div>
          <Activity class="w-24 h-24 text-primary-500" />
        </div>
        <h3 class="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white mb-2">
          Select Connection to Pulse
        </h3>
        <p class="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-6 max-w-xs leading-relaxed">
          Select any connection from the current project to monitor live locks, thread activities, and call the AI DBA diagnostic.
        </p>

        <div class="w-full max-w-xs">
          <select
            v-model="selectedConnectionId"
            class="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs font-bold text-gray-700 dark:text-gray-200 outline-none focus:border-primary-500 shadow-lg cursor-pointer"
          >
            <option value="" disabled>-- Choose a Connection --</option>
            <option v-for="conn in projectConnections" :key="conn.id" :value="conn.id">
              {{ conn.name }} ({{ conn.environment }} · {{ conn.database }})
            </option>
          </select>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import DatabasePulse from '@/components/compare/DatabasePulse.vue'
import { useAppStore } from '@/stores/app'
import { useProjectsStore } from '@/stores/projects'
import { Activity, ChevronRight } from 'lucide-vue-next'

const appStore = useAppStore()
const projectsStore = useProjectsStore()

const selectedConnectionId = ref<string>('')

const projectConnections = computed(() => {
  if (!projectsStore.currentProject) return []
  const ids = projectsStore.currentProject.connectionIds || []
  return appStore.resolvedConnections.filter(c => ids.includes(c.id))
})

const selectedConnection = computed(() => {
  return projectConnections.value.find(c => c.id === selectedConnectionId.value)
})

// Auto-select first connection if available
onMounted(() => {
  if (projectConnections.value.length > 0 && !selectedConnectionId.value) {
    selectedConnectionId.value = projectConnections.value[0].id
  }
})

// Reset selector on project change
watch(
  () => projectsStore.selectedProjectId,
  () => {
    selectedConnectionId.value = ''
    if (projectConnections.value.length > 0) {
      selectedConnectionId.value = projectConnections.value[0].id
    }
  }
)
</script>

<style scoped>
</style>
