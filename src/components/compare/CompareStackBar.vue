<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="transform translate-y-full opacity-0"
    enter-to-class="transform translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="transform translate-y-0 opacity-100"
    leave-to-class="transform translate-y-full opacity-0"
  >
    <div 
      v-if="appStore.isCompareStackVisible"
      class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 p-1.5 pr-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-full shadow-2xl shadow-black/10 border border-gray-200/50 dark:border-gray-700/50"
    >
      <!-- Source Slot -->
      <div 
        class="flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full transition-all border shrink-0 min-w-[140px] max-w-[200px]"
        :class="appStore.compareStack.source ? 'bg-orange-50/50 dark:bg-orange-900/20 border-orange-200/50 dark:border-orange-800/50' : 'bg-gray-50/50 dark:bg-gray-800/50 border-dashed border-gray-200 dark:border-gray-700'"
      >
        <span class="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 shrink-0">SRC</span>
        <Flame v-if="appStore.compareStack.source" class="w-3.5 h-3.5 text-orange-500 shrink-0" />
        <span v-else class="w-3.5 h-3.5 rounded-full border border-dashed border-gray-300 dark:border-gray-500 shrink-0"></span>
        <span class="text-xs font-mono truncate font-medium tracking-tight flex-1 ml-0.5" :class="appStore.compareStack.source ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 italic'">
          {{ appStore.compareStack.source?.name || 'Waiting...' }}
        </span>
        <button v-if="appStore.compareStack.source" @click="appStore.compareStack.source = null" class="w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:bg-orange-100 dark:hover:bg-orange-900/50 hover:text-orange-600 transition-colors shrink-0">
          <X class="w-3 h-3" />
        </button>
      </div>

      <div class="flex items-center justify-center shrink-0">
        <ArrowRightLeft class="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
      </div>

      <!-- Target Slot -->
      <div 
        class="flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-full transition-all border shrink-0 min-w-[140px] max-w-[200px]"
        :class="appStore.compareStack.target ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-800/50' : 'bg-gray-50/50 dark:bg-gray-800/50 border-dashed border-gray-200 dark:border-gray-700'"
      >
        <span class="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 shrink-0">TGT</span>
        <Flame v-if="appStore.compareStack.target" class="w-3.5 h-3.5 text-blue-500 shrink-0" />
        <span v-else class="w-3.5 h-3.5 rounded-full border border-dashed border-gray-300 dark:border-gray-500 shrink-0"></span>
        <span class="text-xs font-mono truncate font-medium tracking-tight flex-1 ml-0.5" :class="appStore.compareStack.target ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 italic'">
          {{ appStore.compareStack.target?.name || 'Waiting...' }}
        </span>
        <button v-if="appStore.compareStack.target" @click="appStore.compareStack.target = null" class="w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-600 transition-colors shrink-0">
          <X class="w-3 h-3" />
        </button>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-1.5 ml-1 shrink-0">
        <button 
          @click="startComparison"
          :disabled="!isReadyToCompare"
          class="px-5 py-2 rounded-full font-bold transition-all flex items-center gap-1.5 shadow-sm text-xs whitespace-nowrap shrink-0"
          :class="isReadyToCompare 
            ? 'bg-[#159688] text-white hover:bg-[#117a6e] hover:scale-[1.02] active:scale-95 shadow-[#159688]/20' 
            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-200 dark:border-gray-700'"
        >
          <Sparkles v-if="isReadyToCompare" class="w-3.5 h-3.5 shrink-0" />
          <span>Compare Now</span>
        </button>
        <button @click="appStore.clearCompareStack()" class="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shrink-0" title="Clear Stack">
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Flame, ArrowRightLeft, Sparkles, X, Trash2 } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const router = useRouter()

const isReadyToCompare = computed(() => {
  return !!(appStore.compareStack.source && appStore.compareStack.target)
})

const startComparison = () => {
  if (!isReadyToCompare.value) return
  
  appStore.compareMode = 'instant'
  appStore.isCompareStackVisible = false // Hide stack while viewing the lab
  router.push('/instant-compare')
}
</script>
