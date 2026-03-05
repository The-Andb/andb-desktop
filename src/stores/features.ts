import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useFeaturesStore = defineStore('features', () => {
  const flags = ref<Record<string, boolean>>({})
  const loading = ref(false)
  const initialized = ref(false)

  const fetchFeatures = async () => {
    if (loading.value) return
    loading.value = true
    try {
      // Use the generic invoke exposed in preload.ts
      // @ts-ignore
      const status = await window.electronAPI.invoke('get-features-status')
      flags.value = status || {}
      initialized.value = true
    } catch (e) {
      console.error('Failed to fetch feature flags:', e)
      flags.value = {}
    } finally {
      loading.value = false
    }
  }

  /**
   * Check if a feature is enabled.
   * Usage: isEnabled('mcpServer')
   */
  const isEnabled = (key: string): boolean => {
    return !!flags.value[key]
  }

  const toggleFeature = async (key: string, enabled: boolean) => {
    try {
      // @ts-ignore
      const result = await window.electronAPI.invoke('update-feature-flag', { key, enabled })
      if (result.success) {
        flags.value[key] = enabled
      }
      return result
    } catch (e) {
      console.error('Failed to update feature flag:', e)
      return { success: false, error: e }
    }
  }

  return {
    flags,
    loading,
    initialized,
    fetchFeatures,
    isEnabled,
    toggleFeature
  }
})
