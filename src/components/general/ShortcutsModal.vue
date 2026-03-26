<template>
  <teleport to="body">
    <Transition name="fade">
      <div 
        v-if="isOpen"
        class="fixed inset-0 z-[60] flex items-center justify-center px-4 sm:px-0"
      >
        <!-- Backdrop -->
        <div 
          class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
          @click="$emit('close')"
        ></div>

        <!-- Modal Content -->
        <Transition name="scale">
          <div 
            v-if="isOpen"
            class="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
            @click.stop
          >
            <div class="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-primary-500 text-white">
                  <Command class="w-5 h-5" />
                </div>
                <div>
                  <h2 class="text-xl font-extrabold text-gray-900 dark:text-white leading-none mb-1">{{ $t('shortcuts.title', 'Keyboard Shortcuts') }}</h2>
                  <p class="text-xs text-gray-400 font-medium uppercase tracking-wider">{{ $t('shortcuts.subtitle', 'Power User Commands') }}</p>
                </div>
              </div>
              <button @click="$emit('close')" class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <X class="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div class="p-8 max-h-[70vh] overflow-y-auto no-scrollbar grid grid-cols-2 gap-x-12 gap-y-8">
              <div v-for="(group, category) in groupedShortcuts" :key="category" class="space-y-4">
                <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500 border-b border-primary-500/10 pb-2">
                  {{ category }}
                </h3>
                
                <div v-for="s in group" :key="s.id" class="flex items-center justify-between group">
                  <span class="text-xs font-bold text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors cursor-default">
                    {{ s.label }}
                  </span>
                  <div class="flex items-center gap-1">
                    <kbd v-if="s.meta" class="px-1.5 py-1 text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md border-b-2 border-gray-300 dark:border-gray-700 min-w-[24px] text-center shadow-sm">
                      {{ isMac ? '⌘' : 'Ctrl' }}
                    </kbd>
                    <kbd v-if="s.shift" class="px-1.5 py-1 text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md border-b-2 border-gray-300 dark:border-gray-700 min-w-[24px] text-center shadow-sm">
                      ⇧
                    </kbd>
                    <kbd v-for="key in s.keys" :key="key" class="px-1.5 py-1 text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md border-b-2 border-gray-300 dark:border-gray-700 min-w-[24px] text-center shadow-sm uppercase">
                      {{ key }}
                    </kbd>
                  </div>
                </div>
              </div>
            </div>

            <div class="px-8 py-4 bg-gray-50 dark:bg-gray-800/50 text-center">
              <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">
                {{ $t('shortcuts.footer', 'Press ESC to close') }}
              </p>
              <div class="flex items-center justify-center gap-4 mt-2">
                <button 
                  v-if="isDev"
                  @click="testUpdate"
                  class="px-3 py-1 text-[9px] font-black uppercase tracking-tighter bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded border border-amber-200 dark:border-amber-800/50 hover:bg-amber-200 transition-colors"
                >
                  Test Auto-Update
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { Command, X } from 'lucide-vue-next'
import { useShortcutStore } from '@/stores/shortcut'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close'])

const shortcutStore = useShortcutStore()
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
const isDev = import.meta.env.DEV

const handleEsc = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleEsc)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEsc)
})

const groupedShortcuts = computed(() => {
  const groups: Record<string, any[]> = {}
  shortcutStore.shortcuts.forEach(s => {
    if (!groups[s.category]) groups[s.category] = []
    groups[s.category].push(s)
  })
  return groups
})

const testUpdate = () => {
  if (window.electronAPI?.debugTestUpdate) {
    window.electronAPI.debugTestUpdate('available')
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.scale-enter-active, .scale-leave-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.scale-enter-from, .scale-leave-to { opacity: 0; transform: scale(0.95); }

kbd {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
</style>
