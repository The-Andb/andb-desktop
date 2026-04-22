<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { 
  Bot, Send, Loader2, Sparkles, AlertTriangle, User, AlertCircle, 
  Shield, Zap, X, Menu, Plus, Trash2, Clock, MessageSquare, RefreshCw, Settings
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import MarkdownIt from 'markdown-it'
import { useAppStore } from '@/stores/app'
import { useSettingsStore } from '@/stores/settings'
import { useAiChatStore } from '@/stores/aiChat'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

const appStore = useAppStore()
const settingsStore = useSettingsStore()
const chatStore = useAiChatStore()
const router = useRouter()

const goToSettings = () => {
  router.push('/settings?tab=ai')
}

const props = defineProps<{
  locale?: string
  context?: {
    source?: { name: string; ddl: string }
    target?: { name: string; ddl: string }
    objectName: string
    objectType: string
  } | null
}>()

const question = ref('')
const isLoading = ref(false)
const showHistory = ref(false)

onMounted(() => {
  chatStore.init()
  window.addEventListener('mouseup', handleGlobalSelection)
  window.addEventListener('andb-ai-inject-selection', handleInjectSelectionEvent)
  adjustHeight()
})

onUnmounted(() => {
  window.removeEventListener('mouseup', handleGlobalSelection)
  window.removeEventListener('andb-ai-inject-selection', handleInjectSelectionEvent)
})

const messages = computed(() => chatStore.currentMessages)
const conversations = computed(() => chatStore.sortedConversations)

const getFriendlyError = (err: string) => {
  if (err.includes('429')) return 'Oops! It looks like you\'ve reached your Gemini quota limit. You might need to wait a few minutes or check your billing settings in the Google AI Console. ☕️'
  if (err.includes('503') || err.includes('504')) return 'The AI service is currently overloaded or taking a break. Please try again in a few seconds! 🧘‍♂️'
  if (err.includes('API_KEY') || err.includes('401') || err.includes('403')) return 'There\'s a problem with your API Key. Please verify it in Settings > AI Assistant. 🔑'
  if (err.includes('ETIMEDOUT') || err.includes('network')) return 'Connection timed out. Please check your internet and try again. 🌐'
  return 'The AI assistant hit a small snag. Let\'s try sending that again? 🛠️'
}

// Initial review logic
const triggerReview = async (force = false) => {
  if (!force && messages.value.length > 0) return
  if (!props.context || (!props.context.source?.ddl && !props.context.target?.ddl)) return
  
  if (force) {
    chatStore.newConversation()
  }
  
  isLoading.value = true
  try {
    const result = await (window as any).electronAPI.invoke('andb-ai-review', {
      context: props.context,
      locale: settingsStore.settings.aiLanguage || props.locale
    })
    if (result.success && result.data && result.data.content) {
      chatStore.addMessage('ai', result.data.content)
    } else {
      throw new Error(result.error || 'No response')
    }
  } catch (e: any) {
    chatStore.addMessage('error', getFriendlyError(e.message))
  } finally {
    isLoading.value = false
  }
}

// Trigger review if context changes
watch(() => props.context?.objectName, (newVal) => {
  // Only auto-trigger if we have a valid object and DDL to analyze and no current chat history
  if (newVal && newVal !== 'Unknown' && props.context?.target?.ddl && messages.value.length === 0) {
    triggerReview()
  }
}, { immediate: true })

// Watch for global review requests from buttons
watch(() => appStore.aiReviewTrigger, () => {
  triggerReview(true) // Force fresh review
})

const formatContent = (content: string) => {
  if (!content) return ''
  let trimmed = content.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const data = JSON.parse(trimmed)
      let mdOutput = ''
      if (data.summary) mdOutput += `### 📝 Summary\n${data.summary}\n\n`
      if (data.risks) {
        mdOutput += `### ⚠️ Risks\n`
        if (Array.isArray(data.risks)) {
          data.risks.forEach((r: string) => { mdOutput += `- ${r}\n` })
        } else {
          mdOutput += `${data.risks}\n`
        }
        mdOutput += '\n'
      }
      if (data.suggestions || data.suggestion) {
        mdOutput += `### ✨ Suggestions\n`
        const s = data.suggestions || data.suggestion
        if (Array.isArray(s)) {
          s.forEach((u: string) => { mdOutput += `- ${u}\n` })
        } else {
          mdOutput += `${s}\n`
        }
      }
      return mdOutput || content
    } catch (e) {}
  }
  return content
}

