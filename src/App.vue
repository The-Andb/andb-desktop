<template>
  <div id="app" class="h-screen bg-gray-50 dark:bg-gray-900">
    <router-view />
    <UpdateModal />
    <MigrationChangelogModal
      :isOpen="showMigrationChangelog"
      :report="migrationReport"
      @dismiss="dismissMigrationChangelog"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { useUpdaterStore } from '@/stores/updater'
import { useConsoleStore } from '@/stores/console'
import { useSidebarStore } from '@/stores/sidebar'
import { useFeaturesStore } from '@/stores/features'
import { useProjectsStore } from '@/stores/projects'
import { useSettingsStore } from '@/stores/settings'
import Andb from '@/utils/andb'

import UpdateModal from '@/components/general/UpdateModal.vue'
import MigrationChangelogModal from '@/components/general/MigrationChangelogModal.vue'

const appStore = useAppStore()
const updaterStore = useUpdaterStore()
const consoleStore = useConsoleStore()
const sidebarStore = useSidebarStore()
const featuresStore = useFeaturesStore()
const projectsStore = useProjectsStore()
const settingsStore = useSettingsStore()

// Migration Changelog state
const showMigrationChangelog = ref(false)
const migrationReport = ref<any>(null)

const dismissMigrationChangelog = async () => {
  showMigrationChangelog.value = false
  migrationReport.value = null
  try {
    await window.electronAPI?.dismissMigrationChangelog?.()
  } catch {
    // Silent fail
  }
}

// Global Refresh Handlers
const handleDatabaseRefreshRequested = async (e: any) => {
  const { env, db } = e.detail
  const conn = appStore.resolvedConnections.find(c => 
    c.environment === env && 
    (c.database === db || c.database?.toLowerCase() === db?.toLowerCase() || c.name === db || c.name?.toLowerCase() === db?.toLowerCase())
  )
  if (!conn) return

  try {
    consoleStore.addLog(`Database Refresh: ${db}`, 'info')
    consoleStore.setVisibility(true)
    
    // Clear data first for full refresh
    await Andb.clearConnectionData(conn)
    
    // Fetch all types efficiently
    const cmd = `andb export --source ${conn.environment}`
    consoleStore.addLog(cmd, 'cmd')
    
    await Andb.export(conn, null as any, { type: 'all' as any, environment: conn.environment })
      .then((summary) => {
         if (summary) {
           consoleStore.addLog(`Exported schema for ${conn.environment}: ${JSON.stringify(summary)}`, 'success')
         } else {
           consoleStore.addLog(`export success.`, 'success')
         }
      })
    
    sidebarStore.triggerRefresh()
  } catch (err: any) {
    consoleStore.addLog(`Refresh failed: ${err.message}`, 'error')
  }
}

const handleCategoryRefreshRequested = async (e: any) => {
  const { type, env, db } = e.detail
  const conn = appStore.resolvedConnections.find(c => 
    c.environment === env && 
    (c.database === db || c.database?.toLowerCase() === db?.toLowerCase() || c.name === db || c.name?.toLowerCase() === db?.toLowerCase())
  )
  if (!conn) return

  try {
    consoleStore.addLog(`Category Refresh: ${type} in ${db}`, 'info')
    consoleStore.setVisibility(true)
    
    await Andb.export(conn, null as any, { type: type as any, environment: conn.environment })
      .then((summary) => {
         if (summary) {
           consoleStore.addLog(`Exported ${type} for ${conn.environment}: ${JSON.stringify(summary)}`, 'success')
         } else {
           consoleStore.addLog(`export success.`, 'success')
         }
      })
    
    sidebarStore.triggerRefresh()
  } catch (err: any) {
    consoleStore.addLog(`Refresh failed: ${err.message}`, 'error')
  }
}

const handleObjectRefreshRequested = async (e: any) => {
  const { name, type, env, db } = e.detail
  const conn = appStore.resolvedConnections.find(c => 
    c.environment === env && 
    (c.database === db || c.database?.toLowerCase() === db?.toLowerCase() || c.name === db || c.name?.toLowerCase() === db?.toLowerCase())
  )
  if (!conn) return

  try {
    consoleStore.addLog(`Object Refresh: ${name} (${type})`, 'info')
    consoleStore.setVisibility(true)
    
    await Andb.export(conn, null as any, { type: type as any, environment: conn.environment, name })
      .then((summary) => {
         if (summary) {
           consoleStore.addLog(`Exported ${type} ${name} for ${conn.environment}: ${JSON.stringify(summary)}`, 'success')
         } else {
           consoleStore.addLog(`export success.`, 'success')
         }
      })
      
    sidebarStore.triggerRefresh()
  } catch (err: any) {
    consoleStore.addLog(`Refresh failed: ${err.message}`, 'error')
  }
}

