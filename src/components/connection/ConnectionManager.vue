<template>
  <div class="space-y-4 animate-in fade-in duration-500 relative">
    <!-- View: Connection List -->
    <div v-if="!showAddForm && !editingConnection" class="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">

      <!-- Header + Filters + Actions -->
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div class="flex items-center gap-4">
          <h3 class="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">
            PROJECT CONNECTIONS
          </h3>

          <!-- FILTERS -->
          <div class="flex items-center gap-2">
            <!-- Quick Env Filter Pills -->
            <div class="hidden sm:flex items-center rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 p-0.5 h-[32px]">
              <button
                type="button"
                @click="viewMode = 'all'; selectedEnvironment = ''"
                class="px-2.5 h-full flex items-center justify-center text-[9px] font-black uppercase tracking-widest rounded transition-all whitespace-nowrap select-none"
                :class="viewMode === 'all' ? 'bg-primary-500 dark:bg-primary-600 text-white shadow-md shadow-primary-500/20' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'"
              >
                All
              </button>
              <button
                v-for="env in enabledEnvironments" :key="env.name"
                type="button"
                @click="selectedEnvironment = env.name; viewMode = 'tabs'"
                class="px-2.5 h-full flex items-center justify-center text-[9px] font-black uppercase tracking-widest rounded transition-all whitespace-nowrap select-none"
                :class="selectedEnvironment === env.name && viewMode === 'tabs' ? 'bg-primary-500 dark:bg-primary-600 text-white shadow-md shadow-primary-500/20' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'"
              >
                {{ env.name }}
              </button>
            </div>
            <!-- Mobile Env Dropdown -->
            <select
              :value="viewMode === 'all' ? 'ALL' : selectedEnvironment"
              @change="handleMobileEnvChange(($event.target as HTMLSelectElement).value)"
              class="sm:hidden text-[10px] font-bold px-2 h-[32px] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md outline-none cursor-pointer"
            >
              <option value="ALL">All</option>
              <option v-for="env in enabledEnvironments" :key="env.name" :value="env.name">{{ env.name }}</option>
            </select>
            <!-- Type Filter -->
            <select v-model="typeFilter" class="text-[10px] font-bold px-2 h-[32px] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md outline-none cursor-pointer">
              <option value="all">All Drivers</option>
              <option value="mysql">MySQL</option>
              <option value="postgres">PostgreSQL</option>
              <option value="sqlite">SQLite</option>
              <option value="dump">Dump</option>
            </select>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 ml-auto w-full sm:w-auto">
          <!-- Bulk Actions -->
          <div v-if="selectedConnections.length > 0" class="flex items-center gap-2 mr-2 animate-in fade-in zoom-in duration-200">
            <span class="text-xs text-gray-500 font-bold">{{ selectedConnections.length }} selected</span>
            
            <Transition name="slide-left" mode="out-in">
              <div v-if="confirmingBulkDelete" class="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm animate-in fade-in duration-200">
                <span class="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Delete {{ selectedConnections.length }}?</span>
                <button @click="confirmingBulkDelete = false" class="text-[11px] font-black uppercase text-gray-400 hover:text-gray-600 px-2">No</button>
                <button @click="confirmingBulkDelete = false; bulkDeleteConnections(true)" class="text-[11px] font-black uppercase bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg transition-all shadow-sm shadow-rose-500/20">Yes</button>
              </div>
              <div v-else class="flex items-center gap-2">
                <button @click="bulkTestConnections" class="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                  <ShieldQuestion class="w-3.5 h-3.5" />
                  Test All
                </button>
                <button @click="confirmingBulkDelete = true" class="btn btn-danger text-xs px-3 py-1.5 flex items-center gap-1">
                  <Trash2 class="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </Transition>

            <button @click="clearSelection" class="text-xs text-gray-400 hover:text-gray-600 px-2 transition-colors">
              Clear
            </button>
          </div>

          <button @click="appStore.clearAllStatuses()" class="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 mx-1" title="Reset all connection statuses">
            <RefreshCw class="w-4 h-4" /> Clean
          </button>

          <button @click="showGlobalPicker = true" class="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95" title="Import from Global Templates">
            <LayoutTemplate class="w-4 h-4" /> Import
          </button>

          <button @click="showAddForm = true" class="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 transition-all active:scale-95">
            <Plus class="w-4 h-4" /> Add Connection
          </button>
        </div>
      </div>

      <!-- Connection Table -->
      <div class="card overflow-hidden rounded-2xl">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th class="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    @change="toggleSelectAll"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-800"
                  />
                </th>
                <th class="px-4 py-2 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  {{ $t('connections.connectionName') }}
                </th>
                <th class="px-4 py-2 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  {{ $t('connections.host') }}
                </th>
                <th class="px-4 py-2 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  {{ $t('connections.database') }}
                </th>
                <th class="px-4 py-2 text-right text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  {{ $t('common.actions') }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-900">
              <!-- Group Headers (by environment when showing all) -->
              <template v-for="group in connectionGroups" :key="group.env">
                <tr v-if="group.connections.length > 0 && viewMode === 'all'">
                  <td colspan="5" class="px-6 py-2 bg-gray-50/50 dark:bg-gray-800/20 text-xs font-black text-gray-500 uppercase tracking-widest">
                    <div class="flex items-center gap-2">
                      <div class="w-1.5 h-1.5 rounded-full" :class="getEnvDotClass(group.env)"></div>
                      {{ group.env }} <span class="text-gray-400 font-mono ml-1">{{ group.connections.length }}</span>
                    </div>
                  </td>
                </tr>
                <tr v-for="connection in group.connections"
                    :key="connection.id"
                    class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                    :class="{ 'bg-primary-50 dark:bg-primary-900/10': selectedConnections.includes(connection.id) }"
                >
                  <td class="px-4 py-2 whitespace-nowrap w-10">
                    <input
                      type="checkbox"
                      :value="connection.id"
                      v-model="selectedConnections"
                      class="rounded border-gray-300 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-800"
                    />
                  </td>
                  <td class="px-4 py-2 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-8 w-8">
                        <div class="h-8 w-8 rounded-lg flex items-center justify-center transition-colors shadow-sm"
                          :class="{
                            'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400': !connection.type || connection.type === 'mysql',
                            'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400': connection.type === 'postgres',
                            'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400': connection.type === 'sqlite',
                            'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400': connection.type === 'dump'
                          }"
                        >
                          <span v-if="connection.type === 'postgres'" class="text-[8px] font-black">PG</span>
                          <span v-else-if="connection.type === 'sqlite'" class="text-[8px] font-black">SL</span>
                          <span v-else-if="connection.type === 'dump'" class="text-[8px] font-black">DP</span>
                          <span v-else class="text-[8px] font-black">MY</span>
                        </div>
                      </div>
                      <div class="ml-3">
                        <div class="flex items-center gap-2">
                          <span class="text-xs font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {{ connection.name }}
                          </span>
                          <span v-if="viewMode === 'tabs'" class="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter bg-gray-100 dark:bg-gray-800 text-gray-500">
                            {{ connection.environment }}
                          </span>
                        </div>
                        <div class="text-[8px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                          {{ connection.type || 'mysql' }}
                          <span v-if="connection.templateId" class="text-primary-500 flex items-center gap-0.5">· <LayoutTemplate class="w-2 h-2" /> linked</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-2 whitespace-nowrap">
                    <div class="flex flex-col max-w-[200px]">
                      <div class="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 overflow-hidden">
                        <Server class="w-3 h-3 text-gray-400 shrink-0" />
                        <span class="truncate" :title="connection.host">{{ connection.host || '(No Host)' }}</span>
                        <span v-if="connection.port" class="shrink-0 text-[10px] opacity-75">:{{ connection.port }}</span>
                      </div>
                      <div class="flex items-center gap-2 text-[10px] mt-0.5 text-gray-500">
                        <User class="w-2.5 h-2.5 opacity-70" />
                        {{ connection.username || '(None)' }}
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-2 whitespace-nowrap">
                    <div v-if="editingDbConnId === connection.id" class="flex items-center gap-1.5 min-w-[120px]">
                      <input
                        v-model="editingDbValue"
                        @blur="saveDbEdit(connection.id)"
                        @keyup.enter="saveDbEdit(connection.id)"
                        @keyup.esc="editingDbConnId = null"
                        v-focus
                        type="text"
                        class="w-full px-2 py-0.5 text-xs font-bold border border-primary-500 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                    <div v-else @click="startEditDb(connection)" class="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded w-fit cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group/db">
                      <Database class="w-3 h-3 text-gray-400 group-hover/db:text-primary-500" />
                      {{ connection.database || '(No DB)' }}
                      <Edit2 class="w-2.5 h-2.5 opacity-0 group-hover/db:opacity-100 text-primary-500 transition-opacity" />
                    </div>
                  </td>
                  <td class="px-4 py-2 whitespace-nowrap text-right text-xs font-medium">
                    <div class="flex items-center justify-end gap-2 px-2 py-1 rounded-lg min-h-[40px]">
                      <Transition name="slide-left" mode="out-in">
                        <div v-if="confirmingId === connection.id" class="flex items-center gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl animate-in fade-in slide-in-from-right-2 duration-300 shadow-sm">
                            <span class="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest shrink-0">Delete connection?</span>
                            <div class="flex items-center gap-3">
                                <button @click="confirmingId = null" class="text-xs font-black uppercase text-gray-400 hover:text-gray-600 px-2 transition-colors">Cancel</button>
                                <button @click="deleteConnection(connection.id, true)" class="text-xs font-black uppercase bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg transition-all shadow-sm shadow-rose-500/20">Confirm</button>
                            </div>
                        </div>
                        <div v-else class="flex items-center justify-end gap-2">
                          <button @click="testConnection(connection.id)"
                            class="relative p-1 rounded-lg transition-all"
                            :class="{
                              'text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20': connection.status === 'idle',
                              'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20': connection.status === 'connected',
                              'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20': connection.status === 'failed',
                              'animate-pulse': connection.status === 'testing'
                            }"
                            :title="$t('connections.testConnection')"
                          >
                            <RefreshCw v-if="connection.status === 'testing'" class="w-4 h-4 animate-spin" />
                            <CheckCircle2 v-else-if="connection.status === 'connected'" class="w-4 h-4" />
                            <AlertCircle v-else-if="connection.status === 'failed'" class="w-4 h-4" />
                            <ShieldQuestion v-else class="w-4 h-4" />
                          </button>
                          <button @click="editConnection(connection)"
                            class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 p-1 rounded-lg transition-all"
                            :title="$t('common.edit')"
                          >
                            <Edit2 class="w-4 h-4" />
                          </button>
                          <button @click="duplicateConnection(connection)"
                            class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 p-1 rounded-lg transition-all"
                            :title="$t('common.duplicate')"
                          >
                            <Copy class="w-4 h-4" />
                          </button>
                          <button @click="confirmingId = connection.id"
                            class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded-lg transition-all"
                            :title="$t('common.delete')"
                          >
                            <Trash2 class="w-4 h-4" />
                          </button>
                        </div>
                      </Transition>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-if="displayedConnections.length === 0" class="flex flex-col items-center justify-center text-center py-16 bg-gray-50/50 dark:bg-gray-900/50">
          <div class="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 text-gray-300 dark:text-gray-600 shadow-inner">
            <Link2 class="w-8 h-8" />
          </div>
          <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-1">{{ $t('connections.noConnections') || 'No endpoints found' }}</h3>
          <p class="text-xs text-gray-500 max-w-xs mb-6">Import from Global Templates or create new connections manually.</p>
          <div class="flex items-center gap-3">
            <button @click="showGlobalPicker = true" class="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest hover:border-primary-500 hover:shadow-lg hover:shadow-primary-500/10 transition-all flex items-center gap-2">
              <LayoutTemplate class="w-4 h-4" /> Import from Global
            </button>
            <button @click="showAddForm = true" class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 transition-all active:scale-95 flex items-center gap-2">
              <Plus class="w-4 h-4" /> New Connection
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- View: Connection Form (Single) -->
    <div v-if="showAddForm || editingConnection" class="animate-in fade-in slide-in-from-right-4 duration-300 bg-white dark:bg-gray-900 h-full flex flex-col pt-2">
      <div class="px-0 py-1 flex items-center justify-between shrink-0 border-b border-gray-100 dark:border-gray-800">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center shadow-inner">
            <Link2 class="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
              {{ editingConnection ? 'Edit Connection' : 'Register Endpoint' }}
            </h3>
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-60">Manual Database Configuration</p>
          </div>
        </div>
        <button @click="closeForm" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 transition-colors flex items-center gap-2">
          <span class="text-xs font-bold uppercase">{{ $t('common.cancel') }}</span>
          <X class="w-4 h-4" />
        </button>
      </div>
      <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <ConnectionForm
          :connection="editingConnection || ({ environment: selectedEnvironment || 'DEV' } as any)"
          @save="handleSaveConnection"
          @cancel="closeForm"
        />
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- SLIDE-OUT PANEL: Import from Global Templates                -->
    <!-- ============================================================ -->
    <Teleport to="body">
      <Transition name="panel">
        <div v-if="showGlobalPicker" class="fixed inset-0 z-[60]" @click.self="showGlobalPicker = false">
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" @click="showGlobalPicker = false"></div>

          <!-- Panel -->
          <div class="absolute top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <!-- Panel Header -->
            <div class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center shadow-inner">
                  <LayoutTemplate class="w-4.5 h-4.5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Import from Global</h3>
                  <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest opacity-60 mt-0.5">Select templates to add</p>
                </div>
              </div>
              <button @click="showGlobalPicker = false" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 transition-colors">
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- Panel Filters -->
            <div class="px-6 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2 shrink-0">
              <div class="flex items-center rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 p-0.5 h-[28px]">
                <button
                  v-for="env in ['ALL', 'DEV', 'UAT', 'STAGE', 'PROD', 'LOCAL']" :key="env"
                  type="button"
                  @click="togglePickerEnvFilter(env)"
                  class="px-2 h-full flex items-center justify-center text-[8px] font-black uppercase tracking-widest rounded transition-all whitespace-nowrap select-none"
                  :class="pickerEnvFilter.includes(env) ? 'bg-primary-500 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 hover:bg-black/5'"
                >
                  {{ env }}
                </button>
              </div>
              <select v-model="pickerTypeFilter" class="text-[9px] font-bold px-1.5 h-[28px] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md outline-none cursor-pointer">
                <option value="ALL">All</option>
                <option value="mysql">MySQL</option>
                <option value="postgres">PG</option>
                <option value="sqlite">SQLite</option>
                <option value="dump">Dump</option>
              </select>
            </div>

            <!-- Panel Template List -->
            <div class="flex-1 overflow-y-auto custom-scrollbar">
              <div class="divide-y divide-gray-100 dark:divide-gray-800">
                <label
                  v-for="t in filteredGlobalTemplates" :key="t.id"
                  class="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                  :class="{ 'bg-primary-50/50 dark:bg-primary-900/10': pickerSelectedIds.includes(t.id) }"
                >
                  <input
                    type="checkbox"
                    :value="t.id"
                    v-model="pickerSelectedIds"
                    class="rounded border-gray-300 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-800 shrink-0"
                  />
                  <div class="flex-shrink-0 h-8 w-8">
                    <div class="h-8 w-8 rounded-lg flex items-center justify-center shadow-sm"
                      :class="{
                        'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400': t.type === 'mysql',
                        'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400': t.type === 'postgres',
                        'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400': t.type === 'sqlite',
                        'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400': t.type === 'dump'
                      }"
                    >
                      <span v-if="t.type === 'postgres'" class="text-[8px] font-black">PG</span>
                      <span v-else-if="t.type === 'sqlite'" class="text-[8px] font-black">SL</span>
                      <span v-else-if="t.type === 'dump'" class="text-[8px] font-black">DP</span>
                      <span v-else class="text-[8px] font-black">MY</span>
                    </div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold text-gray-900 dark:text-white truncate">{{ t.name }}</span>
                      <span v-for="env in (t.environment || '').split(',').filter(Boolean)" :key="env"
                        class="px-1 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter bg-gray-100 dark:bg-gray-800 text-gray-500 shrink-0">
                        {{ env.trim() }}
                      </span>
                    </div>
                    <div class="text-[10px] text-gray-400 font-mono truncate mt-0.5">
                      {{ t.host || '(No Host)' }}{{ t.port ? ':'+t.port : '' }}
                      <span v-if="t.database" class="ml-1 text-gray-500">· {{ t.database }}</span>
                    </div>
                  </div>
                </label>
              </div>

              <!-- Empty state -->
              <div v-if="filteredGlobalTemplates.length === 0" class="flex flex-col items-center justify-center py-16 opacity-40">
                <LayoutTemplate class="w-10 h-10 mb-3 stroke-[1]" />
                <span class="text-[10px] font-black uppercase tracking-widest">No templates match</span>
              </div>
            </div>

            <!-- Panel Footer: Import Action -->
            <div class="px-6 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
              <button @click="pickerSelectedIds = pickerSelectedIds.length === filteredGlobalTemplates.length ? [] : filteredGlobalTemplates.map(t => t.id)"
                class="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors">
                {{ pickerSelectedIds.length === filteredGlobalTemplates.length ? 'Deselect All' : 'Select All' }}
              </button>
              <button
                @click="importSelectedTemplates"
                :disabled="pickerSelectedIds.length === 0"
                class="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/30 active:scale-95 transition-all"
              >
                <Plus class="w-4 h-4" />
                Import {{ pickerSelectedIds.length }} Connection{{ pickerSelectedIds.length === 1 ? '' : 's' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  Plus,
  Database,
  ShieldQuestion,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  LayoutTemplate,
  Link2,
  Server,
  User,
  Copy
} from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { useProjectsStore } from '@/stores/projects'
import { useConnectionPairsStore } from '@/stores/connectionPairs'
import ConnectionForm from './ConnectionForm.vue'
import type { DatabaseConnection } from '@/stores/app'
import { useConnectionTemplatesStore } from '@/stores/connectionTemplates'

const route = useRoute()
const router = useRouter()
const { t: $t } = useI18n()
const appStore = useAppStore()
const projectsStore = useProjectsStore()
const templatesStore = useConnectionTemplatesStore()
const connectionPairsStore = useConnectionPairsStore()

// Inline Edit State
const editingDbConnId = ref<string | null>(null)
const editingDbValue = ref('')

// Directive for auto-focus
const vFocus = {
  mounted: (el: HTMLElement) => el.focus()
}

const startEditDb = (conn: DatabaseConnection) => {
  editingDbConnId.value = conn.id
  editingDbValue.value = conn.database || ''
}

const saveDbEdit = async (id: string) => {
  if (!editingDbConnId.value) return
  const val = editingDbValue.value.trim()
  appStore.updateConnection(id, { database: val })
  editingDbConnId.value = null
}

// State
const viewMode = ref<'tabs' | 'all'>('all')
const selectedEnvironment = ref('')
const typeFilter = ref('all')
const showAddForm = ref(false)
const editingConnection = ref<DatabaseConnection | null>(null)
const selectedConnections = ref<string[]>([])

// Confirmation states
const confirmingId = ref<string | null>(null)
const confirmingBulkDelete = ref(false)

// Global Picker State
const showGlobalPicker = ref(false)
const pickerSelectedIds = ref<string[]>([])
const pickerEnvFilter = ref<string[]>(['ALL'])
const pickerTypeFilter = ref('ALL')

onMounted(async () => {
  await templatesStore.reloadData()
  if (route.query.action === 'new') {
    showAddForm.value = true
    router.replace({ query: { ...route.query, action: undefined } })
  }
  displayedConnections.value.forEach((conn: DatabaseConnection) => {
    if (conn.type !== 'dump') appStore.testConnection(conn.id)
  })
})

const handleMobileEnvChange = (val: string) => {
  if (val === 'ALL') {
    viewMode.value = 'all'
    selectedEnvironment.value = ''
  } else {
    selectedEnvironment.value = val
    viewMode.value = 'tabs'
  }
}

// ── Global Picker Logic ──────────────────────────────────────────

const togglePickerEnvFilter = (env: string) => {
  if (env === 'ALL') {
    pickerEnvFilter.value = ['ALL']
    return
  }
  
  if (pickerEnvFilter.value.includes(env)) {
    pickerEnvFilter.value = ['ALL']
  } else {
    pickerEnvFilter.value = [env]
  }
}

const filteredGlobalTemplates = computed(() => {
  let list = templatesStore.templates.filter(t => !!t.host && t.host.trim() !== '')

  if (!pickerEnvFilter.value.includes('ALL')) {
    list = list.filter(t => {
      if (!t.environment) return false
      return t.environment.split(',').map(s => s.trim()).some(e => pickerEnvFilter.value.includes(e))
    })
  }

  if (pickerTypeFilter.value !== 'ALL') {
    list = list.filter(t => t.type === pickerTypeFilter.value)
  }

  return list
})

const importSelectedTemplates = async () => {
  const targetProjectId = projectsStore.selectedProjectId
  if (!targetProjectId || pickerSelectedIds.value.length === 0) return

  const defaultEnv = connectionPairsStore.enabledEnvironments[0]?.name || 'DEV'

  for (const templateId of pickerSelectedIds.value) {
    const template = templatesStore.templates.find(t => t.id === templateId)
    if (!template) continue

    const connData: Omit<DatabaseConnection, 'id'> = {
      name: template.name,
      environment: (template.environment?.split(',')[0]?.trim() || defaultEnv) as any,
      database: template.database || '',
      templateId: template.id,
      type: template.type as any,
      status: 'idle',
      host: template.host || '',
      port: template.port || 0,
      username: template.username || ''
    }
    await appStore.addConnection(connData, targetProjectId)
  }

  // Reset and close
  pickerSelectedIds.value = []
  showGlobalPicker.value = false
}

// ── Connection List Logic ────────────────────────────────────────

const enabledEnvironments = computed(() => connectionPairsStore.enabledEnvironments)

const displayedConnections = computed(() => {
  let conns = viewMode.value === 'all'
    ? appStore.filteredConnections
    : appStore.filteredConnections.filter(conn => conn.environment === selectedEnvironment.value)

  if (typeFilter.value !== 'all') {
    conns = conns.filter(conn => conn.type === typeFilter.value)
  }

  return conns
})

// Group connections by environment for display
const connectionGroups = computed(() => {
  if (viewMode.value === 'tabs') {
    return [{ env: selectedEnvironment.value, connections: displayedConnections.value }]
  }

  const envOrder = enabledEnvironments.value.map(e => e.name)
  const groups: { env: string, connections: DatabaseConnection[] }[] = []

  for (const envName of envOrder) {
    const conns = displayedConnections.value.filter((c: DatabaseConnection) => c.environment === envName)
    if (conns.length > 0) {
      groups.push({ env: envName, connections: conns })
    }
  }

  const ungrouped = displayedConnections.value.filter((c: DatabaseConnection) => !envOrder.includes(c.environment))
  if (ungrouped.length > 0) {
    groups.push({ env: 'OTHER', connections: ungrouped })
  }

  return groups
})

const isAllSelected = computed(() => displayedConnections.value.length > 0 && displayedConnections.value.every(conn => selectedConnections.value.includes(conn.id)))

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedConnections.value = []
  } else {
    selectedConnections.value = displayedConnections.value.map(conn => conn.id)
  }
}

