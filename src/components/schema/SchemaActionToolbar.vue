<template>
  <div class="w-full flex flex-col">
    <!-- Toolbar -->
    <div
      class="flex items-center w-full h-14 px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/50 backdrop-blur-md gap-4"
    >
      <div
        class="flex items-center gap-2 uppercase tracking-[0.25em] text-[10px] font-black text-gray-400 dark:text-gray-500 shrink-0 select-none"
      >
        <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"></div>
        {{ $t('schema.title') }}
      </div>

      <div class="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1 opacity-50"></div>

      <div class="flex-1 flex items-center justify-end gap-2">
        <slot name="actions"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
</script>
