<template>
  <teleport to="body">
    <Transition name="fade">
      <div 
        v-if="isOpen && report"
        class="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0"
      >
        <!-- Backdrop -->
        <div 
          class="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity" 
          @click="dismiss"
        ></div>

        <!-- Modal Content -->
        <Transition name="scale">
          <div 
            v-if="isOpen && report"
            class="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
            @click.stop
          >
            <!-- Background Gradient Decorations -->
            <div class="absolute top-0 left-0 w-full h-48 bg-gradient-to-br from-emerald-600 to-teal-700 opacity-10 dark:opacity-20"></div>
            <div class="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div class="absolute -top-24 -left-24 w-64 h-64 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

            <!-- Content Container -->
            <div class="relative z-10 px-8 py-8">
              
              <!-- Header -->
              <div class="flex items-center gap-3 mb-2">
                <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <Database v-if="!isAppUpdate" class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <Zap v-else class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                    {{ isAppUpdate ? "What's New" : "Database Updated" }}
                  </h2>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ isAppUpdate ? `Version ${report.toVersion} is ready` : "Internal storage migrated automatically" }}
                  </p>
                </div>
              </div>

              <!-- Version Badge -->
              <div class="flex items-center gap-2 mb-6 mt-4">
                <span class="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-mono">
                  {{ report.fromVersion || '?' }}
                </span>
                <ArrowRight class="w-3 h-3 text-gray-400" />
                <span class="px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold">
                  {{ report.toVersion }}
                </span>
              </div>

              <!-- Changes List -->
              <div class="space-y-2 max-h-64 overflow-y-auto pr-1 mb-6 scrollbar-thin">
                <div 
                  v-for="(change, idx) in report.changes" 
                  :key="idx"
                  class="group bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <!-- Table Header -->
                  <div 
                    class="flex items-center gap-2 cursor-pointer"
                    @click="toggleExpand(idx)"
                  >
                    <span 
                      class="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold"
                      :class="change.action === 'CREATED' 
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' 
                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'"
                    >
                      {{ change.action === 'CREATED' ? '✦' : '⚡' }}
                    </span>
                    <span class="font-mono text-sm font-semibold text-gray-800 dark:text-gray-200 flex-1">
                      {{ change.table }}
                    </span>
                    <span class="text-[10px] uppercase tracking-wider font-bold"
                      :class="change.action === 'CREATED' 
                        ? 'text-green-500' 
                        : 'text-amber-500'"
                    >
                      {{ change.action }}
                    </span>
                    <ChevronDown 
                      class="w-3.5 h-3.5 text-gray-400 transition-transform duration-200" 
                      :class="{ 'rotate-180': expandedItems.has(idx) }"
                    />
                  </div>

                  <!-- Expandable Details -->
                  <Transition name="slide">
                    <div v-if="expandedItems.has(idx)" class="mt-2 pl-7 space-y-1">
                      <p 
                        v-for="(detail, dIdx) in change.details" 
                        :key="dIdx"
                        class="text-xs text-gray-500 dark:text-gray-400 font-mono leading-relaxed"
                      >
                        {{ detail }}
                      </p>
                    </div>
                  </Transition>
                </div>
              </div>

              <!-- Summary -->
              <p class="text-xs text-gray-400 dark:text-gray-500 text-center mb-5">
                {{ report.changes.length }} table{{ report.changes.length !== 1 ? 's' : '' }} updated · No action required
              </p>

              <!-- Dismiss Button -->
              <button 
                @click="dismiss"
                class="w-full py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transform active:scale-[0.98] transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Got it
              </button>

            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Database, ArrowRight, ChevronDown, Zap } from 'lucide-vue-next'

interface MigrationChange {
  action: 'CREATED' | 'MODIFIED'
  table: string
  details: string[]
}

interface MigrationReport {
  fromVersion?: string
  toVersion: string
  changes: MigrationChange[]
  timestamp: string
}

defineProps<{
  isOpen: boolean
  report: MigrationReport | null
  isAppUpdate?: boolean
}>()

const emit = defineEmits<{
  dismiss: []
}>()

const expandedItems = ref<Set<number>>(new Set())

const toggleExpand = (idx: number) => {
  if (expandedItems.value.has(idx)) {
    expandedItems.value.delete(idx)
  } else {
    expandedItems.value.add(idx)
  }
  // Force reactivity
  expandedItems.value = new Set(expandedItems.value)
}

const dismiss = () => {
  emit('dismiss')
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
}

.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  max-height: 200px;
}

@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 4px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}
</style>
