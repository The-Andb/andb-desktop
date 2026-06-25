<template>
  <div class="flex-1 flex flex-col bg-white dark:bg-gray-950 relative min-w-0">
    <!-- Tab Bar -->
    <TabBar
      v-if="tabs.length > 0"
      :tabs="tabs"
      :active-tab-id="activeTabId"
      @select="$emit('select-tab', $event)"
      @close="$emit('close-tab', $event)"
      @duplicate="$emit('duplicate-tab', $event)"
      @close-others="$emit('close-others', $event)"
      @close-right="$emit('close-right', $event)"
    />

    <div v-if="selectedItem?.type === 'search_advanced'" class="h-full flex flex-col">
      <CompareSearchView
        :all-results="allResults"
        @open-item="$emit('open-item', $event)"
      />
    </div>

    <div v-else-if="selectedItem" class="h-full flex flex-col">
      <div
        class="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between h-12 shrink-0"
      >
        <div class="flex items-center text-xs space-x-2 overflow-hidden">
          <span class="text-gray-400 dark:text-gray-500 font-medium truncate max-w-[80px]">{{ selectedPath.env }}</span>
          <ChevronRight class="w-3 h-3 text-gray-350 dark:text-gray-650 shrink-0" />
          <span class="text-gray-400 dark:text-gray-500 font-medium truncate max-w-[100px]">{{ selectedPath.db }}</span>
          <ChevronRight class="w-3 h-3 text-gray-350 dark:text-gray-650 shrink-0" />
          
          <div class="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white text-sm">
            <component :is="getIconForType(selectedItem.type)" class="w-4 h-4 text-primary-500 shrink-0" />
            <span class="font-mono">{{ selectedItem.name }}</span>
          </div>
          <span
            :class="getStatusClass(selectedItem.status)"
            class="ml-2 text-[9px] px-2 py-0.5 rounded-full bg-opacity-10 font-black border uppercase tracking-tighter"
            :style="{ borderColor: 'currentColor' }"
          >
            {{ getStatusText(selectedItem.status) }}
          </span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button
            @click="$emit('refresh-pair', selectedItem)"
            :disabled="isRefreshing || showSuccessTick"
            class="text-[10px] font-extrabold flex items-center transition-all rounded-lg active:scale-95 animate-in fade-in duration-200 focus:outline-none disabled:opacity-80 disabled:cursor-default"
            :class="[
              buttonStyle === 'icons' ? 'p-2 shadow-sm' : buttonStyle === 'full' ? 'px-3.5 py-2 shadow-md' : 'px-2.5 py-1.5 shadow-sm',
              buttonStyle === 'icons' ? '' : 'gap-1.5',
              showSuccessTick
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/40'
                : buttonStyle === 'full'
                  ? 'text-gray-850 dark:text-gray-250 hover:bg-gray-200 dark:hover:bg-gray-700 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 border border-gray-350 dark:border-gray-700'
                  : 'text-gray-600 dark:text-gray-400 hover:text-white hover:bg-gray-600 bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800'
            ]"
            title="Force refresh database metadata & re-run comparison for this object"
          >
            <template v-if="isRefreshing">
              <RotateCw class="w-3.5 h-3.5 animate-spin" />
              <span v-if="buttonStyle !== 'icons'">Refreshing...</span>
            </template>
            <template v-else-if="showSuccessTick">
              <Check class="w-3.5 h-3.5 text-emerald-500" />
              <span v-if="buttonStyle !== 'icons'">Refreshed</span>
            </template>
            <template v-else>
              <RotateCw class="w-3.5 h-3.5" />
              <span v-if="buttonStyle !== 'icons'">Refresh Pair</span>
            </template>
          </button>
          
          <button
            v-if="selectedItem.status?.toLowerCase() !== 'equal' && selectedItem.status?.toLowerCase() !== 'same'"
            @click="$emit('migrate', { ...selectedItem, backwards: true })"
            class="text-[10px] font-extrabold flex items-center transition-all rounded-lg active:scale-95 animate-in fade-in duration-200 focus:outline-none"
            :class="[
              buttonStyle === 'icons' ? 'p-2 shadow-sm' : buttonStyle === 'full' ? 'px-3.5 py-2 shadow-md' : 'px-2.5 py-1.5 shadow-sm',
              buttonStyle === 'icons' ? '' : 'gap-1.5',
              buttonStyle === 'full'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-655 text-white border-transparent'
                : 'text-amber-600 dark:text-amber-400 hover:text-white hover:bg-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40'
            ]"
            title="Alter Source database to match Target"
          >
            <ArrowLeft class="w-3.5 h-3.5" />
            <span v-if="buttonStyle !== 'icons'">Alter Source</span>
          </button>

          <button
            v-if="selectedItem.status?.toLowerCase() !== 'equal' && selectedItem.status?.toLowerCase() !== 'same' && !isTargetDump"
            @click="$emit('migrate', { ...selectedItem, backwards: false })"
            class="text-[10px] font-extrabold flex items-center transition-all rounded-lg active:scale-95 animate-in fade-in duration-200 focus:outline-none"
            :class="[
              buttonStyle === 'icons' ? 'p-2 shadow-sm' : buttonStyle === 'full' ? 'px-3.5 py-2 shadow-md' : 'px-2.5 py-1.5 shadow-sm',
              buttonStyle === 'icons' ? '' : 'gap-1.5',
              buttonStyle === 'full'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-655 text-white border-transparent'
                : 'text-emerald-600 dark:text-emerald-400 hover:text-white hover:bg-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/40'
            ]"
            title="Alter Target database to match Source"
          >
            <ArrowRight class="w-3.5 h-3.5" />
            <span v-if="buttonStyle !== 'icons'">Alter Target</span>
          </button>
        </div>
      </div>
      <div class="flex-1 flex flex-col min-h-0 min-w-0">
        <MirrorDiffView
          :source-ddl="selectedItem.diff?.source || null"
          :target-ddl="selectedItem.diff?.target || null"
          :source-label="sourceName"
          :target-label="targetName"
          :status="selectedItem.status || 'equal'"
          :diff-options="diffOptions"
          :navigatable-names="navigatableNames"
          @navigate-to-definition="$emit('navigate-to-definition', $event)"
        />
      </div>
    </div>
    <div v-else class="flex-1 flex items-center justify-center text-gray-400 italic">
      <div class="text-center">
        <MousePointer2 class="w-12 h-12 mx-auto mb-2 opacity-10" />
        <p>{{ t('schema.selectObject') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Database,
  ChevronRight,
  Zap,
  MousePointer2,
  Table,
  Layers,
  Workflow,
  Sigma,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Check
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import TabBar from '@/components/general/TabBar.vue'
import MirrorDiffView from '@/components/compare/MirrorDiffView.vue'
import CompareSearchView from '@/components/compare/CompareSearchView.vue'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    tabs: any[]
    activeTabId: string | null
    selectedItem: any | null
    selectedPath: { env: string; db: string; type: string }
    sourceName: string
    targetName: string
    isTargetDump: boolean
    isMigrating: boolean
    isMigratingItemId: string | null
    isRefreshing?: boolean
    diffOptions: any
    navigatableNames: string[]
    allResults: any[]
    buttonStyle?: 'full' | 'minimal' | 'icons'
  }>(),
  {
    isRefreshing: false,
    buttonStyle: 'full'
  }
)

