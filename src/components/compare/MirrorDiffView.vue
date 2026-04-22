<template>
  <div class="mirror-diff-view flex h-full min-h-0 min-w-0 max-w-full overflow-hidden bg-white dark:bg-gray-950 group/view border-t border-gray-200 dark:border-gray-800 relative" :style="{ fontFamily: appStore.fontFamilies.code, fontSize: appStore.fontSizes.code + 'px' }">
    <!-- SPLIT VIEW MODE -->
    <template v-if="viewType === 'split'">
      <div class="flex-1 flex flex-col min-h-0 min-w-0 max-w-full overflow-hidden relative">
        <!-- Headers -->
        <div class="flex shrink-0 h-10 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 relative">
          <!-- Source Header -->
          <div :style="{ width: leftPaneWidth + '%' }" class="px-4 py-2 flex justify-between items-center shrink-0">
            <span class="font-bold text-primary-600 dark:text-primary-400 opacity-80 uppercase tracking-widest text-[10px]">{{ $t('compare.diffView.source', { label: sourceLabel }) }}</span>
            <span v-if="isEmptySource" class="text-[10px] bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800/50 font-bold uppercase">{{ $t('compare.diffView.deleted') }}</span>
          </div>

          <!-- Target Header -->
          <div class="flex-1 px-4 py-2 flex justify-between items-center">
            <span class="font-bold text-emerald-600 dark:text-emerald-400 opacity-80 uppercase tracking-widest text-[10px]">{{ $t('compare.diffView.target', { label: targetLabel }) }}</span>
            <div class="flex items-center gap-3">
              <span v-if="isEmptyTarget" class="text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50 font-bold uppercase">{{ $t('compare.diffView.new') }}</span>

              <!-- Settings Component -->
              <div class="relative" ref="settingsRef">
                <button 
                  @click="showSettings = !showSettings"
                  class="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                  :class="{ 'text-primary-500 bg-gray-200 dark:bg-gray-700': showSettings }"
                >
                  <Settings class="w-3.5 h-3.5" />
                </button>
                <!-- Dropdown -->
                <div v-if="showSettings" class="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 z-50 text-xs text-gray-600 dark:text-gray-300 pointer-events-auto">
                  <h3 class="font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-widest text-[10px]">{{ $t('compare.diffView.settings') }}</h3>
                  <div class="space-y-4 text-left">
                    <!-- Whitespace -->
                    <div>
                      <h4 class="font-bold text-gray-500 uppercase text-[9px] mb-2">{{ $t('compare.diffView.whitespace') }}</h4>
                      <label class="flex items-start cursor-pointer group">
                        <div class="relative flex items-center mt-0.5">
                          <input type="checkbox" v-model="hideWhitespace" class="sr-only" />
                          <div class="w-4 h-4 border rounded border-gray-300 dark:border-gray-600 group-hover:border-primary-500 transition-colors flex items-center justify-center font-bold" :class="{ 'bg-primary-500 border-primary-500': hideWhitespace }">
                            <Check v-show="hideWhitespace" class="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <div class="ml-2">
                          <div class="text-gray-900 dark:text-white font-medium">{{ $t('compare.diffView.hideWhitespace') }}</div>
                          <div class="text-[10px] text-gray-400 mt-0.5 leading-tight">{{ $t('compare.diffView.hideWhitespaceDesc') }}</div>
                        </div>
                      </label>
                      <label class="flex items-start cursor-pointer group mt-3">
                        <div class="relative flex items-center mt-0.5">
                          <input type="checkbox" v-model="internalIgnoreCase" class="sr-only" />
                          <div class="w-4 h-4 border rounded border-gray-300 dark:border-gray-600 group-hover:border-primary-500 transition-colors flex items-center justify-center font-bold" :class="{ 'bg-primary-500 border-primary-500': internalIgnoreCase }">
                            <Check v-show="internalIgnoreCase" class="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <div class="ml-2">
                          <div class="text-gray-900 dark:text-white font-medium">{{ $t('compare.diffView.ignoreCase') }}</div>
                          <div class="text-[10px] text-gray-400 mt-0.5 leading-tight">{{ $t('compare.diffView.ignoreCaseDesc') }}</div>
                        </div>
                      </label>
                    </div>
                    <!-- Line Wrapping -->
                    <div>
                      <h4 class="font-bold text-gray-500 uppercase text-[9px] mb-2">{{ $t('compare.diffView.display') }}</h4>
                      <label class="flex items-start cursor-pointer group">
                        <div class="relative flex items-center mt-0.5">
                          <input type="checkbox" v-model="wrapLines" class="sr-only" />
                          <div class="w-4 h-4 border rounded border-gray-300 dark:border-gray-600 group-hover:border-primary-500 transition-colors flex items-center justify-center font-bold" :class="{ 'bg-primary-500 border-primary-500': wrapLines }">
                            <Check v-show="wrapLines" class="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <div class="ml-2">
                          <div class="text-gray-900 dark:text-white font-medium">{{ $t('compare.diffView.wrapLines') }}</div>
                        </div>
                      </label>
                    </div>
                    <!-- Diff display -->
                    <div>
                      <h4 class="font-bold text-gray-500 uppercase text-[9px] mb-2">{{ $t('compare.diffView.diffDisplay') }}</h4>
                      <div class="space-y-2">
                        <label v-for="mode in ['Unified', 'Split']" :key="mode" class="flex items-center cursor-pointer group">
                          <input type="radio" :value="mode.toLowerCase()" v-model="viewType" class="sr-only" />
                          <div class="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 group-hover:border-primary-500 transition-colors flex items-center justify-center p-1" :class="{ 'border-primary-500': viewType === mode.toLowerCase() }">
                            <div v-show="viewType === mode.toLowerCase()" class="w-2 h-2 rounded-full bg-primary-500"></div>
                          </div>
                          <span class="ml-2 text-gray-900 dark:text-white font-medium">{{ $t('compare.diffView.' + mode.toLowerCase() + 'Mode') }}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>

        <!-- Resize Handle (Internal) -->
        <div 
          @mousedown="startResize"
          class="absolute inset-y-0 w-[1px] bg-gray-200 dark:bg-gray-800 hover:bg-primary-500 cursor-col-resize z-30 transition-colors duration-200 group/resizer"
          :style="{ left: `calc(${leftPaneWidth}% - 1px)` }"
          :class="{ 'bg-primary-500 w-[2px] shadow-[0_0_8px_rgba(59,130,246,0.5)]': isResizing }"
        >
          <!-- Hover trigger area (wider than the visible line) -->
          <div class="absolute inset-y-0 -left-1.5 -right-1.5 cursor-col-resize"></div>
        </div>

        <!-- Scrollable Content Container -->
        <div class="flex-1 flex overflow-hidden relative bg-gray-50 dark:bg-gray-950">
          <div v-if="isEmptySource && isEmptyTarget" class="placeholder-empty flex items-center justify-center w-full h-full text-gray-600 italic">
            {{ $t('compare.diffView.sourceEmpty') }}
          </div>
          
          <div v-else 
            class="flex-1 flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar-diff relative ddl-container"
            ref="sharedScrollContainer"
          >
            <div class="pb-4 flex flex-col w-full min-h-full">
              <template v-for="(chunk, cIdx) in alignedChunks" :key="'sp-chk-' + chunk.id">
                
                <!-- VISIBLE ROWS: Render Both Panes Side-by-Side per row -->
                <template v-if="chunk.type === 'visible'">
                  <div 
                    v-for="(row, idx) in chunk.rows" 
                    :key="'sp-row-' + chunk.id + '-' + idx"
                    class="flex w-full min-w-0"
                  >
                    <!-- Source Side -->
                    <div 
                      :style="{ width: leftPaneWidth + '%' }"
                      class="shrink-0 flex line-row group border-r border-gray-100 dark:border-[#30363d]/50"
                      :class="getLineClass(row.source.type)"
                    >
                      <div class="line-number w-12 shrink-0 text-right px-2 py-0.5 text-gray-400 dark:text-gray-600 select-none border-r border-gray-100 dark:border-[#30363d] group-hover:text-gray-600 dark:group-hover:text-gray-400 bg-gray-100/30 dark:bg-gray-800/20">
                        {{ row.source.line || '' }}
                      </div>
                      <div class="line-marker w-5 shrink-0 flex items-center justify-center opacity-70 select-none font-bold">
                        {{ row.source.type === 'added' ? '+' : '' }}
                      </div>
                      <div 
                        class="line-content source-content px-2 py-0.5 grow ddl-code overflow-x-auto no-scrollbar"
                        :class="[wrapLines ? 'whitespace-pre-wrap break-words' : 'whitespace-pre']"
                        @scroll="handleHorizontalScroll($event, 'source')"
                        v-html="highlightNavLinks(row.source.highlighted || row.source.content)"
                        @click="handleCodeClick"
                      ></div>
                    </div>

                    <!-- Target Side -->
                    <div 
                      class="flex-1 flex line-row group"
                      :class="getLineClass(row.target.type)"
                    >
                      <div class="line-number w-12 shrink-0 text-right px-2 py-0.5 text-gray-400 dark:text-gray-600 select-none border-r border-gray-100 dark:border-[#30363d] group-hover:text-gray-600 dark:group-hover:text-gray-400 bg-gray-100/30 dark:bg-gray-800/20">
                        {{ row.target.line || '' }}
                      </div>
                      <div class="line-marker w-5 shrink-0 flex items-center justify-center opacity-70 select-none font-bold">
                        {{ row.target.type === 'removed' ? '-' : '' }}
                      </div>
                      <div 
                        class="line-content target-content px-2 py-0.5 grow ddl-code overflow-x-auto no-scrollbar"
                        :class="[wrapLines ? 'whitespace-pre-wrap break-words' : 'whitespace-pre']"
                        @scroll="handleHorizontalScroll($event, 'target')"
                        v-html="highlightNavLinks(row.target.highlighted || row.target.content)"
                        @click="handleCodeClick"
                      ></div>
                    </div>
                  </div>
                </template>

                <!-- COLLAPSED BLOCK -->
                <div v-else class="w-full flex items-center justify-center bg-gray-50/30 dark:bg-gray-900/30 border-y py-2 border-gray-100 dark:border-[#30363d]/50 relative group/expandbtn shadow-inner isolate" style="height: 48px">
                   <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div class="absolute top-0 bottom-0 w-[1px] bg-gray-200 dark:bg-gray-800/50 pointer-events-none z-0" :style="{ left: `calc(${leftPaneWidth}% - 1px)` }"></div>
                   </div>

                   <div class="flex items-center isolate z-10 bg-white dark:bg-gray-800 rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10 p-0.5 pointer-events-auto transition-transform hover:scale-105">
                     <button class="w-8 h-6 flex items-center justify-center rounded-l-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-primary-500 transition-colors" @click.stop="expandFromTop(cIdx)" :disabled="cIdx === 0" :class="{ 'opacity-30 cursor-not-allowed': cIdx === 0 }">
                       <ChevronDown class="w-4 h-4" />
                     </button>
                     <button class="px-3 h-6 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" @click.stop="expandAll(cIdx)">
                       {{ chunk.rows.length }} Lines
                     </button>
                     <button class="w-8 h-6 flex items-center justify-center rounded-r-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-primary-500 transition-colors" @click.stop="expandFromBottom(cIdx)" :disabled="cIdx >= alignedChunks.length - 1" :class="{ 'opacity-30 cursor-not-allowed': cIdx >= alignedChunks.length - 1 }">
                       <ChevronUp class="w-4 h-4" />
                     </button>
                   </div>
                </div>

              </template>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- UNIFIED VIEW MODE -->
    <div 
      v-else
      class="flex-1 flex flex-col min-h-0 overflow-hidden"
    >
      <div class="sticky top-0 z-10 bg-gray-100 dark:bg-gray-900 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shrink-0 h-10">
        <span class="font-bold text-primary-600 dark:text-primary-400 opacity-80 uppercase tracking-widest text-[10px]">{{ $t('compare.diffView.unified', { source: sourceLabel, target: targetLabel }) }}</span>
        
        <div class="flex items-center gap-3">


          <!-- Settings inside header -->
          <div class="relative" ref="settingsRefUnified">
            <button 
              @click="showSettings = !showSettings"
              class="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
              :class="{ 'text-primary-500 bg-gray-200 dark:bg-gray-700': showSettings }"
            >
              <Settings class="w-3.5 h-3.5" />
            </button>
  
            <!-- Dropdown (same logic as above) -->
            <div v-if="showSettings" class="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 z-50 text-xs text-gray-600 dark:text-gray-300 pointer-events-auto">
              <h3 class="font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-widest text-[10px]">{{ $t('compare.diffView.settings') }}</h3>
              <div class="space-y-4 text-left">
                <div>
                  <h4 class="font-bold text-gray-500 uppercase text-[9px] mb-2">{{ $t('compare.diffView.whitespace') }}</h4>
                  <label class="flex items-start cursor-pointer group">
                    <div class="relative flex items-center mt-0.5">
                      <input type="checkbox" v-model="hideWhitespace" class="sr-only" />
                      <div class="w-4 h-4 border rounded border-gray-300 dark:border-gray-600 group-hover:border-primary-500 transition-colors flex items-center justify-center font-bold" :class="{ 'bg-primary-500 border-primary-500': hideWhitespace }">
                        <Check v-show="hideWhitespace" class="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <div class="ml-2">
                      <div class="text-gray-900 dark:text-white font-medium">{{ $t('compare.diffView.hideWhitespace') }}</div>
                      <div class="text-[10px] text-gray-400 mt-0.5 leading-tight">{{ $t('compare.diffView.hideWhitespaceDesc') }}</div>
                    </div>
                  </label>
                  <label class="flex items-start cursor-pointer group mt-3">
                    <div class="relative flex items-center mt-0.5">
                      <input type="checkbox" v-model="internalIgnoreCase" class="sr-only" />
                      <div class="w-4 h-4 border rounded border-gray-300 dark:border-gray-600 group-hover:border-primary-500 transition-colors flex items-center justify-center font-bold" :class="{ 'bg-primary-500 border-primary-500': internalIgnoreCase }">
                        <Check v-show="internalIgnoreCase" class="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <div class="ml-2">
                      <div class="text-gray-900 dark:text-white font-medium">{{ $t('compare.diffView.ignoreCase') }}</div>
                      <div class="text-[10px] text-gray-400 mt-0.5 leading-tight">{{ $t('compare.diffView.ignoreCaseDesc') }}</div>
                    </div>
                  </label>
                </div>
  
                <!-- Line Wrapping -->
                <div>
                  <h4 class="font-bold text-gray-500 uppercase text-[9px] mb-2">{{ $t('compare.diffView.display') }}</h4>
                  <label class="flex items-start cursor-pointer group">
                    <div class="relative flex items-center mt-0.5">
                      <input type="checkbox" v-model="wrapLines" class="sr-only" />
                      <div class="w-4 h-4 border rounded border-gray-300 dark:border-gray-600 group-hover:border-primary-500 transition-colors flex items-center justify-center font-bold" :class="{ 'bg-primary-500 border-primary-500': wrapLines }">
                        <Check v-show="wrapLines" class="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <div class="ml-2">
                      <div class="text-gray-900 dark:text-white font-medium">{{ $t('compare.diffView.wrapLines') }}</div>
                    </div>
                  </label>
                </div>
  
                <div>
                  <h4 class="font-bold text-gray-500 uppercase text-[9px] mb-2">{{ $t('compare.diffView.diffDisplay') }}</h4>
                  <div class="space-y-2">
                    <label v-for="mode in ['Unified', 'Split']" :key="mode" class="flex items-center cursor-pointer group">
                      <input type="radio" :value="mode.toLowerCase()" v-model="viewType" class="sr-only" />
                      <div class="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 group-hover:border-primary-500 transition-colors flex items-center justify-center p-1" :class="{ 'border-primary-500': viewType === mode.toLowerCase() }">
                        <div v-show="viewType === mode.toLowerCase()" class="w-2 h-2 rounded-full bg-primary-500"></div>
                      </div>
                      <span class="ml-2 text-gray-900 dark:text-white font-medium">{{ $t('compare.diffView.' + mode.toLowerCase() + 'Mode') }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-auto custom-scrollbar-diff relative ddl-container">
          <template v-for="(chunk, cIdx) in unifiedChunks" :key="'uni-chk-' + chunk.id">
            <template v-if="chunk.type === 'visible'">
              <div 
                v-for="(row, idx) in chunk.rows" 
                :key="'uni-' + chunk.id + '-' + idx"
                class="flex line-row group"
                :class="getLineClass(row.type)"
              >
                <div class="line-numbers w-24 shrink-0 flex border-r border-gray-100 dark:border-[#30363d] select-none text-[10px]">
                  <div class="w-12 text-right px-2 py-0.5 text-gray-400 dark:text-gray-600 border-r border-gray-50 dark:border-gray-800/50">
                    {{ row.sourceLine || '' }}
                  </div>
                  <div class="w-12 text-right px-2 py-0.5 text-gray-400 dark:text-gray-600">
                    {{ row.targetLine || '' }}
                  </div>
                </div>
                <div class="line-marker w-5 shrink-0 flex items-center justify-center opacity-70 select-none font-bold">
                  {{ row.type === 'added' ? '+' : (row.type === 'removed' ? '-' : '') }}
                </div>
                <div 
                  class="line-content px-2 py-0.5 grow ddl-code min-w-0"
                  :class="[
                    wrapLines ? 'whitespace-pre-wrap break-words overflow-hidden' : 'whitespace-pre',
                    { 'is-navigating': isNavigating }
                  ]"
                  v-html="highlightNavLinks(row.highlighted || row.content)"
                  @click="handleCodeClick"
                ></div>
              </div>
            </template>
            <div v-else class="flex items-center justify-center bg-gray-50/30 dark:bg-gray-900/30 border-y py-2 border-gray-100 dark:border-[#30363d]/50 relative group/expandbtn shadow-inner" style="height: 48px">
                 <div class="flex items-center isolate z-10 bg-white dark:bg-gray-800 rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10 p-0.5 pointer-events-auto transition-transform hover:scale-105">
                   <button class="w-8 h-6 flex items-center justify-center rounded-l-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-primary-500 transition-colors" @click.stop="expandFromTop(cIdx)" :disabled="cIdx === 0" :class="{ 'opacity-30 cursor-not-allowed': cIdx === 0 }" title="Expand Down">
                     <ChevronDown class="w-4 h-4" />
                   </button>

                   <button class="px-3 h-6 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" @click.stop="expandAll(cIdx)" title="Expand All">
                     <ChevronsUpDown class="w-3 h-3 mr-1 opacity-50" />
                     {{ chunk.rows.length }} Lines
                   </button>

                   <button class="w-8 h-6 flex items-center justify-center rounded-r-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-primary-500 transition-colors" @click.stop="expandFromBottom(cIdx)" :disabled="cIdx >= unifiedChunks.length - 1" :class="{ 'opacity-30 cursor-not-allowed': cIdx >= unifiedChunks.length - 1 }" title="Expand Up">
                     <ChevronUp class="w-4 h-4" />
                   </button>
                 </div>
            </div>
          </template>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import prismjs from 'prismjs'