// Global keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  // Ctrl+B or Cmd+B to toggle sidebar
  if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
    event.preventDefault()
    appStore.toggleSidebar()
  }
}

onMounted(async () => {
  await featuresStore.fetchFeatures()
  
  // Sync Focus Mode setting
  if (featuresStore.isEnabled('focusColumnMode')) {
    appStore.autoCollapseColumns = true
  }
  
  document.addEventListener('keydown', handleKeydown)
  
  // global refresh listeners
  window.addEventListener('database-refresh-requested', handleDatabaseRefreshRequested)
  window.addEventListener('category-refresh-requested', handleCategoryRefreshRequested)
  window.addEventListener('object-refresh-requested', handleObjectRefreshRequested)
  
  // Listen for Electron Updater events
  if (window.electronAPI?.updater) {
    window.electronAPI.updater.onUpdateStatus((response: any) => {
      updaterStore.setStatus(response.status, response.info || response.progress || response.error)
    })
  }

  // Global IPC progress listener
  if (window.electronAPI?.onAndbProgress) {
    window.electronAPI.onAndbProgress((_event: any, data: any) => {
      if (data.operation === 'export') {
        appStore.schemaFetchProgress = {
          current: data.current || 0,
          total: data.total || 0,
          type: data.type || '',
          objectName: data.objectName || ''
        }

        if (data.state === 'starting_type' && data.type) {
          // Suppress redundant log spam per user request. 
          // Final summary will be logged upon successful export resolution.
        }
      }
    })
  }

  // Check for migration changelog (delayed to avoid blocking initial load)
  setTimeout(async () => {
    if (window.electronAPI?.getMigrationChangelog) {
      try {
        const result = await window.electronAPI.getMigrationChangelog()
        if (result?.success && result.data) {
          migrationReport.value = result.data
          showMigrationChangelog.value = true
        }
      } catch (e) {
        // Silent fail — changelog is non-critical
      }
    }
  }, 2000)

  // Wait for store to init and identify telemetry user
  watch(() => appStore.installationId, (id) => {
    if (id) {
      import('@/composables/usePostHog').then(({ usePostHog }) => {
        const { posthog } = usePostHog()
        posthog.identify(id, { is_desktop: true })
      })
      import('@sentry/electron/renderer').then(Sentry => {
        Sentry.setUser({ id })
      })
    }
  }, { immediate: true })

  // FAILSAFE: Verify Project Selection state after mounting
  setTimeout(() => {
     // Recover Name from storage
     const lastPName = localStorage.getItem('andb_last_pname')
     const lastPId = localStorage.getItem('andb_last_pid')
     console.log('[App] Failsafe Check:', { lastPName, lastPId })
     
     // Note: Store init happens before this, but let's just log verification.
     // Actual recovery logic is better placed in the store itself, which we improved.
  }, 1000)

  // System Db Dogfooding: Automatically setup the "TheAndb System" project
  const assureSystemDb = async () => {
    let dbPath = settingsStore.settings.sqlitePath
    
    // Fetch from backend if store is empty
    if (!dbPath && (window as any).electronAPI?.getDbPath) {
      const res = await (window as any).electronAPI.getDbPath()
      if (res?.success) {
        dbPath = res.data
        settingsStore.settings.sqlitePath = res.data
      }
    }

    if (!dbPath) {
       dbPath = 'default' 
    }
    if (dbPath && projectsStore.isLoaded) {
      await projectsStore.setupSystemProject(dbPath)
      // Force UI observation after manual store injections
      await projectsStore.reloadData()
    }
  }

  // Watch for Project Load & Path changes
  watch([() => settingsStore.settings.sqlitePath, () => projectsStore.isLoaded], () => {
    if (projectsStore.isLoaded) assureSystemDb()
  }, { immediate: true })

})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  
  window.removeEventListener('database-refresh-requested', handleDatabaseRefreshRequested)
  window.removeEventListener('category-refresh-requested', handleCategoryRefreshRequested)
  window.removeEventListener('object-refresh-requested', handleObjectRefreshRequested)
  if (window.electronAPI?.updater) {
    window.electronAPI.updater.offUpdateStatus()
  }
})
</script>
