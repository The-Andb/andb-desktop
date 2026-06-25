import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { useConsoleStore } from '@/stores/console'
import { useNotificationStore } from '@/stores/notification'
import { useSidebarStore } from '@/stores/sidebar'
import Andb from '@/utils/andb'

export interface ParsedColumnInfo {
  name: string
  type: string
  pk: boolean
  notNull: boolean
  unique: boolean
  autoIncrement: boolean
  default?: string
  comment?: string
}

export interface TableColumnIndex {
  columns: ParsedColumnInfo[]
  indexes: any[]
  foreignKeys: any[]
  options: any
  partitions: string | null
}

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

  const logDiag = (msg: string, type: 'info' | 'warn' | 'error' = 'info') => {
    consoleStore.addLog(msg, type)
    try {
      if ((window as any).electronAPI?.log?.send) {
        (window as any).electronAPI.log.send(type, msg)
      } else if ((window as any).electronAPI?.log?.log) {
        (window as any).electronAPI.log.log(type, msg)
      }
    } catch (e) { }
  }

  const loading = ref(false)
  const statusMessage = ref('')
  const error = ref<string | null>(null)
  const selectedDbLastUpdated = ref<string | null>(null)

  // Column Index for instant column-level search
  const columnIndex = ref<Record<string, TableColumnIndex>>({})
  const isIndexingColumns = ref(false)
  const columnIndexProgress = ref({ current: 0, total: 0 })
  let columnIndexAbortController: AbortController | null = null

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
      ...schemaData.value.tables
        .filter((i: any) => i.name)
        .map((i: any) => ({ ...i, type: 'tables' })),
      ...schemaData.value.procedures
        .filter((i: any) => i.name)
        .map((i: any) => ({ ...i, type: 'procedures' })),
      ...schemaData.value.functions
        .filter((i: any) => i.name)
        .map((i: any) => ({ ...i, type: 'functions' })),
      ...schemaData.value.views
        .filter((i: any) => i.name)
        .map((i: any) => ({ ...i, type: 'views' })),
      ...schemaData.value.triggers
        .filter((i: any) => i.name)
        .map((i: any) => ({ ...i, type: 'triggers' })),
      ...schemaData.value.events
        .filter((i: any) => i.name)
        .map((i: any) => ({ ...i, type: 'events' }))
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
    columnIndex.value = {}
    isIndexingColumns.value = false
    columnIndexProgress.value = { current: 0, total: 0 }
    if (columnIndexAbortController) {
      columnIndexAbortController.abort()
      columnIndexAbortController = null
    }
    schemaData.value = {
      tables: [],
      procedures: [],
      functions: [],
      views: [],
      triggers: [],
      events: []
    }
  }

  // Background column indexing functionality is currently disabled to prevent IPC overhead.

  // Manual/On-demand rebuild column index when tables data changes
  // Disabling automatic background indexing as it causes massive IPC overhead and hangs
  /*
  watch(() => schemaData.value.tables, (newTables) => {
    if (newTables && newTables.length > 0) {
      buildColumnIndex(newTables)
    } else {
      columnIndex.value = {}
    }
  })
  */

  const loadSchema = async (forceRefresh = false, keepSelection = false, hardPurge = false) => {
    if (!selectedConnectionId.value) return

    const currentRunConnectionId = selectedConnectionId.value
    const isStale = () => selectedConnectionId.value !== currentRunConnectionId

    const conn = appStore.getConnectionById(selectedConnectionId.value)
    if (!conn) return

    // Set active fetch context for global IPC listener matching
    appStore.activeFetchConnectionId = conn.id

    loading.value = true
    if (forceRefresh) {
      appStore.isSchemaFetching = true // Lock global fetch state
      statusMessage.value = t('schema.fetchingFromDb')
      consoleStore.clearLogs()
    } else {
      // Silent load from cache
      statusMessage.value = t('schema.loadingCache')
    }

    error.value = null

    let preservedName = null
    let preservedType = null

    const isVirtualTab = selectedItem.value && ['query', 'diagrams', 'deep-search'].includes(selectedItem.value.type) || selectedItem.value?.isNew

    if (keepSelection || forceRefresh || isVirtualTab) {
      preservedName = selectedItem.value?.name
      preservedType = selectedItem.value?.type
    } else {
      // Reset selection and clear schema cache instantly to avoid showing stale tables from old connections
      selectedItem.value = null
      selectedFilterType.value = 'all'
      clearSchemaData()
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
            consoleStore.addLog(
              `Refreshing single object: ${selectedItem.value.name} (${selectedItem.value.type})`,
              'info'
            )
          }

          const taskId = `${conn.id}-${selectedItem.value.type}-${selectedItem.value.name || 'all'}`
          appStore.updateSchemaProgress(taskId, {
            current: 0,
            total: 1,
            type: selectedItem.value.type,
            connectionName: conn.name
          })

          try {
            const res = await Andb.export(conn, null as any, {
              type: objTypes[0],
              env: conn.environment,
              name: exportName
            })
            if (isStale()) return
            const summary = res?.data || {}
            Object.entries(summary).forEach(([type, count]) => {
              consoleStore.addLog(`Fetched ${count} ${type}`, 'success')
            })
          } finally {
            appStore.updateSchemaProgress(taskId, {
              current: 1,
              total: 1,
              type: selectedItem.value.type,
              connectionName: conn.name
            })
            setTimeout(() => appStore.removeSchemaProgress(taskId), 500)
          }
        } else if (selectedFilterType.value && selectedFilterType.value !== 'all') {
          // 2. Refresh specific category
          const type = selectedFilterType.value as any
          consoleStore.addLog(`andb export --source ${conn.environment} --type ${type}`, 'cmd')

          const taskId = `${conn.id}-${type}`
          appStore.updateSchemaProgress(taskId, {
            current: 0,
            total: 1,
            type,
            connectionName: conn.name
          })

          try {
            const res = await Andb.export(conn, null as any, {
              type,
              env: conn.environment
            })
            if (isStale()) return
            const summary = res?.data || {}
            Object.entries(summary).forEach(([t, count]) => {
              consoleStore.addLog(`Fetched ${count} ${t}`, 'success')
            })
          } finally {
            appStore.updateSchemaProgress(taskId, {
              current: 1,
              total: 1,
              type,
              connectionName: conn.name
            })
            setTimeout(() => appStore.removeSchemaProgress(taskId), 500)
          }
        } else {
          // 3. FULL REFRESH
          if (hardPurge) {
            consoleStore.addLog('🔥 EXECUTING HARD FORCE-FETCH (Physically purging local folder structure & database caches...)', 'error')
          } else {
            consoleStore.addLog(t('schema.cleaningCache'), 'warn')
          }

          if (isStale()) return
          const clearResult = await Andb.clearConnectionData(conn, hardPurge)
          if (isStale()) return

          if (clearResult) {
            consoleStore.addLog(`Cleared ${clearResult.ddlCount || 0} DDL records`, 'info')
            consoleStore.addLog(
              `Cleared ${clearResult.comparisonCount || 0} Comparison records`,
              'info'
            )
            if (hardPurge) {
              consoleStore.addLog('✅ Hard Purge Completed Successfully: Local physical folders cleared.', 'success')
            }
          }

          consoleStore.addLog(t('schema.refreshed'), 'info')

          const ddlTypes: any[] = [
            'tables',
            'views',
            'procedures',
            'functions',
            'triggers',
            'events'
          ]
          consoleStore.addLog(
            `andb export --source ${conn.environment} (safe sequential execution)`,
            'cmd'
          )

          // Execute sequentially to prevent SQLite write-contention and database connection pool lockups
          for (const type of ddlTypes) {
            if (isStale()) return
            const taskId = `${conn.id}-${type}`
            appStore.updateSchemaProgress(taskId, {
              current: 0,
              total: 1,
              type,
              connectionName: conn.name
            })

            try {
              await Andb.export(conn, null as any, {
                type,
                environment: conn.environment,
                env: conn.environment // double check both formats
              })
              if (isStale()) return
            } catch (fetchErr: any) {
              console.warn(`[useSchemaLoader] Failed fetching ${type}:`, fetchErr)
              consoleStore.addLog(`⚠️ Warning: Skipping ${type} fetch due to error: ${fetchErr.message || fetchErr}`, 'warn')
            } finally {
              appStore.updateSchemaProgress(taskId, {
                current: 1,
                total: 1,
                type,
                connectionName: conn.name
              })
              // Small delay to show completion before removing
              setTimeout(() => appStore.removeSchemaProgress(taskId), 100)
            }
          }
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
      logDiag(`[Diagnostic] loadSchema called. selectedConnectionId: ${selectedConnectionId.value}`)

      if (isStale()) return
      // Strip Vue reactive proxy — Electron IPC structured clone cannot serialize Proxy objects
      const plainConnections = JSON.parse(JSON.stringify(appStore.resolvedConnections))
      const allSchemasRes = await Andb.getSchemas(plainConnections)
      if (isStale()) return
      let allSchemas = allSchemasRes.data || []

      logDiag(`[Diagnostic] getSchemas returned environments: ${JSON.stringify(allSchemas.map((e: any) => ({ name: e.name, databases: e.databases?.map((d: any) => ({ name: d.name, connectionId: d.connectionId, tables: d.tables?.length })) })))}`)

      // Fallback: if backend returned nothing, use sidebar store cache (avoids "NO SCHEMA LOADED" on cold start)
      if (allSchemas.length === 0 && sidebarStore.environments.length > 0) {
        logDiag('[Diagnostic] getSchemas returned empty, falling back to sidebarStore cache', 'warn')
        allSchemas = sidebarStore.environments
      }

      logDiag(`[Diagnostic] conn found: ${conn ? JSON.stringify({ id: conn.id, name: conn.name, environment: conn.environment, database: conn.database }) : 'null'}`)

      const envData = allSchemas?.find((e: any) => (e.name || '').toLowerCase() === (conn.environment || '').toLowerCase())
      logDiag(`[Diagnostic] envData found: ${envData ? envData.name : 'null'}`)

      const targetDbName = conn.database || conn.name
      const dbData = envData?.databases?.find((d: any) => {
        const dName = (d.name || '').toLowerCase()
        const tName = (targetDbName || '').toLowerCase()
        const cName = (conn.name || '').toLowerCase()
        const connIdMatch = d.connectionId && conn.id && d.connectionId === conn.id
        return dName === tName || dName === cName || connIdMatch
      })

      logDiag(`[Diagnostic] dbData found: ${dbData ? JSON.stringify({ name: dbData.name, connectionId: dbData.connectionId, tablesCount: dbData.tables?.length }) : 'null'}`)

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

        // Update sidebar cache if we got fresh data from backend
        if (allSchemasRes.data && allSchemasRes.data.length > 0) {
          sidebarStore.setEnvironments(allSchemasRes.data)
        }

      } else {
        logDiag('[Diagnostic] dbData not found, clearing schema data', 'warn')
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
      if (isStale()) return

      loading.value = false
      appStore.isSchemaFetching = false
      appStore.activeFetchConnectionId = null

      if (preservedName && preservedType) {
        const newItem = allResults.value.find(
          i => i.name === preservedName && i.type === preservedType
        )
        if (newItem) {
          selectedItem.value = newItem
        }
      }
    }
  }

  watch(
    () => sidebarStore.refreshKey,
    () => {
      logDiag('[Diagnostic] refreshKey changed, reloading schema', 'info')
      loadSchema()
    }
  )


  return {
    loading,
    error,
    statusMessage,
    schemaData,
    allResults,
    selectedDbLastUpdated,
    loadSchema,
    clearSchemaData,
    columnIndex,
    isIndexingColumns,
    columnIndexProgress
  }
}