const Prism = prismjs;
import 'prismjs/components/prism-sql'
import { Settings, Check, ChevronDown, ChevronUp, ChevronsUpDown, Sparkles } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import AIReviewPanel from '../ai/AIReviewPanel.vue'
import { getNavigatableWord, highlightLinks } from '@/utils/navigation'

const appStore = useAppStore()

const props = defineProps<{
  sourceDdl: string | null
  targetDdl: string | null
  sourceLabel: string
  targetLabel: string
  status: string
  diffOptions?: { showChangesOnly?: boolean, ignoreCase?: boolean, wrapLines?: boolean }
  navigatableNames?: string[]
}>()

const emit = defineEmits(['navigate-to-definition'])

const sharedScrollContainer = ref<HTMLElement | null>(null)
const sourcePane = ref<HTMLElement | null>(null)
const targetPane = ref<HTMLElement | null>(null)

const leftPaneWidth = ref(50)
const isResizing = ref(false)

const showSettings = ref(false)
const settingsRef = ref<HTMLElement | null>(null)
const settingsRefUnified = ref<HTMLElement | null>(null)
const viewType = ref<'split' | 'unified'>('split')
const hideWhitespace = ref(false)
const internalIgnoreCase = ref(props.diffOptions?.ignoreCase ?? true)
const wrapLines = ref(props.diffOptions?.wrapLines ?? false)
const isAIReviewOpen = ref(false)

