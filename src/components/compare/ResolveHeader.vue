<script setup lang="ts">
defineProps<{
  sourceName: string
  targetName: string
  conflictCount: number
}>()

defineEmits(['cancel', 'finalize'])
</script>

<template>
  <header class="h-16 flex items-center justify-between border-b border-slate-800 px-6 bg-panel-dark z-20 shrink-0">
    <div class="flex items-center gap-4">
      <div class="bg-primary-600 size-8 rounded flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
        <span class="material-symbols-outlined text-xl">database</span>
      </div>
      <div>
        <h1 class="text-white text-sm font-bold leading-none tracking-wide">AnDB Conflict Resolution</h1>
        <p class="text-slate-500 text-xs mt-1 font-medium">
          {{ sourceName }} <span class="mx-1 text-slate-600">→</span> {{ targetName }}
        </p>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <div 
        v-if="conflictCount > 0"
        class="flex items-center px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-amber-500 text-xs font-bold mr-4 animate-pulse"
      >
        <span class="material-symbols-outlined text-sm mr-1.5">warning</span>
        {{ conflictCount }} CONFLICTS REMAINING
      </div>
      
      <button 
        @click="$emit('cancel')"
        class="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
      >
        Cancel
      </button>
      
      <button 
        @click="$emit('finalize')"
        :disabled="conflictCount > 0"
        class="px-5 py-2 bg-primary-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-primary-600/20 hover:bg-primary-500 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span class="material-symbols-outlined text-lg">check_circle</span>
        Finalize Merge
      </button>
    </div>
  </header>
</template>
