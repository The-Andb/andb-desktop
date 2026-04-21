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

  /**
   * Background column indexing: parse all table DDLs to extract column metadata.
   * Runs in batches to avoid blocking the UI.
   */
  const buildColumnIndex = async (tables: any[]) => {
    // Abort any previous indexing
    if (columnIndexAbortController) {
      columnIndexAbortController.abort()
    }
    columnIndexAbortController = new AbortController()
    const signal = columnIndexAbortController.signal

    const tablesToParse = tables.filter(t => t.name && (t.content || t.ddl))
    if (tablesToParse.length === 0) {
      columnIndex.value = {}
      return
    }

    isIndexingColumns.value = true
    columnIndexProgress.value = { current: 0, total: tablesToParse.length }
    const newIndex: Record<string, TableColumnIndex> = {}
    const BATCH_SIZE = 10

    try {
      for (let i = 0; i < tablesToParse.length; i += BATCH_SIZE) {
        if (signal.aborted) return

        const batch = tablesToParse.slice(i, i + BATCH_SIZE)
        const results = await Promise.all(
          batch.map(async (table) => {
            try {
              const ddl = table.content || table.ddl
              if (!ddl) return { name: table.name, data: null }
              const result = await (window as any).electronAPI.andbParseTable(ddl)
              return { name: table.name, data: result?.success ? result.data : null }
            } catch {
              return { name: table.name, data: null }
            }
          })
        )

        for (const r of results) {
          if (signal.aborted) return
          if (r.data) {
            newIndex[r.name] = {
              columns: (r.data.columns || []).map((c: any) => ({
                name: c.name,
                type: c.type || '',
                pk: !!c.pk,
                notNull: !!c.notNull,
                unique: !!c.unique,
                autoIncrement: !!c.autoIncrement,
                default: c.default ? String(c.default) : undefined,
                comment: c.comment || undefined
              })),
              indexes: r.data.indexes || [],
              foreignKeys: r.data.foreignKeys || []
            }
          }
        }

        columnIndexProgress.value = { current: Math.min(i + BATCH_SIZE, tablesToParse.length), total: tablesToParse.length }
        // Yield to UI thread between batches
        await new Promise(resolve => setTimeout(resolve, 0))
      }

      if (!signal.aborted) {
        columnIndex.value = newIndex
        console.log(`[useSchemaLoader] Column index built: ${Object.keys(newIndex).length} tables, ${Object.values(newIndex).reduce((acc, t) => acc + t.columns.length, 0)} columns`)
      }
    } catch (e) {
      console.warn('[useSchemaLoader] Column indexing failed:', e)
    } finally {
      if (!signal.aborted) {
        isIndexingColumns.value = false
      }
    }
  }

  // Auto-rebuild column index when tables data changes
  watch(() => schemaData.value.tables, (newTables) => {
    if (newTables && newTables.length > 0) {
      buildColumnIndex(newTables)
    } else {
      columnIndex.value = {}
    }
  })

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
    clearSchemaData,
    columnIndex,
    isIndexingColumns,
    columnIndexProgress
  }
}
