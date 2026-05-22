import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import Andb from '@/utils/andb'

export const useSidebarStore = defineStore('sidebar', () => {
  const refreshKey = ref(0)
  const refreshRequestKey = ref(0)
  const comparisonResults = ref<any[]>([])
  const environments = ref<any[]>([])
  const loading = ref(false)
  const isComparing = ref(false)
  const lastFetchTime = ref(0)
  const CACHE_TTL = 30000 // 30 seconds

  const expandedEnvironments = ref(new Set<string>())
  const expandedDatabases = ref(new Set<string>())
  const expandedTypes = ref(new Set<string>())

  function triggerRefresh() {
    refreshKey.value++
    lastFetchTime.value = 0 // Invalidate cache so next load gets latest from core
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

  async function loadSchemas(force = false, connections?: any[]) {
    const now = Date.now()
    if (!force && environments.value.length > 0 && now - lastFetchTime.value < CACHE_TTL) {
      return environments.value
    }

    if (loading.value && !force) return environments.value

    loading.value = true
    try {
      // Pass connections for backend project isolation — backend only returns data for these
      const cleanConnections = connections ? JSON.parse(JSON.stringify(connections)) : undefined
      const result = await Andb.getSchemas(cleanConnections)
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

  // Persistence Logic — cache is SCOPED to the active project to prevent cross-project bleed
  const STORAGE_KEY_PREFIX = 'andb-sidebar-cache'
  let _currentCacheProjectId: string | null = null

  function getCacheKey(projectId?: string): string {
    return projectId ? `${STORAGE_KEY_PREFIX}-${projectId}` : STORAGE_KEY_PREFIX
  }

  function loadFromStorage(projectId?: string) {
    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.storage) {
        const key = getCacheKey(projectId)
        // If project changed, clear stale in-memory data immediately
        if (projectId && projectId !== _currentCacheProjectId) {
          environments.value = []
          lastFetchTime.value = 0
          _currentCacheProjectId = projectId
        }
        ;(window as any).electronAPI.storage.get(key).then((result: any) => {
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

  function saveToStorage(projectId?: string) {
    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.storage) {
        const key = getCacheKey(projectId)
        ;(window as any).electronAPI.storage.set(key, {
          environments: JSON.parse(JSON.stringify(environments.value)),
          lastFetchTime: lastFetchTime.value
        })
      }
    } catch (e) {
      // Ignore
    }
  }

  function saveCurrentToStorage() {
    saveToStorage(_currentCacheProjectId || undefined)
  }

  // Watch to save
  watch(
    environments,
    () => {
      saveCurrentToStorage()
    },
    { deep: true }
  )

  // Initial load — no project ID yet, will re-load when project is selected
  // (Called from Sidebar.vue after project is known)


  const gitStatus = ref<any>(null)
  const gitLoading = ref(false)

  async function checkGitStatus() {
    const projectsStore = (await import('./projects')).useProjectsStore()
    const projectId = projectsStore.selectedProjectId

    if (!projectId || gitLoading.value) return
    gitLoading.value = true

    try {
      const gitConfigRes = await (window as any).electronAPI?.storage?.get(
        `git_config_${projectId}`
      )
      if (!gitConfigRes?.success || !gitConfigRes.data?.remoteUrl) {
        gitStatus.value = null
        return
      }

      const connectionPairsStore = (await import('./connectionPairs')).useConnectionPairsStore()
      const activePair = connectionPairsStore.activePair
      const sEnv = activePair?.source?.environment || 'DEV'
      const dbName = activePair?.source?.database || activePair?.source?.name || 'default'

      const cleanSource = activePair?.source ? JSON.parse(JSON.stringify(activePair.source)) : {}
      const cleanTarget = activePair?.target ? JSON.parse(JSON.stringify(activePair.target)) : {}

      const res = await (window as any).electronAPI?.andbExecute({
        sourceConnection: cleanSource,
        targetConnection: cleanTarget,
        operation: 'git-status' as any,
        options: {
          config: gitConfigRes.data,
          env: sEnv,
          db: dbName
        }
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

  // Auto-check on project switch disabled to prevent background execution
  // watch(() => (import('./projects').then(m => m.useProjectsStore().selectedProjectId)), () => {
  //   checkGitStatus()
  // })

  return {
    refreshKey,
    refreshRequestKey,
    comparisonResults,
    environments,
    loading,
    isComparing,
    gitStatus,
    gitLoading,
    triggerRefresh,
    requestRefresh,
    setComparisonResults,
    clearComparisonResults,
    loadSchemas,
    setEnvironments,
    loadFromStorage,
    checkGitStatus,
    expandedEnvironments,
    expandedDatabases,
    expandedTypes
  }
})
