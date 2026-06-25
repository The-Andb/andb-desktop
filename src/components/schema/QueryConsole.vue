<template>
  <div class="h-full w-full bg-white dark:bg-gray-950 flex flex-col overflow-hidden">
      <!-- Main Toolbar -->
    <div
      class="flex-none h-14 px-4 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 gap-4"
    >
      <div class="flex items-center gap-2">
        <!-- Execute / Run Button -->
        <button
          @click="handleExecute(false)"
          :disabled="isLoading || !sql.trim()"
          class="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-800 dark:disabled:to-gray-900 text-white text-[11px] font-black uppercase tracking-wider rounded-lg shadow-md shadow-primary-500/10 active:scale-[0.98] transition-all shrink-0"
        >
          <Play v-if="!isLoading" class="w-3 h-3 fill-current" />
          <Loader2 v-else class="w-3 h-3 animate-spin" />
          <span>{{ isLoading ? 'Running...' : 'Execute' }}</span>
        </button>

        <!-- Cancel / Stop Button -->
        <button
          v-if="isLoading && activeSession && activeConnection"
          @click="handleCancelQuery"
          class="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[11px] font-black uppercase tracking-wider rounded-lg shadow-md shadow-red-500/10 active:scale-[0.98] transition-all shrink-0"
        >
          <X class="w-3 h-3" />
          <span>Stop</span>
        </button>

        <div class="h-5 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1 shrink-0"></div>

        <!-- Fill Params -->
        <button
          @click="fillParameters"
          class="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 transition-colors shrink-0"
          title="Quick Fill Parameters"
        >
          <Wand2 class="w-3.5 h-3.5 text-purple-500" />
          <span>Fill Params</span>
        </button>

        <!-- Format SQL -->
        <button
          @click="formatSql"
          class="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 transition-colors shrink-0"
          title="Format SQL (Alt+Shift+F)"
        >
          <AlignLeft class="w-3.5 h-3.5" />
          <span>Format SQL</span>
        </button>

        <!-- Explain Plan -->
        <button
          @click="handleExplain"
          class="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 transition-colors shrink-0"
          title="Explain Query Plan"
        >
          <Zap class="w-3.5 h-3.5 text-amber-500" />
          <span>Explain Plan</span>
        </button>

        <!-- Save Snippet -->
        <button
          @click="copySql"
          class="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 transition-colors shrink-0"
          title="Copy SQL to Clipboard"
        >
          <Save class="w-3.5 h-3.5" />
          <span>Save Snippet</span>
        </button>
      </div>

      <!-- Right side: Limit, View & Export Dropdowns -->
      <div class="flex items-center gap-2.5 shrink-0">
        <!-- DB Selector -->
        <div class="flex items-center gap-1.5 shrink-0 pr-2 border-r border-gray-200 dark:border-gray-700">
          <Database class="w-3.5 h-3.5 text-gray-400" />
          <select
            v-model="localConnectionId"
            class="bg-transparent border-none text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-0 cursor-pointer min-w-[100px] p-0"
          >
            <option v-for="conn in appStore.filteredConnections" :key="conn.id" :value="conn.id">
              {{ conn.name }} ({{ conn.environment }})
            </option>
          </select>
        </div>

        <!-- Limit Selection -->
        <div class="flex items-center gap-2 shrink-0">
          <span class="text-[10px] font-black uppercase text-gray-455 dark:text-gray-500 tracking-wider">Limit:</span>
          <select
            v-model="limit"
            class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all font-mono"
          >
            <option :value="50">50</option>
            <option :value="100">100</option>
            <option :value="500">500</option>
            <option :value="1000">1000</option>
            <option :value="5000">5000</option>
          </select>
        </div>

        <!-- View Options Dropdown -->
        <div class="relative shrink-0">
          <button
            @click="showViewOptions = !showViewOptions; showExportMenu = false"
            class="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 transition-colors"
            title="Grid View Settings"
          >
            <SlidersHorizontal class="w-3.5 h-3.5" />
            <span>View</span>
            <ChevronDown class="w-3 h-3 opacity-60" />
          </button>
          
          <div
            v-if="showViewOptions"
            @click.stop
            class="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-850 rounded-xl shadow-xl z-50 p-3 flex flex-col gap-3"
          >
            <div class="text-[9px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider pb-1.5 border-b border-gray-100 dark:border-gray-800">
              Grid Settings
            </div>
            
            <!-- Font Size -->
            <div class="flex items-center justify-between gap-4">
              <span class="text-xs text-gray-600 dark:text-gray-400 font-semibold">Font Size:</span>
              <select
                v-model="textSize"
                class="bg-gray-50 dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-750 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="10">Small (10px)</option>
                <option value="12">Medium (12px)</option>
                <option value="14">Large (14px)</option>
              </select>
            </div>

            <!-- Row Height -->
            <div class="flex items-center justify-between gap-4">
              <span class="text-xs text-gray-600 dark:text-gray-400 font-semibold">Row Height:</span>
              <select
                v-model="rowHeight"
                class="bg-gray-50 dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-755 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option :value="26">Small (26px)</option>
                <option :value="32">Medium (32px)</option>
                <option :value="40">Large (40px)</option>
              </select>
            </div>

            <!-- Column Filters Toggle -->
            <div class="flex items-center justify-between gap-4">
              <span class="text-xs text-gray-600 dark:text-gray-400 font-semibold">Column Filters:</span>
              <button
                @click="showColumnFilters = !showColumnFilters"
                class="px-2.5 py-1 text-xs font-bold rounded-lg border transition-all"
                :class="[
                  showColumnFilters
                    ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-500 border-primary-200 dark:border-primary-900/50'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-550 border-gray-200 dark:border-gray-700'
                ]"
              >
                {{ showColumnFilters ? 'Enabled' : 'Disabled' }}
              </button>
            </div>

            <!-- Auto Fit -->
            <button
              @click="autoFitColumns"
              class="w-full flex items-center justify-center gap-1.5 py-1.5 mt-1 bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors"
            >
              <Maximize2 class="w-3.5 h-3.5" />
              <span>Auto Fit Widths</span>
            </button>
          </div>
        </div>

        <!-- Export Dropdown -->
        <div class="relative shrink-0">
          <button
            @click="showExportMenu = !showExportMenu; showViewOptions = false"
            :disabled="!activeSession || !activeSession.results || activeSession.results.length === 0"
            class="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:hover:bg-transparent rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors"
          >
            <Download class="w-3.5 h-3.5" />
            <span>Export</span>
            <ChevronDown class="w-3 h-3 opacity-60" />
          </button>

          <div
            v-if="showExportMenu"
            @click.stop
            class="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-xl shadow-xl z-50 p-2 flex flex-col gap-0.5"
          >
            <div class="px-2.5 py-1.5 text-[9px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider border-b border-gray-100 dark:border-gray-800 mb-1">
              Export Results
            </div>
            <button
              @click="downloadCsv(activeSession); showExportMenu = false"
              class="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 rounded-lg text-left transition-colors"
            >
              <Download class="w-3.5 h-3.5 text-gray-450" />
              <span>Download CSV</span>
            </button>
            <button
              @click="copyResultsAsJson(activeSession); showExportMenu = false"
              class="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 rounded-lg text-left transition-colors"
            >
              <Save class="w-3.5 h-3.5 text-gray-450" />
              <span>Copy as JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Editor Section -->
    <div
      class="flex-none relative bg-white dark:bg-[#1e1e1e] overflow-hidden"
      :style="{ height: editorHeight + 'px' }"
    >
      <MonacoEditor
        ref="monacoRef"
        v-model="sql"
        language="sql"
        :schema-metadata="schemaMetadata"
        @execute="handleExecute(false)"
        @executeNew="handleExecute(false)"
        :options="{
          lineNumbers: 'on',
          glyphMargin: false,
          folding: true,
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 3,
          fontSize: 13,
          fontFamily: 'JetBrains Mono, monospace',
          minimap: { enabled: false }
        }"
      />
    </div>

    <!-- Resizer Handle -->
    <div
      class="h-1.5 cursor-row-resize hover:bg-primary-500/50 transition-colors z-10 bg-gray-100 dark:bg-gray-800 flex items-center justify-center group"
      @mousedown="startEditorResize"
    >
      <div
        class="w-12 h-[2px] bg-gray-300 dark:bg-gray-600 rounded-full group-hover:bg-white transition-colors"
      ></div>
    </div>

    <!-- Results Pane -->
    <div class="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-950 relative">
      <!-- Result Tabs -->
      <div
        v-if="activeSession"
        class="flex-none px-4 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between"
      >
        <div class="flex items-center gap-1">
          <button
            @click="activeTab = 'grid'"
            class="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all duration-200 border-b-2"
            :class="[
              activeTab === 'grid'
                ? 'text-primary-500 border-primary-500'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border-transparent'
            ]"
          >
            Data Grid
          </button>
          <button
            v-if="isExplainSession"
            @click="activeTab = 'explain'"
            class="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all duration-200 border-b-2"
            :class="[
              activeTab === 'explain'
                ? 'text-primary-500 border-primary-500'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border-transparent'
            ]"
          >
            Explain Tree
          </button>
          <button
            @click="activeTab = 'info'"
            class="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all duration-200 border-b-2"
            :class="[
              activeTab === 'info'
                ? 'text-primary-500 border-primary-500'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border-transparent'
            ]"
          >
            Query Info
          </button>
        </div>
      </div>

      <!-- Active Content -->
      <div v-if="activeSession" class="flex-1 flex flex-col min-h-0 overflow-hidden">
        <!-- Error State -->
        <div
          v-if="activeSession.isError"
          class="flex-1 p-6 overflow-auto font-mono text-xs text-red-500 bg-red-50/50 dark:bg-red-950/10"
        >
          <div class="font-bold text-sm mb-2 text-red-600 dark:text-red-400">Error executing query:</div>
          <pre class="whitespace-pre-wrap">{{ activeSession.error }}</pre>
        </div>

        <!-- Result Content (Universal Data Grid) -->
        <UniversalDataGrid
          v-else-if="activeTab === 'grid' && activeSession.results && (activeSession.results.length > 0 || getColumnHeaders(activeSession).length > 0)"
          ref="gridRef"
          :table-id="`query-console-${activeSession.id}`"
          :headers="getColumnHeaders(activeSession)"
          :rows="activeSession.results"
          :is-loading="isLoading"
          :is-loading-more="activeSession.isLoadingMore"
          :is-error="false"
          :read-only="isReadOnlyQuery"
          :row-height="rowHeight"
          :text-size="parseInt(textSize)"
          :show-column-filters="showColumnFilters"
          :connection="activeConnection"
          :table-name="detectTableName(activeSession.sql)"
          @edits-committed="handleExecute(false)"
          @load-more="loadMore"
        />

        <!-- Explain Visual Tree -->
        <div
          v-else-if="activeTab === 'explain' && isExplainSession && activeSession.results"
          class="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-950 font-sans"
        >
          <div class="max-w-4xl mx-auto space-y-4">
            <div
              v-for="(row, idx) in activeSession.results"
              :key="idx"
              class="relative flex gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-150 dark:border-gray-800 shadow-sm transition-all hover:shadow-md"
            >
              <!-- Connection line -->
              <div v-if="idx > 0" class="absolute left-6 -top-4 w-0.5 h-4 bg-primary-500/30"></div>
              
              <!-- Icon/Step indicator -->
              <div class="flex-none w-8 h-8 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                {{ idx + 1 }}
              </div>
              
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <span class="text-[9px] font-black uppercase tracking-wider text-primary-500">{{ row.select_type || 'SELECT' }}</span>
                    <h4 class="text-sm font-bold text-gray-800 dark:text-gray-200 mt-0.5">
                      Access Type: <code class="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-purple-600 dark:text-purple-400 font-bold">{{ row.type }}</code>
                    </h4>
                  </div>
                  <div v-if="row.table" class="text-right">
                    <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Table</span>
                    <div class="text-xs font-black font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-750 inline-block mt-0.5">{{ row.table }}</div>
                  </div>
                </div>
                
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 border-t border-b border-gray-100 dark:border-gray-800 my-2 text-xs">
                  <div>
                    <span class="text-gray-400 block text-[9px] uppercase font-black tracking-wider">Key Used</span>
                    <span class="font-bold text-gray-700 dark:text-gray-300 font-mono">{{ row.key || 'NULL' }}</span>
                  </div>
                  <div>
                    <span class="text-gray-400 block text-[9px] uppercase font-black tracking-wider">Rows Checked</span>
                    <span class="font-bold text-gray-700 dark:text-gray-300 font-mono">{{ row.rows || 0 }}</span>
                  </div>
                  <div>
                    <span class="text-gray-400 block text-[9px] uppercase font-black tracking-wider">Filtered</span>
                    <span class="font-bold text-gray-700 dark:text-gray-300 font-mono">{{ row.filtered ? row.filtered + '%' : '100%' }}</span>
                  </div>
                  <div>
                    <span class="text-gray-400 block text-[9px] uppercase font-black tracking-wider">Ref</span>
                    <span class="font-bold text-gray-700 dark:text-gray-300 font-mono truncate block" :title="row.ref">{{ row.ref || 'NULL' }}</span>
                  </div>
                </div>
                
                <div v-if="row.Extra" class="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <span class="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[9px] font-bold uppercase tracking-wider shrink-0">Extra</span>
                  <code class="font-mono text-gray-600 dark:text-gray-400 truncate block">{{ row.Extra }}</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Query Info Tab -->
        <div
          v-else-if="activeTab === 'info'"
          class="flex-1 p-6 overflow-auto font-mono text-xs text-gray-650 bg-gray-50/50 dark:bg-gray-900/20 space-y-4"
        >
          <div>
            <div class="font-bold text-gray-400 uppercase tracking-widest text-[9px] mb-1">SQL Query</div>
            <pre class="bg-white dark:bg-gray-900 p-4 rounded border border-gray-150 dark:border-gray-800 text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans">{{ activeSession.sql }}</pre>
          </div>
          <div class="flex gap-8 border-t border-gray-100 dark:border-gray-800 pt-4">
            <div>
              <div class="font-bold text-gray-400 uppercase tracking-widest text-[9px] mb-1">Execution Time</div>
              <div class="text-sm font-bold text-primary-500">{{ activeSession.executionTime }} ms</div>
            </div>
            <div>
              <div class="font-bold text-gray-400 uppercase tracking-widest text-[9px] mb-1">Rows Fetched</div>
              <div class="text-sm font-bold text-emerald-500">{{ activeSession.results?.length || 0 }}</div>
            </div>
          </div>
        </div>

        <!-- Empty Results -->
        <div v-else class="flex-1 flex flex-col items-center justify-center text-gray-400/50 italic">
          <Database class="w-8 h-8 mb-2 opacity-20" />
          <p class="text-xs">Query executed successfully, but returned no results.</p>
        </div>
      </div>

      <!-- Placeholder if no active session -->
      <div v-else class="flex-1 flex flex-col items-center justify-center text-gray-400/50 italic">
        <Database class="w-12 h-12 mb-4 opacity-20" />
        <p class="text-sm tracking-tight font-medium">
          Ready to execute SQL on
          <span class="text-primary-500 font-bold">{{
            activeConnection?.name || 'Unknown Connection'
          }}</span>
        </p>
      </div>
    </div>

    <!-- Technical Status Bar -->
    <div
      class="flex-none h-8 px-4 bg-gray-150 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 select-none"
    >
      <div class="flex items-center gap-6 min-w-0 overflow-hidden">
        <div class="flex items-center gap-2 shrink-0">
          <div
            class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0"
          ></div>
          <span class="text-gray-400 whitespace-nowrap">{{ activeConnection?.name || 'Unknown' }}</span>
        </div>
        <div class="flex items-center gap-4 text-gray-400/60 min-w-0 shrink-0">
          <span
            class="truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px] whitespace-nowrap block"
            :title="activeConnection?.host"
            >{{ activeConnection?.host || 'localhost' }}{{ activeConnection?.port ? `:${activeConnection.port}` : '' }}</span
          >
          <span class="whitespace-nowrap shrink-0">UTF-8</span>
          <span class="text-primary-500 whitespace-nowrap shrink-0">{{ activeConnection?.type || 'SQL' }}Dialect</span>
        </div>

        <!-- Auto-commit and transaction controls -->
        <div v-if="activeSession" class="flex items-center gap-4 border-l border-gray-250 dark:border-gray-700 pl-4 shrink-0">
          <button
            @click="toggleAutocommit"
            class="px-2 py-0.5 rounded text-[9px] font-black tracking-normal transition-colors"
            :class="[
              activeSession.autocommit !== false
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
            ]"
          >
            Auto-Commit: {{ activeSession.autocommit !== false ? 'ON' : 'OFF' }}
          </button>

          <template v-if="activeSession.autocommit === false">
            <button
              @click="commitTransaction"
              :disabled="isLoading"
              class="px-2 py-0.5 rounded text-[9px] font-black tracking-normal bg-blue-500/15 text-blue-500 hover:bg-blue-500/25 disabled:opacity-40 transition-colors"
            >
              Commit
            </button>
            <button
              @click="rollbackTransaction"
              :disabled="isLoading"
              class="px-2 py-0.5 rounded text-[9px] font-black tracking-normal bg-red-500/15 text-red-500 hover:bg-red-500/25 disabled:opacity-40 transition-colors"
            >
              Rollback
            </button>
          </template>
        </div>
      </div>

      <div v-if="activeSession" class="flex items-center gap-6">
        <div class="flex items-center gap-1.5">
          <span class="text-gray-400/40">ROWS:</span>
          <span class="text-emerald-500">{{ activeSession.results?.length || 0 }} fetched</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="text-gray-400/40">EXEC TIME:</span>
          <span class="text-primary-500">{{ activeSession.executionTime }}ms</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Play, Loader2, Database, X, ChevronDown, Download, AlignLeft, Zap, Save, SlidersHorizontal, Maximize2, Wand2 } from 'lucide-vue-next'