const isEmptySource = computed(() => !props.sourceDdl || props.status === 'missing_in_source')
const isEmptyTarget = computed(() => !props.targetDdl || props.status === 'missing_in_target' || props.status === 'missing')

// Expand Config
const MathMin = Math.min;
const CONTEXT_LINES = 3;
const EXPAND_STEP = 20;

interface ViewChunk {
  id: string;
  type: 'visible' | 'collapsed';
  rows: any[];
}

const alignedChunks = ref<ViewChunk[]>([]);
let chunkIdCounter = 0;

const highlightedSourceLines = computed(() => {
  if (!props.sourceDdl) return []
  const normalize = (s: string) => s.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
                                    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                                    .replace(/&amp;/g, '&');
  const html = Prism.highlight(normalize(props.sourceDdl), Prism.languages.sql, 'sql')
  return html.split('\n')
})

const highlightedTargetLines = computed(() => {
  if (!props.targetDdl) return []
  const normalize = (s: string) => s.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
                                    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                                    .replace(/&amp;/g, '&');
  const html = Prism.highlight(normalize(props.targetDdl), Prism.languages.sql, 'sql')
  return html.split('\n')
})

watch([() => props.sourceDdl, () => props.targetDdl, () => props.diffOptions?.showChangesOnly, hideWhitespace, internalIgnoreCase], () => {
  const unescapeHtml = (s: string) => s ? s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') : ''
  const oldLines = props.sourceDdl ? unescapeHtml(props.sourceDdl).split('\n') : []
  const newLines = props.targetDdl ? unescapeHtml(props.targetDdl).split('\n') : []

  const baseRows = computeAlignedDiff(oldLines, newLines)
  
  const segments: { isDiff: boolean, rows: any[] }[] = [];
  let currentSegment: { isDiff: boolean, rows: any[] } | null = null;
  
  for (const row of baseRows) {
    const isDiff = row.source.type !== 'equal' || row.target.type !== 'equal';
    if (!currentSegment) {
      currentSegment = { isDiff, rows: [row] };
    } else if (currentSegment.isDiff === isDiff) {
      currentSegment.rows.push(row);
    } else {
      segments.push(currentSegment);
      currentSegment = { isDiff, rows: [row] };
    }
  }
  if (currentSegment) segments.push(currentSegment);
  
  const chunks: ViewChunk[] = [];
  
  const hideUnchanged = props.diffOptions?.showChangesOnly !== false; // Default to true if undefined
  
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.isDiff || !hideUnchanged) {
      chunks.push({ id: `c${chunkIdCounter++}`, type: 'visible', rows: seg.rows });
    } else {
      const isFirst = i === 0;
      const isLast = i === segments.length - 1;
      let keepTop = isFirst ? 0 : CONTEXT_LINES;
      let keepBottom = isLast ? 0 : CONTEXT_LINES;
      
      if (seg.rows.length <= keepTop + keepBottom) {
        chunks.push({ id: `c${chunkIdCounter++}`, type: 'visible', rows: seg.rows });
      } else {
        if (keepTop > 0) chunks.push({ id: `c${chunkIdCounter++}`, type: 'visible', rows: seg.rows.slice(0, keepTop) });
        const collapsedRows = seg.rows.slice(keepTop, seg.rows.length - keepBottom);
        if (collapsedRows.length > 0) chunks.push({ id: `c${chunkIdCounter++}`, type: 'collapsed', rows: collapsedRows });
        if (keepBottom > 0) chunks.push({ id: `c${chunkIdCounter++}`, type: 'visible', rows: seg.rows.slice(seg.rows.length - keepBottom) });
      }
    }
  }
  
  const mergedChunks: ViewChunk[] = [];
  for (const c of chunks) {
    if (c.rows.length === 0) continue;
    const last = mergedChunks[mergedChunks.length - 1];
    if (last && last.type === 'visible' && c.type === 'visible') {
      last.rows.push(...c.rows);
    } else {
      mergedChunks.push(c);
    }
  }
  
  alignedChunks.value = mergedChunks;
}, { immediate: true })

