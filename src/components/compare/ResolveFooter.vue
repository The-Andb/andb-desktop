<script setup lang="ts">
defineProps<{
  totalConflicts: number
  resolvedCount: number
  cursorPosition?: { line: number; col: number }
}>()
</script>

<template>
  <footer class="h-8 border-t border-slate-800 bg-panel-dark px-4 flex items-center justify-between text-[10px] text-slate-500 font-medium shrink-0">
    <div class="flex items-center gap-4">
      <span class="flex items-center gap-1 hover:text-slate-300 transition-colors cursor-help">
        <span class="material-symbols-outlined text-[12px]">info</span> Encoding: UTF-8
      </span>
      <span class="flex items-center gap-1 hover:text-slate-300 transition-colors cursor-help">
        <span class="material-symbols-outlined text-[12px]">code</span> PostgreSQL 15.2
      </span>
    </div>

    <div class="flex items-center gap-4">
      <span>{{ totalConflicts }} Conflicts Found</span>
      <span class="text-emerald-500">{{ resolvedCount }} Conflicts Resolved</span>
      
      <span v-if="cursorPosition" class="flex items-center gap-1 text-primary-400">
        <span class="size-1.5 rounded-full bg-primary-500"></span> 
        Ln {{ cursorPosition.line }}, Col {{ cursorPosition.col }}
      </span>
    </div>
  </footer>
</template>
