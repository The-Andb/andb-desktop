<template>
  <div id="app" class="h-screen bg-gray-50 dark:bg-gray-900">
    <router-view />
    <UpdateModal />
    <ShortcutsModal 
      :isOpen="shortcutStore.isModalOpen" 
      @close="shortcutStore.closeModal" 
    />
    <MigrationChangelogModal
      :isOpen="showMigrationChangelog"
      :report="migrationReport"
      :isAppUpdate="isAppChangelog"
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
import { useShortcutStore } from '@/stores/shortcut'
import Andb from '@/utils/andb'

import UpdateModal from '@/components/general/UpdateModal.vue'
import ShortcutsModal from '@/components/general/ShortcutsModal.vue'
import MigrationChangelogModal from '@/components/general/MigrationChangelogModal.vue'

const appStore = useAppStore()
const updaterStore = useUpdaterStore()
const consoleStore = useConsoleStore()
const sidebarStore = useSidebarStore()
const featuresStore = useFeaturesStore()
const shortcutStore = useShortcutStore()

// Inject Dynamic Typography Variables into DOM root
watch(() => appStore.fontSizes, (sizes) => {
  if (!sizes) return
  const root = document.documentElement
  root.style.setProperty('--font-title', `${sizes.title || 18}px`)
  root.style.setProperty('--font-subtitle', `${sizes.subtitle || 14}px`)
  root.style.setProperty('--font-content', `${sizes.content || 13}px`)
  root.style.setProperty('--font-quote', `${sizes.quote || 11}px`)
  root.style.setProperty('--font-code', `${sizes.code || 12}px`)
}, { deep: true, immediate: true })

// Migration Changelog state
const showMigrationChangelog = ref(false)
const migrationReport = ref<any>(null)
const isAppChangelog = ref(false)

