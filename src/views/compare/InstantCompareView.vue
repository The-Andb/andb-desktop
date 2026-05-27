<template>
  <MainLayout>
    <template #breadcrumbs>
      <div class="flex items-center gap-3">
        <div
          class="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600 dark:text-orange-400"
        >
          <Flame class="w-5 h-5" />
        </div>
        <div>
          <h2
            class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none"
          >
            Instant Compare
          </h2>
          <p class="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
            Paste & Diff Arbitrary SQL Snippets
          </p>
        </div>
      </div>
    </template>

    <template #toolbar>
      <div class="flex items-center gap-3">
        <!-- History Toggle -->
        <button
          @click="isHistorySidebarOpen = !isHistorySidebarOpen"
          class="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700 relative"
          title="Comparison History"
        >
          <History class="w-4 h-4" />
          <span v-if="historyList.length > 0" class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
            {{ historyList.length }}
          </span>
        </button>

        <!-- Save to History -->
        <button
          v-if="srcDDL || destDDL"
          @click="openSaveModal"
          class="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 rounded-xl text-[10px] font-black uppercase transition-all"
          title="Save current comparison session to history"
        >
          <Save class="w-3.5 h-3.5" />
          Save History
        </button>

        <button
          v-if="step === 'compare'"
          @click="step = 'input'"
          class="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-[10px] font-black uppercase transition-all"
        >
          <ArrowLeft class="w-3.5 h-3.5" />
          Back to Inputs
        </button>

        <button
          v-if="step === 'input'"
          @click="runCompare"
          :disabled="loading || (!srcDDL && !destDDL)"
          class="flex items-center gap-2 px-4 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95 disabled:opacity-50 disabled:grayscale group/zbtn"
        >
          <GitCompare
            class="w-3.5 h-3.5 transition-transform duration-300 group-hover/zbtn:scale-125"
            v-if="!loading"
          />
          <RefreshCw class="w-3.5 h-3.5 animate-spin" v-else />
          {{ loading ? 'Comparing...' : 'Analyze & Compare' }}
        </button>

        <!-- Dismiss button (only if not standalone, e.g. overlay mode) -->
        <button
          v-if="isOverlay"
          @click="$emit('close')"
          class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
    </template>

    <div
      class="flex-1 w-full h-full flex flex-col bg-white dark:bg-gray-950 overflow-hidden relative"
    >
      <!-- Main Workspace -->
      <div class="flex-1 flex overflow-hidden relative min-w-0">
        <!-- HISTORY SIDEBAR (Slide-out) -->
        <transition
          enter-active-class="transition-all duration-300 ease-in-out"
          leave-active-class="transition-all duration-200 ease-in-out"
          enter-from-class="-translate-x-full opacity-0"
          leave-to-class="-translate-x-full opacity-0"
        >
          <div
            v-if="isHistorySidebarOpen"
            class="absolute inset-y-0 left-0 w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30 flex flex-col shadow-2xl"
          >
            <div class="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/40">
              <h3 class="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white flex items-center gap-2">
                <History class="w-3.5 h-3.5 text-primary-500" />
                Compare History
              </h3>
              <button
                @click="isHistorySidebarOpen = false"
                class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-all"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <!-- Search inside History -->
            <div class="p-3 border-b border-gray-200 dark:border-gray-800">
              <div class="relative">
                <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  v-model="historySearchQuery"
                  type="text"
                  placeholder="Search history..."
                  class="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 focus:border-primary-500 focus:bg-white dark:focus:bg-gray-900 rounded-lg text-xs font-medium placeholder:text-gray-400 transition-all outline-none"
                />
              </div>
            </div>

            <!-- History List -->
            <div class="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 bg-gray-50/50 dark:bg-gray-950/20">
              <div v-if="filteredHistoryList.length === 0" class="p-8 text-center text-gray-400">
                <Clock class="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p class="text-[10px] font-black uppercase tracking-widest">No History Found</p>
              </div>

              <div
                v-for="item in filteredHistoryList"
                :key="item.id"
                @click="selectHistoryItem(item)"
                class="flex items-center justify-between p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl cursor-pointer hover:border-primary-500/50 hover:shadow-sm transition-all group relative border-l-4"
                :style="{ borderLeftColor: selectedHistoryId === item.id ? '#3b82f6' : 'transparent' }"
              >
                <div class="flex flex-col min-w-0 flex-1 pr-2">
                  <span class="font-bold text-xs text-gray-900 dark:text-white truncate">
                    {{ item.name }}
                  </span>
                  
                  <div class="flex items-center gap-2 mt-1.5">
                    <span
                      class="text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider"
                      :class="
                        item.status === 'equal'
                          ? 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30'
                          : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
                      "
                    >
                      {{ item.status || 'modified' }}
                    </span>
                    <span class="text-[9px] font-bold text-gray-400">
                      {{ formatDate(item.createdAt) }}
                    </span>
                  </div>
                </div>

                <!-- Delete Button -->
                <button
                  @click.stop="deleteHistoryItem(item.id, item.name)"
                  class="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all animate-in fade-in"
                  title="Delete from history"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </transition>

        <!-- Dark backdrop when history is open -->
        <div
          v-if="isHistorySidebarOpen"
          @click="isHistorySidebarOpen = false"
          class="absolute inset-0 bg-black/10 dark:bg-black/35 z-20 transition-opacity backdrop-blur-sm"
        ></div>

        <!-- INPUT STEP -->
        <div
          v-show="step === 'input'"
          class="flex-1 flex w-full p-2 gap-4 bg-white dark:bg-gray-950"
        >
          <div class="flex-1 flex flex-col gap-2 group relative">
            <div class="flex items-center justify-between px-1">
              <label
                class="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-[0.2em]"
                >Source SQL (Reference)</label
              >
              <button
                @click="srcDDL = ''"
                class="text-[9px] font-bold text-gray-400 hover:text-red-500 uppercase transition-colors"
                v-if="srcDDL"
              >
                Clear
              </button>
            </div>
            <div
              class="flex-1 relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus-within:border-primary-500/30 rounded-xl shadow-sm transition-all group/editor"
            >
              <!-- Syntax Highlight Backdrop -->
              <pre
                ref="srcPre"
                class="syntax-highlighter absolute inset-0 p-4 m-0 font-mono text-xs whitespace-pre-wrap break-words overflow-hidden text-gray-800 dark:text-gray-200 pointer-events-none z-0"
                aria-hidden="true"
                :style="{ paddingRight: '14px' }"
              ><code class="language-sql" v-html="highlightedSrc"></code></pre>

              <textarea
                v-model="srcDDL"
                ref="srcTextarea"
                spellcheck="false"
                placeholder="-- Paste source SQL (CREATE TABLE, PROCEDURE, etc.)"
                @scroll="syncScrollSrc"
                class="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-gray-900 dark:caret-white font-mono text-xs whitespace-pre-wrap break-words resize-none outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 custom-scrollbar z-10"
              ></textarea>
              <div
                class="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20"
              >
                <button
                  @click="pasteTo('src')"
                  class="p-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-primary-500"
                >
                  <ClipboardPaste class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div class="flex-1 flex flex-col gap-2 group relative">
            <div class="flex items-center justify-between px-1">
              <label
                class="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-[0.2em]"
                >Target SQL (Comparison)</label
              >
              <button
                @click="destDDL = ''"
                class="text-[9px] font-bold text-gray-400 hover:text-red-500 uppercase transition-colors"
                v-if="destDDL"
              >
                Clear
              </button>
            </div>
            <div
              class="flex-1 relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus-within:border-primary-500/30 rounded-xl shadow-sm transition-all group/editor"
            >
              <!-- Syntax Highlight Backdrop -->
              <pre
                ref="destPre"
                class="syntax-highlighter absolute inset-0 p-4 m-0 font-mono text-xs whitespace-pre-wrap break-words overflow-hidden text-gray-800 dark:text-gray-200 pointer-events-none z-0"
                aria-hidden="true"
                :style="{ paddingRight: '14px' }"
              ><code class="language-sql" v-html="highlightedDest"></code></pre>

              <textarea
                v-model="destDDL"
                ref="destTextarea"
                spellcheck="false"
                placeholder="-- Paste target SQL or modifications"
                @scroll="syncScrollDest"
                class="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-gray-900 dark:caret-white font-mono text-xs whitespace-pre-wrap break-words resize-none outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600 custom-scrollbar z-10"
              ></textarea>
              <div
                class="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20"
              >
                <button
                  @click="pasteTo('dest')"
                  class="p-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-primary-500"
                >
                  <ClipboardPaste class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- Watermark -->
          <div
            v-if="!srcDDL && !destDDL && !loading"
            class="absolute inset-0 pointer-events-none flex items-center justify-center z-0"
          >
            <div
              class="text-center opacity-[0.02] dark:opacity-[0.04] select-none scale-150 rotate-[-10deg]"
            >
              <Flame class="w-64 h-64 mx-auto" />
              <h1 class="text-9xl font-black uppercase mt-4">INSTANT</h1>
            </div>
          </div>
        </div>

        <!-- COMPARE STEP (Results Panel) -->
        <div
          v-if="step === 'compare'"
          class="flex-1 flex flex-col overflow-hidden bg-gray-50/50 dark:bg-gray-950/50 w-full animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <!-- Results Header -->
          <div
            v-if="result"
            class="flex items-center justify-between px-4 h-12 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0 shadow-sm z-10 w-full"
          >
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <div
                  class="w-2 h-2 rounded-full"
                  :class="result.status === 'equal' ? 'bg-green-500' : 'bg-[#159688]'"
                ></div>
                <span
                  class="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300"
                  >{{ result.name }}</span
                >
              </div>
              <div class="h-4 w-px bg-gray-300 dark:bg-gray-700"></div>
              <span
                class="px-2.5 py-0.5 rounded-full bg-primary-500/10 text-primary-500 text-[10px] font-black uppercase tracking-widest border border-primary-500/20"
                >{{ result.type || 'Custom Snippet' }}</span
              >
            </div>
            <div class="flex items-center gap-4">
              <span
                v-if="result.status === 'equal'"
                class="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1"
              >
                <CheckCircle class="w-3.5 h-3.5" /> Synchronized
              </span>
            </div>
          </div>

          <div class="flex-1 overflow-hidden flex flex-col relative w-full">
            <!-- Diff View -->
            <div
              v-if="result && result.status !== 'equal'"
              class="flex-1 overflow-hidden bg-white dark:bg-gray-900 flex flex-col"
            >
              <MirrorDiffView
                :source-ddl="result.diff?.source || srcDDL"
                :target-ddl="result.diff?.target || destDDL"
                source-label="Source Snippet"
                target-label="Target Snippet"
                :status="result.status"
                class="flex-1 h-full w-full"
              />
            </div>

            <!-- No Changes State -->
            <div
              v-else-if="result && result.status === 'equal'"
              class="h-full flex flex-col items-center justify-center space-y-4 py-12"
            >
              <div class="p-6 bg-green-500/10 rounded-full">
                <CheckCircle class="w-16 h-16 text-green-500" />
              </div>
              <div class="text-center">
                <h3
                  class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter"
                >
                  Perfect Match
                </h3>
                <p class="text-sm text-gray-500 uppercase tracking-widest font-bold mt-1">
                  Both SQL definitions are semantically identical.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SAVE COMPARISON MODAL -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      leave-active-class="transition duration-150 ease-in"
      enter-from-class="opacity-0 scale-95"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isSaveModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      >
        <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
          <h3 class="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white mb-2">
            Save Comparison History
          </h3>
          <p class="text-[10px] text-gray-400 uppercase tracking-tighter leading-relaxed mb-4">
            Enter a name to save this comparison session. You can reload this SQL snippet set anytime from the history list.
          </p>

          <input
            v-model="saveComparisonName"
            type="text"
            class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 focus:border-primary-500 rounded-xl text-xs font-bold transition-all outline-none mb-6"
            placeholder="e.g. User Table Modification Snippet"
            @keyup.enter="saveComparison"
          />

          <div class="flex items-center justify-end gap-3">
            <button
              @click="isSaveModalOpen = false"
              class="px-4 py-2 text-[10px] font-black uppercase bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              @click="saveComparison"
              :disabled="!saveComparisonName.trim()"
              class="px-4 py-2 text-[10px] font-black uppercase bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              Save Record
            </button>
          </div>
        </div>
      </div>
    </transition>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  Flame,
  GitCompare,
  RefreshCw,
  X,
  CheckCircle,
  ClipboardPaste,
  ArrowLeft,
  History,
  Save,
  Trash2,
  Search,
  Clock
} from 'lucide-vue-next'
import { useNotificationStore } from '@/stores/notification'
import { useAppStore } from '@/stores/app'
import MirrorDiffView from '@/components/compare/MirrorDiffView.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import 'splitpanes/dist/splitpanes.css'
import Prism from 'prismjs'
import 'prismjs/components/prism-sql'

