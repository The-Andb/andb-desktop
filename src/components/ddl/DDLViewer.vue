<template>
  <div class="flex-1 flex flex-col overflow-hidden relative group h-full">
    <div
      ref="containerRef"
      class="absolute inset-0 flex flex-col overflow-auto custom-scrollbar bg-gray-50 dark:bg-gray-900/50 text-sm font-mono"
    >
      <div class="min-w-max w-full">
        <div
          v-for="(line, idx) in highlightedLines"
          :key="idx"
          :data-line="idx + 1"
          class="flex items-stretch group/line border-l-[6px] border-transparent hover:bg-gray-100/50 dark:hover:bg-gray-800/30 transition-colors"
          :class="{
            '!bg-primary-500/30 dark:!bg-primary-400/30 border-l-primary-600 dark:border-l-primary-400 shadow-[inset_4px_0_0_0_rgba(var(--primary-600),0.5)]':
              selectedLine === idx + 1
          }"
        >
          <!-- Line Numbers -->
          <div
            v-if="showLineNumbers"
            class="flex-none py-0.5 px-3 text-right text-gray-400 dark:text-gray-600 select-none bg-gray-100/30 dark:bg-gray-800/20 border-r border-gray-200 dark:border-gray-700 min-w-[3.5rem] leading-6"
            :class="{
              'text-primary-600 dark:text-primary-400 font-bold bg-primary-500/10':
                selectedLine === idx + 1
            }"
          >
            {{ idx + 1 }}
          </div>

          <!-- Code -->
          <pre
            @click="handleCodeClick($event, idx + 1)"
            class="flex-1 py-0.5 px-4 syntax-highlighter bg-transparent text-gray-800 dark:text-gray-200 !mt-0 !bg-transparent leading-6 overflow-visible"
            :style="{ fontSize: fontSize + 'px', fontFamily: fontFamily }"
          ><code class="block overflow-visible"><div v-html="line || ' '" class="min-h-[1.5rem] whitespace-pre" :class="{ 'is-navigating': isNavigating }"></div></code></pre>
        </div>
      </div>
    </div>

    <!-- Search Bar -->
    <div
      v-if="showSearch"
      class="absolute top-2 right-4 z-[60] flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-xl shadow-black/10 border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-2"
    >
      <div class="px-3 text-gray-400 dark:text-gray-500">
        <Search class="w-4 h-4" />
      </div>
      <input
        ref="searchInputRef"
        v-model="localSearchQuery"
        type="text"
        placeholder="Find in code..."
        class="w-48 bg-transparent border-none text-xs font-mono text-gray-900 dark:text-white focus:ring-0 px-0 py-2 outline-none"
        @keyup.esc="closeSearch"
      />
      <button
        @click="localSearchQuery = ''"
        v-if="localSearchQuery"
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

    <!-- Toolbar (Overlay) -->
    <div
      v-if="showCopyButton && !showSearch"
      class="absolute top-2 right-4 z-[50] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2"
    >
      <button
        @click="handleFocusSearch"
        class="p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-gray-100 dark:hover:bg-gray-700/80 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm border border-black/5 dark:border-white/5"
        title="Search in code (Cmd+F)"
      >
        <Search class="w-4 h-4" />
      </button>
      <button
        @click="appStore.requestAiReview()"
        class="p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded-lg text-indigo-500 dark:text-indigo-400 transition-all shadow-sm border border-black/5 dark:border-white/5"
        title="Ask AI about this code"
      >
        <Sparkles class="w-4 h-4" />
      </button>
      <button
        @click="copyToClipboard"
        class="p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-gray-100 dark:hover:bg-gray-700/80 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm border border-black/5 dark:border-white/5"
        :title="$t('common.copyScript')"
      >
        <Copy v-if="!copied" class="w-4 h-4" />
        <Check v-else class="w-4 h-4 text-green-500 dark:text-green-400" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import Prism from 'prismjs'
import 'prismjs/components/prism-sql'
import { Copy, Check, Sparkles, Search, X } from 'lucide-vue-next'
import { getNavigatableWord, highlightLinks } from '@/utils/navigation'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const props = defineProps({
  content: {
    type: String,
    required: true,
    default: ''
  },
  searchTerm: {
    type: String,
    default: ''
  },
  fontSize: {
    type: Number,
    default: 12
  },
  fontFamily: {
    type: String,
    default: "'JetBrains Mono', monospace"
  },
  showLineNumbers: {
    type: Boolean,
    default: true
  },
  showCopyButton: {
    type: Boolean,
    default: true
  },
  navigatableNames: {
    type: Array as () => string[],
    default: () => []
  }
})

