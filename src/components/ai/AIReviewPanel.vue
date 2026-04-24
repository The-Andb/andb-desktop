<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Bot, Send, Loader2, Sparkles, AlertTriangle, User, AlertCircle,
  Shield, Zap, X, Menu, Plus, Trash2, Clock, MessageSquare, RefreshCw, Settings
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import MarkdownIt from 'markdown-it'
import { useAppStore } from '@/stores/app'
import { useSettingsStore } from '@/stores/settings'
import { useAiChatStore } from '@/stores/aiChat'
import { useProjectsStore } from '@/stores/projects'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

const appStore = useAppStore()
const settingsStore = useSettingsStore()
const chatStore = useAiChatStore()
const projectsStore = useProjectsStore()
const router = useRouter()
const { t } = useI18n()

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

const personas = [
  {
    id: 'dba',
    name: 'Expert DBA',
    emoji: '👴',
    placeholder: 'Ném Schema đây tôi soi cho, đừng để tôi cáu!',
    prompt: 'You are an experienced Database Administrator. Focus on database performance, best practices, and schema design. IMPORTANT: NEVER mention internal source code, file names, or internal implementation details of TheAndb app. Focus only on the database logic and user-facing features.'
  },
  {
    id: 'secretary',
    name: 'Secretary',
    emoji: '👩‍💼',
    placeholder: 'Dạ, anh muốn em kiểm tra phần nào trong Database ạ?',
    prompt: 'You are a professional secretary for TheAndb. You help users navigate the app and summarize database information. NEVER show code or internal paths. Focus on guiding the user through the UI and explaining features.'
  },
  {
    id: 'coworker',
    name: 'Co-worker',
    emoji: '🤝',
    placeholder: 'Ê bro, bảng này trông hơi khoai, check hộ tôi tí?',
    prompt: 'You are a helpful co-worker. You use casual language ("bro", "ê", "ông"). Help the user solve database problems and explain how to use TheAndb features. STRICT RULE: Do not disclose file paths, source code, or internal logic. Talk like a user-facing support engineer, not a core developer.'
  },
  {
    id: 'playful',
    name: 'Playful',
    emoji: '🎮',
    placeholder: 'Database đang hắt hơi à? Để em khám phát xem nào!',
    prompt: 'You are a witty AI assistant. Use humor and fun analogies. Focus on helping the user with their database tasks. NEVER mention internal code or dev details. Keep the magic hidden!'
  }
] as const

const selectedPersonaId = computed({
  get: () => settingsStore.settings.aiPersona || 'coworker',
  set: (val) => { settingsStore.settings.aiPersona = val }
})
const currentPersona = computed(() => personas.find(p => p.id === selectedPersonaId.value))

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
  if (err.includes('429')) return t('aiErrors.quota')
  if (err.includes('503') || err.includes('504')) return t('aiErrors.overloaded')
  if (err.includes('API_KEY') || err.includes('401') || err.includes('403')) return t('aiErrors.invalidKey')
  if (err.includes('ETIMEDOUT') || err.includes('network')) return t('aiErrors.timeout')
  return t('aiErrors.generic')
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
      context: {
        ...props.context,
        activeProjectId: projectsStore.currentProject?.id || '',
        persona: currentPersona.value?.prompt
      },
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