import { Andb } from '@/utils/andb'
import MonacoEditor from '@/components/general/MonacoEditor.vue'
import { useAppStore, type DatabaseConnection } from '@/stores/app'
import { useProjectsStore } from '@/stores/projects'
import UniversalDataGrid from './UniversalDataGrid.vue'

interface ResultSession {
  id: string
  name: string
  sql: string
  results: any[] | null
  executionTime: number
  isError: boolean
  error?: string
  isPinned: boolean
  timestamp: number
  autocommit?: boolean
  offset?: number
  hasMore?: boolean
  isLoadingMore?: boolean
}

const props = defineProps<{
  connection?: DatabaseConnection
  initialSql?: string
  skipAutoload?: boolean
  schemaMetadata?: { tables: string[], columns: Record<string, string[]> }
}>()

const emit = defineEmits<{
  (e: 'update-sql', sql: string): void
}>()

const appStore = useAppStore()
const localConnectionId = ref(props.connection?.id || '')

watch(() => props.connection, (newConn) => {
  if (newConn && newConn.id !== localConnectionId.value) {
    localConnectionId.value = newConn.id
  }
})

const activeConnection = computed(() => {
  if (localConnectionId.value) {
    return appStore.getConnectionById(localConnectionId.value) || props.connection
  }
  return props.connection
})

