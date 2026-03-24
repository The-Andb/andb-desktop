<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Trash2, AlertTriangle, Loader } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  projectName: string
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()

const confirmationText = ref('')

// Reset input when modal opens
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    confirmationText.value = ''
  }
})

const isConfirmed = computed(() => {
  return confirmationText.value === props.projectName
})
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[150] flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div 
      class="absolute inset-0 bg-gray-950/60 backdrop-blur-md transition-opacity animate-in fade-in duration-300" 
      @click="emit('close')"
    ></div>

    <!-- Modal Content -->
    <div class="relative bg-white dark:bg-gray-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
      <!-- Header -->
      <div class="px-8 pt-8 pb-4 flex flex-col items-center text-center">
        <div class="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          <Trash2 class="w-8 h-8" />
        </div>
        <h2 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Delete Project</h2>
        <p class="text-xs text-gray-500 font-bold uppercase tracking-widest mt-2 px-4">
          You are about to permanently remove this base and all its configurations.
        </p>
      </div>

      <!-- Danger Notice -->
      <div class="mx-8 mt-2 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
        <AlertTriangle class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
           <p class="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest leading-normal">
            Warning
           </p>
           <p class="text-[11px] font-bold text-gray-600 dark:text-gray-400 leading-tight">
             This action is irreversible. All connections and pairs within <span class="font-black text-gray-900 dark:text-gray-200">"{{ projectName }}"</span> will be lost.
           </p>
        </div>
      </div>

      <!-- Confirmation Input -->
      <div class="px-8 pt-6 pb-2">
        <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
          Type <span class="font-black text-gray-900 dark:text-white select-all">{{ projectName }}</span> to confirm
        </label>
        <div class="relative">
          <input 
            v-model="confirmationText"
            type="text"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-red-500 focus:bg-white dark:focus:bg-gray-900 transition-all font-mono"
            :placeholder="projectName"
            @keyup.enter="isConfirmed ? emit('confirm') : null"
          />
        </div>
      </div>

      <!-- Actions -->
      <div class="p-8 flex items-center gap-4">
        <button 
          @click="emit('close')"
          class="flex-1 px-6 py-4 rounded-2xl border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all font-black text-[10px] uppercase tracking-widest"
        >
          Cancel
        </button>
        <button 
          @click="emit('confirm')"
          :disabled="loading || !isConfirmed"
          class="flex-1 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          :class="isConfirmed 
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-xl shadow-red-500/20 active:scale-95'
            : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'"
        >
          <Loader v-if="loading" class="w-4 h-4 animate-spin" />
          Confirm Delete
        </button>
      </div>
    </div>
  </div>
</template>
