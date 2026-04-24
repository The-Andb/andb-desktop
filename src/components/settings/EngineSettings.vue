<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useConnectionPairsStore } from '@/stores/connectionPairs'
import { GitCompare, Trash2, Plus } from 'lucide-vue-next'

const settingsStore = useSettingsStore()
const connectionPairsStore = useConnectionPairsStore()

const newExcludeTagGlobal = ref('')

const addExcludeTagGlobal = () => {
  if (!newExcludeTagGlobal.value.trim()) return
  if (!settingsStore.settings.excludeTags) settingsStore.settings.excludeTags = []
  if (!settingsStore.settings.excludeTags.includes(newExcludeTagGlobal.value.trim())) {
    settingsStore.settings.excludeTags.push(newExcludeTagGlobal.value.trim())
  }
  newExcludeTagGlobal.value = ''
}

const removeExcludeTagGlobal = (index: number) => {
  if (!settingsStore.settings.excludeTags) return
  settingsStore.settings.excludeTags.splice(index, 1)
}

const addEnvReplacementGlobal = () => {
  if (!settingsStore.settings.envReplacements) settingsStore.settings.envReplacements = []
  settingsStore.settings.envReplacements.push({ key: '', values: {} })
}

const removeEnvReplacementGlobal = (index: number) => {
  if (!settingsStore.settings.envReplacements) return
  settingsStore.settings.envReplacements.splice(index, 1)
}
</script>

<template>
  <div class="animate-in fade-in slide-in-from-bottom-2 duration-500">
    <div class="space-y-12">
      <!-- Domain Normalization -->
      <div class="relative overflow-hidden transition-all duration-500">
        <div class="relative z-10">
          <div class="flex items-center gap-4 mb-3">
            <div class="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <GitCompare class="w-4 h-4 text-orange-500" />
            </div>
            <div class="flex flex-col">
              <h3
                class="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] leading-none mb-1">
                {{ $t('settings.engine.domainNormalization.title') }}</h3>
              <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{{
                $t('settings.engine.domainNormalization.subtitle') || 'Environment Variable Mapping' }}</span>
            </div>
          </div>
          <p class="text-[11px] text-gray-400 dark:text-gray-500 mb-10 max-w-xl leading-relaxed font-medium"
            v-html="$t('settings.engine.domainNormalization.desc')"></p>

          <div class="space-y-12">
            <TransitionGroup name="list">
              <div v-for="(rep, index) in settingsStore.settings.envReplacements || []" :key="index"
                class="pl-8 pb-10 border-none bg-transparent space-y-10 relative group/rep transition-all duration-500">

                <!-- Static Decoration -->
                <div
                  class="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-gray-100 dark:bg-gray-800/50 group-hover/rep:bg-orange-500 transition-all duration-500">
                </div>

                <button @click="removeEnvReplacementGlobal(index)"
                  class="absolute top-0 right-0 p-2.5 text-gray-400 hover:text-white hover:bg-red-500 dark:hover:bg-red-600 rounded-2xl transition-all opacity-0 group-hover/rep:opacity-100 transform translate-x-4 group-hover/rep:translate-x-0 shadow-lg shadow-red-500/20">
                  <Trash2 class="w-4 h-4" />
                </button>

                <div class="space-y-4 max-w-md">
                  <label
                    class="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.25em]">Variable
                    Identifier</label>
                  <div class="relative group/input">
                    <div
                      class="absolute inset-0 bg-orange-500/30 blur-2xl opacity-0 group-focus-within/input:opacity-20 transition-opacity duration-500">
                    </div>
                    <input v-model="rep.key" type="text"
                      class="relative w-full px-5 py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/30 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-700"
                      placeholder="e.g. APP_DOMAIN" />
                  </div>
                </div>

                <div class="pt-10 border-t border-gray-100 dark:border-gray-800/40">
                  <label
                    class="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.25em] mb-8">Environment
                    Resolution</label>
                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div v-for="env in connectionPairsStore.environments" :key="env.id"
                      class="space-y-4 group/field">
                      <div class="flex items-center gap-2.5">
                        <span
                          class="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-gray-800 group-focus-within/field:bg-orange-500 transition-colors"></span>
                        <span
                          class="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.15em] group-focus-within/field:text-orange-500 transition-colors">{{
                            env.name }}</span>
                      </div>
                      <input v-model="rep.values[env.id]" type="text"
                        class="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-[11px] font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all" />
                    </div>
                  </div>
                </div>
              </div>
            </TransitionGroup>

            <button @click="addEnvReplacementGlobal"
              class="flex items-center gap-2 px-6 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-orange-500 hover:text-white border border-dashed border-gray-300 dark:border-gray-700 hover:border-orange-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
              <Plus class="w-4 h-4" />
              Add Domain Variable
            </button>
          </div>
        </div>
      </div>

      <!-- Global Filter Patterns -->
      <div class="pt-12 border-t border-gray-100 dark:border-gray-800">
        <h3 class="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] mb-2">{{
          $t('settings.engine.globalFilters.title') || 'Global Schema Filters' }}</h3>
        <p class="text-[11px] text-gray-400 dark:text-gray-500 mb-8 max-w-xl font-medium">{{
          $t('settings.engine.globalFilters.desc') || 'Patterns defined here will be excluded from all comparisons across all projects.' }}</p>

        <div class="space-y-6">
          <div class="flex items-center gap-3">
            <input v-model="newExcludeTagGlobal" type="text" @keyup.enter="addExcludeTagGlobal"
              class="flex-1 px-5 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500"
              placeholder="e.g. ^temp_, _backup$, shadow_table" />
            <button @click="addExcludeTagGlobal"
              class="px-6 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
              Add
            </button>
          </div>

          <div class="flex flex-wrap gap-2">
            <div v-for="(tag, index) in settingsStore.settings.excludeTags || []" :key="index"
              class="flex items-center gap-2 pl-4 pr-2 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm animate-in zoom-in-95">
              <span class="text-[10px] font-black text-gray-700 dark:text-gray-300 font-mono">{{ tag }}</span>
              <button @click="removeExcludeTagGlobal(index)"
                class="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 rounded-full transition-colors">
                <Plus class="w-3.5 h-3.5 rotate-45" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