const clearSelection = () => (selectedConnections.value = [])
const bulkTestConnections = () => selectedConnections.value.forEach(id => appStore.testConnection(id))
const bulkDeleteConnections = (confirmed = false) => {
  if (!confirmed) {
    confirmingBulkDelete.value = true
    return
  }
  selectedConnections.value.forEach(id => appStore.removeConnection(id))
  clearSelection()
}

const getEnvDotClass = (env: string) => {
  const map: Record<string, string> = { DEV: 'bg-green-500', STAGE: 'bg-yellow-500', UAT: 'bg-purple-500', PROD: 'bg-red-500' }
  return map[env] || 'bg-gray-400'
}

const testConnection = (id: string) => appStore.testConnection(id)
const editConnection = (connection: DatabaseConnection) => { editingConnection.value = connection; showAddForm.value = false; }
const deleteConnection = (id: string, confirmed = false) => { 
  if (!confirmed) {
    confirmingId.value = id
    return
  }
  appStore.removeConnection(id)
  confirmingId.value = null
}
const duplicateConnection = (connection: DatabaseConnection) => {
  const { id, ...data } = connection
  appStore.addConnection({
    ...data,
    name: `${connection.name} (Copy)`
  }, projectsStore.selectedProjectId!)
}
const handleSaveConnection = (data: any) => {
  if (editingConnection.value) appStore.updateConnection(editingConnection.value.id, data)
  else appStore.addConnection(data, projectsStore.selectedProjectId!)
  closeForm()
}
const closeForm = () => { showAddForm.value = false; editingConnection.value = null; }

if (enabledEnvironments.value.length > 0) selectedEnvironment.value = enabledEnvironments.value[0].name
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
.dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }

/* Panel transition */
.panel-enter-active,
.panel-leave-active {
  transition: all 0.3s ease;
}
.panel-enter-active > div:first-child,
.panel-leave-active > div:first-child {
  transition: opacity 0.3s ease;
}
.panel-enter-active > div:last-child,
.panel-leave-active > div:last-child {
  transition: transform 0.3s ease;
}
.panel-enter-from > div:first-child,
.panel-leave-to > div:first-child {
  opacity: 0;
}
.panel-enter-from > div:last-child,
.panel-leave-to > div:last-child {
  transform: translateX(100%);
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
