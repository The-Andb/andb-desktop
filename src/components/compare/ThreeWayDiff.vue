<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  sourceContent: string
  targetContent: string
}>()

interface DiffLine {
  index: number
  source?: string
  target?: string
  status: 'same' | 'conflict' | 'source-only' | 'target-only'
}

// Naive diff implementation for demo purposes (assumes consistent line count/ordering mostly)
const diffLines = computed(() => {
  const sourceLines = props.sourceContent.split('\n')
  const targetLines = props.targetContent.split('\n')
  const maxLines = Math.max(sourceLines.length, targetLines.length)
  
  const result: DiffLine[] = []
  
  for (let i = 0; i < maxLines; i++) {
    const s = sourceLines[i]
    const t = targetLines[i]
    
    let status: DiffLine['status'] = 'same'
    if (s !== t) {
        if (s && t) status = 'conflict' // Both exist but differ (Modify)
        else if (s && !t) status = 'source-only' // Add (Safe)
        else if (!s && t) status = 'target-only' // Deprecated (Warn)
    }
    
    result.push({
      index: i + 1,
      source: s,
      target: t,
      status
    })
  }
  
  return result
})

// Highlight styles
const getLineClass = (status: DiffLine['status'], side: 'source' | 'target') => {
  if (status === 'same') return 'text-slate-300'
  if (status === 'conflict') return 'bg-conflict/10 text-amber-400'
  
  if (side === 'source') {
     if (status === 'source-only') return 'bg-emerald-500/10 text-emerald-400'
     return 'opacity-30'
  } else {
     if (status === 'target-only') return 'bg-slate-700/50 text-slate-500 decoration-line-through' // Deprecated
     return 'opacity-30'
  }
}
</script>

<template>
  <div class="flex-1 flex flex-col overflow-hidden bg-background-dark">
    <!-- Split View -->
    <div class="flex flex-1 overflow-hidden border-b border-slate-800">
      <!-- Source Pane -->
      <div class="flex-1 flex flex-col min-w-0 border-r border-slate-800">
         <div class="h-10 px-4 flex items-center justify-between bg-slate-900 border-b border-slate-800 shrink-0">
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Source (Production)</span>
            <div class="flex items-center gap-2">
                 <span class="size-2 rounded-full bg-emerald-500"></span>
                 <span class="text-[10px] text-slate-400">New additions allowed</span>
            </div>
         </div>
         <div class="flex-1 overflow-auto bg-[#0d1117] p-2 font-mono text-sm leading-6">
            <div 
                v-for="line in diffLines" 
                :key="`s-${line.index}`"
                class="flex"
                :class="line.status === 'conflict' ? 'border-l-2 border-conflict' : 'min-h-[1.5rem]'"
            >
                <span class="w-8 text-right pr-3 text-slate-600 select-none text-[10px] pt-1">{{ line.index }}</span>
                <span class="whitespace-pre flex-1 pl-2" :class="getLineClass(line.status, 'source')">{{ line.source || ' ' }}</span>
            </div>
         </div>
      </div>
      
      <!-- Target Pane -->
      <div class="flex-1 flex flex-col min-w-0">
         <div class="h-10 px-4 flex items-center justify-between bg-slate-900 border-b border-slate-800 shrink-0">
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target (Staging)</span>
            <div class="flex items-center gap-2">
                 <span class="size-2 rounded-full bg-slate-500"></span>
                 <span class="text-[10px] text-slate-400">Missing = Deprecated (No Drop)</span>
            </div>
         </div>
         <div class="flex-1 overflow-auto bg-[#0d1117] p-2 font-mono text-sm leading-6">
            <div 
                v-for="line in diffLines" 
                :key="`t-${line.index}`"
                class="flex"
                :class="line.status === 'conflict' ? 'border-l-2 border-conflict' : 'min-h-[1.5rem]'"
            >
                <span class="w-8 text-right pr-3 text-slate-600 select-none text-[10px] pt-1">{{ line.index }}</span>
                <span class="whitespace-pre flex-1 pl-2" :class="getLineClass(line.status, 'target')">{{ line.target || ' ' }}</span>
            </div>
         </div>
      </div>
    </div>
    
    <!-- Result Pane (Bottom) -->
     <div class="h-1/3 min-h-[200px] flex flex-col bg-panel-dark">
        <div class="h-10 px-4 flex items-center justify-between bg-slate-900 border-b border-slate-800 shrink-0">
            <div class="flex items-center gap-3">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Merged Result Preview</span>
                <span class="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded">Review Required</span>
            </div>
        </div>
        <div class="flex-1 p-4 bg-[#0d1117] font-mono text-sm text-slate-300 overflow-auto">
            <!-- Simple manual merge preview -->
            <template v-for="line in diffLines" :key="`r-${line.index}`">
                <div v-if="line.status === 'same'">{{ line.source }}</div>
                <div v-else-if="line.status === 'source-only'" class="text-emerald-400">{{ line.source }}</div>
                <div v-else-if="line.status === 'conflict'">
                    <div class="text-amber-500/50">&lt;&lt;&lt;&lt; SOURCE</div>
                    <div class="text-emerald-400">{{ line.source }}</div>
                    <div class="text-amber-500/50">====</div>
                    <div class="text-amber-400">{{ line.target }}</div>
                    <div class="text-amber-500/50">&gt;&gt;&gt;&gt; TARGET</div>
                </div>
            </template>
        </div>
     </div>
  </div>
</template>