const showSuccessTick = ref(false)

watch(
  () => props.isRefreshing,
  (newVal, oldVal) => {
    if (oldVal === true && newVal === false) {
      showSuccessTick.value = true
      setTimeout(() => {
        showSuccessTick.value = false
      }, 2000)
    }
  }
)

defineEmits([
  'select-tab',
  'close-tab',
  'duplicate-tab',
  'close-others',
  'close-right',
  'migrate',
  'navigate-to-definition',
  'refresh-pair',
  'open-item'
])

const getIconForType = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'tables':
    case 'table':
      return Table
    case 'views':
    case 'view':
      return Layers
    case 'procedures':
    case 'procedure':
      return Workflow
    case 'functions':
    case 'function':
      return Sigma
    case 'triggers':
    case 'trigger':
      return Zap
    default:
      return Database
  }
}

const getStatusClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'equal':
    case 'same':
      return 'text-teal-600 dark:text-teal-400 font-bold'
    case 'new':
    case 'missing_in_target':
      return 'text-emerald-500 dark:text-emerald-400 drop-shadow-sm font-bold'
    case 'deprecated':
    case 'missing_in_source':
      return 'text-rose-500 dark:text-rose-400 drop-shadow-sm font-bold'
    case 'modified':
    case 'different':
    case 'updated':
      return 'text-amber-500 dark:text-amber-400 drop-shadow-sm font-bold'
    default:
      return 'text-gray-400'
  }
}

const getStatusText = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'equal':
    case 'same':
      return t('common.status.identical')
    case 'different':
    case 'updated':
    case 'modified':
      return t('common.status.modified')
    case 'new':
    case 'missing_in_target':
      return t('common.status.new')
    case 'deprecated':
    case 'missing_in_source':
      return t('common.status.deprecated')
    default:
      return status
  }
}
</script>
