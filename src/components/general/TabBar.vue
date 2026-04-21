<template>
  <div 
    ref="scrollContainer"
    class="flex items-center bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar shrink-0 h-10 px-2 gap-0.5 scroll-smooth"
  >
    <div 
      v-for="tab in tabs" 
      :key="tab.id"
      :ref="(el) => { if (activeTabId === tab.id) activeTabRef = el }"
      @click="$emit('select', tab.id)"
      @contextmenu.prevent="openContextMenu($event, tab.id)"
      class="group relative flex items-center h-[34px] mt-[6px] px-2 rounded-t-lg cursor-pointer transition-all duration-200 select-none flex-1 min-w-[36px] max-w-[200px] border-t border-x overflow-hidden shrink-0"
      :class="activeTabId === tab.id 
        ? 'bg-white dark:bg-gray-900 text-primary-600 dark:text-primary-400 border-gray-200 dark:border-gray-800 shadow-[0_-2px_4px_rgba(0,0,0,0.02)] z-10' 
        : 'bg-transparent border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
      :title="tab.name"
    >
      <component :is="tab.icon" v-if="tab.icon" class="w-3.5 h-3.5 shrink-0 opacity-70 mr-1.5" />
      <span class="text-[11px] font-bold truncate flex-1 tracking-tight min-w-0">{{ tab.name }}</span>
      
      <button 
        @click.stop="$emit('close', tab.id)"
        class="ml-1 p-0.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-opacity text-gray-400 hover:text-red-500 shrink-0"
        :class="activeTabId === tab.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
      >
        <X class="w-2.5 h-2.5" />
      </button>
      
      <!-- Indicator for active tab -->
      <div v-if="activeTabId === tab.id" class="absolute -bottom-px left-0 right-0 h-px bg-white dark:bg-gray-900 z-20"></div>
    </div>

    <!-- Context Menu Container -->
    <div style="display: contents">
      <Teleport to="body">
        <div 
          v-if="showContextMenu" 
          class="fixed z-[9999] min-w-[180px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-100"
          :style="{ left: menuPosition.x + 'px', top: menuPosition.y + 'px' }"
          @click.stop
        >
          <button 
            @click="$emit('duplicate', contextMenuTabId); closeContextMenu()"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 transition-colors"
          >
            <Copy class="w-4 h-4" />
            {{ $t('common.tabs.duplicate') }}
          </button>
          
          <div class="h-px bg-gray-100 dark:bg-gray-800 my-1"></div>
  
          <button 
            @click="$emit('close', contextMenuTabId); closeContextMenu()"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
          >
            <X class="w-4 h-4" />
            {{ $t('common.tabs.close') }}
          </button>
  
          <button 
            @click="$emit('closeOthers', contextMenuTabId); closeContextMenu()"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <Trash2 class="w-4 h-4" />
            {{ $t('common.tabs.closeOthers') }}
          </button>
  
          <button 
            @click="$emit('closeRight', contextMenuTabId); closeContextMenu()"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowRightToLine class="w-4 h-4" />
            {{ $t('common.tabs.closeRight') }}
          </button>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { X, Copy, Trash2, ArrowRightToLine, MoreVertical } from 'lucide-vue-next'

const props = defineProps<{
  tabs: Array<{
    id: string
    name: string
    icon?: any
  }>
  activeTabId: string | null
}>()

defineEmits(['select', 'close', 'duplicate', 'closeOthers', 'closeRight'])

const showContextMenu = ref(false)
const menuPosition = ref({ x: 0, y: 0 })
const contextMenuTabId = ref<string | null>(null)

const openContextMenu = (e: MouseEvent, tabId: string) => {
  e.preventDefault()
  contextMenuTabId.value = tabId
  menuPosition.value = { x: e.clientX, y: e.clientY }
  showContextMenu.value = true
}

const closeContextMenu = () => {
  showContextMenu.value = false
}

onMounted(() => {
  window.addEventListener('click', closeContextMenu)
})

onUnmounted(() => {
  window.removeEventListener('click', closeContextMenu)
})

const scrollContainer = ref<HTMLElement | null>(null)
const activeTabRef = ref<any>(null)

watch(() => props.activeTabId, async (newId) => {
  if (newId) {
    await nextTick()
    if (activeTabRef.value && scrollContainer.value && (scrollContainer.value as HTMLElement).isConnected) {
      const el = (activeTabRef.value as any).$el || activeTabRef.value
      if (el && el.isConnected) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }
})
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