const unifiedChunks = computed(() => {
  return alignedChunks.value.map(chunk => {
    if (chunk.type === 'collapsed') {
      return { id: chunk.id, type: 'collapsed', rows: chunk.rows }
    }
    const result: any[] = []
    chunk.rows.forEach(row => {
      if (row.source.type === 'equal' && row.target.type === 'equal') {
        result.push({
          sourceLine: row.source.line,
          targetLine: row.target.line,
          content: row.source.content,
          highlighted: row.source.highlighted,
          type: 'equal'
        })
      } else {
        if (row.source.type !== 'empty') {
          result.push({
            sourceLine: row.source.line,
            targetLine: null,
            content: row.source.content,
            highlighted: row.source.highlighted,
            type: 'removed'
          })
        }
        if (row.target.type !== 'empty') {
          result.push({
            sourceLine: null,
            targetLine: row.target.line,
            content: row.target.content,
            highlighted: row.target.highlighted,
            type: 'added'
          })
        }
      }
    })
    return { id: chunk.id, type: 'visible', rows: result }
  })
})

const mergeVisibleChunksAction = () => {
  const merged: ViewChunk[] = [];
  for (const c of alignedChunks.value) {
    if (c.rows.length === 0) continue;
    const last = merged[merged.length - 1];
    if (last && last.type === 'visible' && c.type === 'visible') {
      last.rows.push(...c.rows);
    } else {
      merged.push(c);
    }
  }
  alignedChunks.value = merged;
}

