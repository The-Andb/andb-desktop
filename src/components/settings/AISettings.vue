<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { Sparkles, RefreshCw, Loader2, Check, ShieldAlert, ChevronDown } from 'lucide-vue-next'

const settingsStore = useSettingsStore()
const settings = computed(() => settingsStore.settings)

// AI Settings Logic
const aiStatus = ref<'idle' | 'testing' | 'success' | 'error'>('idle')
const aiError = ref('')

const modelOptions = [
  { label: 'Gemini 2.5 Flash (Ultra-Fast)', value: 'gemini-2.5-flash' },
  { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
  { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
  { label: 'Gemini Flash Latest', value: 'gemini-flash-latest' },
  { label: 'Gemini 2.0 Flash Lite', value: 'gemini-2.0-flash-lite' },
  { label: 'Gemini 2.5 Pro (Precision)', value: 'gemini-2.5-pro' }
]

const getModelLabel = (val?: string) => {
  return modelOptions.find(o => o.value === val)?.label || val || 'Google Gemini'
}

const testAIConnection = async () => {
  if (!settings.value.aiApiKey) {
    alert('Please enter an API Key first')
    return
  }

  aiStatus.value = 'testing'
  aiError.value = ''

  try {
    // 1. Configure the core engine
    const configRes = await (window as any).electronAPI.invoke('andb-ai-configure', {
      apiKey: settings.value.aiApiKey,
      provider: 'gemini',
      modelVersion: settings.value.aiModelVersion
    })

    if (!configRes.success) {
      throw new Error(configRes.error || 'Failed to configure AI')
    }

    // 2. Test with a simple prompt
    const res = await (window as any).electronAPI.invoke('andb-ai-ask', {
      question: 'Ping'
    })

    if (res && res.success && res.data) {
      if (res.data.content || res.data.message) {
        aiStatus.value = 'success'
      } else {
        throw new Error('AI returned an empty response')
      }
    } else {
      throw new Error(res?.error || 'No response from AI')
    }
  } catch (e: any) {
    aiStatus.value = 'error'
    const err = e.message || ''
    if (err.includes('429')) {
      aiError.value = 'Quota Exceeded: You\'ve reached your Gemini limit. Please check your plan in Google AI Console. ☕️'
    } else if (err.includes('401') || err.includes('403') || err.includes('API_KEY')) {
      aiError.value = 'Invalid Key: Please double-check your API Key and try again. 🔑'
    } else if (err.includes('503') || err.includes('504')) {
      aiError.value = 'AI Service Overloaded: The server is busy, please try again in a moment. ⏳'
    } else {
      aiError.value = err
    }
  }
}

const openExternal = (url: string) => {
  if ((window as any).electronAPI?.openExternal) {
    (window as any).electronAPI.openExternal(url)
  } else {
    window.open(url, '_blank')
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
    <div
      class="bg-primary-500/5 dark:bg-primary-500/10 p-6 rounded-3xl border border-primary-500/10 flex items-start gap-6">
      <div class="p-3 bg-primary-500 rounded-2xl shadow-xl shadow-primary-500/20">
        <Sparkles class="w-8 h-8 text-white" />
      </div>
      <div class="space-y-1">
        <h2 class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">{{ $t('settings.ai.title') || 'AI DBA Assistant (Beta)' }}</h2>
        <p class="text-sm text-gray-500 leading-relaxed max-w-xl">
          Unlock deep schema analysis, automated risk assessment, and natural language DBA troubleshooting
          powered
          by <span class="font-bold text-primary-600 dark:text-primary-400">{{ getModelLabel(settings.aiModelVersion) }}</span>.
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Gemini Config -->
      <div class="space-y-4">
        <div class="flex items-center justify-between px-1">
          <label class="block text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{{ $t('settings.ai.apiKey') || 'Gemini API Key' }}</label>
          <a href="#" @click.prevent="openExternal('https://aistudio.google.com/app/apikey')"
            class="text-[10px] font-bold text-primary-500 hover:underline">Get Free Key →</a>
        </div>
        <div class="relative group">
          <input v-model="settings.aiApiKey" type="password" placeholder="Enter your Google AI API Key..."
            class="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold font-mono outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all" />
        </div>

        <div class="space-y-4 pt-2">
          <label class="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] px-1">Model Version</label>
          <div class="relative group">
            <select v-model="settings.aiModelVersion" 
              class="w-full h-[52px] px-5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 appearance-none cursor-pointer">
              <option v-for="opt in modelOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        
        <div class="space-y-4 pt-2">
          <label class="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] px-1">{{ $t('settings.ai.responseLanguage.label') || 'Response Language' }}</label>
          <div class="relative group">
            <select v-model="settings.aiLanguage" 
              class="w-full h-[52px] px-5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 appearance-none cursor-pointer">
              <option value="en">{{ $t('settings.english') }}</option>
              <option value="vi">{{ $t('settings.vietnamese') }}</option>
            </select>
            <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <button @click="testAIConnection" :disabled="aiStatus === 'testing'"
          class="w-full flex items-center justify-center gap-2 py-4 px-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-500 rounded-2xl transition-all group font-bold uppercase text-[10px] tracking-widest text-gray-700 dark:text-gray-300 shadow-sm">
          <RefreshCw v-if="aiStatus !== 'testing'"
            class="w-3.5 h-3.5 text-primary-500 group-hover:rotate-180 transition-transform duration-500" />
          <Loader2 v-else class="w-3.5 h-3.5 animate-spin text-primary-500" />
          {{ aiStatus === 'testing' ? 'Connecting...' : 'Test Connection' }}
        </button>

        <div v-if="aiStatus === 'success'"
          class="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl flex items-center gap-3 animate-in zoom-in-95">
          <div
            class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            <Check class="w-4 h-4" />
          </div>
          <div class="flex-1">
            <div
              class="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none mb-1">
              Authenticated Successfully</div>
            <div class="text-[11px] text-emerald-800/60 dark:text-emerald-400/60 font-medium">Your AI DBA
              Assistant
              is ready to help.</div>
          </div>
        </div>

        <div v-if="aiStatus === 'error'"
          class="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-2xl flex items-center gap-3 animate-in zoom-in-95">
          <div
            class="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/20 shrink-0">
            <ShieldAlert class="w-4 h-4" />
          </div>
          <div class="flex-1">
            <div
              class="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest leading-none mb-1">
              Configuration Error</div>
            <div class="text-[11px] text-red-800/60 dark:text-red-400/60 font-medium line-clamp-2">{{ aiError }}
            </div>
          </div>
        </div>
      </div>

      <!-- AI Capabilities -->
      <div
        class="bg-gray-50/50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 space-y-6">
        <h3 class="text-xs font-black text-gray-400 uppercase tracking-widest">Active Capabilities</h3>

        <div class="space-y-4">
          <div class="flex items-start gap-4">
            <div class="w-2 h-2 rounded-full bg-primary-500 mt-2"></div>
            <div>
              <div class="text-xs font-bold text-gray-900 dark:text-white uppercase leading-none mb-1">Schema
                Change
                Review</div>
              <p class="text-[10px] text-gray-500 font-medium leading-relaxed">Automated analysis of DDL changes
                with risk level assessment.</p>
            </div>
          </div>
          <div class="flex items-start gap-4">
            <div class="w-2 h-2 rounded-full bg-primary-500 mt-2"></div>
            <div>
              <div class="text-xs font-bold text-gray-900 dark:text-white uppercase leading-none mb-1">DBA
                Troubleshooting</div>
              <p class="text-[10px] text-gray-500 font-medium leading-relaxed">Natural language interface to ask
                about complex table patterns and FK graphs.</p>
            </div>
          </div>
          <div class="flex items-start gap-4">
            <div class="w-2 h-2 rounded-full bg-primary-500 mt-2"></div>
            <div>
              <div class="text-xs font-bold text-gray-900 dark:text-white uppercase leading-none mb-1">Semantic
                Diff
                (Preview)</div>
              <p class="text-[10px] text-gray-500 font-medium leading-relaxed">Understand the intent of schema
                changes beyond text comparison.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
