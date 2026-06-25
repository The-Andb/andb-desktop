<template>
  <div
    class="flex flex-col overflow-hidden bg-white dark:bg-gray-900 transition-all duration-300"
    :class="[inline ? 'flex-1 h-full' : 'absolute inset-0 z-50']"
  >
    <!-- Header -->
    <div
      class="shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 flex items-center justify-between shadow-sm z-10 box-border transition-colors duration-200"
      :class="inline ? 'py-2' : 'h-10'"
    >
      <div class="flex items-center gap-3 overflow-hidden">
        <!-- Title & Breadcrumbs -->
        <div class="flex items-center gap-2 min-w-0">
          <h2
            class="text-[10px] sm:text-xs font-black leading-6 text-gray-900 dark:text-white uppercase tracking-tight sm:tracking-wider whitespace-nowrap opacity-80"
          >
            {{ isBackwards ? 'Alter Source DDL Item' : (isBatchMode ? $t('migration.titleBatch') : $t('migration.titleSingle')) }}
          </h2>
          <span
            v-if="isBackwards"
            class="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[8px] font-black uppercase tracking-widest border border-amber-500/20"
          >
            Backwards (Alter Source)
          </span>
          <div class="h-3 w-px bg-gray-300 dark:bg-gray-600 shrink-0 mx-1 sm:mx-0"></div>
          <div
            class="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-mono truncate"
          >
            <span
              class="font-bold text-blue-600 dark:text-blue-400 truncate max-w-[80px] sm:max-w-[120px]"
              >{{ sourceName }}</span
            >
            <ArrowRight class="w-3 h-3 opacity-40 shrink-0" />
            <span
              class="font-bold text-green-600 dark:text-green-400 truncate max-w-[80px] sm:max-w-[120px]"
              >{{ targetName }}</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content (Split View) -->
    <div class="flex-1 flex overflow-hidden lg:flex-row flex-col">
      <!-- LEFT PANEL: Overview & List -->
      <div
        class="w-full lg:w-1/3 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col min-h-0"
      >
        <!-- Summary Cards -->
        <div class="p-4 pb-0 shrink-0">
          <!-- Combined Stats (Shows for both Single and Batch now) -->
          <div class="grid grid-cols-2 gap-2 mb-2">
            <div
              class="bg-white dark:bg-gray-800 rounded-lg p-2 text-center border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <div class="text-xl font-black text-gray-900 dark:text-white leading-none mb-1">
                {{ itemsToProcess.length }}
              </div>
              <div class="text-[9px] uppercase text-gray-500 font-bold tracking-wider">
                {{ $t('migration.totalItems') }}
              </div>
            </div>
            <div
              class="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 text-center border border-amber-100 dark:border-amber-800/30"
            >
              <div class="text-xl font-black text-amber-600 dark:text-amber-400 leading-none mb-1">
                {{ Object.keys(groupedItems).length }}
              </div>
              <div
                class="text-[9px] uppercase text-amber-600 dark:text-amber-400 font-bold tracking-wider"
              >
                {{ $t('migration.typesChanged') }}
              </div>
            </div>
          </div>
        </div>

        <!-- Items List (Scrollable) -->
        <div class="flex-1 overflow-y-auto custom-scrollbar p-4 pt-2">
          <h3
            class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1 flex items-center"
          >
            <List class="w-3 h-3 mr-1.5" />
            {{ $t('migration.itemsToMigrate') }}
          </h3>

          <div class="space-y-3 pb-4">
            <div
              v-for="(group, type) in groupedItems"
              :key="type"
              class="border rounded-lg border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-sm"
            >
              <div
                class="bg-gray-50 dark:bg-gray-700/30 px-3 py-1.5 flex items-center justify-between border-b border-gray-100 dark:border-gray-700/50"
              >
                <div
                  class="flex items-center text-[10px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300"
                >
                  <component
                    :is="getIconForType(type as any)"
                    class="w-3 h-3 mr-1.5 shrink-0 opacity-70"
                  />
                  {{ type }}
                  <span
                    class="ml-2 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-1.5 rounded-full text-[9px] min-w-[16px] text-center mb-0.5"
                    >{{ group.length }}</span
                  >
                </div>
              </div>
              <div class="divide-y divide-gray-100 dark:divide-gray-700/50">
                <div
                  v-for="obj in group"
                  :key="obj.name"
                  @click="selectItem(obj)"
                  class="px-3 py-2 flex items-center justify-between cursor-pointer transition-all border-l-2"
                  :class="
                    selectedItemKey === getItemKey(obj)
                      ? 'bg-primary-50 dark:bg-gray-700 border-primary-500'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/30 border-transparent'
                  "
                >
                  <span
                    class="text-[11px] font-mono text-gray-600 dark:text-gray-300 truncate pr-2 flex items-center min-w-0"
                  >
                    <span
                      class="truncate"
                      :class="{
                        'font-bold text-gray-900 dark:text-white':
                          selectedItemKey === getItemKey(obj)
                      }"
                      >{{ obj.name }}</span
                    >
                  </span>
                  <span
                    v-if="isMigratingItemId === obj.name"
                    class="shrink-0 text-[9px] uppercase font-bold tracking-tighter flex items-center text-primary-500 animate-pulse"
                  >
                    <RefreshCw class="w-3 h-3 mr-1 animate-spin" />
                    {{ $t('common.processing') || 'RUNNING...' }}
                  </span>
                  <span
                    v-else
                    :class="getStatusClass(obj.status)"
                    class="shrink-0 text-[9px] uppercase font-bold tracking-tighter flex items-center"
                  >
                    <component :is="getStatusIcon(obj.status)" class="w-3 h-3 mr-1" />
                    {{ getStatusText(obj.status) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Action Footer -->
        <div class="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shrink-0 flex items-center justify-between gap-2 shadow-sm">
          <button
            type="button"
            class="flex items-center justify-center rounded-xl transition-all active:scale-95"
            :class="[
              appStore.buttonStyle === 'icons' ? 'p-2.5 shadow-sm' : appStore.buttonStyle === 'full' ? 'px-5 py-2.5 shadow-md border border-gray-305 dark:border-gray-700 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 text-gray-750 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-750 font-black' : 'px-4 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-500 hover:text-gray-750 dark:text-gray-400 dark:hover:text-gray-200 font-bold',
              appStore.buttonStyle === 'icons' ? '' : 'flex-1 gap-1.5'
            ]"
            :disabled="loading"
            @click="$emit('close')"
            title="Back"
          >
            <ArrowLeft class="w-3.5 h-3.5" />
            <span v-if="appStore.buttonStyle !== 'icons'" class="text-[10px] uppercase tracking-wider">Back</span>
          </button>
          <button
            type="button"
            class="flex items-center justify-center rounded-xl transition-all border active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            :class="[
              appStore.buttonStyle === 'icons' ? 'p-2.5 shadow-sm' : appStore.buttonStyle === 'full' ? 'px-5 py-2.5 shadow-md font-black' : 'px-4 py-2.5 shadow-sm font-bold',
              appStore.buttonStyle === 'icons' ? '' : 'flex-1 gap-1.5',
              isBackwards
                ? appStore.buttonStyle === 'full'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-transparent text-white shadow-lg shadow-amber-500/20'
                  : 'text-amber-600 dark:text-amber-400 hover:text-white hover:bg-amber-600 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40'
                : appStore.buttonStyle === 'full'
                  ? 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 border-transparent text-white shadow-lg shadow-primary-500/20'
                  : 'text-primary-600 dark:text-primary-400 hover:text-white hover:bg-primary-600 bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-900/40'
            ]"
            :disabled="loading || targetIsStatic"
            @click="handleConfirm"
            :title="targetIsStatic ? $t('migration.staticWarning') : (isBackwards ? 'Alter Source' : 'Migrate')"
          >
            <Loader2 v-if="loading" class="w-3.5 h-3.5 animate-spin" />
            <Zap v-else class="w-3.5 h-3.5 fill-current" />
            <span v-if="appStore.buttonStyle !== 'icons'" class="text-[10px] uppercase tracking-wider">
              {{ loading ? $t('common.processing') : (isBackwards ? 'Alter Source' : 'Migrate') }}
            </span>
          </button>
        </div>
      </div>

      <!-- RIGHT PANEL: SQL Preview -->
      <div class="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900">
        <div
          class="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 shrink-0"
        >
          <span
            class="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest flex items-center gap-2"
          >
            <Terminal class="w-4 h-4 text-gray-400" />
            {{ $t('migration.sqlPreview') }}
            <span
              v-if="selectedItemName"
              class="ml-2 px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] normal-case tracking-normal"
            >
              {{ selectedItemName }}
            </span>
          </span>
          <button 
            v-if="(sqlScript || (sqlMap && Object.keys(sqlMap).length > 0)) && !fetchingSql"
            @click="copyAllAlterScripts"
            class="text-[10px] font-extrabold flex items-center transition-all shadow-sm active:scale-95"
            :class="[
              appStore.buttonStyle === 'icons' ? 'p-2 rounded-lg' : appStore.buttonStyle === 'full' ? 'px-3.5 py-2 rounded-lg shadow-md' : 'px-3 py-1.5 rounded-lg',
              appStore.buttonStyle === 'icons' ? '' : 'gap-1.5',
              appStore.buttonStyle === 'full'
                ? 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white border-transparent'
                : 'text-primary-600 dark:text-primary-400 hover:text-white hover:bg-primary-600 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/30'
            ]"
            title="Copy All Scripts"
          >
            <Copy class="w-3.5 h-3.5" />
            <span v-if="appStore.buttonStyle !== 'icons'">Copy All Scripts</span>
          </button>
        </div>

        <div class="flex-1 relative bg-gray-50 dark:bg-gray-950 overflow-hidden flex flex-col">
          <div
            v-if="fetchingSql"
            class="flex-1 flex flex-col items-center justify-center p-12 text-gray-500"
          >
            <div class="relative w-16 h-16 mb-4">
              <div
                class="absolute inset-0 border-4 border-gray-200 dark:border-gray-800 rounded-full"
              ></div>
              <div
                class="absolute inset-0 border-4 border-t-primary-500 rounded-full animate-spin"
              ></div>
            </div>
            <span class="text-xs uppercase tracking-widest font-bold animate-pulse">{{
              $t('common.loading')
            }}</span>
          </div>

          <div v-else-if="previewSql" class="flex-1 flex flex-col min-h-0 relative">
            <!-- Combined Alert Center -->
            <div class="border-b border-gray-200 dark:border-gray-800 shrink-0 p-4">
              <div
                class="rounded-xl border p-3 flex items-start gap-3 justify-between transition-all"
                :class="[
                  targetIsStatic
                    ? 'bg-red-500/5 border-red-200 dark:border-red-900/30 text-red-900 dark:text-red-400'
                    : showWarning
                    ? 'bg-amber-500/5 border-amber-200 dark:border-amber-900/30 text-amber-900 dark:text-amber-400'
                    : 'bg-blue-500/5 border-blue-200 dark:border-blue-900/30 text-blue-900 dark:text-blue-400'
                ]"
              >
                <div class="flex items-start gap-3 min-w-0 flex-1">
                  <!-- Dynamic Icon based on highest severity -->
                  <component
                    :is="targetIsStatic ? AlertTriangle : (showWarning ? AlertTriangle : Info)"
                    class="w-4 h-4 shrink-0 mt-0.5"
                    :class="[
                      targetIsStatic ? 'text-red-500' : (showWarning ? 'text-amber-500' : 'text-blue-500')
                    ]"
                  />
                  <div class="space-y-1.5 min-w-0 flex-1 text-[10.5px]">
                    <div class="font-extrabold uppercase tracking-wider text-[11px] leading-tight">
                      {{
                        targetIsStatic
                          ? $t('migration.staticWarning')
                          : showWarning
                          ? $t('migration.warning')
                          : 'Semantic SQL Preview'
                      }}
                    </div>
                    <ul class="list-disc pl-4 space-y-1 text-[10px] opacity-85 leading-normal font-medium">
                      <li v-if="targetIsStatic">
                        This connection is configured as static. Migration operations are disabled to prevent accidental modifications.
                      </li>
                      <li v-if="showWarning">
                        This migration script contains destructive operations that will permanently delete columns or tables. Please review carefully.
                      </li>
                      <li>
                        {{ $t('migration.semanticDiffNote') }}
                      </li>
                    </ul>
                  </div>
                </div>

                <!-- Control checkbox on the right if warning is present and target is not static -->
                <div v-if="showWarning && !targetIsStatic" class="shrink-0 ml-4 self-center">
                  <label class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 hover:bg-amber-200/50 dark:hover:bg-amber-900/30 transition-all cursor-pointer select-none">
                    <input
                      type="checkbox"
                      v-model="allowDestructive"
                      class="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 border-amber-300 dark:border-amber-700"
                    />
                    <span class="text-[9px] font-extrabold uppercase tracking-widest text-amber-800 dark:text-amber-300">
                      Allow Drop Command
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <DDLViewer
              :content="previewSql"
              :font-size="appStore.fontSizes.code + 1"
              :font-family="appStore.fontFamilies.code"
              :show-line-numbers="true"
              :is-dark="appStore.isDark"
              class="flex-1"
            />
          </div>

          <div
            v-else
            class="flex-1 flex flex-col items-center justify-center p-10 text-gray-400 italic text-[11px] bg-gray-100/30 dark:bg-gray-900"
          >
            <div class="mb-4 opacity-10 p-6 bg-gray-200 dark:bg-gray-700 rounded-full">
              <Terminal class="w-12 h-12" />
            </div>
            <span class="max-w-[200px] text-center">{{ $t('migration.noPreview') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue' // Added watch
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import DDLViewer from '@/components/ddl/DDLViewer.vue'
import {
  Zap,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Table,
  Layers,
  Database,
  Trash2,
  PlusCircle,
  FileEdit,
  Terminal,
  List,
  Workflow,
  Sigma,
  RefreshCw,
  Info,
  Loader2,
  Copy
} from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notification'

const { t } = useI18n()
const appStore = useAppStore()

const props = defineProps<{
  isOpen: boolean
  loading: boolean
  isMigratingItemId?: string | null
  item: any
  sourceName: string
  targetName: string
  sqlScript?: string
  fetchingSql?: boolean
  sqlMap?: Record<string, string>
  inline?: boolean
  targetIsStatic?: boolean
}>()

const selectedItemKey = ref<string | null>(null) // State for selected item

// Reset selection when modal closes
watch(
  () => props.isOpen,
  newVal => {
    if (!newVal) {
      selectedItemKey.value = null
    }
  }
)

watch(selectedItemKey, newKey => {
  if (newKey && isBatchMode.value) {
    const [type, ...nameParts] = newKey.split('-')
    emit('select', { type, name: nameParts.join('-') })
  }
})

const emit = defineEmits(['close', 'confirm', 'select'])

const typeIcons: any = {
  tables: Table,
  views: Layers,
  procedures: Workflow,
  functions: Sigma,
  triggers: Zap
}

const getIconForType = (type: string) => {
  const key = type?.toLowerCase()
  return typeIcons[key] || Database
}

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'missing_in_source':
    case 'deprecated':
      return Trash2
    case 'missing_in_target':
    case 'new':
      return PlusCircle
    default:
      return FileEdit
  }
}

