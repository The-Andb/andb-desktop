<template>
  <div class="flex-1 flex flex-col overflow-hidden h-full">
    <!-- Header -->
    <div
      class="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-800 shrink-0"
    >
      <div class="flex items-center overflow-hidden">
        <div
          class="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mr-3"
        >
          <component :is="getIconForType(ddlType)" class="w-5 h-5" />
        </div>
        <div class="min-w-0">
          <h2 class="font-bold text-gray-900 dark:text-white truncate text-lg">{{ objectName }}</h2>
          <div class="flex items-center space-x-2 mt-0.5">
            <span
              class="text-[10px] uppercase font-bold text-gray-400 tracking-wider transition-colors duration-200"
              >{{ ddlType }}</span
            >
            <span
              v-if="environment"
              class="text-[10px] uppercase font-bold text-primary-500 tracking-wider"
              >• {{ environment }}</span
            >
            <span
              v-if="isDump"
              class="text-[10px] uppercase font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded tracking-widest animate-pulse border border-orange-500/20 ml-2"
              >Static File</span
            >
            <div
              v-else-if="updatedAt"
              class="flex items-center text-[10px] text-gray-400 ml-2 pl-2 border-l border-gray-200 dark:border-gray-700"
            >
              <span class="mr-1 opacity-70">{{ $t('schema.lastSynced') }}:</span>
              <span class="font-mono text-gray-500 dark:text-gray-300">{{
                formatTimeAgo(updatedAt)
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <button
          v-if="!isDump"
          @click="$emit('snapshot')"
          :disabled="loading"
          class="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
          :title="$t('schema.takeSnapshot')"
        >
          <Camera class="w-4 h-4" />
        </button>
        <button
          v-if="!isDump"
          @click="$emit('history')"
          class="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
          :title="$t('schema.viewHistory')"
        >
          <History class="w-4 h-4" />
        </button>
        <button
          v-if="!isDump"
          @click="$emit('refresh')"
          :disabled="loading"
          class="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
          :title="$t('schema.refresh')"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
        <button
          @click="handleGlobalFocusSearch"
          class="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
          title="Search in code (Cmd+F)"
        >
          <Search class="w-4 h-4" />
        </button>
        <button
          @click="copyDDL"
          class="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
          :title="$t('common.copyScript')"
        >
          <Copy class="w-4 h-4" />
        </button>
        <button
          @click="downloadDDL"
          class="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all"
          :title="$t('common.download')"
        >
          <Download class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Search Bar -->
    <div
      v-if="showSearch"
      class="absolute top-16 right-6 z-50 flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-xl shadow-black/10 border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-2"
    >
      <div class="px-3 text-gray-400 dark:text-gray-500">
        <Search class="w-4 h-4" />
      </div>
      <input
        ref="searchInputRef"
        v-model="searchTerm"
        type="text"
        placeholder="Find in DDL..."
        class="w-48 bg-transparent border-none text-xs font-mono text-gray-900 dark:text-white focus:ring-0 px-0 py-2 outline-none"
        @keyup.esc="closeSearch"
      />
      <button
        @click="searchTerm = ''"
        v-if="searchTerm"
        class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <X class="w-3.5 h-3.5" />
      </button>
      <div class="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>
      <button
        @click="closeSearch"
        class="p-2 text-gray-400 hover:text-red-500 transition-colors"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Code Viewer -->
    <DDLViewer
      :content="code"
      :search-term="searchTerm"
      :font-size="fontSize"
      :font-family="fontFamily"
      :show-copy-button="false"
    />
  </div>
</template>

<script setup lang="ts">
import DDLViewer from './DDLViewer.vue'
import {
  RefreshCw,
  Copy,
  Download,
  Camera,
  History,
  Database,
  Table,
  Layers,
  Workflow,
  Sigma,
  Zap,
  Search,
  X
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useNotificationStore } from '@/stores/notification'
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps<{
  code: string
  objectName: string
  ddlType: string
  environment?: string
  updatedAt?: string
  loading?: boolean
  isDump?: boolean
  fontSize?: number
  fontFamily?: string
}>()

const emit = defineEmits(['refresh', 'snapshot', 'history'])
const { t } = useI18n()
const notificationStore = useNotificationStore()

const showSearch = ref(false)
const searchTerm = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)

const handleKeyDown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault()
    e.stopPropagation()
    openSearch()
  }
}

const handleGlobalFocusSearch = () => {
  openSearch()
}

const openSearch = () => {
  showSearch.value = true
  nextTick(() => {
    searchInputRef.value?.focus()
    searchInputRef.value?.select()
  })
}

const closeSearch = () => {
  showSearch.value = false
  searchTerm.value = ''
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  window.addEventListener('andb-focus-local-search', handleGlobalFocusSearch)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('andb-focus-local-search', handleGlobalFocusSearch)
})

const typeIcons: Record<string, any> = {
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

const formatTimeAgo = (dateString: string) => {
  if (!dateString) return 'Never'
  try {
    let utcString = dateString
    if (!dateString.endsWith('Z')) {
      utcString = dateString.replace(' ', 'T') + 'Z'
    }

    const date = new Date(utcString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)

    if (diffSec < 0) return 'Just now'

    if (diffSec < 60) return 'Just now'
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
    return date.toLocaleDateString()
  } catch (e) {
    return 'Unknown'
  }
}

const copyDDL = () => {
  if (!props.code) return
  navigator.clipboard.writeText(props.code)
  notificationStore.add({
    type: 'success',
    title: t('schema.copied'),
    message: t('schema.copiedDesc')
  })
}

const downloadDDL = () => {
  if (!props.code) return
  const blob = new Blob([props.code], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.objectName}.sql`
  a.click()
  URL.revokeObjectURL(url)
}
</script>