const sql = ref(props.initialSql || '')
const sessions = ref<ResultSession[]>([])
const activeSessionId = ref<string | null>(null)
const isLoading = ref(false)
const editorHeight = ref(300)
const monacoRef = ref<any>(null)
const activeTab = ref('grid')
const showExportMenu = ref(false)
const showViewOptions = ref(false)
const textSize = ref('12')
const rowHeight = ref(32)
const showColumnFilters = ref(false)
const limit = ref(200)
const gridRef = ref<any>(null)

const isExplainSession = computed(() => {
  return activeSession.value?.name === 'Explain' || activeSession.value?.sql?.trim()?.toUpperCase()?.startsWith('EXPLAIN')
})

const detectTableName = (sqlText: string): string => {
  if (!sqlText) return ''
  const match = sqlText.match(/from\s+`?([a-zA-Z0-9_-]+)`?/i)
  return match ? match[1] : ''
}

const isReadOnlyQuery = computed(() => {
  if (!activeSession.value || !activeSession.value.sql) return true
  const sqlText = activeSession.value.sql.toUpperCase()
  if (sqlText.includes(' JOIN ')) return true
  const detectedTable = detectTableName(activeSession.value.sql)
  if (!detectedTable) return true
  if (activeSession.value.results && activeSession.value.results.length > 0) {
    const cols = Object.keys(activeSession.value.results[0])
    const hasId = cols.some(c => c.toLowerCase() === 'id' || c.toLowerCase().endsWith('id'))
    if (!hasId) return true
  }
  return false
})