const isBatchMode = computed(() => !!props.item?.isBatch)
const isBackwards = computed(() => !!props.item?.backwards)

const itemsToProcess = computed(() => {
  if (isBatchMode.value) return props.item?.items || []
  return props.item ? [props.item] : []
})

const groupedItems = computed(() => {
  const items = itemsToProcess.value
  if (!items.length) return {}
  const groups: any = {}

  items.forEach((item: any) => {
    const type = item.type || 'Unknown'
    if (!groups[type]) groups[type] = []
    groups[type].push(item)
  })

  return groups
})

const showWarning = computed(() => {
  const items = itemsToProcess.value
  // Show warning if ANY item is NOT a pure creation (i.e. is an update or delete)
  return items.some((item: any) => {
    const s = item.status?.toLowerCase()
    return s !== 'new' && s !== 'missing_in_target'
  })
})

const getStatusClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'new':
    case 'missing_in_target':
      return 'text-emerald-600 dark:text-emerald-400'
    case 'deprecated':
    case 'missing_in_source':
      return 'text-rose-600 dark:text-rose-400'
    default:
      return 'text-amber-600 dark:text-amber-400'
  }
}

const getStatusText = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'different':
    case 'updated':
    case 'modified':
      return t('common.status.modified').toUpperCase()
    case 'missing_in_target':
    case 'new':
      return t('common.status.newSource').toUpperCase()
    case 'missing_in_source':
    case 'deprecated':
      return t('common.status.deprecatedTarget').toUpperCase()
    default:
      return status ? status.toUpperCase() : 'UNKNOWN'
  }
}

