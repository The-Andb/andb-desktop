<template>
  <div 
    v-if="isOpen"
    class="fixed inset-0 z-[100] flex justify-end transition-opacity duration-300"
    :class="isOpen ? 'bg-black/20 backdrop-blur-sm opacity-100' : 'bg-transparent opacity-0 pointer-events-none'"
    @click.self="$emit('close')"
  >
    <div 
      class="w-full max-w-xl bg-white dark:bg-gray-900 shadow-2xl h-full flex flex-col transform transition-transform duration-500 ease-out border-l border-gray-200 dark:border-gray-800"
      :class="isOpen ? 'translate-x-0' : 'translate-x-full'"
    >
      <!-- Header -->
      <div class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
        <div class="flex items-center gap-3">
          <div class="p-2.5 bg-primary-500 rounded-xl text-white shadow-lg shadow-primary-500/20">
            <Zap class="w-5 h-5 fill-current" />
          </div>
          <div>
            <h2 class="text-base font-black text-gray-900 dark:text-white uppercase tracking-widest">{{ $t('ai.reviewTitle') || 'AI DBA Assistant' }}</h2>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gemini 1.5 Flash Online</span>
            </div>
          </div>
        </div>
        <button 
          @click="$emit('close')"
          class="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl text-gray-400 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        <!-- Thinking State -->
        <div v-if="loading" class="flex flex-col items-center justify-center h-64 space-y-4">
          <div class="relative w-16 h-16">
            <div class="absolute inset-0 border-4 border-primary-500/20 rounded-full"></div>
            <div class="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
            <Zap class="absolute inset-0 m-auto w-6 h-6 text-primary-500 animate-pulse" />
          </div>
          <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">Analyzing Schema Patterns...</p>
        </div>

        <!-- Result -->
        <div v-else-if="result" class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <!-- AI Response (Markdown) -->
           <div class="prose prose-sm dark:prose-invert max-w-none">
              <div v-html="formattedResult"></div>
           </div>

           <!-- Actions -->
           <div class="pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <button 
                @click="copyResult"
                class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 transition-all"
              >
                <Copy class="w-4 h-4" />
                Copy Report
              </button>
              <button 
                @click="reanalyze"
                class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-500 hover:bg-primary-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-lg shadow-primary-500/20"
              >
                <RefreshCw class="w-4 h-4" />
                Re-analyze
              </button>
           </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!loading" class="flex flex-col items-center justify-center h-full text-center px-12 space-y-6">
           <div class="w-24 h-24 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center border border-gray-100 dark:border-gray-800 shadow-inner">
             <Bot class="w-12 h-12 text-gray-300" />
           </div>
           <div>
             <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2">No active analysis</h3>
             <p class="text-xs text-gray-500 leading-relaxed">
               Select database objects and click "Review with AI" to start a semantic audit of your schema changes.
             </p>
           </div>
           <button 
            @click="$emit('trigger')"
            class="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-primary-500/20"
           >
             Start Analysis
           </button>
        </div>
      </div>

      <!-- Footer (Expert Chat) -->
      <div v-if="result && !loading" class="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        <label class="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Ask our DBA Expert</label>
        <div class="flex items-center gap-2">
          <input 
            v-model="question"
            @keyup.enter="askExpert"
            type="text" 
            placeholder="e.g. Why is this index redundant?"
            class="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
          />
          <button 
            @click="askExpert"
            :disabled="!question.trim()"
            class="p-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all active:scale-95 disabled:opacity-50"
          >
            <Send class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Zap, X, Copy, RefreshCw, Send, Bot } from 'lucide-vue-next'
import { marked } from 'marked'

const props = defineProps<{
  isOpen: boolean
  loading: boolean
  result: string | null
}>()

const emit = defineEmits(['close', 'trigger', 'ask'])

const question = ref('')

const formattedResult = computed(() => {
  if (!props.result) return ''
  return marked.parse(props.result)
})

const copyResult = () => {
  if (props.result) {
    navigator.clipboard.writeText(props.result)
    // Add notification logic if needed
  }
}

const reanalyze = () => {
  emit('trigger')
}

const askExpert = () => {
  if (!question.value.trim()) return
  emit('ask', question.value)
  question.value = ''
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
}

:deep(h1), :deep(h2), :deep(h3) {
  @apply font-black uppercase tracking-widest text-gray-900 dark:text-white mt-6 mb-3;
}
:deep(h1) { @apply text-base; }
:deep(h2) { @apply text-sm; }
:deep(h3) { @apply text-xs; }

:deep(p) {
  @apply text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-4;
}

:deep(ul) {
  @apply list-disc list-inside mb-4 space-y-1;
}

:deep(li) {
  @apply text-xs text-gray-600 dark:text-gray-400;
}

:deep(strong) {
  @apply text-gray-900 dark:text-white font-bold;
}

:deep(code) {
  @apply bg-gray-100 dark:bg-gray-800 text-primary-500 px-1 py-0.5 rounded text-[10px] font-mono;
}

:deep(pre) {
  @apply bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto my-4 border border-white/5;
}

:deep(pre code) {
  @apply bg-transparent text-inherit p-0;
}
</style>