const props = defineProps<{
  initialSource?: string | null
  initialTarget?: string | null
}>()

const srcDDL = ref(props.initialSource || '')
const destDDL = ref(props.initialTarget || '')
const loading = ref(false)
const result = ref<any>(null)
const step = ref<'input' | 'compare'>('input')

const srcTextarea = ref<HTMLTextAreaElement | null>(null)
const destTextarea = ref<HTMLTextAreaElement | null>(null)
const srcPre = ref<HTMLPreElement | null>(null)
const destPre = ref<HTMLPreElement | null>(null)

const notification = useNotificationStore()
const appStore = useAppStore()

// State for History
const isHistorySidebarOpen = ref(false)
const historyList = ref<any[]>([])
const historySearchQuery = ref('')
const selectedHistoryId = ref<string | null>(null)

// State for Save Modal
const isSaveModalOpen = ref(false)
const saveComparisonName = ref('')

// Load history list from SQLite
const loadHistory = async () => {
  try {
    const res = await (window as any).electronAPI.invoke('andb-get-instant-compare-history')
    if (res.success && res.data) {
      historyList.value = res.data
    }
  } catch (e: any) {
    console.error('Failed to load comparison history:', e)
  }
}

// Fetch detail and load into comparison
const selectHistoryItem = async (item: any) => {
  try {
    loading.value = true
    const res = await (window as any).electronAPI.invoke('andb-load-instant-compare-detail', { id: item.id })
    if (res.success && res.data) {
      srcDDL.value = res.data.srcDDL || ''
      destDDL.value = res.data.destDDL || ''
      selectedHistoryId.value = item.id
      
      // Auto run comparison
      await runCompare()
      isHistorySidebarOpen.value = false // close sidebar on selection for clean workspace
    } else {
      throw new Error(res.error || 'Failed to load details')
    }
  } catch (e: any) {
    notification.add({
      type: 'error',
      title: 'Load Failed',
      message: e.message
    })
  } finally {
    loading.value = false
  }
}