const autoFitColumns = () => {
  gridRef.value?.autoFitColumns()
}

// Session ID for auto-saving queries to a single file per editor instance session
const projectsStore = useProjectsStore()

let saveTimeout: any = null
watch(sql, (newSql) => {
  emit('update-sql', newSql)
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    if (!newSql.trim()) return
    const currentProject = projectsStore.currentProject
    const baseDir = currentProject?.projectBaseDir || currentProject?.settings?.projectBaseDir
    if (!baseDir) return

    const connId = activeConnection.value?.id || 'default'

    window.electronAPI.invoke('andb-save-query', {
      sql: newSql,
      projectBaseDir: baseDir,
      filename: `autosave_${connId}.sql`
    }).catch((err: any) => console.error('[QueryConsole] Auto-save error:', err))
  }, 1000)
})

const formatSql = () => {
  monacoRef.value?.format()
}

const fillParameters = () => {
  const currentSql = sql.value
  if (!currentSql) return

  const paramMatch = currentSql.match(/--\s*PARAMETERS\s*:\s*(\[.*\])/i)
  if (!paramMatch) return

  try {
    const paramsJson = paramMatch[1]
    const params = JSON.parse(paramsJson)
    
    if (!Array.isArray(params)) return

    let paramIndex = 0
    let inString = false
    let stringChar = ''
    let filledSql = ''
    
    for (let i = 0; i < currentSql.length; i++) {
      const char = currentSql[i]
      
      if ((char === "'" || char === '"') && (i === 0 || currentSql[i - 1] !== '\\')) {
        if (!inString) {
          inString = true
          stringChar = char
        } else if (stringChar === char) {
          inString = false
        }
      }
      
      if (char === '?' && !inString && paramIndex < params.length) {
        const val = params[paramIndex++]
        if (val === null) filledSql += 'NULL'
        else if (typeof val === 'string') filledSql += `'${val.replace(/'/g, "''")}'`
        else if (typeof val === 'boolean') filledSql += val ? 'TRUE' : 'FALSE'
        else filledSql += String(val)
      } else {
        filledSql += char
      }
    }

    // Remove the PARAMETERS comment
    filledSql = filledSql.replace(/--\s*PARAMETERS\s*:\s*\[.*\]/i, '').trim()

    sql.value = filledSql
  } catch (err) {
    console.error('Failed to parse parameters:', err)
  }
}

