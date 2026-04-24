<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { useConnectionTemplatesStore } from '@/stores/connectionTemplates'
import { Key, Shield } from 'lucide-vue-next'

const { t } = useI18n()
const appStore = useAppStore()
const templatesStore = useConnectionTemplatesStore()

const publicKey = ref('')
const isRegeneratingKeys = ref(false)

const loadPublicKey = async () => {
  if ((window as any).electronAPI && (window as any).electronAPI.invoke) {
    const res = await (window as any).electronAPI.invoke('security-get-public-key')
    if (res.success) {
      publicKey.value = res.data
    }
  }
}

const regenerateKeys = async () => {
  if (!confirm(t('settings.security.regenerateConfirm'))) return

  isRegeneratingKeys.value = true
  try {
    if ((window as any).electronAPI && (window as any).electronAPI.invoke) {
      const res = await (window as any).electronAPI.invoke('security-regenerate-keys')
      if (res.success) {
        await loadPublicKey()

        // Clear all passwords in memory to force re-entry
        if (appStore.connections) {
          appStore.connections.forEach(conn => {
            conn.password = ''
            conn.status = 'idle'
          })
        }

        if (templatesStore.templates) {
          templatesStore.templates.forEach((t: any) => {
            t.password = ''
          })
        }

        alert(t('settings.security.regenerateSuccess'))
      } else {
        alert(t('settings.security.regenerateError') + ': ' + res.error)
      }
    }
  } catch (e: any) {
    console.error(e)
    alert('Error: ' + e.message)
  } finally {
    isRegeneratingKeys.value = false
  }
}

onMounted(() => {
  loadPublicKey()
})
</script>

<template>
  <div class="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
    <div>
      <div class="relative overflow-hidden">
        <div class="relative z-10">
          <div class="flex items-center gap-4 mb-3">
            <div
              class="w-8 h-8 rounded-lg bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center">
              <Shield class="w-4 h-4 text-primary-500" />
            </div>
            <div class="flex flex-col">
              <h3 class="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] leading-none mb-1">
                {{ $t('settings.security.title') }}
                <span class="bg-primary-500 text-white px-2 py-0.5 rounded-md text-[9px] tracking-widest">{{
                  $t('settings.security.active') }}</span>
              </h3>
              <p class="text-[11px] text-gray-400 dark:text-gray-500 mb-6 max-w-lg leading-relaxed"
                v-html="$t('settings.security.desc')"></p>
            </div>
          </div>

          <div class="space-y-6">
            <!-- Public Key Display -->
            <div class="py-4">
              <div class="flex items-center justify-between mb-4">
                <label class="block text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{{
                  $t('settings.security.publicKey') }}</label>
                <div
                  class="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500">
                  RSA-4096-AES-256-GCM</div>
              </div>
              <div
                class="font-mono text-[10px] bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 break-all text-gray-600 dark:text-gray-400 leading-relaxed shadow-inner select-all cursor-text whitespace-pre-wrap">
                {{ publicKey || 'Loading Master Public Key...' }}
              </div>
              <p class="mt-2 text-xs text-gray-400">{{ $t('settings.security.publicKeyDesc') }}</p>
            </div>

            <!-- Regenerate Actions -->
            <div class="mt-12 pt-12 border-t border-gray-100 dark:border-gray-800/40">
              <h3 class="text-xs font-black text-rose-500 uppercase tracking-widest mb-2">{{
                $t('settings.security.dangerZone') }}</h3>
              <p class="text-[11px] text-gray-400 dark:text-gray-500 mb-6 leading-relaxed max-w-2xl font-medium">
                {{ $t('settings.security.regenerateWarning') }}
              </p>

              <button @click="regenerateKeys" :disabled="isRegeneratingKeys"
                class="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2">
                <Key v-if="!isRegeneratingKeys" class="w-4 h-4" />
                <span v-if="isRegeneratingKeys"
                  class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                {{ isRegeneratingKeys ? $t('common.processing') : $t('settings.security.regenerateKeys') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