const expandFromTop = (index: number) => {
  const chunk = alignedChunks.value[index];
  if (chunk.type !== 'collapsed') return;
  const takeCount = MathMin(EXPAND_STEP, chunk.rows.length);
  const revealed = chunk.rows.splice(0, takeCount);
  if (alignedChunks.value[index - 1] && alignedChunks.value[index - 1].type === 'visible') {
    alignedChunks.value[index - 1].rows.push(...revealed);
  } else {
    alignedChunks.value.splice(index, 0, { id: `c${chunkIdCounter++}`, type: 'visible', rows: revealed });
  }
  if (chunk.rows.length === 0) alignedChunks.value.splice(index, 1);
  mergeVisibleChunksAction();
};

const expandFromBottom = (index: number) => {
  const chunk = alignedChunks.value[index];
  if (chunk.type !== 'collapsed') return;
  const takeCount = MathMin(EXPAND_STEP, chunk.rows.length);
  const revealed = chunk.rows.splice(chunk.rows.length - takeCount, takeCount);
  if (alignedChunks.value[index + 1] && alignedChunks.value[index + 1].type === 'visible') {
    alignedChunks.value[index + 1].rows.unshift(...revealed);
  } else {
    alignedChunks.value.splice(index + 1, 0, { id: `c${chunkIdCounter++}`, type: 'visible', rows: revealed });
  }
  if (chunk.rows.length === 0) alignedChunks.value.splice(index, 1);
  mergeVisibleChunksAction();
};

