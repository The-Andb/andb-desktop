<template>
  <MainLayout>
    <div class="flex-1 w-full h-full flex flex-col bg-white dark:bg-gray-950 overflow-hidden relative">
      <!-- Header -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-gray-900/20">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600 dark:text-orange-400">
            <Flame class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Instant Compare</h2>
            <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Paste & Diff Arbitrary SQL Snippets</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button 
            v-if="step === 'compare'"
            @click="step = 'input'" 
            class="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-black uppercase transition-all"
          >
            <ArrowLeft class="w-4 h-4" />
            Back to Inputs
          </button>
          
          <button 
            v-if="step === 'input'"
            @click="runCompare" 
            :disabled="loading || (!srcDDL && !destDDL)"
            class="flex items-center gap-2 px-6 py-2.5 bg-[#159688]/20 hover:bg-[#159688]/30 dark:bg-[#159688]/10 text-[#159688] dark:text-[#33bba6] rounded-xl text-xs font-black uppercase transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
          >
            <GitCompare class="w-4 h-4" v-if="!loading" />
            <RefreshCw class="w-4 h-4 animate-spin" v-else />
            {{ loading ? 'Comparing...' : 'Analyze & Compare' }}
          </button>

          <!-- Dismiss button (only if not standalone, e.g. overlay mode) -->
          <button 
            v-if="isOverlay"
            @click="$emit('close')" 
            class="ml-2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
             <X class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Main Workspace -->
      <div class="flex-1 flex overflow-hidden relative min-w-0">
          
        <!-- INPUT STEP -->
        <div v-show="step === 'input'" class="flex-1 flex w-full p-2 gap-4 bg-white dark:bg-gray-950">
            <div class="flex-1 flex flex-col gap-2 group relative">
              <div class="flex items-center justify-between px-1">
                <label class="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-[0.2em]">Source SQL (Reference)</label>
                <button @click="srcDDL = ''" class="text-[9px] font-bold text-gray-400 hover:text-red-500 uppercase transition-colors" v-if="srcDDL">Clear</button>
              </div>
              <div class="flex-1 relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus-within:border-primary-500/30 rounded-xl shadow-sm transition-all group/editor">
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
                <div class="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                   <button @click="pasteTo('src')" class="p-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-primary-500"><ClipboardPaste class="w-4 h-4"/></button>
                </div>
              </div>
            </div>
            
            <div class="flex-1 flex flex-col gap-2 group relative">
              <div class="flex items-center justify-between px-1">
                <label class="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-[0.2em]">Target SQL (Comparison)</label>
                <button @click="destDDL = ''" class="text-[9px] font-bold text-gray-400 hover:text-red-500 uppercase transition-colors" v-if="destDDL">Clear</button>
              </div>
              <div class="flex-1 relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus-within:border-primary-500/30 rounded-xl shadow-sm transition-all group/editor">
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
                <div class="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                   <button @click="pasteTo('dest')" class="p-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-primary-500"><ClipboardPaste class="w-4 h-4"/></button>
                </div>
              </div>
            </div>
            
            <!-- Watermark -->
            <div v-if="!srcDDL && !destDDL && !loading" class="absolute inset-0 pointer-events-none flex items-center justify-center z-0">
               <div class="text-center opacity-[0.02] dark:opacity-[0.04] select-none scale-150 rotate-[-10deg]">
                  <Flame class="w-64 h-64 mx-auto" />
                  <h1 class="text-9xl font-black uppercase mt-4">INSTANT</h1>
               </div>
            </div>
        </div>

        <!-- COMPARE STEP (Results Panel) -->
        <div v-if="step === 'compare'" class="flex-1 flex flex-col overflow-hidden bg-gray-50/50 dark:bg-gray-950/50 w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
             <!-- Results Header -->
             <div v-if="result" class="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0 shadow-sm z-10 w-full">
                 <div class="flex items-center gap-4">
                     <div class="flex items-center gap-2">
                       <div class="w-2 h-2 rounded-full" :class="result.status === 'equal' ? 'bg-green-500' : 'bg-[#159688]'"></div>
                       <span class="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">{{ result.name }}</span>
                     </div>
                     <div class="h-4 w-px bg-gray-300 dark:bg-gray-700"></div>
                     <span class="px-2.5 py-0.5 rounded-full bg-primary-500/10 text-primary-500 text-[10px] font-black uppercase tracking-widest border border-primary-500/20">{{ result.type || 'Custom Snippet' }}</span>
                 </div>
                 <div class="flex items-center gap-4">
                   <span v-if="result.status === 'equal'" class="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1">
                     <CheckCircle class="w-3.5 h-3.5" /> Synchronized
                   </span>
                 </div>
             </div>
             
              <div class="flex-1 overflow-hidden flex flex-col relative w-full">
                  <!-- Diff View -->
                  <div v-if="result && result.status !== 'equal'" class="flex-1 overflow-hidden bg-white dark:bg-gray-900 flex flex-col">
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
                  <div v-else-if="result && result.status === 'equal'" class="h-full flex flex-col items-center justify-center space-y-4 py-12">
                      <div class="p-6 bg-green-500/10 rounded-full">
                        <CheckCircle class="w-16 h-16 text-green-500" />
                      </div>
                      <div class="text-center">
                        <h3 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Perfect Match</h3>
                        <p class="text-sm text-gray-500 uppercase tracking-widest font-bold mt-1">Both SQL definitions are semantically identical.</p>
                      </div>
                  </div>
              </div>
        </div>

      </div>
    </div>
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
  ArrowLeft
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

onMounted(() => {
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
        const data = await (window as any).electronAPI.invoke('andb-compare-arbitrary', {
            srcDDL: srcDDL.value,
            destDDL: destDDL.value
        })
        result.value = data
        step.value = 'compare'
        
        if (data.status === 'equal') {
            notification.add({ type: 'success', title: 'Perfect Match', message: 'The SQL definitions are identical.' })
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
        notification.add({ type: 'error', title: 'Paste Failed', message: 'Could not access clipboard' })
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
.syntax-highlighter { color: var(--code-text); }
.syntax-highlighter .token.keyword { color: var(--code-keyword); font-weight: bold; }
.syntax-highlighter .token.string { color: var(--code-string); }
.syntax-highlighter .token.comment { color: var(--code-comment); font-style: italic; }
.syntax-highlighter .token.function { color: var(--code-function); }
.syntax-highlighter .token.number { color: var(--code-number); }
.syntax-highlighter .token.operator { color: var(--code-operator); }
.syntax-highlighter .token.punctuation { color: var(--code-punctuation); }
</style>
