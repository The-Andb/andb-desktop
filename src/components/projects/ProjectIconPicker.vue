<template>
  <div class="p-4 w-64 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200 z-[100]" @click.stop>
    <div class="space-y-4">
      <!-- Icon Selection -->
      <div>
        <label class="text-[10px] font-black text-gray-400 tracking-widest block mb-3">Select representative icon</label>
        <div class="grid grid-cols-5 gap-2">
          <button 
            v-for="icon in availableIcons" 
            :key="icon.name"
            @click.stop="selectIcon(icon.name)"
            class="p-2 rounded-xl transition-all flex items-center justify-center border hover:scale-110 active:scale-95"
            :class="selectedIcon === icon.name ? 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400'"
          >
            <component :is="icon.comp" class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Color Selection -->
      <div>
        <label class="text-[10px] font-black text-gray-400 tracking-widest block mb-3">Accent color</label>
        <div class="grid grid-cols-6 gap-2">
          <button 
            v-for="c in availableColors" 
            :key="c.value"
            @click.stop="selectColor(c.value)"
            class="w-6 h-6 rounded-full border-2 transition-transform hover:scale-125 active:scale-90 flex items-center justify-center p-0.5"
            :style="{ backgroundColor: c.value, borderColor: selectedColor === c.value ? 'white' : 'transparent' }"
            :title="c.name"
          >
            <Check v-if="selectedColor === c.value" class="w-3 h-3 text-white" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  Database, 
  Package, 
  Cpu, 
  Zap, 
  Terminal, 
  Cloud, 
  Shield, 
  Activity, 
  HardDrive,
  Globe,
  Rocket,
  Server,
  Layers,
  Component,
  Check
} from 'lucide-vue-next'

const props = defineProps<{
  selectedIcon?: string
  selectedColor?: string
}>()

const emit = defineEmits<{
  (e: 'select', data: { icon: string, color: string }): void
}>()

const availableIcons = [
  { name: 'Database', comp: Database },
  { name: 'Package', comp: Package },
  { name: 'Cpu', comp: Cpu },
  { name: 'Zap', comp: Zap },
  { name: 'Terminal', comp: Terminal },
  { name: 'Cloud', comp: Cloud },
  { name: 'Shield', comp: Shield },
  { name: 'Activity', comp: Activity },
  { name: 'HardDrive', comp: HardDrive },
  { name: 'Globe', comp: Globe },
  { name: 'Rocket', comp: Rocket },
  { name: 'Server', comp: Server },
  { name: 'Layers', comp: Layers },
  { name: 'Component', comp: Component }
]

const availableColors = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Slate', value: '#64748b' },
  { name: 'Lime', value: '#84cc16' }
]

const selectIcon = (icon: string) => {
  emit('select', { icon, color: props.selectedColor || '#6366f1' })
}

const selectColor = (color: string) => {
  emit('select', { icon: props.selectedIcon || 'Database', color })
}
</script>