const expandAll = (index: number) => {
  alignedChunks.value[index].type = 'visible';
  mergeVisibleChunksAction();
};



function computeAlignedDiff(sourceLines: string[], targetLines: string[]) {
  const compare = (s1: string | undefined, s2: string | undefined) => {
    if (s1 === undefined || s2 === undefined) return false
    let str1 = hideWhitespace.value ? s1.trim() : s1
    let str2 = hideWhitespace.value ? s2.trim() : s2
    if (internalIgnoreCase.value) {
      str1 = str1.toLowerCase()
      str2 = str2.toLowerCase()
    }
    return str1 === str2
  }

  const n = sourceLines.length
  const m = targetLines.length
  
  // LCS Matrix
  const matrix: number[][] = Array(n + 1).fill(0).map(() => Array(m + 1).fill(0))
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (compare(sourceLines[i - 1], targetLines[j - 1])) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1
      } else {
        matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1])
      }
    }
  }

  const result: any[] = []
  let i = n
  let j = m

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && compare(sourceLines[i - 1], targetLines[j - 1])) {
      // MATCH
      result.unshift({
        source: { line: i, content: sourceLines[i - 1], highlighted: highlightedSourceLines.value[i - 1], type: 'equal' },
        target: { line: j, content: targetLines[j - 1], highlighted: highlightedTargetLines.value[j - 1], type: 'equal' }
      })
      i--
      j--
    } else if (i > 0 && (j === 0 || matrix[i - 1][j] >= matrix[i][j - 1])) {
      // Source has extra line (ADDED)
      result.unshift({
        source: { line: i, content: sourceLines[i - 1], highlighted: highlightedSourceLines.value[i - 1], type: 'added' },
        target: { line: null, content: '', highlighted: '', type: 'empty' }
      })
      i--
    } else {
      // Target has extra line (REMOVED)
      result.unshift({
        source: { line: null, content: '', highlighted: '', type: 'empty' },
        target: { line: j, content: targetLines[j - 1], highlighted: highlightedTargetLines.value[j - 1], type: 'removed' }
      })
      j--
    }
  }

  return result
}