const askQuestion = async () => {
  if (!question.value.trim() || isLoading.value) return
  const userQuestion = question.value
  chatStore.addMessage('user', userQuestion)
  question.value = ''
  isLoading.value = true

  try {
    const result = await (window as any).electronAPI.invoke('andb-ai-ask', {
      question: userQuestion,
      context: props.context,
      locale: settingsStore.settings.aiLanguage || props.locale
    })
    if (result.success && result.data && result.data.content) {
      chatStore.addMessage('ai', result.data.content)
    } else {
      throw new Error(result.error || 'No response')
    }
  } catch (e: any) {
    chatStore.addMessage('error', getFriendlyError(e.message), userQuestion)
  } finally {
    isLoading.value = false
    nextTick(() => {
        const chatContainer = document.querySelector('.ai-chat-container');
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
    })
  }
}

const retryLast = async (msg: any) => {
  if (isLoading.value) return
  
  // Remove the error message
  chatStore.removeMessage(msg)
  
  if (msg.lastQuestion) {
    // Retry askQuestion with the saved text
    question.value = msg.lastQuestion
    askQuestion()
  } else {
    // Retry triggerReview
    triggerReview(true)
  }
}

// Auto-resize textarea logic
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const adjustHeight = () => {
  if (!textareaRef.value) return
  textareaRef.value.style.height = 'auto'
  textareaRef.value.style.height = Math.min(textareaRef.value.scrollHeight, 200) + 'px'
}

watch(question, () => {
  nextTick(adjustHeight)
})

// Handle selection to chat
const handleGlobalSelection = () => {
  const selection = window.getSelection()?.toString().trim()
  if (selection && selection.length > 0) {
    // Selection listener logic
  }
}

const handleInjectSelectionEvent = (e: any) => {
  if (e.detail?.text) injectSelection(e.detail.text)
}

// Function to inject selected text from parent views
const injectSelection = (text: string) => {
  if (question.value) question.value += '\n'
  question.value += `\`\`\`sql\n${text}\n\`\`\``
  adjustHeight()
  textareaRef.value?.focus()
}

const selectConversation = (id: string) => {
  chatStore.selectConversation(id)
  showHistory.value = false
  nextTick(() => {
      const chatContainer = document.querySelector('.ai-chat-container');
      if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
  })
}

const startNewConversation = () => {
  chatStore.newConversation()
  showHistory.value = false
}

const deleteConversation = (id: string, e: Event) => {
  e.stopPropagation()
  chatStore.deleteConversation(id)
}