// Logic for preview
const previewSql = computed(() => {
  // If we have a specific selection
  if (selectedItemKey.value) {
    // If batch, try map
    if (isBatchMode.value && props.sqlMap) {
      return props.sqlMap[selectedItemKey.value] || '-- No SQL available for this item'
    }
    // If single, and selected key matches (it should), return script
    if (!isBatchMode.value) {
      return props.sqlScript
    }
  }

  // Default fallback
  return props.sqlScript || '-- Select an item to view specific SQL'
})

const selectedItemName = computed(() => {
  if (selectedItemKey.value) {
    // Parse key "type-name"
    return selectedItemKey.value.split('-').slice(1).join('-')
  }
  return props.item?.name
})

const selectItem = (item: any) => {
  selectedItemKey.value = getItemKey(item)
}

const getItemKey = (item: any) => `${item.type}-${item.name}`

// Auto select first item logic
watch(
  () => props.item,
  newItem => {
    if (newItem) {
      if (newItem.isBatch && newItem.items?.length > 0) {
        selectedItemKey.value = getItemKey(newItem.items[0])
      } else if (!newItem.isBatch) {
        selectedItemKey.value = getItemKey(newItem)
      }
    } else {
      selectedItemKey.value = null
    }
  },
  { immediate: true }
)