const emit = defineEmits(['navigate-to-definition'])

const copied = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const selectedLine = ref<number | null>(null)

// Search feature
const localSearchQuery = ref('')
const showSearch = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)

const handleFocusSearch = () => {
  showSearch.value = true
  nextTick(() => {
    searchInputRef.value?.focus()
    searchInputRef.value?.select()
  })
}

const closeSearch = () => {
  showSearch.value = false
  localSearchQuery.value = ''
}

// Reset selection when content changes
watch(
  () => props.content,
  () => {
    selectedLine.value = null
  }
)

defineExpose({
  scrollToLine: (line: number) => {
    if (!containerRef.value) return
    selectedLine.value = line
    const lineElement = containerRef.value.querySelector(`[data-line="${line}"]`)
    if (lineElement) {
      lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
})

const isNavigating = ref(false)

const handleCodeClick = (event: MouseEvent, _line: number) => {
  const word = getNavigatableWord(event, props.navigatableNames as string[])
  if (word) {
    emit('navigate-to-definition', word)
  }
}

// Track meta/ctrl key for cursor change
const handleGlobalKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Meta' || e.key === 'Control') isNavigating.value = true
}
const handleGlobalKeyup = (e: KeyboardEvent) => {
  if (e.key === 'Meta' || e.key === 'Control') isNavigating.value = false
}

watch(isNavigating, val => {
  if (val) {
    window.addEventListener('keyup', handleGlobalKeyup)
  } else {
    window.removeEventListener('keyup', handleGlobalKeyup)
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('andb-focus-local-search', handleFocusSearch)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('keyup', handleGlobalKeyup)
  window.removeEventListener('andb-focus-local-search', handleFocusSearch)
})

const copyToClipboard = () => {
  if (!props.content) return
  navigator.clipboard.writeText(props.content)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

const highlightedLines = computed(() => {
  if (!props.content) return []

  // Highlight with Prism
  const html = Prism.highlight(props.content, Prism.languages.sql, 'sql')
  const lines = html.split('\n')

  // Prepare search regex if needed
  let searchRegex: RegExp | null = null
  const activeSearchTerm = props.searchTerm || localSearchQuery.value
  if (activeSearchTerm && activeSearchTerm.trim()) {
    try {
      const escaped = activeSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      searchRegex = new RegExp(`(${escaped})`, 'gi')
    } catch (e) {
      console.warn('Invalid search term for highlight:', activeSearchTerm)
    }
  }

  return lines.map(line => {
    let processed = line
    // Custom post-processing for brackets/punctuation
    processed = processed.replace(
      /<span class="token punctuation">(\()<\/span>/g,
      '<span class="token punctuation paren-open text-yellow-500 dark:text-yellow-400 font-bold">(</span>'
    )
    processed = processed.replace(
      /<span class="token punctuation">(\))<\/span>/g,
      '<span class="token punctuation paren-close text-yellow-500 dark:text-yellow-400 font-bold">)</span>'
    )
    processed = processed.replace(
      /<span class="token punctuation">(,)<\/span>/g,
      '<span class="token punctuation comma text-gray-500 dark:text-gray-100 font-bold">,</span>'
    )
    processed = processed.replace(
      /<span class="token punctuation">(;)<\/span>/g,
      '<span class="token punctuation semicolon text-red-500 dark:text-pink-400 font-bold">;</span>'
    )

    // Search Keyword Highlighting
    if (searchRegex) {
      const parts = processed.split(/(<[^>]+>)/g)
      processed = parts
        .map(part => {
          if (part.startsWith('<')) return part
          return part.replace(
            searchRegex!,
            '<span class="search-highlight bg-yellow-400 dark:bg-yellow-500/80 text-black dark:text-gray-900 ring-2 ring-yellow-400/20 rounded-sm px-0.5 font-bold shadow-sm">$1</span>'
          )
        })
        .join('')
    }

    // Navigatable Identifier Highlighting (Precise Underline)
    processed = highlightLinks(processed, props.navigatableNames as string[])

    return processed
  })
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
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

.is-navigating .nav-link {
  cursor: pointer;
}

.is-navigating .nav-link:hover {
  text-decoration: underline;
  text-decoration-color: var(--primary-500);
  text-underline-offset: 4px;
}
</style>
