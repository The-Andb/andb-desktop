<template>
  <div class="flex items-center justify-between w-full h-full gap-4">


    <!-- Right Side: Actions & Controls -->
    <div class="flex items-center gap-4 flex-1 justify-end">
      <!-- View Mode Switch & Safe Mode Toggle -->
      <div
        v-if="appStore.layoutSettings.toolbar"
        class="flex items-center space-x-2 shrink-0 p-1.5"
      >
        <div
          v-if="appStore.compareMode === 'auto'"
          class="flex items-center p-1 border border-gray-100 dark:border-gray-700 rounded-xl"
          :class="appStore.buttonStyle === 'minimal' ? 'scale-90' : ''"
        >
          <button
            @click="$emit('update:viewMode', 'list')"
            class="flex items-center gap-2 rounded-lg font-bold uppercase transition-all duration-200"
            :class="[
              viewMode === 'list'
                ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200',
              appStore.buttonStyle === 'full'
                ? 'px-3 py-1.5 text-[10px]'
                : 'px-2 py-1 text-[10px]'
            ]"
            :title="t('compare.listViewTooltip')"
          >
            <List class="w-3.5 h-3.5" />
            <span v-if="appStore.buttonStyle !== 'icons' && appStore.buttonStyle === 'full'">{{
              t('compare.listView')
            }}</span>
          </button>
          <button
            @click="$emit('update:viewMode', 'tree')"
            class="flex items-center gap-2 rounded-lg font-bold uppercase transition-all duration-200"
            :class="[
              viewMode === 'tree'
                ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200',
              appStore.buttonStyle === 'full'
                ? 'px-3 py-1.5 text-[10px]'
                : 'px-2 py-1 text-[10px]'
            ]"
            :title="t('compare.treeViewTooltip')"
          >
            <GitMerge class="w-3.5 h-3.5 rotate-90" />
            <span v-if="appStore.buttonStyle !== 'icons' && appStore.buttonStyle === 'full'">{{
              t('compare.treeViewLabel')
            }}</span>
          </button>
        </div>

        <div
          v-if="appStore.compareMode === 'auto' && appStore.buttonStyle === 'full'"
          class="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"
        ></div>

        <!-- Safe Mode Toggle -->
        <div
          class="relative flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700 select-none"
        >
          <ShieldCheck
            class="w-4 h-4"
            :class="appStore.safeMode ? 'text-green-500' : 'text-gray-400'"
          />

          <div class="flex items-center gap-1">
            <span
              class="text-[10px] font-bold uppercase tracking-widest text-gray-500 cursor-help"
              :title="
                t(
                  'common.tooltips.safeMode',
                  'Safe Mode prevents potentially destructive actions during comparisons and migrations.'
                )
              "
              >{{ t('schema.safeMode', 'Safe Mode') }}</span
            >
            <button
              @click="$emit('update:showSafeModeInfo', !showSafeModeInfo)"
              class="text-gray-400 hover:text-primary-500 transition-colors p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <Info class="w-3 h-3" />
            </button>
          </div>

          <button
            @click="appStore.safeMode = !appStore.safeMode"
            class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ml-1"
            :class="appStore.safeMode ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'"
          >
            <span
              class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
              :class="appStore.safeMode ? 'translate-x-4' : 'translate-x-0'"
            ></span>
          </button>

          <!-- Info Popover -->
          <div
            v-if="showSafeModeInfo"
            class="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-[100]"
          >
            <div
              class="flex items-start justify-between mb-3 border-b border-gray-100 dark:border-gray-700 pb-2"
            >
              <h3
                class="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 text-xs uppercase tracking-widest"
              >
                <ShieldCheck class="w-4 h-4 text-green-500" />
                {{ t('schema.safeMode', 'Safe Mode') }} Info
              </h3>
              <button
                @click="$emit('update:showSafeModeInfo', false)"
                class="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-0.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
            <div class="text-gray-600 dark:text-gray-300 space-y-3 text-xs leading-relaxed">
              <p>
                <span class="font-bold text-green-500 flex items-center gap-1 mb-0.5"
                  ><span class="w-1.5 h-1.5 rounded-full bg-green-500"></span> ON (Dry
                  Run)</span
                >
                Simulates changes without affecting your database. Generates SQL for preview
                only. <span class="text-gray-400 italic">Recommended.</span>
              </p>
              <p>
                <span class="font-bold text-red-500 flex items-center gap-1 mb-0.5"
                  ><span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> OFF (Execute)</span
                >
                Executes actual CREATE, ALTER, and DROP statements directly on the database.
                <span class="text-red-400 font-bold">Use with extreme caution!</span>
              </p>
            </div>
          </div>
        </div>


      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  List,
  GitMerge,
  ShieldCheck,
  Info,
  X
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

defineProps<{
  appStore: any
  viewMode: string
  showSafeModeInfo: boolean
  loading: boolean
  loadingAction: string | null
  activePair: any
}>()

defineEmits([
  'update:viewMode',
  'update:showSafeModeInfo',
  'runComparison'
])

const { t } = useI18n()
</script>
