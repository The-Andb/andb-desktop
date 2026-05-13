<template>
  <div v-if="activePair" class="flex items-center gap-2">
    <!-- Source Context -->
    <div
      class="flex items-center gap-2 bg-white dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm"
    >
      <div class="flex items-center text-gray-500 dark:text-gray-400">
        <Server class="w-3.5 h-3.5 mr-1.5" />
        <span class="text-[9px] font-black uppercase tracking-widest opacity-60">{{
          activePair.source.environment
        }}</span>
      </div>
      <ChevronRight class="w-3 h-3 text-gray-300 dark:text-gray-600" />
      <div class="flex items-center text-primary-600 dark:text-primary-400">
        <Database class="w-3.5 h-3.5 mr-1.5" />
        <span class="text-[10px] font-black uppercase tracking-[0.1em]">{{
          activePair.source.database || activePair.source.name
        }}</span>
      </div>
    </div>

    <div class="flex items-center px-1">
      <ArrowRightLeft class="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
    </div>

    <!-- Target Context -->
    <div
      class="flex items-center gap-2 bg-white dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm"
    >
      <div class="flex items-center text-gray-500 dark:text-gray-400">
        <Server class="w-3.5 h-3.5 mr-1.5" />
        <span class="text-[9px] font-black uppercase tracking-widest opacity-60">{{
          activePair.target.environment
        }}</span>
      </div>
      <ChevronRight class="w-3 h-3 text-gray-300 dark:text-gray-600" />
      <div class="flex items-center text-primary-600 dark:text-primary-400">
        <Database class="w-3.5 h-3.5 mr-1.5" />
        <span class="text-[10px] font-black uppercase tracking-[0.1em]">{{
          activePair.target.database || activePair.target.name
        }}</span>
      </div>
    </div>

    <button
      @click="$emit('runComparison')"
      :disabled="loading || !activePair"
      class="ml-3 p-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl text-gray-400 hover:text-primary-500 transition-all active:scale-95 disabled:opacity-30 border border-transparent hover:border-primary-100 dark:hover:border-primary-800"
    >
      <RotateCcw
        class="w-4 h-4"
        :class="{ 'animate-spin': loading && loadingAction === 'compare' }"
      />
    </button>
  </div>
  <span
    v-else
    class="text-[10px] font-black uppercase tracking-widest text-gray-400 opacity-30"
    >{{ t('compare.noPair') }}</span
  >
</template>

<script setup lang="ts">
import {
  Server,
  Database,
  ChevronRight,
  ArrowRightLeft,
  RotateCcw
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

defineProps<{
  activePair: any
  loading: boolean
  loadingAction: string | null
}>()

defineEmits(['runComparison'])

const { t } = useI18n()
</script>
