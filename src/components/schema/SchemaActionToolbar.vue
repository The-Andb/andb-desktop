<template>
  <div class="w-full flex flex-col">
    <!-- Toolbar -->
    <div class="flex items-center w-full h-14 px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/50 backdrop-blur-md gap-4">
      <div class="flex items-center gap-2 uppercase tracking-widest text-[10px] font-black text-gray-400 shrink-0">
        {{ $t('schema.title') }}
      </div>

      <div class="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1 opacity-50"></div>

      <div class="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <slot name="actions"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RefreshCw, Database } from 'lucide-vue-next'

defineProps<{
  connectionId: string
  connectionName: string
  lastUpdated?: string
  isFetching: boolean
  selectedEnv?: string
  selectedDbName?: string
  selectedType?: string
  selectedObject?: any
}>()

const emit = defineEmits<{
  refresh: []
  'reset-nav': []
}>()

const formatTimeAgo = (dateString: string) => {
  if (!dateString) return ''
  // This is a simplified placeholder, the real one uses i18n
  return dateString
}
</script>
