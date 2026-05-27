<template>
  <teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity"
          @click="close"
        ></div>

        <!-- Modal Content -->
        <Transition name="scale">
          <div
            v-if="isOpen"
            class="relative w-full max-w-4xl h-[85vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
            @click.stop
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
                  <ArrowRightLeft class="w-5 h-5" />
                </div>
                <div>
                  <h3 class="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-white">
                    {{ $t('history.migrationDetails') || 'Migration Run Details' }}
                  </h3>
                  <p class="text-[10px] text-gray-400 dark:text-gray-500 font-mono tracking-tight mt-0.5">
                    ID: {{ operation?.id }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <!-- Status Badge -->
                <span
                  class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border"
                  :class="[
                    operation?.status === 'success' ? 'bg-green-500/15 border-green-500/30 text-green-500' : '',
                    operation?.status === 'pending' ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-500' : '',
                    operation?.status === 'failed' ? 'bg-red-500/15 border-red-500/30 text-red-500' : ''
                  ]"
                >
                  {{ operation?.status }}
                </span>
                
                <!-- Close Button -->
                <button
                  @click="close"
                  class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Body (Split Content) -->
            <div class="flex-1 flex flex-col md:flex-row overflow-hidden">
              <!-- Left Sidebar: Metadata & Target Objects -->
              <div class="w-full md:w-80 border-r border-gray-100 dark:border-gray-800 p-6 flex flex-col gap-6 overflow-y-auto bg-gray-50/20 dark:bg-gray-900/10">
                <!-- Meta Info -->
                <div class="space-y-4">
                  <h4 class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    {{ $t('common.info') || 'Information' }}
                  </h4>
                  
                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-0.5">
                      <span class="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Environment</span>
                      <span class="text-xs font-black uppercase text-gray-900 dark:text-white">{{ operation?.targetEnv }}</span>
                    </div>
                    <div class="space-y-0.5">
                      <span class="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Database</span>
                      <span class="text-xs font-black uppercase text-gray-900 dark:text-white">{{ operation?.metadata?.database || 'Unknown' }}</span>
                    </div>
                    <div class="space-y-0.5 col-span-2">
                      <span class="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Executed At</span>
                      <span class="text-xs font-medium text-gray-900 dark:text-white">{{ formatFullDate(operation?.startTime) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Error Messages if failed -->
                <div v-if="operation?.errorMessage" class="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <h4 class="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle class="w-3.5 h-3.5" />
                    Error Message
                  </h4>
                  <p class="text-xs text-red-600 dark:text-red-400 font-medium break-all font-mono leading-relaxed">
                    {{ operation.errorMessage }}
                  </p>
                </div>

                <!-- Target Objects -->
                <div class="flex-1 flex flex-col min-h-[200px]">
                  <h4 class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                    Affected Objects ({{ targetObjects.length }})
                  </h4>

                  <div class="flex-1 overflow-y-auto space-y-2 max-h-[30vh] md:max-h-none">
                    <div
                      v-for="(obj, idx) in targetObjects"
                      :key="idx"
                      class="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700/50 hover:shadow-sm transition-all"
                    >
                      <div class="min-w-0">
                        <span class="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block leading-none mb-1">
                          {{ obj.type }}
                        </span>
                        <span class="text-xs font-bold text-gray-800 dark:text-gray-200 truncate block">
                          {{ obj.name }}
                        </span>
                      </div>
                      <span
                        class="px-2 py-0.5 rounded text-[8px] font-black uppercase border"
                        :class="[
                          ['deprecated', 'deprecated_in_target', 'missing_in_source', 'DEPRECATED'].includes(obj.status)
                            ? 'bg-red-500/10 border-red-500/20 text-red-500'
                            : 'bg-green-500/10 border-green-500/20 text-green-500'
                        ]"
                      >
                        {{ obj.status }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Pane: Code Viewer -->
              <div class="flex-1 flex flex-col overflow-hidden relative bg-gray-50 dark:bg-gray-950">
                <div class="px-6 py-2.5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                  <span class="font-mono text-gray-400 text-[10px] truncate max-w-md" :title="operation?.metadata?.filePath">
                    <FileCode class="w-3.5 h-3.5 inline mr-1 text-primary-500" />
                    {{ operation?.metadata?.filePath || 'No script file path logged' }}
                  </span>
                </div>

                <div class="flex-1 relative overflow-hidden">
                  <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-10">
                    <div class="flex flex-col items-center gap-2">
                      <Loader2 class="w-8 h-8 text-primary-500 animate-spin" />
                      <span class="text-xs font-black text-gray-400 uppercase tracking-widest">Loading SQL File...</span>
                    </div>
                  </div>

                  <div v-else-if="loadError" class="absolute inset-0 flex flex-col items-center justify-center p-8 text-center gap-3">
                    <div class="p-3 bg-yellow-500/10 text-yellow-500 rounded-full">
                      <AlertTriangle class="w-8 h-8" />
                    </div>
                    <div>
                      <h4 class="text-sm font-bold text-gray-800 dark:text-gray-200">Could not read SQL script</h4>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm leading-relaxed">
                        The physical trace file might have been deleted, or resides outside the workspace directory.
                      </p>
                    </div>
                    <!-- Fallback Raw View of Target Objects -->
                    <div class="w-full max-w-md bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 mt-2">
                      <pre class="text-[11px] text-left font-mono text-gray-500 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48">
/* Target objects: */
{{ JSON.stringify(targetObjects, null, 2) }}
                      </pre>
                    </div>
                  </div>

                  <DDLViewer
                    v-else-if="sqlContent"
                    :content="sqlContent"
                    :show-line-numbers="true"
                    :show-copy-button="true"
                  />

                  <div v-else class="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                    <FileCode class="w-12 h-12 mb-2 text-gray-300" />
                    <span class="text-xs">No migration history file available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ArrowRightLeft, X, AlertTriangle, FileCode, Loader2 } from 'lucide-vue-next'
import DDLViewer from '../ddl/DDLViewer.vue'

const props = defineProps<{
  isOpen: boolean
  operation: any | null
}>()

const emit = defineEmits<{
  close: []
}>()

const loading = ref(false)
const sqlContent = ref<string>('')
const loadError = ref<string | null>(null)

const targetObjects = computed(() => {
  if (!props.operation?.metadata?.targetObjects) return []
  try {
    const parsed = typeof props.operation.metadata.targetObjects === 'string'
      ? JSON.parse(props.operation.metadata.targetObjects)
      : props.operation.metadata.targetObjects
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    return []
  }
})

const close = () => {
  emit('close')
}

const loadSqlFile = async () => {
  const filePath = props.operation?.metadata?.filePath
  if (!filePath) {
    sqlContent.value = ''
    loadError.value = null
    return
  }

  loading.value = true
  loadError.value = null
  sqlContent.value = ''

  try {
    const res = await (window as any).electronAPI.readMigrationFile(filePath)
    if (res.success) {
      sqlContent.value = res.data
    } else {
      loadError.value = res.error || 'Failed to read script file'
    }
  } catch (err: any) {
    loadError.value = err.message || 'Error occurred while loading file'
  } finally {
    loading.value = false
  }
}

const formatFullDate = (dateVal: any) => {
  if (!dateVal) return ''
  const d = new Date(dateVal)
  return d.toLocaleString()
}

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      loadSqlFile()
    }
  }
)

watch(
  () => props.operation,
  () => {
    if (props.isOpen) {
      loadSqlFile()
    }
  }
)
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