const dismissMigrationChangelog = async () => {
  showMigrationChangelog.value = false
  migrationReport.value = null
  try {
    if (isAppChangelog.value) {
      await window.electronAPI?.dismissAppChangelog?.()
      isAppChangelog.value = false
    } else {
      await window.electronAPI?.dismissMigrationChangelog?.()
    }
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
    appStore.isSchemaFetching = true
    consoleStore.addLog(`Database Refresh: ${db}`, 'info')
    consoleStore.setVisibility(true)
    
    // Clear data first for full refresh
    await Andb.clearConnectionData(conn)
    
    const ddlTypes: any[] = ['tables', 'views', 'procedures', 'functions', 'triggers', 'events']
    consoleStore.addLog(`Fetching all DDL types for ${conn.name} (parallel)...`, 'info')
    
    await Promise.all(ddlTypes.map(async type => {
      const taskId = `${conn.id}-${type}`
      appStore.updateSchemaProgress(taskId, { current: 0, total: 1, type, connectionName: conn.name })
      
      try {
        await Andb.export(conn, null as any, { 
          type,
          environment: conn.environment 
        })
      } finally {
        appStore.updateSchemaProgress(taskId, { current: 1, total: 1, type, connectionName: conn.name })
        setTimeout(() => appStore.removeSchemaProgress(taskId), 100)
      }
    }))
    
    consoleStore.addLog(`Database ${db} refresh complete.`, 'success')
    sidebarStore.triggerRefresh()
  } catch (err: any) {
    consoleStore.addLog(`Refresh failed: ${err.message}`, 'error')
  } finally {
    appStore.isSchemaFetching = false
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
    appStore.isSchemaFetching = true
    consoleStore.addLog(`Category Refresh: ${type} in ${db}`, 'info')
    consoleStore.setVisibility(true)
    
    const taskId = `${conn.id}-${type}`
    appStore.updateSchemaProgress(taskId, { current: 0, total: 1, type, connectionName: conn.name })

    try {
      await Andb.export(conn, null as any, { type: type as any, environment: conn.environment })
    } finally {
      appStore.updateSchemaProgress(taskId, { current: 1, total: 1, type, connectionName: conn.name })
      setTimeout(() => appStore.removeSchemaProgress(taskId), 100)
    }
    
    consoleStore.addLog(`${type} refresh complete.`, 'success')
    sidebarStore.triggerRefresh()
  } catch (err: any) {
    consoleStore.addLog(`Refresh failed: ${err.message}`, 'error')
  } finally {
    appStore.isSchemaFetching = false
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
  const isMod = event.ctrlKey || event.metaKey
  const key = event.key.toLowerCase()

  // Cmd+B: Toggle Sidebar
  if (isMod && key === 'b') {
    event.preventDefault()
    appStore.toggleSidebar()
    return
  }

  // Cmd+W: Close Tab (Emit global event)
  if (isMod && key === 'w') {
    event.preventDefault()
    window.dispatchEvent(new CustomEvent('andb-close-active-tab'))
    return
  }

  // Cmd+[ / Cmd+]: Prev/Next Tab
  if (isMod && key === '[') {
    event.preventDefault()
    window.dispatchEvent(new CustomEvent('andb-prev-tab'))
    return
  }
  if (isMod && key === ']') {
    event.preventDefault()
    window.dispatchEvent(new CustomEvent('andb-next-tab'))
    return
  }

  // Cmd+R: Refresh
  if (isMod && key === 'r') {
    event.preventDefault()
    window.dispatchEvent(new CustomEvent('andb-refresh-active-view'))
    return
  }

  // Cmd+F: Focus Search
  if (isMod && key === 'f') {
    event.preventDefault()
    window.dispatchEvent(new CustomEvent('andb-focus-search'))
    return
  }

  // Cmd+/: Show Shortcuts
  if (isMod && key === '/') {
    event.preventDefault()
    shortcutStore.openModal()
    return
  }
}

onMounted(async () => {
  await featuresStore.fetchFeatures()
  
  
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
        let connId = data.connectionId || data.connId
        
        // Priority Resolution: Use active context if ID is missing from event
        if (!connId && appStore.activeFetchConnectionId) {
          connId = appStore.activeFetchConnectionId
        }
        
        // Fallback: Multi-factor lookup (Env + DB)
        if (!connId && data.env) {
          const conn = appStore.resolvedConnections.find(c => 
            c.environment === data.env && 
            (c.database === data.db || c.name === data.db || !data.db)
          )
          if (conn) {
            connId = conn.id
          }
        }
        
        // Final fallback
        connId = connId || appStore.selectedConnectionId || 'default'
        
        const opId = data.type ? `${connId}-${data.type}` : `export-${connId}`
        const connObj = appStore.getConnectionById(connId)
        const connectionName = connObj?.name || data.env || data.connectionName || 'GLOBAL'

        if (data.state === 'finished') {
          appStore.updateSchemaProgress(opId, {
            current: data.total || 1,
            total: data.total || 1,
            type: data.type || 'schema',
            connectionName
          })
          setTimeout(() => {
            appStore.removeSchemaProgress(opId)
          }, 100)
        } else {
          appStore.updateSchemaProgress(opId, {
            current: data.current || 0,
            total: data.total || 0,
            type: data.type || '',
            connectionName: data.env || data.connectionName || 'GLOBAL'
          })
        }
      }
    })
  }

  // Check for app changelog or migration changelog
  setTimeout(async () => {
    try {
      // 1. Check for App Version Upgrade Changelog (Priority)
      if (window.electronAPI?.getAppChangelog) {
        const result = await window.electronAPI.getAppChangelog()
        if (result?.success && result.data) {
          migrationReport.value = result.data
          isAppChangelog.value = true
          showMigrationChangelog.value = true
          return // Prioritize app changelog over migration changelog
        }
      }

      // 2. Check for Database Migration Changelog
      if (window.electronAPI?.getMigrationChangelog) {
        const result = await window.electronAPI.getMigrationChangelog()
        if (result?.success && result.data) {
          migrationReport.value = result.data
          isAppChangelog.value = false
          showMigrationChangelog.value = true
        }
      }
    } catch (e) {
      // Silent fail
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
