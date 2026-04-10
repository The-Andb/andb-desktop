<script setup lang="ts">
import { ref, watch } from 'vue'
import { Sparkles, X, Send, Loader2, Bot, User } from 'lucide-vue-next'
import MarkdownIt from 'markdown-it'
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

const props = defineProps<{
  isOpen: boolean
  context: {
    sourceDdl: string
    targetDdl: string
    tableName: string
  }
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const messages = ref<{ role: 'ai' | 'user'; content: string }[]>([])
const question = ref('')
const isLoading = ref(false)

// Trigger initial review when opened if empty
watch(() => props.isOpen, async (newVal) => {
  if (newVal && messages.value.length === 0) {
    await triggerReview()
  }
})

const triggerReview = async () => {
  isLoading.value = true
  try {
    const result = await (window as any).electron.ipcRenderer.invoke('execute-core', 'ai-review', {
      context: props.context
    })
    messages.value.push({ role: 'ai', content: result.content })
  } catch (e: any) {
    messages.value.push({ role: 'ai', content: `Error: ${e.message}` })
  } finally {
    isLoading.value = false
  }
}

const askQuestion = async () => {
  if (!question.value.trim() || isLoading.value) return

  const userQuestion = question.value
  messages.value.push({ role: 'user', content: userQuestion })
  question.value = ''
  isLoading.value = true

  try {
    const result = await (window as any).electron.ipcRenderer.invoke('execute-core', 'ai-ask', {
      question: userQuestion,
      context: props.context
    })
    messages.value.push({ role: 'ai', content: result.content })
  } catch (e: any) {
    messages.value.push({ role: 'ai', content: `Error: ${e.message}` })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Transition
    enter-active-class="transform transition ease-in-out duration-300"
    enter-from-class="translate-x-full"
    enter-to-class="translate-x-0"
    leave-active-class="transform transition ease-in-out duration-300"
    leave-from-class="translate-x-0"
    leave-to-class="translate-x-full"
  >
    <div v-if="isOpen" class="fixed inset-y-0 right-0 w-[450px] bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-800 z-[999] flex flex-col">
      <!-- Header -->
      <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md">
        <div class="flex items-center gap-2">
          <div class="p-1.5 bg-primary-500 rounded-lg shadow-lg shadow-primary-500/20">
            <Sparkles class="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 class="text-xs font-bold text-gray-900 dark:text-white leading-tight">AI DBA Assistant</h3>
            <p class="text-[9px] text-gray-500 font-medium uppercase tracking-wider">Object: {{ context.tableName }}</p>
          </div>
        </div>
        <button 
          @click="emit('close')"
          class="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors group"
        >
          <X class="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200" />
        </button>
      </div>

      <!-- Chat Messages -->
      <div class="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        <div 
          v-for="(msg, idx) in messages" 
          :key="idx"
          :class="[
            'flex gap-3',
            msg.role === 'user' ? 'flex-row-reverse' : ''
          ]"
        >
          <div :class="[
            'w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm',
            msg.role === 'ai' 
              ? 'bg-primary-500/10 text-primary-500 border-primary-500/20' 
              : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'
          ]">
            <Bot v-if="msg.role === 'ai'" class="w-4 h-4" />
            <User v-else class="w-4 h-4" />
          </div>
          <div :class="[
            'max-w-[85%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed relative',
            msg.role === 'ai' 
              ? 'bg-gray-50/80 dark:bg-gray-800/30 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800' 
              : 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
          ]">
            <div v-html="md.render(msg.content)" class="prose prose-xs dark:prose-invert max-w-none"></div>
            
            <!-- Tail -->
            <div :class="[
              'absolute top-4 w-2 h-2 rotate-45 border-t border-l',
              msg.role === 'ai' 
                ? '-left-1 bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-800' 
                : '-right-1 bg-primary-500 border-primary-500'
            ]"></div>
          </div>
        </div>
        
        <div v-if="isLoading" class="flex gap-3">
          <div class="w-8 h-8 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center border border-primary-500/20">
            <Bot class="w-4 h-4" />
          </div>
          <div class="bg-gray-50/80 dark:bg-gray-800/30 px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <Loader2 class="w-3.5 h-3.5 animate-spin text-primary-500" />
            <span class="text-[11px] text-gray-500 font-medium">Analyzing schema patterns...</span>
          </div>
        </div>
      </div>

      <!-- Footer / Input -->
      <div class="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div class="relative group">
          <input 
            v-model="question"
            @keyup.enter="askQuestion"
            type="text"
            placeholder="Ask AI about these changes..."
            class="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-3.5 pl-5 pr-14 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all shadow-inner"
          />
          <button 
            @click="askQuestion"
            :disabled="!question.trim() || isLoading"
            class="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg shadow-primary-500/20"
          >
            <Send class="w-4 h-4" />
          </button>
        </div>
        <div class="mt-3 flex items-center justify-center gap-1.5 opacity-60">
          <span class="text-[10px] text-gray-400">Powered by Gemini 1.5 Flash</span>
          <div class="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></div>
          <span class="text-[10px] text-gray-400">Database Safety Guard</span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.prose-xs {
  font-size: 0.8rem;
  line-height: 1.6;
}
.prose-xs :deep(p) {
  margin: 0.75rem 0;
}
.prose-xs :deep(p:first-child) {
  margin-top: 0;
}
.prose-xs :deep(p:last-child) {
  margin-bottom: 0;
}
.prose-xs :deep(ul), .prose-xs :deep(ol) {
  margin: 0.75rem 0;
  padding-left: 1.5rem;
}
.prose-xs :deep(li) {
  margin: 0.4rem 0;
}
.prose-xs :deep(code) {
  background: rgba(0,0,0,0.06);
  padding: 0.15rem 0.4rem;
  border-radius: 0.4rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.9em;
}
.dark .prose-xs :deep(code) {
  background: rgba(255,255,255,0.12);
  color: #a5f3fc;
}
.prose-xs :deep(strong) {
  color: #111827;
  font-weight: 700;
}
.dark .prose-xs :deep(strong) {
  color: #f9fafb;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.1);
  border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.1);
}
</style>
