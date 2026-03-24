import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import Andb from '@/utils/andb'


export const useSidebarStore = defineStore('sidebar', () => {
  const refreshKey = ref(0)
  const refreshRequestKey = ref(0)
  const comparisonResults = ref<any[]>([])
  const environments = ref<any[]>([])
  const loading = ref(false)
  const lastFetchTime = ref(0)
  const CACHE_TTL = 30000 // 30 seconds

  const expandedEnvironments = ref(new Set<string>())
  const expandedDatabases = ref(new Set<string>())
  const expandedTypes = ref(new Set<string>())



  function triggerRefresh() {
    refreshKey.value++
  }

  function requestRefresh() {
    refreshRequestKey.value++
  }

  function setComparisonResults(results: any[]) {
    comparisonResults.value = results
  }

  function clearComparisonResults() {
    comparisonResults.value = []
  }

  async function loadSchemas(force = false) {
    const now = Date.now()
    if (!force && environments.value.length > 0 && (now - lastFetchTime.value < CACHE_TTL)) {
      return environments.value
    }

    if (loading.value && !force) return environments.value

    loading.value = true
    try {
      const result = await Andb.getSchemas()
      if (result) {
        lastFetchTime.value = Date.now()
      }
      return result
    } catch (err) {
      console.error('Failed to load schemas in store:', err)
      return environments.value
    } finally {
      loading.value = false
    }
  }

  function setEnvironments(data: any[]) {
    environments.value = data
  }


  // Persistence Logic
  const STORAGE_KEY = 'andb-sidebar-cache'

  function loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.storage) {
        (window as any).electronAPI.storage.get(STORAGE_KEY).then((result: any) => {
          if (result && result.success && result.data) {
            const data = typeof result.data === 'string' ? JSON.parse(result.data) : result.data
            if (data.environments) {
              environments.value = data.environments
              lastFetchTime.value = data.lastFetchTime || 0
            }
          }
        })
      }
    } catch (e) {
      console.warn('Failed to load sidebar cache', e)
    }
  }

  function saveToStorage() {
    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.storage) {
        (window as any).electronAPI.storage.set(STORAGE_KEY, {
          environments: JSON.parse(JSON.stringify(environments.value)),
          lastFetchTime: lastFetchTime.value
        })
      }
    } catch (e) {
      // Ignore
    }
  }

  // Watch to save
  watch(environments, () => {
    saveToStorage()
  }, { deep: true })

  // Initial load
  loadFromStorage()

  const gitStatus = ref<any>(null)
  const gitLoading = ref(false)

  async function checkGitStatus() {
    const projectsStore = (await import('./projects')).useProjectsStore()
    const projectId = projectsStore.selectedProjectId

    if (!projectId || gitLoading.value) return
    gitLoading.value = true

    try {
      const gitConfigRes = await (window as any).electronAPI?.storage?.get(`git_config_${projectId}`)
      if (!gitConfigRes?.success || !gitConfigRes.data?.remoteUrl) {
        gitStatus.value = null
        return
      }

      const res = await (window as any).electronAPI?.andbExecute({
        sourceConnection: {} as any,
        targetConnection: {} as any,
        operation: 'git-status' as any,
        options: { config: gitConfigRes.data }
      })

      if (res?.success) {
        gitStatus.value = res.data
      } else {
        gitStatus.value = null
      }
    } catch (err) {
      console.error('Failed to check git status in store:', err)
      gitStatus.value = null
    } finally {
      gitLoading.value = false
    }
  }

  // Auto-check on project switch
  watch(() => (import('./projects').then(m => m.useProjectsStore().selectedProjectId)), () => {
    checkGitStatus()
  })

  return {
    refreshKey,
    refreshRequestKey,
    comparisonResults,
    environments,
    loading,
    gitStatus,
    gitLoading,
    triggerRefresh,
    requestRefresh,
    setComparisonResults,
    clearComparisonResults,
    loadSchemas,
    setEnvironments,
    checkGitStatus,
    expandedEnvironments,
    expandedDatabases,
    expandedTypes
  }
})