const formatTime = (ts: number) => {
  return new Date(ts).toLocaleDateString() + ' ' + new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

defineExpose({ injectSelection })

</script>

<template>
  <div class="h-full w-full flex relative bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 overflow-hidden">
    
    <!-- History Sidebar Overlay -->
    <div 
      v-if="showHistory" 
      class="absolute inset-y-0 left-0 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30 shadow-2xl flex flex-col transform transition-transform duration-300"
    >
      <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h3 class="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white flex items-center gap-2">
          <Clock class="w-4 h-4 text-primary-500" />
          History
        </h3>
        <button @click="showHistory = false" class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <X class="w-4 h-4" />
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto p-2 custom-scrollbar">
        <div v-if="conversations.length === 0" class="text-center p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-10">
          No previous chats
        </div>
        <div 
          v-for="conv in conversations" 
          :key="conv.id"
          @click="selectConversation(conv.id)"
          class="group p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors mb-1 flex items-start justify-between border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
          :class="{ 'bg-primary-50/50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800/30': chatStore.currentConversationId === conv.id }"
        >
          <div class="overflow-hidden flex-1">
            <h4 class="text-xs font-bold text-gray-900 dark:text-white truncate" :title="conv.title">{{ conv.title }}</h4>
            <div class="text-[9px] font-medium text-gray-400 mt-1 flex items-center gap-1 uppercase tracking-wider">
               <MessageSquare class="w-3 h-3" />
               {{ conv.messages.length }} msgs • {{ formatTime(conv.updatedAt) }}
            </div>
          </div>
          <button 
            @click="deleteConversation(conv.id, $event)" 
            class="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all ml-2 shrink-0"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      <div class="p-4 border-t border-gray-100 dark:border-gray-800">
         <button 
           @click="chatStore.clearAll()" 
           class="w-full py-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-900/30"
         >
           Clear All History
         </button>
      </div>
    </div>
    
    <!-- Backdrop for sidebar on small screens if needed -->
    <div v-if="showHistory" @click="showHistory = false" class="absolute inset-0 bg-gray-900/10 dark:bg-black/20 backdrop-blur-sm z-20"></div>

    <!-- Main Chat Area -->
    <div class="flex-1 flex flex-col h-full w-full bg-white dark:bg-gray-900 relative z-10">
      <!-- Header -->
      <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md shrink-0">
        <div class="flex items-center gap-3">
          <button 
            @click="showHistory = true"
            class="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Chat History"
          >
            <Menu class="w-4 h-4" />
          </button>
          
          <div class="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
          
          <div class="p-1.5 bg-primary-500 rounded-lg shadow-lg shadow-primary-500/20">
            <Sparkles class="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 class="text-xs font-bold text-gray-900 dark:text-white leading-tight uppercase tracking-wide">AI Assistant</h3>
            <p v-if="context" class="text-[9px] text-gray-500 font-medium uppercase tracking-wider opacity-70">{{ context.objectType }}: {{ context.objectName }}</p>
            <p v-else class="text-[9px] text-gray-500 font-medium uppercase tracking-wider opacity-70">Ready to help</p>
          </div>
        </div>

        <div class="flex items-center gap-1">
          <!-- New Chat Button -->
          <button 
            @click="startNewConversation"
            class="h-8 px-2.5 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all flex items-center gap-1.5 group active:scale-95"
            title="New Conversation"
          >
            <Plus class="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
            <span class="text-[9px] font-black uppercase tracking-widest">New</span>
          </button>
          
          <!-- Close Button -->
          <button 
            @click="appStore.layoutSettings.aiPanel = false"
            class="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center group active:scale-95"
            title="Close Assistant"
          >
            <X class="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar flex flex-col ai-chat-container">
        <!-- Polyglot Empty State -->
        <div v-if="messages.length === 0 && !isLoading" class="flex-1 flex flex-col items-center justify-center text-center py-10">
          <div class="relative mb-8">
            <div class="w-20 h-20 rounded-[2.5rem] bg-gradient-to-tr from-primary-500 to-emerald-400 flex items-center justify-center shadow-xl shadow-primary-500/20 animate-pulse">
              <Sparkles class="w-10 h-10 text-white" />
            </div>
            <div class="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center animate-bounce">
               <Bot class="w-4 h-4 text-primary-500" />
            </div>
          </div>

          <div class="space-y-2 mb-8">
            <div class="flex items-center justify-center gap-2 overflow-hidden px-4">
               <span class="text-xs font-black text-primary-500 uppercase tracking-widest">Xin chào</span>
               <span class="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
               <span class="text-xs font-black text-emerald-500 uppercase tracking-widest">Hello</span>
               <span class="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
               <span class="text-xs font-black text-blue-500 uppercase tracking-widest">Bonjour</span>
            </div>
            <h2 class="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
              I'm TheAndb <span class="px-2 py-0.5 rounded-md bg-primary-500/10 text-primary-500 text-[10px] uppercase tracking-widest">AI DBA</span>
            </h2>
            <p class="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] max-w-[250px] leading-relaxed mt-2 mx-auto">
              Ready to review schemas and optimize your data.
            </p>
          </div>

          <!-- Quick Tips -->
          <div class="grid grid-cols-1 gap-2 w-full max-w-[240px]">
             <div class="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 text-[10px] font-bold text-gray-400 dark:text-gray-500 text-left flex items-center gap-3">
                <div class="w-5 h-5 rounded-lg bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm">
                  <Shield class="w-3 h-3 text-emerald-500" />
                </div>
                Analyze Index Safety
             </div>
             <div class="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 text-[10px] font-bold text-gray-400 dark:text-gray-500 text-left flex items-center gap-3">
                <div class="w-5 h-5 rounded-lg bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm">
                  <Zap class="w-3 h-3 text-primary-500" />
                </div>
                Optimize Data Types
             </div>
          </div>
        </div>

        <!-- Messages List -->
        <template v-else>
          <div v-for="(msg, idx) in messages" :key="idx" :class="['flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : '']">
            <div :class="['w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm', msg.role === 'ai' ? 'bg-primary-500/10 text-primary-500 border-primary-500/20' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700']">
              <Bot v-if="msg.role === 'ai'" class="w-4 h-4" />
              <AlertTriangle v-else-if="msg.role === 'error'" class="w-4 h-4 text-red-500" />
              <User v-else class="w-4 h-4" />
            </div>
            <div :class="['max-w-[90%] px-5 py-4 rounded-3xl text-[14px] leading-relaxed relative shadow-sm border', 
              msg.role === 'ai' ? 'bg-white dark:bg-gray-800/40 text-gray-700 dark:text-gray-200 border-gray-100 dark:border-gray-700/50' : 
              msg.role === 'error' ? 'bg-red-50/50 dark:bg-red-950/10 text-red-700 dark:text-red-400 border-red-100/50 dark:border-red-900/30' : 
              'bg-primary-500 text-white shadow-md shadow-primary-500/10 border-transparent']">
              <div v-if="msg.role === 'error'" class="flex items-center gap-2 font-bold mb-1">
                <AlertCircle class="w-3.5 h-3.5 text-red-500" />
                <span>AI Analysis Error</span>
              </div>
              <div 
                v-html="md.render(formatContent(msg.content))" 
                :class="['prose prose-xs max-w-none', 
                  msg.role === 'ai' ? 'dark:prose-invert text-gray-700 dark:text-gray-200' : 
                  msg.role === 'error' ? 'text-red-800 dark:text-red-300' : 'text-white prose-invert'
                ]"
              ></div>
              
              <div v-if="msg.role === 'error'" class="mt-4 flex items-center gap-2">
                <button @click="retryLast(msg)" class="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider transition-all shadow-lg shadow-red-500/20 active:scale-95">
                  <RefreshCw class="w-3 h-3" />
                  Retry Now
                </button>
              </div>
            </div>
          </div>
          
          <div v-if="isLoading" class="flex gap-3">
            <div class="w-8 h-8 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center border border-primary-500/20 animate-pulse">
              <Bot class="w-4 h-4" />
            </div>
            <div class="bg-gray-50/80 dark:bg-gray-800/30 px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <Loader2 class="w-3.5 h-3.5 animate-spin text-primary-500" />
              <span class="text-[11px] text-gray-500 font-black uppercase tracking-widest">{{ settingsStore.settings.aiLanguage === 'vi' ? 'Đang suy nghĩ...' : 'Thinking...' }}</span>
            </div>
          </div>
        </template>
      </div>

      <!-- Input Area -->
      <div class="p-3 pb-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0">
        <div class="relative group">
          <textarea 
            ref="textareaRef"
            v-model="question" 
            @keydown.enter.exact.prevent="askQuestion"
            @keydown.enter.shift.exact="question += '\n'"
            placeholder="Ask AI anything... (Enter to send, Shift+Enter for new line)" 
            class="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 pl-5 pr-14 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all shadow-inner resize-none min-h-[48px] max-h-[200px] custom-scrollbar"
          ></textarea>
          <button @click="askQuestion" :disabled="!question.trim() || isLoading" class="absolute right-2 bottom-2 p-1.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-xl transition-all shadow-lg shadow-primary-500/20">
            <Send v-if="!isLoading" class="w-4 h-4" />
            <Loader2 v-else class="w-4 h-4 animate-spin" />
          </button>
        </div>
        <div class="mt-2 flex items-center justify-between px-1">
          <div class="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
              <span class="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Powered by Gemini</span>
              <span class="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
              <div class="flex items-center gap-1 cursor-help" title="Supports Markdown formatting">
                  <svg class="w-3 h-3 text-gray-400" viewBox="0 0 16 16" fill="currentColor"><path d="M14.85 3H1.15C.52 3 0 3.52 0 4.15v7.69C0 12.48.52 13 1.15 13h13.69c.63 0 1.15-.52 1.15-1.15V4.15C16 3.52 15.48 3 14.85 3zM9 11H7V8L5.5 9.92 4 8v3H2V5h2l1.5 2L7 5h2v6zm2.99.01L10.5 9H12V5h2v4h1.5l-2.51 2.01z"></path></svg>
              </div>
          </div>
          <div class="flex items-center gap-3">
              <span class="text-[9px] text-gray-400 font-medium italic opacity-60 hidden sm:inline">✨ Tip: Select text to ask about it</span>
              <button @click="goToSettings" class="p-1 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-all" title="AI Settings">
                 <Settings class="w-3.5 h-3.5" />
              </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.prose-xs {
  font-size: 0.875rem;
  line-height: 1.6;
  color: inherit;
}
.prose-xs :deep(h1), .prose-xs :deep(h2), .prose-xs :deep(h3) {
  font-weight: 800;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  color: var(--tw-prose-headings);
}
.prose-xs :deep(p) { margin: 0.5rem 0; }
.prose-xs :deep(ul), .prose-xs :deep(ol) { margin: 0.5rem 0; padding-left: 1.25rem; }
.prose-xs :deep(li) { margin: 0.25rem 0; }
.prose-xs :deep(pre) {
  background: rgba(0,0,0,0.8) !important;
  color: #e5e7eb !important;
  padding: 1rem;
  border-radius: 0.75rem;
  margin: 0.75rem 0;
  border: 1px solid rgba(255,255,255,0.1);
  overflow-x: auto;
}
.prose-xs :deep(code) {
  background: rgba(0,0,0,0.05);
  color: #c026d3;
  padding: 0.15rem 0.35rem;
  border-radius: 0.4rem;
  font-size: 0.9em;
  font-weight: 600;
}
.prose-invert :deep(code) {
  color: #a5f3fc !important;
  background: rgba(255,255,255,0.1) !important;
}
.dark .prose-xs :deep(code) { 
  background: rgba(255,255,255,0.05); 
  color: #22d3ee; 
}
.prose-xs :deep(strong) {
  font-weight: 800;
  color: inherit;
}
.prose-xs :deep(h1), .prose-xs :deep(h2), .prose-xs :deep(h3) {
  color: inherit;
}

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
.dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
</style>