// Manual review trigger only - removed auto-watch to save tokens

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
    } catch (e) { }
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
      context: {
        ...props.context,
        activeProjectId: projectsStore.currentProject?.id || '',
        persona: currentPersona.value?.prompt
      },
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
  <div
    class="h-full w-full flex relative bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 overflow-hidden">

    <!-- History Sidebar Overlay -->
    <div v-if="showHistory"
      class="absolute inset-y-0 left-0 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30 shadow-2xl flex flex-col transform transition-transform duration-300">
      <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h3 class="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white flex items-center gap-2">
          <Clock class="w-4 h-4 text-primary-500" />
          {{ t('aiAssistant.history') }}
        </h3>
        <button @click="showHistory = false"
          class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-2 custom-scrollbar">
        <div v-if="conversations.length === 0"
          class="text-center p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-10">
          {{ t('aiAssistant.noPreviousChats') }}
        </div>
        <div v-for="conv in conversations" :key="conv.id" @click="selectConversation(conv.id)"
          class="group p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors mb-1 flex items-start justify-between border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
          :class="{ 'bg-primary-50/50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800/30': chatStore.currentConversationId === conv.id }">
          <div class="overflow-hidden flex-1">
            <h4 class="text-xs font-bold text-gray-900 dark:text-white truncate" :title="conv.title">{{ conv.title }}
            </h4>
            <div class="text-[9px] font-medium text-gray-400 mt-1 flex items-center gap-1 uppercase tracking-wider">
              <MessageSquare class="w-3 h-3" />
              {{ conv.messages.length }} msgs • {{ formatTime(conv.updatedAt) }}
            </div>
          </div>
          <button @click="deleteConversation(conv.id, $event)"
            class="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all ml-2 shrink-0">
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div class="p-4 border-t border-gray-100 dark:border-gray-800">
        <button @click="chatStore.clearAll()"
          class="w-full py-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-900/30">
          {{ t('aiAssistant.clearAllHistory') }}
        </button>
      </div>
    </div>

    <!-- Backdrop for sidebar on small screens if needed -->
    <div v-if="showHistory" @click="showHistory = false"
      class="absolute inset-0 bg-gray-900/10 dark:bg-black/20 backdrop-blur-sm z-20"></div>

    <!-- Main Chat Area -->
    <div class="flex-1 flex flex-col h-full w-full bg-white dark:bg-gray-900 relative z-10">
      <!-- Header -->
      <div
        class="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md shrink-0">
        <div class="flex items-center gap-3">
          <button @click="showHistory = true"
            class="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Chat History">
            <Menu class="w-4 h-4" />
          </button>

          <div class="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>

          <div class="p-1.5 bg-primary-500 rounded-lg shadow-lg shadow-primary-500/20">
            <Sparkles class="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 class="text-xs font-bold text-gray-900 dark:text-white leading-tight uppercase tracking-wide">{{
              t('aiAssistant.title') }}</h3>
            <p v-if="context" class="text-[9px] text-gray-500 font-medium uppercase tracking-wider opacity-70">{{
              context.objectType }}: {{ context.objectName }}</p>
            <p v-else class="text-[9px] text-gray-500 font-medium uppercase tracking-wider opacity-70">{{
              t('aiAssistant.readyToHelp') }}</p>
          </div>
        </div>

        <div class="flex items-center gap-1">
          <!-- New Chat Button -->
          <button @click="startNewConversation"
            class="h-8 px-2.5 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all flex items-center gap-1.5 group active:scale-95"
            title="New Conversation">
            <Plus class="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
            <span class="text-[9px] font-black uppercase tracking-widest">{{ t('aiAssistant.new') }}</span>
          </button>

          <!-- Close Button -->
          <button @click="appStore.layoutSettings.aiPanel = false"
            class="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center group active:scale-95"
            title="Close Assistant">
            <X class="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar flex flex-col ai-chat-container">
        <!-- Polyglot Empty State -->
        <div v-if="messages.length === 0 && !isLoading"
          class="flex-1 flex flex-col items-center justify-center text-center py-10">
          <div class="relative mb-8">
            <div
              class="w-20 h-20 rounded-[2.5rem] bg-gradient-to-tr from-primary-500 to-emerald-400 flex items-center justify-center shadow-xl shadow-primary-500/20 animate-pulse">
              <Sparkles class="w-10 h-10 text-white" />
            </div>
            <div
              class="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center animate-bounce">
              <Bot class="w-4 h-4 text-primary-500" />
            </div>
          </div>

          <div class="space-y-2 mb-8">
            <div class="flex items-center justify-center gap-2 overflow-hidden px-4">
              <span class="text-xs font-black text-primary-500 uppercase tracking-widest">{{ t('aiAssistant.xinChao')
                }}</span>
              <span class="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
              <span class="text-xs font-black text-emerald-500 uppercase tracking-widest">{{ t('aiAssistant.hello')
                }}</span>
              <span class="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
              <span class="text-xs font-black text-blue-500 uppercase tracking-widest">{{ t('aiAssistant.bonjour')
                }}</span>
            </div>
            <h2
              class="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
              I'm TheAndb <span
                class="px-2 py-0.5 rounded-md bg-primary-500/10 text-primary-500 text-[10px] uppercase tracking-widest">AI
                DBA</span>
            </h2>
            <p
              class="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] max-w-[250px] leading-relaxed mt-2 mx-auto">
              {{ t('aiAssistant.tagline') }}
            </p>
          </div>

          <!-- Quick Tips -->
          <div class="grid grid-cols-1 gap-2 w-full max-w-[240px]">
            <div
              class="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 text-[10px] font-bold text-gray-400 dark:text-gray-500 text-left flex items-center gap-3">
              <div class="w-5 h-5 rounded-lg bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm">
                <Shield class="w-3 h-3 text-emerald-500" />
              </div>
              {{ t('aiAssistant.analyzeIndexSafety') }}
            </div>
            <div
              class="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 text-[10px] font-bold text-gray-400 dark:text-gray-500 text-left flex items-center gap-3">
              <div class="w-5 h-5 rounded-lg bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm">
                <Zap class="w-3 h-3 text-primary-500" />
              </div>
              {{ t('aiAssistant.optimizeDataTypes') }}
            </div>
          </div>
        </div>

        <!-- Messages List -->
        <template v-else>
          <div v-for="(msg, idx) in messages" :key="idx"
            :class="['flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : '']">
            <div
              :class="['w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm', msg.role === 'ai' ? 'bg-primary-500/10 text-primary-500 border-primary-500/20' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700']">
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
                <span>{{ t('aiAssistant.analysisError') }}</span>
              </div>
              <div v-html="md.render(formatContent(msg.content))" :class="['prose prose-xs max-w-none',
                msg.role === 'ai' ? 'dark:prose-invert text-gray-700 dark:text-gray-200' :
                  msg.role === 'error' ? 'text-red-800 dark:text-red-300' : 'text-white prose-invert'
              ]"></div>

              <div v-if="msg.role === 'error'" class="mt-4 flex items-center gap-2">
                <button @click="retryLast(msg)"
                  class="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider transition-all shadow-lg shadow-red-500/20 active:scale-95">
                  <RefreshCw class="w-3 h-3" />
                  {{ t('aiAssistant.retryNow') }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="isLoading" class="flex gap-3">
            <div
              class="w-8 h-8 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center border border-primary-500/20 animate-pulse">
              <Bot class="w-4 h-4" />
            </div>
            <div
              class="bg-gray-50/80 dark:bg-gray-800/30 px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <Loader2 class="w-3.5 h-3.5 animate-spin text-primary-500" />
              <span class="text-[11px] text-gray-500 font-black uppercase tracking-widest">{{ t('aiAssistant.thinking')
                }}</span>
            </div>
          </div>
        </template>
      </div>

      <!-- Input Area -->
      <div class="p-3 pb-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0">
        <div class="relative group">
          <textarea ref="textareaRef" v-model="question" @keydown.enter.exact.prevent="askQuestion"
            @keydown.enter.shift.exact="question += '\n'"
            :placeholder="currentPersona?.placeholder || t('aiAssistant.askAnything')"
            class="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl py-3 pl-5 pr-14 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all shadow-inner resize-none min-h-[48px] max-h-[200px] custom-scrollbar"></textarea>
          <button @click="askQuestion" :disabled="!question.trim() || isLoading"
            class="absolute right-3 bottom-3.5 p-2 bg-primary-400 hover:bg-primary-500 disabled:opacity-30 text-white rounded-full transition-all shadow-md shadow-primary-500/20 active:scale-95 flex items-center justify-center">
            <Send v-if="!isLoading" class="w-4 h-4" />
            <Loader2 v-else class="w-4 h-4 animate-spin" />
          </button>
        </div>
        <div class="mt-2 flex items-center justify-between px-1.5">
          <div class="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-help">
            <Sparkles class="w-3 h-3 text-amber-400" />
            <span class="text-[9px] text-gray-400 font-black uppercase tracking-widest italic">
              {{ t('aiAssistant.tipSelectText') }}
            </span>
          </div>
          <div class="flex items-center gap-3">
            <button @click="goToSettings"
              class="p-1 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-all"
              title="AI Settings">
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

.prose-xs :deep(h1),
.prose-xs :deep(h2),
.prose-xs :deep(h3) {
  font-weight: 800;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  color: var(--tw-prose-headings);
}

.prose-xs :deep(p) {
  margin: 0.5rem 0;
}

.prose-xs :deep(ul),
.prose-xs :deep(ol) {
  margin: 0.5rem 0;
  padding-left: 1.25rem;
}

.prose-xs :deep(li) {
  margin: 0.25rem 0;
}

.prose-xs :deep(pre) {
  background: rgba(0, 0, 0, 0.8) !important;
  color: #e5e7eb !important;
  padding: 1rem;
  border-radius: 0.75rem;
  margin: 0.75rem 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow-x: auto;
}

.prose-xs :deep(code) {
  background: rgba(0, 0, 0, 0.05);
  color: #c026d3;
  padding: 0.15rem 0.35rem;
  border-radius: 0.4rem;
  font-size: 0.9em;
  font-weight: 600;
}

.prose-invert :deep(code) {
  color: #a5f3fc !important;
  background: rgba(255, 255, 255, 0.1) !important;
}

.dark .prose-xs :deep(code) {
  background: rgba(255, 255, 255, 0.05);
  color: #22d3ee;
}

.prose-xs :deep(strong) {
  font-weight: 800;
  color: inherit;
}

.prose-xs :deep(h1),
.prose-xs :deep(h2),
.prose-xs :deep(h3) {
  color: inherit;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
}
</style>