// Delete history item
const deleteHistoryItem = async (id: string, name: string) => {
  if (!confirm(`Are you sure you want to delete "${name}" from history?`)) return
  try {
    const res = await (window as any).electronAPI.invoke('andb-delete-instant-compare', { id })
    if (res.success) {
      if (selectedHistoryId.value === id) {
        selectedHistoryId.value = null
      }
      await loadHistory()
      notification.add({
        type: 'success',
        title: 'Deleted history',
        message: 'Successfully removed item.'
      })
    } else {
      throw new Error(res.error)
    }
  } catch (e: any) {
    notification.add({
      type: 'error',
      title: 'Delete Failed',
      message: e.message
    })
  }
}

// Open save modal
const openSaveModal = () => {
  const dateStr = new Date().toLocaleString()
  saveComparisonName.value = saveComparisonName.value || `Comparison ${dateStr}`
  isSaveModalOpen.value = true
}

// Save current comparison
const saveComparison = async () => {
  if (!saveComparisonName.value.trim()) return
  try {
    loading.value = true
    const currentStatus = result.value ? result.value.status : 'unknown'
    const res = await (window as any).electronAPI.invoke('andb-save-instant-compare', {
      id: selectedHistoryId.value || undefined,
      name: saveComparisonName.value.trim(),
      srcDDL: srcDDL.value,
      destDDL: destDDL.value,
      status: currentStatus,
      type: 'SQL'
    })
    
    if (res.success && res.data) {
      selectedHistoryId.value = res.data.id
      isSaveModalOpen.value = false
      await loadHistory()
      notification.add({
        type: 'success',
        title: 'History Saved',
        message: `Successfully saved "${saveComparisonName.value.trim()}"`
      })
    } else {
      throw new Error(res.error || 'Failed to save history')
    }
  } catch (e: any) {
    notification.add({
      type: 'error',
      title: 'Save Failed',
      message: e.message
    })
  } finally {
    loading.value = false
  }
}

