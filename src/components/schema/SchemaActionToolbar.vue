<template>
  <div class="w-full flex flex-col">
    <div class="flex items-center gap-2">
      <slot name="actions"></slot>
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