function getLineClass(type: string) {
  switch (type) {
    case 'removed': return 'line-removed'
    case 'added': return 'line-added'
    case 'empty': return 'line-empty'
    default: return ''
  }
}


const handleHorizontalScroll = (event: Event, type: 'source' | 'target') => {
  if (wrapLines.value) return;
  
  const target = event.target as HTMLElement;
  const scrollLeft = target.scrollLeft;
  const container = sharedScrollContainer.value;
  if (!container) return;

  const className = type === 'source' ? '.source-content' : '.target-content';
  const elements = container.querySelectorAll(className);
  
  elements.forEach((el: any) => {
    if (el !== target && el.scrollLeft !== scrollLeft) {
      el.scrollLeft = scrollLeft;
    }
  });
}

// Resizing logic
const startResize = () => {
  isResizing.value = true
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
}

const handleResize = (e: MouseEvent) => {
  if (!isResizing.value) return
    const viewRect = document.querySelector('.mirror-diff-view')?.getBoundingClientRect()
    if (viewRect) {
      const relativeX = e.clientX - viewRect.left
      const percentage = (relativeX / viewRect.width) * 100
      leftPaneWidth.value = Math.max(10, Math.min(90, percentage))
    }
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
}

const isNavigating = ref(false)

const handleGlobalKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Meta' || e.key === 'Control') isNavigating.value = true
}
const handleGlobalKeyup = (e: KeyboardEvent) => {
  if (e.key === 'Meta' || e.key === 'Control') isNavigating.value = false
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('keyup', handleGlobalKeyup)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('keyup', handleGlobalKeyup)
})