// Filter history list
const filteredHistoryList = computed(() => {
  const query = historySearchQuery.value.trim().toLowerCase()
  if (!query) return historyList.value
  return historyList.value.filter(h => 
    h.name.toLowerCase().includes(query) || 
    (h.status && h.status.toLowerCase().includes(query))
  )
})

// Format dates nicely
const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr)
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateStr
  }
}


const highlightedSrc = computed(() => {
  if (!srcDDL.value) return ''
  // Append a space to ensure the final newline renders correctly if present
  const val = srcDDL.value.endsWith('\n') ? srcDDL.value + ' ' : srcDDL.value
  return Prism.highlight(val, Prism.languages.sql, 'sql')
})

const highlightedDest = computed(() => {
  if (!destDDL.value) return ''
  const val = destDDL.value.endsWith('\n') ? destDDL.value + ' ' : destDDL.value
  return Prism.highlight(val, Prism.languages.sql, 'sql')
})

const syncScrollSrc = () => {
  if (srcPre.value && srcTextarea.value) {
    srcPre.value.scrollTop = srcTextarea.value.scrollTop
    srcPre.value.scrollLeft = srcTextarea.value.scrollLeft
  }
}

const syncScrollDest = () => {
  if (destPre.value && destTextarea.value) {
    destPre.value.scrollTop = destTextarea.value.scrollTop
    destPre.value.scrollLeft = destTextarea.value.scrollLeft
  }
}