const notificationStore = useNotificationStore()

const copyAllAlterScripts = async () => {
  try {
    let text = ''
    if (isBatchMode.value) {
      if (!props.sqlMap || Object.keys(props.sqlMap).length === 0) {
        if (props.sqlScript) {
          text = props.sqlScript
        } else {
          notificationStore.add({
            type: 'warning',
            title: 'Copy Failed',
            message: 'No SQL scripts generated yet.'
          })
          return
        }
      } else {
        const parts: string[] = []
        itemsToProcess.value.forEach((item: any) => {
          const key = getItemKey(item)
          const sql = props.sqlMap?.[key]
          if (sql) {
            const singleType = item.type ? item.type.replace(/s$/, '') : 'object'
            parts.push(`======== ${singleType} ${item.name} =======\n${sql.trim()}\n======== end ${singleType} ${item.name} ========`)
          }
        })
        text = parts.join('\n\n')
      }
    } else {
      const item = props.item
      const singleType = item.type ? item.type.replace(/s$/, '') : 'object'
      text = `======== ${singleType} ${item.name} =======\n${(props.sqlScript || '').trim()}\n======== end ${singleType} ${item.name} ========`
    }

    await navigator.clipboard.writeText(text)
    notificationStore.add({
      type: 'success',
      title: 'Copied All',
      message: 'All ALTER scripts have been copied to clipboard.'
    })
  } catch (e: any) {
    notificationStore.add({
      type: 'error',
      title: 'Copy Failed',
      message: e.message
    })
  }
}

const allowDestructive = ref(!appStore.safeMode)

// Synchronize allowDestructive with safeMode when it changes
watch(
  () => appStore.safeMode,
  safeMode => {
    allowDestructive.value = !safeMode
  }
)

const handleConfirm = () => {
  emit('confirm', allowDestructive.value)
}

</script>
