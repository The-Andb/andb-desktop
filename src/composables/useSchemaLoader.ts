import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { useConsoleStore } from '@/stores/console'
import { useNotificationStore } from '@/stores/notification'
import { useSidebarStore } from '@/stores/sidebar'
import Andb from '@/utils/andb'

export function useSchemaLoader(
  selectedConnectionId: { value: string | null },
  selectedItem: { value: any },
  selectedFilterType: { value: string }
) {
  const { t } = useI18n()
  const appStore = useAppStore()
  const consoleStore = useConsoleStore()
  const notificationStore = useNotificationStore()
  const sidebarStore = useSidebarStore()

  const loading = ref(false)
  const statusMessage = ref('')
  const error = ref<string | null>(null)
  const selectedDbLastUpdated = ref<string | null>(null)

  const schemaData = ref({
    tables: [] as any[],
    procedures: [] as any[],
    functions: [] as any[],
    views: [] as any[],
    triggers: [] as any[],
    events: [] as any[]
  })

  const allResults = computed(() => {
    const base = [
      ...schemaData.value.tables.filter((i: any) => i.name).map((i: any) => ({ ...i, type: 'tables' })),
      ...schemaData.value.procedures.filter((i: any) => i.name).map((i: any) => ({ ...i, type: 'procedures' })),
      ...schemaData.value.functions.filter((i: any) => i.name).map((i: any) => ({ ...i, type: 'functions' })),
      ...schemaData.value.views.filter((i: any) => i.name).map((i: any) => ({ ...i, type: 'views' })),
      ...schemaData.value.triggers.filter((i: any) => i.name).map((i: any) => ({ ...i, type: 'triggers' })),
      ...schemaData.value.events.filter((i: any) => i.name).map((i: any) => ({ ...i, type: 'events' }))
    ]
    const hasData = base.length > 0
    if (hasData) {
      base.unshift({ name: 'Interactive ERD', type: 'diagrams' })
    }
    return base
  })

  // Set schemaData back to purely empty initially
  const clearSchemaData = () => {
    selectedDbLastUpdated.value = null
    schemaData.value = {
      tables: [],
      procedures: [],
      functions: [],
      views: [],
      triggers: [],
      events: []
    }
  }

  const loadSchema = async (forceRefresh = false, keepSelection = false) => {
    if (!selectedConnectionId.value) return
    
    const conn = appStore.getConnectionById(selectedConnectionId.value)
    if (!conn) return

    // Set active fetch context for global IPC listener matching
    appStore.activeFetchConnectionId = conn.id

    loading.value = true
    if (forceRefresh) {
      appStore.isSchemaFetching = true // Lock global fetch state
      consoleStore.setVisibility(true) // Open console only on manual refresh
      statusMessage.value = t('schema.fetchingFromDb')
      consoleStore.clearLogs()
    } else {
      // Silent load from cache
      statusMessage.value = t('schema.loadingCache')
    }
    
    error.value = null
    
    let preservedName = null
    let preservedType = null
    
    if (keepSelection || forceRefresh) {
      preservedName = selectedItem.value?.name
      preservedType = selectedItem.value?.type
    } else {
      // Reset selection if changing DBs normally
      selectedItem.value = null
      selectedFilterType.value = 'all'
    }

    try {
      if (forceRefresh) {
        // REAL FETCH: Hit the database
        consoleStore.addLog(t('schema.connecting'), 'info')
        
        // Atomic Refresh Logic
        if (selectedItem.value) {
          // 1. Refresh specific object
          let objTypes: any[] = [selectedItem.value.type.toLowerCase()]
          let exportName: string | undefined = selectedItem.value.name

          if (selectedItem.value.type === 'diagrams') {
            objTypes = ['tables']
            exportName = undefined
            consoleStore.addLog(`Refreshing tables for Interactive ERD...`, 'info')
          } else {
            consoleStore.addLog(`Refreshing single object: ${selectedItem.value.name} (${selectedItem.value.type})`, 'info')
          }
          
          const taskId = `${conn.id}-${selectedItem.value.type}-${selectedItem.value.name || 'all'}`
          appStore.updateSchemaProgress(taskId, { current: 0, total: 1, type: selectedItem.value.type, connectionName: conn.name })
          
          try {
            const res = await Andb.export(conn, null as any, { 
              type: objTypes[0], 
              env: conn.environment, 
              name: exportName 
            })
            const summary = res?.data || {}
            Object.entries(summary).forEach(([type, count]) => {
              consoleStore.addLog(`Fetched ${count} ${type}`, 'success')
            })
          } finally {
            appStore.updateSchemaProgress(taskId, { current: 1, total: 1, type: selectedItem.value.type, connectionName: conn.name })
            setTimeout(() => appStore.removeSchemaProgress(taskId), 500)
          }

        } else if (selectedFilterType.value && selectedFilterType.value !== 'all') {
          // 2. Refresh specific category
          const type = selectedFilterType.value as any
          consoleStore.addLog(`andb export --source ${conn.environment} --type ${type}`, 'cmd')
          
          const taskId = `${conn.id}-${type}`
          appStore.updateSchemaProgress(taskId, { current: 0, total: 1, type, connectionName: conn.name })

          try {
            const res = await Andb.export(conn, null as any, { 
              type,
              env: conn.environment
            })
            const summary = res?.data || {}
            Object.entries(summary).forEach(([t, count]) => {
                consoleStore.addLog(`Fetched ${count} ${t}`, 'success')
            })
          } finally {
            appStore.updateSchemaProgress(taskId, { current: 1, total: 1, type, connectionName: conn.name })
            setTimeout(() => appStore.removeSchemaProgress(taskId), 500)
          }

        } else {
          // 3. FULL REFRESH
          consoleStore.addLog(t('schema.cleaningCache'), 'warn')
          const clearResult = await Andb.clearConnectionData(conn)
          
          if (clearResult) {
            consoleStore.addLog(`Cleared ${clearResult.ddlCount || 0} DDL records`, 'info')
            consoleStore.addLog(`Cleared ${clearResult.comparisonCount || 0} Comparison records`, 'info')
          }
          
          consoleStore.addLog(t('schema.refreshed'), 'info')
          
          const ddlTypes: any[] = ['tables', 'views', 'procedures', 'functions', 'triggers', 'events']
          consoleStore.addLog(`andb export --source ${conn.environment} (parallel execution)`, 'cmd')
          
          await Promise.all(ddlTypes.map(async type => {
            const taskId = `${conn.id}-${type}`
            appStore.updateSchemaProgress(taskId, { current: 0, total: 1, type, connectionName: conn.name })
            
            try {
              await Andb.export(conn, null as any, { 
                type,
                environment: conn.environment,
                env: conn.environment // double check both formats
              })
            } finally {
              appStore.updateSchemaProgress(taskId, { current: 1, total: 1, type, connectionName: conn.name })
              // Small delay to show completion before removing
              setTimeout(() => appStore.removeSchemaProgress(taskId), 100)
            }
          }))
        }

        notificationStore.add({
          type: 'success',
          title: t('schema.refreshed'),
          message: t('schema.refreshedDesc', { name: conn.name })
        })
        
        consoleStore.addLog(t('schema.refreshSuccess'), 'success')
        sidebarStore.triggerRefresh() // Trigger sidebar update
      } 
      
      // Always load from cache to update UI state
      console.log('[useSchemaLoader] loadSchema called. ConnId:', selectedConnectionId.value, 'Filter:', selectedFilterType.value)
      
      const allSchemasRes = await Andb.getSchemas()
      const allSchemas = allSchemasRes.data || []
      
      const envData = allSchemas?.find((e: any) => e.name === conn.environment)
      if (!envData) console.warn('[useSchemaLoader] Environment not found in schemas:', conn.environment)

      const targetDbName = conn.database || conn.name
      const dbData = envData?.databases?.find((d: any) => {
         const dName = d.name.toLowerCase()
         return dName === targetDbName.toLowerCase() || 
                (conn.name && dName === conn.name.toLowerCase()) ||
                (conn.database && dName === conn.database.toLowerCase())
      })

      if (dbData) {
        selectedDbLastUpdated.value = dbData.lastUpdated || null
        
        schemaData.value = {
          tables: dbData.tables || [],
          procedures: dbData.procedures || [],
          functions: dbData.functions || [],
          views: dbData.views || [],
          triggers: dbData.triggers || [],
          events: dbData.events || []
        }
      } else {
        clearSchemaData()
      }

    } catch (err: any) {
      error.value = err.message
      consoleStore.addLog(`Error loading schema: ${err.message}`, 'error')
      notificationStore.add({
        type: 'error',
        title: t('schema.errorLoading'),
        message: err.message
      })
    } finally {
      loading.value = false
      appStore.isSchemaFetching = false
      appStore.activeFetchConnectionId = null
      
      if (preservedName && preservedType) {
        const newItem = allResults.value.find(i => i.name === preservedName && i.type === preservedType)
        if (newItem) {
          selectedItem.value = newItem
        }
      }
    }
  }

  return {
    loading,
    error,
    statusMessage,
    schemaData,
    allResults,
    selectedDbLastUpdated,
    loadSchema,
    clearSchemaData
  }
}