const highlightNavLinks = (html: string) => {
  return highlightLinks(html, props.navigatableNames || [])
}

const handleCodeClick = (event: MouseEvent) => {
  const word = getNavigatableWord(event, props.navigatableNames || [])
  if (word) {
    emit('navigate-to-definition', word)
  }
}

// Reset scroll on content change
watch(() => props.sourceDdl, () => {
  if (sourcePane.value) sourcePane.value.scrollTop = 0
  if (targetPane.value) targetPane.value.scrollTop = 0
})

const handleClickOutside = (event: MouseEvent) => {
   const isOutsideSplit = settingsRef.value && !settingsRef.value.contains(event.target as Node)
   const isOutsideUnified = settingsRefUnified.value && !settingsRefUnified.value.contains(event.target as Node)

   if (showSettings.value && isOutsideSplit && isOutsideUnified) {
     showSettings.value = false
   }
}

const handleKeydown = (e: KeyboardEvent) => {
  // Opt + Z (Alt + Z)
  if (e.altKey && e.code === 'KeyZ') {
    e.preventDefault()
    wrapLines.value = !wrapLines.value
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  window.removeEventListener('keydown', handleKeydown)
  stopResize()
})
</script>

<style scoped>
.ddl-container {
  overflow-y: auto;
}

.no-scrollbar-y::-webkit-scrollbar {
  width: 0 !important;
  display: none !important;
}

.ddl-code {
  color: var(--code-text);
}

/* Syntax Highlighting Styles using Theme Variables */
:deep(.token.keyword) { color: var(--code-keyword); font-weight: bold; }
:deep(.token.string) { color: var(--code-string); }
:deep(.token.comment) { color: var(--code-comment); font-style: italic; }
:deep(.token.function) { color: var(--code-function); }
:deep(.token.number) { color: var(--code-number); }
:deep(.token.operator) { color: var(--code-operator); }
:deep(.token.punctuation) { color: var(--code-punctuation); }
:deep(.token.boolean) { color: var(--code-keyword); }
:deep(.token.property) { color: var(--code-function); }
:deep(.token.comment *) { color: inherit !important; }

.underline-navigatable {
  text-decoration: underline;
  text-decoration-color: var(--primary-500);
  text-underline-offset: 4px;
}

.line-row {
  transition: background 0.1s ease;
}

.line-removed {
  background-color: rgba(248, 81, 73, 0.08);
}
.line-removed .line-marker {
  color: #cf222e;
  opacity: 0.8;
}
.dark .line-removed {
  background-color: rgba(248, 81, 73, 0.12);
}
.dark .line-removed .line-marker {
  color: #f85149;
}

.line-added {
  background-color: rgba(63, 185, 80, 0.08);
}
.line-added .line-marker {
  color: #1a7f37;
  opacity: 0.8;
}
.dark .line-added {
  background-color: rgba(63, 185, 80, 0.12);
}
.dark .line-added .line-marker {
  color: #3fb950;
}

.line-empty {
  background-color: transparent;
  opacity: 0.15;
  background-image: linear-gradient(45deg, #e1e4e8 25%, transparent 25%, transparent 50%, #e1e4e8 50%, #e1e4e8 75%, transparent 75%, transparent);
  background-size: 10px 10px;
}
.dark .line-empty {
  background-color: #0d1117;
  background-image: linear-gradient(45deg, #1d2127 25%, transparent 25%, transparent 50%, #1d2127 50%, #1d2127 75%, transparent 75%, transparent);
}

.placeholder-empty {
  background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.01) 10px, rgba(255,255,255,0.01) 20px);
}

.custom-scrollbar-diff::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar-diff::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar-diff::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.6);
  border-radius: 10px;
}

.custom-scrollbar-diff:hover::-webkit-scrollbar-thumb {
  background: rgba(139, 148, 158, 0.4);
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>
