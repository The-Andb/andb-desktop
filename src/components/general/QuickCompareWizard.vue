<template>
  <Transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-gray-950/40 backdrop-blur-sm" @click="close"></div>

      <!-- Modal Content -->
      <div class="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl shadow-primary-500/10 border border-gray-100 dark:border-gray-800 overflow-hidden animate-zoom-in">
        <!-- Decoration -->
        <div class="absolute -right-20 -top-20 w-64 h-64 bg-primary-500/5 rounded-full filter blur-3xl"></div>
        <div class="absolute -left-20 -bottom-20 w-64 h-64 bg-indigo-500/5 rounded-full filter blur-3xl"></div>

        <!-- Header -->
        <div class="p-8 pb-4 flex items-center justify-between relative z-10">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
              <Zap class="w-6 h-6 fill-white" />
            </div>
            <div>
              <h3 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{{ $t('compare.quickCompare') || 'Quick Compare' }}</h3>
              <p class="text-[11px] text-gray-400 font-bold uppercase tracking-widest">{{ $t('compare.instantAnalysis') || 'Instant engine-to-engine analysis' }}</p>
            </div>
          </div>
          <button @click="close" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div class="p-8 pt-4 space-y-8 relative z-10">
          <!-- Selection Grid -->
          <div class="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6">
            <!-- Source Selection -->
            <div class="space-y-3">
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('compare.source') }}</label>
              <div class="relative group">
                <select 
                  v-model="sourceId"
                  class="w-full h-14 pl-12 pr-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="" disabled>{{ $t('common.select') }}</option>
                  <option v-for="conn in allConnections" :key="conn.id" :value="conn.id">
                    {{ conn.name }} ({{ conn.environment }})
                  </option>
                </select>
                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors">
                  <Database class="w-5 h-5" />
                </div>
                <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <div v-if="sourceConn" class="flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/10 rounded-lg border border-primary-100 dark:border-primary-900/30">
                 <span class="text-[9px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">{{ sourceConn.type }}</span>
                 <span v-if="sourceConn.schema" class="text-[9px] font-bold text-gray-400 uppercase">/ {{ sourceConn.schema }}</span>
              </div>
            </div>

            <!-- Arrow -->
            <div class="flex justify-center pt-6">
              <div class="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                <ArrowRight class="w-5 h-5 text-primary-500" />
              </div>
            </div>

            <!-- Target Selection -->
            <div class="space-y-3">
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('compare.target') }}</label>
              <div class="relative group">
                <select 
                  v-model="targetId"
                  class="w-full h-14 pl-12 pr-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="" disabled>{{ $t('common.select') }}</option>
                  <option v-for="conn in allConnections" :key="conn.id" :value="conn.id" :disabled="conn.id === sourceId">
                    {{ conn.name }} ({{ conn.environment }})
                  </option>
                </select>
                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors">
                  <Layers class="w-5 h-5" />
                </div>
                <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <div v-if="targetConn" class="flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/10 rounded-lg border border-primary-100 dark:border-primary-900/30">
                 <span class="text-[9px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">{{ targetConn.type }}</span>
                 <span v-if="targetConn.schema" class="text-[9px] font-bold text-gray-400 uppercase">/ {{ targetConn.schema }}</span>
              </div>
            </div>
          </div>

          <!-- Quick Actions / Presets -->
          <div class="pt-4 border-t border-gray-50 dark:border-gray-800">
             <div class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <History class="w-3.5 h-3.5" />
                {{ $t('compare.recentSelections') || 'Recent Selections' }}
             </div>
             <div class="flex flex-wrap gap-2">
                <button 
                  v-for="preset in recentPresets" 
                  :key="preset.id"
                  @click="applyPreset(preset)"
                  class="px-4 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl text-[10px] font-bold text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700 transition-all active:scale-95 flex items-center gap-2"
                >
                  {{ preset.sourceName }} <ArrowRight class="w-3 h-3" /> {{ preset.targetName }}
                </button>
             </div>
          </div>

          <!-- Bottom Actions -->
          <div class="flex items-center justify-between pt-4">
             <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full animate-pulse" :class="canCompare ? 'bg-green-500' : 'bg-gray-300'"></div>
                <span class="text-[10px] font-black uppercase tracking-widest" :class="canCompare ? 'text-gray-600' : 'text-gray-400'">
                  {{ canCompare ? 'Ready for Analysis' : 'Select Source & Target' }}
                </span>
             </div>

             <div class="flex items-center gap-4">
                <button 
                  @click="close"
                  class="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {{ $t('common.cancel') }}
                </button>
                <button 
                  @click="startCompare"
                  :disabled="!canCompare"
                  class="group flex items-center justify-center px-10 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                >
                  <Zap class="w-4 h-4 mr-2 group-hover:scale-125 transition-transform" />
                  {{ $t('compare.startFlashCompare') || 'Flash Compare' }}
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Zap, X, Database, Layers, ArrowRight, ChevronDown, History } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { storage } from '@/utils/storage-ipc'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const { t: $t } = useI18n()
const router = useRouter()
const appStore = useAppStore()

const sourceId = ref('')
const targetId = ref('')
const recentPresets = ref<any[]>([])

const allConnections = computed(() => appStore.resolvedConnections)
const sourceConn = computed(() => allConnections.value.find(c => c.id === sourceId.value))
const targetConn = computed(() => allConnections.value.find(c => c.id === targetId.value))

const canCompare = computed(() => !!sourceId.value && !!targetId.value && sourceId.value !== targetId.value)

const close = () => {
  emit('close')
}

const startCompare = async () => {
  if (!canCompare.value) return

  // Save to recent presets
  const preset = {
    id: Date.now(),
    sourceId: sourceId.value,
    targetId: targetId.value,
    sourceName: sourceConn.value?.name,
    targetName: targetConn.value?.name
  }
  
  recentPresets.value = [preset, ...recentPresets.value.filter(p => p.sourceId !== sourceId.value || p.targetId !== targetId.value)].slice(0, 3)
  await storage.set('quickCompareRecent', JSON.parse(JSON.stringify(recentPresets.value)))

  // Navigate to compare view with special "instant" parameters
  router.push({
    path: '/compare',
    query: {
      sourceId: sourceId.value,
      targetId: targetId.value,
      mode: 'instant'
    }
  })
  
  close()
}

const applyPreset = (preset: any) => {
  sourceId.value = preset.sourceId
  targetId.value = preset.targetId
}

onMounted(async () => {
  const saved = await storage.get('quickCompareRecent')
  if (saved) recentPresets.value = saved
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@keyframes zoom-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.animate-zoom-in {
  animation: zoom-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