const isOverlay = computed(() => !!props.initialSource || !!props.initialTarget)

onMounted(async () => {
  await loadHistory()

  // If opened via Compare Stack route but as a page, we should populate from stack
  if (!isOverlay.value && appStore.compareStack.source?.ddl && appStore.compareStack.target?.ddl) {
    srcDDL.value = appStore.compareStack.source.ddl
    destDDL.value = appStore.compareStack.target.ddl

    // Auto run compare since we populated from stack
    runCompare()
  }
})

const runCompare = async () => {
  if (!srcDDL.value && !destDDL.value) return
  loading.value = true
  try {
    const res = await (window as any).electronAPI.invoke('andb-compare-arbitrary', {
      srcDDL: srcDDL.value,
      destDDL: destDDL.value
    })
    if (res.success && res.data) {
      result.value = res.data
      step.value = 'compare'

      if (res.data.status === 'equal') {
        notification.add({
          type: 'success',
          title: 'Perfect Match',
          message: 'The SQL definitions are identical.'
        })
      }
    } else {
      throw new Error(res.error || 'Compare failed')
    }
  } catch (e: any) {
    notification.add({ type: 'error', title: 'Compare Failed', message: e.message })
  } finally {
    loading.value = false
  }
}

const pasteTo = async (target: 'src' | 'dest') => {
  try {
    const text = await navigator.clipboard.readText()
    if (target === 'src') srcDDL.value = text
    else destDDL.value = text
  } catch (e) {
    notification.add({
      type: 'error',
      title: 'Paste Failed',
      message: 'Could not access clipboard'
    })
  }
}

// Migration logic removed as focus shifted to tracking/diffing

defineEmits(['close'])
</script>

<style scoped>
.animate-in {
  animation-duration: 0.3s;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(var(--primary-500), 0.1);
  border-radius: 10px;
}
textarea:focus::-webkit-scrollbar-thumb {
  background: rgba(var(--primary-500), 0.3);
}
</style>

<style>
/* Syntax Highlighting Styles using Theme Variables */
.syntax-highlighter {
  color: var(--code-text);
}
.syntax-highlighter .token.keyword {
  color: var(--code-keyword);
  font-weight: bold;
}
.syntax-highlighter .token.string {
  color: var(--code-string);
}
.syntax-highlighter .token.comment {
  color: var(--code-comment);
  font-style: italic;
}
.syntax-highlighter .token.function {
  color: var(--code-function);
}
.syntax-highlighter .token.number {
  color: var(--code-number);
}
.syntax-highlighter .token.operator {
  color: var(--code-operator);
}
.syntax-highlighter .token.punctuation {
  color: var(--code-punctuation);
}
</style>
