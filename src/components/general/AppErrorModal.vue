<template>
  <div
    v-if="errorStore.isOpen"
    class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
  >
    <div
      class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-red-100 dark:border-red-900/30 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
    >
      <div class="p-6 flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0"
          >
            <AlertCircle class="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3
              class="text-lg font-extrabold text-gray-900 dark:text-white uppercase tracking-tight"
            >
              {{ errorStore.title }}
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">
              An unexpected issue occurred during the operation
            </p>
          </div>
        </div>

        <div
          class="bg-gray-50 dark:bg-gray-950 rounded-xl p-4 border border-gray-100 dark:border-gray-800/50 font-mono text-xs text-red-600 dark:text-red-400 break-words max-h-[300px] overflow-y-auto custom-scrollbar leading-relaxed"
        >
          {{ errorStore.message }}
        </div>

        <div class="flex items-center gap-3 mt-2">
          <button
            @click="errorStore.close()"
            class="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all"
          >
            {{ $t('common.close') }}
          </button>
          <button
            v-if="errorStore.onRetry"
            @click="handleRetry"
            class="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-red-500/20 active:scale-95"
          >
            {{ errorStore.retryText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next'
import { useErrorModalStore } from '@/stores/errorModal'

const errorStore = useErrorModalStore()

const handleRetry = () => {
  if (errorStore.onRetry) {
    errorStore.onRetry()
  }
  errorStore.close()
}
</script>
