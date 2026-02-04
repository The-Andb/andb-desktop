<script setup lang="ts">


export interface ConflictItem {
  id: string
  name: string
  type: 'table' | 'view' | 'trigger' | 'procedure'
  status: 'conflict' | 'resolved'
  conflictLineCount: number
}

const props = defineProps<{
  items: ConflictItem[]
  selectedId?: string
}>()

defineEmits(['select'])

const getIcon = (type: string) => {
  switch (type) {
    case 'table': return 'table_chart'
    case 'view': return 'visibility'
    case 'trigger': return 'bolt'
    case 'procedure': return 'functions'
    default: return 'code'
  }
}
</script>

<template>
  <div class="w-72 border-r border-slate-800 bg-panel-dark flex flex-col shrink-0">
    <div class="p-4 border-b border-slate-800 flex items-center justify-between">
      <h2 class="text-xs font-bold text-slate-400 uppercase tracking-widest">Conflict List</h2>
      <span class="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full">{{ items.length }} Objects</span>
    </div>
    
    <div class="flex-1 overflow-y-auto">
      <div 
        v-for="item in items" 
        :key="item.id"
        @click="$emit('select', item.id)"
        class="p-4 border-b border-slate-800 cursor-pointer transition-colors group"
        :class="[
          selectedId === item.id 
            ? 'bg-slate-800/50 border-l-2 border-primary-500' 
            : 'hover:bg-slate-800/20 border-l-2 border-transparent'
        ]"
      >
        <div class="flex items-start gap-3">
          <span 
            class="material-symbols-outlined text-lg group-hover:scale-110 transition-transform"
            :class="[
              item.status === 'resolved' ? 'text-emerald-500' : 
              selectedId === item.id ? 'text-primary-500' : 'text-slate-500'
            ]"
          >
            {{ getIcon(item.type) }}
          </span>
          
          <div class="flex-1 min-w-0">
            <p 
              class="text-sm font-bold truncate transition-colors"
              :class="selectedId === item.id ? 'text-white' : 'text-slate-300'"
            >
              {{ item.name }}
            </p>
            <p 
              class="text-[11px] mt-1"
              :class="item.status === 'resolved' ? 'text-emerald-500' : 'text-slate-500'"
            >
              {{ item.status === 'resolved' ? 'Resolved' : `${item.conflictLineCount} conflicting lines` }}
            </p>
          </div>
          
          <span 
            v-if="item.status === 'conflict'"
            class="size-2 rounded-full bg-conflict mt-1 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
          ></span>
          
          <span 
            v-else
            class="material-symbols-outlined text-emerald-500 text-sm"
          >
            check
          </span>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="items.length === 0" class="p-8 text-center text-slate-500 text-xs">
        No conflicts found.
      </div>
    </div>
  </div>
</template>
