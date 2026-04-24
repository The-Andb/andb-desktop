<script setup lang="ts">
import { useUpdaterStore } from '@/stores/updater'
import { RefreshCw, Check } from 'lucide-vue-next'

const updaterStore = useUpdaterStore()
</script>

<template>
  <div class="animate-in fade-in slide-in-from-bottom-2 duration-500">
    <div class="space-y-12">
      <!-- Status Card -->
      <div class="flex flex-col items-center text-center">
        <div class="mb-4">
          <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">{{
            $t('settings.update.currentVersion') }}</span>
          <div class="text-3xl font-black text-gray-900 dark:text-white mt-1">{{ updaterStore.currentVersion }}
          </div>
        </div>

        <div v-if="updaterStore.status === 'checking'"
          class="flex items-center gap-2 text-primary-500 font-bold mb-4">
          <RefreshCw class="w-4 h-4 animate-spin" />
          {{ $t('settings.update.checking') }}
        </div>
        <div v-else-if="updaterStore.status === 'available'" class="flex flex-col items-center gap-2 mb-4">
          <div class="flex items-center gap-2 text-green-500 font-bold">
            <Check class="w-4 h-4" />
            {{ $t('settings.update.available', { version: updaterStore.updateInfo?.version }) }}
          </div>
        </div>

        <button v-if="updaterStore.status === 'available' || updaterStore.status === 'downloaded'"
          @click="updaterStore.showModal = true"
          class="mt-4 text-xs font-bold text-primary-500 hover:text-primary-600 underline">
          {{ $t('settings.update.viewNotes') }}
        </button>
      </div>

      <!-- Settings -->
      <div class="mt-12 pt-12 border-t border-gray-100 dark:border-gray-800/40">
        <label class="flex items-center justify-between cursor-pointer group">
          <div>
            <div class="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-1">{{
              $t('settings.update.autoDownload') }}</div>
            <div class="text-[11px] text-gray-400 dark:text-gray-500 font-medium">{{
              $t('settings.update.autoDownloadDesc') }}</div>
          </div>
          <div class="relative">
            <input type="checkbox" v-model="updaterStore.autoDownload" class="sr-only peer">
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600">
            </div>
          </div>
        </label>
      </div>
    </div>
  </div>
</template>