const activeSession = computed(() => sessions.value.find(s => s.id === activeSessionId.value))

const extractHeadersFromSql = (sqlText: string, schemaMetadata?: any): string[] => {
  if (!sqlText) return []
  const cleanSql = sqlText.trim().replace(/\s+/g, ' ')
  
  if (!cleanSql.toUpperCase().startsWith('SELECT')) return []

  const match = cleanSql.match(/select\s+(.*?)\s+from/i)
  if (!match) return []

  const selectExpr = match[1].trim()
  
  const fields: string[] = []
  let currentField = ''
  let parenDepth = 0
  for (let i = 0; i < selectExpr.length; i++) {
    const char = selectExpr[i]
    if (char === '(') parenDepth++
    else if (char === ')') parenDepth--
    
    if (char === ',' && parenDepth === 0) {
      fields.push(currentField.trim())
      currentField = ''
    } else {
      currentField += char
    }
  }
  if (currentField.trim()) {
    fields.push(currentField.trim())
  }

  const headers: string[] = []
  for (const field of fields) {
    const cleanField = field.replace(/`/g, '').replace(/"/g, '').replace(/'/g, '')
    
    const asMatch = cleanField.match(/\s+as\s+(\S+)/i)
    if (asMatch) {
      headers.push(asMatch[1])
      continue
    }

    const words = cleanField.split(/\s+/)
    if (words.length > 1) {
      const lastWord = words[words.length - 1]
      if (/^[a-zA-Z0-9_-]+$/.test(lastWord) && !['ASC', 'DESC', 'AND', 'OR', 'ON'].includes(lastWord.toUpperCase())) {
        headers.push(lastWord)
        continue
      }
    }

    const dotParts = cleanField.split('.')
    let columnName = dotParts[dotParts.length - 1].trim()
    
    if (columnName === '*') {
      const tableName = detectTableName(sqlText)
      if (tableName && schemaMetadata?.columns?.[tableName]) {
        headers.push(...schemaMetadata.columns[tableName])
        continue
      }
    }

    headers.push(columnName)
  }

  return headers
}

const getColumnHeaders = (session: ResultSession) => {
  if (!session.results) return []
  if ((session.results as any).__fields && (session.results as any).__fields.length > 0) {
    return (session.results as any).__fields
  }
  if (session.results.length > 0) {
    return Object.keys(session.results[0])
  }
  // Try to parse headers directly from SELECT query if results are empty and there are no fields metadata
  return extractHeadersFromSql(session.sql, props.schemaMetadata)
}



const copySql = () => {
  if (!sql.value.trim()) return
  navigator.clipboard.writeText(sql.value)
  // We could add a toast here
}

const downloadCsv = (session?: ResultSession | null) => {
  if (!session || !session.results || session.results.length === 0) return

  const headers = getColumnHeaders(session)
  const csvContent = [
    headers.join(','),
    ...session.results.map(row =>
      headers
        .map((header: any) => {
          let val = row[header]
          if (val === null) return 'NULL'
          if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`
          return String(val)
        })
        .join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${session.name}_${new Date().toISOString()}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const copyResultsAsJson = (session?: ResultSession | null) => {
  if (!session || !session.results) return
  navigator.clipboard.writeText(JSON.stringify(session.results, null, 2))
}

const handleExecute = async (newTab: boolean = false) => {
  const selectedText = monacoRef.value?.getSelectedText()
  const querySql = (selectedText && selectedText.trim()) ? selectedText.trim() : sql.value.trim()

  if (!querySql || isLoading.value) return
  activeTab.value = 'grid'

  if (!activeConnection.value) {
    addResultSession(
      {
        sql: querySql,
        results: null,
        executionTime: 0,
        isError: true,
        error: 'No active connection selected.'
      },
      newTab
    )
    return
  }

  // Pre-resolve target session ID
  let targetSessionId = activeSessionId.value
  const isOverwriting = !newTab && activeSession.value && !activeSession.value.isPinned
  if (!targetSessionId || !isOverwriting) {
    targetSessionId = `session-${Date.now()}`
  }

  const isAutocommit = activeSession.value ? activeSession.value.autocommit !== false : true

  isLoading.value = true
  const startTime = Date.now()

  try {
    const data = await Andb.executeQuery(
      activeConnection.value,
      querySql,
      [],
      targetSessionId,
      isAutocommit,
      Number(limit.value),
      0
    )
    const time = Date.now() - startTime

    addResultSession(
      {
        id: targetSessionId,
        sql: querySql,
        results: Array.isArray(data) ? data : [data],
        executionTime: time,
        isError: false,
        autocommit: isAutocommit
      },
      newTab
    )
  } catch (err: any) {
    addResultSession(
      {
        id: targetSessionId,
        sql: querySql,
        results: null,
        executionTime: Date.now() - startTime,
        isError: true,
        error: err.message,
        autocommit: isAutocommit
      },
      newTab
    )
  } finally {
    isLoading.value = false
  }
}

const handleExplain = async () => {
  const selectedText = monacoRef.value?.getSelectedText()
  const targetSql = (selectedText && selectedText.trim()) ? selectedText.trim() : sql.value.trim()

  if (!targetSql || isLoading.value) return
  activeTab.value = 'explain'

  if (!activeConnection.value) {
    addResultSession(
      {
        sql: `EXPLAIN ${targetSql}`,
        results: null,
        executionTime: 0,
        isError: true,
        error: 'No active connection selected.'
      },
      true
    )
    return
  }

  const explainSql = `EXPLAIN ${targetSql}`
  const targetSessionId = `session-explain-${Date.now()}`

  isLoading.value = true
  const startTime = Date.now()

  try {
    const data = await Andb.executeQuery(
      activeConnection.value,
      explainSql,
      [],
      targetSessionId,
      true
    )
    addResultSession(
      {
        id: targetSessionId,
        sql: explainSql,
        results: Array.isArray(data) ? data : [data],
        executionTime: Date.now() - startTime,
        isError: false,
        name: 'Explain',
        autocommit: true
      },
      true
    ) // Always new tab for explain
  } catch (err: any) {
    addResultSession(
      {
        id: targetSessionId,
        sql: explainSql,
        results: null,
        executionTime: Date.now() - startTime,
        isError: true,
        error: err.message,
        name: 'Explain Error',
        autocommit: true
      },
      true
    )
  } finally {
    isLoading.value = false
    await Andb.closeQuerySession(targetSessionId)
  }
}

const toggleAutocommit = async () => {
  if (!activeSession.value || !activeConnection.value) return
  const currentVal = activeSession.value.autocommit !== false
  const nextVal = !currentVal
  activeSession.value.autocommit = nextVal

  try {
    await Andb.executeQuery(
      activeConnection.value,
      `SET autocommit = ${nextVal ? 1 : 0};`,
      [],
      activeSession.value.id,
      nextVal
    )
  } catch (err: any) {
    console.error('Failed to set autocommit:', err)
  }
}

const commitTransaction = async () => {
  if (!activeSession.value || !activeConnection.value) return
  isLoading.value = true
  try {
    await Andb.executeQuery(activeConnection.value, 'COMMIT;', [], activeSession.value.id, false)
  } catch (err: any) {
    activeSession.value.isError = true
    activeSession.value.error = `Commit failed: ${err.message}`
  } finally {
    isLoading.value = false
  }
}

const rollbackTransaction = async () => {
  if (!activeSession.value || !activeConnection.value) return
  isLoading.value = true
  try {
    await Andb.executeQuery(activeConnection.value, 'ROLLBACK;', [], activeSession.value.id, false)
  } catch (err: any) {
    activeSession.value.isError = true
    activeSession.value.error = `Rollback failed: ${err.message}`
  } finally {
    isLoading.value = false
  }
}

const handleCancelQuery = async () => {
  if (!activeSession.value || !activeConnection.value) return
  try {
    await Andb.cancelQuery(activeConnection.value, activeSession.value.id)
  } catch (err: any) {
    console.error('Failed to cancel query:', err)
  }
}

const addResultSession = (data: Partial<ResultSession>, forceNew: boolean = false) => {
  // If not forceNew, and current session is not pinned, overwrite it
  if (!forceNew && activeSession.value && !activeSession.value.isPinned) {
    const session = activeSession.value
    session.sql = data.sql || ''
    session.results = data.results || null
    session.executionTime = data.executionTime || 0
    session.isError = data.isError || false
    session.error = data.error
    session.timestamp = Date.now()
    if (data.autocommit !== undefined) {
      session.autocommit = data.autocommit
    }
    session.offset = 0
    session.hasMore = !!(data.results && Array.isArray(data.results) && data.results.length >= Number(limit.value))
    session.isLoadingMore = false
    return
  }

  // Otherwise create new
  const id = data.id || `session-${Date.now()}`
  const count = sessions.value.length + 1
  const newSession: ResultSession = {
    id,
    name: data.name || `Result ${count}`,
    sql: data.sql || '',
    results: data.results || null,
    executionTime: data.executionTime || 0,
    isError: data.isError || false,
    error: data.error,
    isPinned: false,
    timestamp: Date.now(),
    autocommit: data.autocommit !== false,
    offset: 0,
    hasMore: !!(data.results && Array.isArray(data.results) && data.results.length >= Number(limit.value)),
    isLoadingMore: false
  }

  sessions.value.push(newSession)
  activeSessionId.value = id
}



// Editor Resizing Logic
let isResizing = false
const startEditorResize = () => {
  isResizing = true
  document.addEventListener('mousemove', handleResizeMove)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'row-resize'
}

const handleResizeMove = (e: MouseEvent) => {
  if (!isResizing) return
  const newHeight = e.clientY - 140 // Offset for header/tabs
  if (newHeight > 100 && newHeight < window.innerHeight - 200) {
    editorHeight.value = newHeight
  }
}

const stopResize = () => {
  isResizing = false
  document.removeEventListener('mousemove', handleResizeMove)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
}

const loadMore = async () => {
  const session = activeSession.value
  if (!session || isLoading.value || session.isLoadingMore || !session.hasMore || !activeConnection.value) return

  session.isLoadingMore = true
  const CHUNK_SIZE = Number(limit.value)
  const nextOffset = (session.offset || 0) + CHUNK_SIZE

  try {
    const querySql = session.sql
    
    // Call executeQuery passing limit and offset
    const data = await Andb.executeQuery(
      activeConnection.value,
      querySql,
      [],
      session.id,
      session.autocommit,
      CHUNK_SIZE,
      nextOffset
    )

    const newRows = Array.isArray(data) ? data : [data]
    if (newRows.length < CHUNK_SIZE) {
      session.hasMore = false
    }

    session.results = [...(session.results || []), ...newRows]
    session.offset = nextOffset
  } catch (err: any) {
    console.error('Failed to load more rows for session:', err)
  } finally {
    session.isLoadingMore = false
  }
}

const closeDropdowns = () => {
  showExportMenu.value = false
}

const loadAutoSave = async () => {
  if (props.skipAutoload) return
  if (sql.value) return // If initialSql was provided, don't overwrite

  const currentProject = projectsStore.currentProject
  const baseDir = currentProject?.projectBaseDir || currentProject?.settings?.projectBaseDir
  if (!baseDir) return

  const connId = activeConnection.value?.id || 'default'
  const filename = `autosave_${connId}.sql`
  
  try {
    const result = await (window as any).electronAPI.andbLoadQuery({
      projectBaseDir: baseDir,
      filename
    })
    if (result.success && result.sql) {
      sql.value = result.sql
    }
  } catch (err) {
    console.warn('[QueryConsole] Failed to load auto-save:', err)
  }
}

onMounted(() => {
  window.addEventListener('click', closeDropdowns)
  loadAutoSave()
})

onUnmounted(async () => {
  stopResize()
  window.removeEventListener('click', closeDropdowns)
  for (const session of sessions.value) {
    await Andb.closeQuerySession(session.id)
  }
})
</script>

<style scoped>
.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  background-color: transparent;
  transition: background-color 0.2s;
  z-index: 30;
}

.resize-handle:hover,
.resize-handle.resizing {
  background-color: theme('colors.primary.500');
  opacity: 0.5;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
