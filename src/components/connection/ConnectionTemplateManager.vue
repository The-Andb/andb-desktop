<template>
  <div class="space-y-6">
    <!-- View: Template List -->
    <div v-if="!showAddForm" class="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">


      <!-- Template List (Table View) -->
      <div class="space-y-4 pt-1">
          <div class="flex items-center justify-between flex-wrap gap-4">
              <div class="flex items-center gap-4">
                  <h3 class="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  DATABASE CONNECTIONS
                  </h3>
                  
                  <!-- FILTERS -->
                  <div class="flex items-center gap-2">
                     <!-- Quick Env Filter Pills -->
                     <div class="hidden sm:flex items-center rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 p-0.5 h-[32px]">
                       <button 
                         type="button"
                         v-for="env in ['ALL', 'NONE', 'DEV', 'UAT', 'STAGE', 'PROD', 'LOCAL']" :key="env"
                         @click="toggleFilterEnv(env)"
                         class="px-2.5 h-full flex items-center justify-center text-[9px] font-black uppercase tracking-widest rounded transition-all whitespace-nowrap select-none"
                         :class="filterEnvs.includes(env) ? 'bg-primary-500 dark:bg-primary-600 text-white shadow-md shadow-primary-500/20' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'"
                       >
                         {{ env === 'NONE' ? 'No Tag' : (env === 'ALL' ? 'All' : env) }}
                       </button>
                     </div>
                     <!-- Mobile Fallback Dropdown -->
                     <select 
                       :value="filterEnvs[0] || 'ALL'" 
                       @change="toggleFilterEnv(($event.target as HTMLSelectElement).value, true)" 
                       class="sm:hidden text-[10px] font-bold px-2 h-[32px] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md outline-none cursor-pointer"
                     >
                        <option value="ALL">All</option>
                        <option value="NONE">No Tag</option>
                        <option value="DEV">DEV</option>
                        <option value="UAT">UAT</option>
                        <option value="STAGE">STAGE</option>
                        <option value="PROD">PROD</option>
                        <option value="LOCAL">LOCAL</option>
                     </select>
                     <select v-model="filterType" class="text-[10px] font-bold px-2 h-[32px] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md outline-none cursor-pointer">
                        <option value="ALL">All Drivers</option>
                        <option value="mysql">MySQL</option>
                        <option value="postgres">PostgreSQL</option>
                        <option value="sqlite">SQLite</option>
                        <option value="dump">Dump</option>
                     </select>
                  </div>
              </div>

              <div class="flex items-center gap-2">
                  <!-- Bulk Actions -->
                  <div v-if="selectedTemplates.length > 0" class="flex items-center gap-2 mr-2 animate-in fade-in zoom-in duration-200">
                      <span class="text-xs text-gray-500 font-bold">{{ selectedTemplates.length }} selected</span>
                      <button @click="bulkTestTemplates"
                              class="btn btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                          <ShieldQuestion class="w-3.5 h-3.5" />
                          Test All
                      </button>
                      <button @click="bulkDeleteTemplates"
                              class="btn btn-danger text-xs px-3 py-1.5 flex items-center gap-1">
                          <Trash2 class="w-3.5 h-3.5" />
                          Delete
                      </button>
                      <button @click="clearSelection"
                              class="text-xs text-gray-400 hover:text-gray-600 px-2 transition-colors">
                          Clear
                      </button>
                  </div>
                  <button @click="cleanEmptyConnections" class="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 mx-1" title="Clean Empty Connections without Hosts">
                    <Eraser class="w-4 h-4" /> Clean
                  </button>
                  <button @click="openForm(undefined, false)" class="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 transition-all active:scale-95">
                    <Plus class="w-4 h-4" /> Add Connection
                  </button>
              </div>
          </div>

          <div class="card overflow-hidden border border-gray-200 dark:border-gray-800 rounded-2xl">
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
                  <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                  <template v-for="group in connectionGroups" :key="group.id">
                    <!-- Group Header -->
                    <tr v-if="group.templates.length > 0">
                      <td colspan="5" class="px-6 py-2 bg-gray-50 dark:bg-gray-800/50 text-xs font-black text-gray-500 uppercase tracking-widest border-y border-gray-100 dark:border-gray-800">
                        <div class="flex items-center gap-2"><Database class="w-3.5 h-3.5" /> {{ group.label }}</div>
                      </td>
                    </tr>
                    <tr v-for="template in group.templates" 
                        :key="template.id"
                        class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                        :class="{ 'bg-primary-50 dark:bg-primary-900/10': selectedTemplates.includes(template.id) }"
                    >
                        <td class="px-4 py-2 whitespace-nowrap w-10">
                          <input
                            type="checkbox"
                            :value="template.id"
                            v-model="selectedTemplates"
                            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-800"
                          />
                        </td>
                        <td class="px-4 py-2 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 h-8 w-8">
                            <div class="h-8 w-8 rounded-lg flex items-center justify-center transition-colors shadow-sm cursor-pointer hover:scale-105"
                                :class="{
                                'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400': template.type === 'mysql',
                                'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400': template.type === 'postgres',
                                'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400': template.type === 'sqlite' || !!(template as any).permissions,
                                'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400': template.type === 'dump'
                                }"
                                @click="openForm(template)"
                            >
                                <ShieldCheck v-if="!!(template as any).permissions" class="w-3.5 h-3.5" />
                                <span v-else-if="template.type === 'postgres'" class="text-[8px] font-black">PG</span>
                                <span v-else-if="template.type === 'sqlite'" class="text-[8px] font-black">SL</span>
                                <span v-else-if="template.type === 'dump'" class="text-[8px] font-black">DP</span>
                                <span v-else class="text-[8px] font-black">MY</span>
                            </div>
                            </div>
                            <div class="ml-3 cursor-pointer" @click="openForm(template)">
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                    {{ template.name }}
                                </span>
                                <div class="flex items-center gap-1" @click.stop>
                                    <span v-for="env in (template.environment || '').split(',').filter(Boolean)" :key="env" class="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter bg-gray-100 dark:bg-gray-800 text-gray-500">
                                        {{ env.trim() }}
                                    </span>
                                    <select 
                                      :value="''"
                                      @change="quickUpdateEnvironment(template, ($event.target as HTMLSelectElement).value); ($event.target as HTMLSelectElement).value = ''"
                                      class="px-1 text-[8px] font-black uppercase tracking-tighter border-none bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer text-gray-400 hover:text-primary-600 focus:ring-0 appearance-none"
                                      title="Quick Assign Environment"
                                    >
                                      <option value="" disabled selected>{{ template.environment ? '+' : '+ Tag' }}</option>
                                      <option value="DEV">DEV</option>
                                      <option value="STAGE">STAGE</option>
                                      <option value="UAT">UAT</option>
                                      <option value="PROD">PROD</option>
                                      <option value="LOCAL">LOCAL</option>
                                      <option v-if="template.environment" value="CLEAR">(Clear)</option>
                                    </select>
                                </div>
                            </div>
                            <div class="text-[8px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                                {{ template.type }} 
                                <span v-if="!!(template as any).permissions" class="text-emerald-500 flex items-center gap-1">· <ShieldCheck class="w-2 h-2" /> restricted</span>
                            </div>
                            </div>
                        </div>
                        </td>
                        <td class="px-4 py-2 whitespace-nowrap">
                        <div class="flex flex-col max-w-[200px]">
                            <div class="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 overflow-hidden">
                                <Server class="w-3 h-3 text-gray-400 shrink-0" />
                                <span class="truncate" :title="template.host">{{ template.host || '(No Host)' }}</span>
                                <span v-if="template.type !== 'sqlite' && template.port" class="shrink-0 text-[10px] opacity-75">:{{ template.port }}</span>
                            </div>
                            <div class="flex items-center gap-2 text-[10px] mt-0.5" :class="!!(template as any).permissions ? 'text-emerald-600 font-medium' : 'text-gray-500'">
                                <ShieldCheck v-if="!!(template as any).permissions" class="w-2.5 h-2.5" />
                                <User v-else class="w-2.5 h-2.5 opacity-70" />
                                {{ template.username || '(None)' }}
                            </div>
                        </div>
                        </td>
                        <td class="px-4 py-2 whitespace-nowrap">
                        <div v-if="template.database" class="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded w-fit">
                            <Database class="w-3 h-3 text-gray-400" />
                            {{ template.database }}
                        </div>
                        <span v-else class="text-[10px] text-gray-400 italic">No DB</span>
                        </td>
                        <td class="px-4 py-2 whitespace-nowrap text-right text-xs font-medium">
                        <div class="flex items-center justify-end gap-2 px-2 py-1 rounded-lg">
                            <button @click="testTemplate(template)" 
                                    class="relative p-1 rounded-lg transition-all"
                                    :class="{
                                        'text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20': !testingTemplates.has(template.id) && !testResults[template.id],
                                        'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20': testResults[template.id]?.success,
                                        'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20': testResults[template.id] && !testResults[template.id].success,
                                        'animate-pulse': testingTemplates.has(template.id)
                                    }"
                                    :title="$t('connections.testConnection')">
                              <RefreshCw v-if="testingTemplates.has(template.id)" class="w-4 h-4 animate-spin" />
                              <CheckCircle2 v-else-if="testResults[template.id]?.success" class="w-4 h-4" />
                              <AlertCircle v-else-if="testResults[template.id] && !testResults[template.id].success" class="w-4 h-4" />
                              <ShieldQuestion v-else class="w-4 h-4" />
                            </button>
                            <button v-if="!!(template as any).permissions" @click="openReconfigure(template)" class="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 p-1 rounded-lg transition-all hover:bg-emerald-50 dark:hover:bg-emerald-900/20" title="Reconfigure Privileges">
                               <ShieldCheck class="w-4 h-4" />
                            </button>
                            <button @click="openForm(template)" 
                                    class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                                    :title="$t('common.edit')">
                            <Edit2 class="w-4 h-4" />
                            </button>
                            <button @click="duplicateTemplate(template)"
                                    class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                                    :title="$t('common.duplicate')">
                            <Copy class="w-4 h-4" />
                            </button>
                            <button @click="deleteTemplate(template.id)" 
                                    class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                    :title="$t('common.delete')">
                            <Trash2 class="w-4 h-4" />
                            </button>
                        </div>
                        </td>
                    </tr>
                  </template>
                  </tbody>
              </table>
              </div>

              <!-- Empty State in Table -->
              <div v-if="templates.length === 0" class="flex flex-col items-center justify-center text-center py-16 bg-gray-50/50 dark:bg-gray-900/50">
                  <div class="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 text-gray-300 dark:text-gray-600 shadow-inner">
                      <LayoutTemplate class="w-8 h-8" />
                  </div>
                  <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-1">{{ $t('settings.global_connections.emptyTitle') }}</h3>
                  <p class="text-xs text-gray-500 max-w-xs mb-6">{{ $t('settings.global_connections.emptyDesc') }}</p>
                  <button @click="openForm()" class="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all">
                      {{ $t('settings.global_connections.createFirst') }}
                  </button>
              </div>
          </div>
      </div>
    </div>

    <!-- View: Template Form (Inline) -->
    <div v-else class="animate-in fade-in slide-in-from-right-4 duration-300 bg-white dark:bg-gray-900 h-full flex flex-col pt-2">
        
        <!-- Form Header & Global Mode Toggle -->
        <div class="px- py-1 flex items-center justify-between shrink-0 border-b border-gray-100 dark:border-gray-800">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center shadow-inner">
                    <LayoutTemplate class="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                    <h3 class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                        {{ editingTemplate ? $t('settings.global_connections.edit') : $t('settings.global_connections.create') }}
                    </h3>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-60">Global Connection Configuration</p>
                </div>
            </div>
            <button @click="closeForm" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 transition-colors flex items-center gap-2">
                <span class="text-xs font-bold uppercase">{{ $t('common.cancel') }}</span>
                <X class="w-4 h-4" />
            </button>
        </div>

        <!-- Form Body Top: Database Type Selector -->
        <div class="px-6 py-4 shrink-0 border-b border-gray-100 dark:border-gray-800">
            <div class="space-y-2 max-w-sm">
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.databaseType') }} *</label>
                <div class="relative group">
                    <select
                        v-model="form.type"
                        :disabled="!!editingTemplate"
                        class="w-full h-12 px-4 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all appearance-none outline-none disabled:opacity-50 disabled:cursor-not-allowed font-bold leading-tight"
                    >
                        <option value="mysql">{{ $t('connections.types.mysql') }}</option>
                        <option value="postgres">{{ $t('connections.types.postgres') }}</option>
                        <option value="sqlite">{{ $t('connections.types.sqlite') }}</option>
                        <option value="dump">{{ $t('connections.types.dump') }}</option>
                    </select>
                    <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-primary-500 transition-colors" />
                </div>
            </div>
        </div>

        <!-- Mode Toggle (Only visible when creating a new connection AND type supports restricted auth) -->
        <div v-if="!editingTemplate && ['mysql', 'postgres'].includes(form.type || '')" class="px-6 pt-4 shrink-0">
           <div class="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-full sm:w-fit overflow-x-auto">
              <button @click="isUserConnectionMode = false"
                      class="flex-1 sm:flex-none px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center whitespace-nowrap"
                      :class="!isUserConnectionMode ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'">
                 <Database class="w-4 h-4" /> Trusted Auth
              </button>
              <button @click="isUserConnectionMode = true"
                      class="flex-1 sm:flex-none px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center whitespace-nowrap"
                      :class="isUserConnectionMode ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'">
                 <ShieldCheck class="w-4 h-4" /> Restricted Auth
              </button>
           </div>
        </div>

        <!-- Secure Assistant Mode (ONLY for Restricted User setups) -->
        <div v-if="isUserConnectionMode && (!editingTemplate || reconfigureMode) && ['mysql', 'postgres'].includes(form.type || '')" class="flex-1 flex flex-col min-h-0 pt-2">
           <SetupUserTemplate 
              :initialData="editingTemplate"
              @cancel="closeForm"
              @complete="handleSetupComplete"
           />
        </div>

        <!-- Standard Form Mode (For non-MySQL OR Editing) -->
        <template v-else>

            <!-- Form Body -->
            <div class="px-6 py-4 space-y-6 overflow-y-auto">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-2">
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.connectionName') }} *</label>
                        <input
                            v-model="form.name"
                            type="text"
                            :placeholder="$t('connections.connectionNamePlaceholder')"
                            class="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none font-bold"
                        />
                    </div>

                    <div class="space-y-2">
                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.environment') }} (Optional)</label>
                        <div class="flex flex-wrap gap-2 pt-1">
                            <button
                                v-for="env in ['DEV', 'UAT', 'STAGE', 'PROD', 'LOCAL']"
                                :key="env"
                                type="button"
                                @click="toggleEnvironment(env)"
                                class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border"
                                :class="hasEnvironment(env) ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800 shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
                            >
                                {{ env }}
                            </button>
                        </div>
                    </div>
                </div>

                <BaseConnectionForm v-model="form" :hideType="true" />

                <!-- Actions -->
                <div class="flex items-center justify-end gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                    @click="closeForm"
                    class="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                    {{ $t('common.cancel') }}
                    </button>
                    <button
                    @click="saveTemplate"
                    class="flex items-center justify-center px-8 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 transition-all active:scale-95"
                    >
                    {{ $t('common.save') }}
                    </button>
                </div>
            </div>
        </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
    Plus, LayoutTemplate, Edit2, Trash2, Server, User, Database, X, Copy, 
    ShieldQuestion, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, ChevronDown, Eraser
} from 'lucide-vue-next'
import { useConnectionTemplatesStore, type ConnectionTemplate } from '@/stores/connectionTemplates'
import BaseConnectionForm from '@/components/connection/BaseConnectionForm.vue'
import SetupUserTemplate from '@/components/connection/SetupUserTemplate.vue'
import { useI18n } from 'vue-i18n'
import Andb from '@/utils/andb'
import type { DatabaseConnection } from '@/stores/app'

const store = useConnectionTemplatesStore()
const templates = computed(() => store.templates)

const filterEnvs = ref<string[]>(['ALL'])
const filterType = ref<string>('ALL')

const toggleFilterEnv = (env: string, overwrite = false) => {
    if (overwrite) {
        filterEnvs.value = [env]
        return
    }

    if (env === 'ALL') {
        filterEnvs.value = ['ALL']
        return
    }
    
    // Explicitly unwrap and clone
    let current = Array.from(filterEnvs.value)
    
    // Remove ALL if another is selected
    current = current.filter(e => e !== 'ALL')
    
    // Toggle the selected environment
    if (current.includes(env)) {
        current = current.filter(e => e !== env)
        if (current.length === 0) {
            current = ['ALL']
        }
    } else {
        current.push(env)
    }
    
    filterEnvs.value = current
}

// Computed groups by database type (Filtered)
const connectionGroups = computed(() => {
    let filtered = templates.value

    if (!filterEnvs.value.includes('ALL')) {
        filtered = filtered.filter(t => {
            const hasNone = filterEnvs.value.includes('NONE') && !t.environment;
            const hasEnv = t.environment && t.environment.split(',').map(s=>s.trim()).some(e => filterEnvs.value.includes(e));
            return hasNone || hasEnv;
        })
    }

    if (filterType.value !== 'ALL') {
        filtered = filtered.filter(t => t.type === filterType.value)
    }

    return [
        { id: 'mysql', label: 'MySQL', templates: filtered.filter(t => t.type === 'mysql') },
        { id: 'postgres', label: 'PostgreSQL', templates: filtered.filter(t => t.type === 'postgres') },
        { id: 'sqlite', label: 'SQLite', templates: filtered.filter(t => t.type === 'sqlite') },
        { id: 'dump', label: 'SQL Dump / Others', templates: filtered.filter(t => t.type === 'dump' || !['mysql','postgres','sqlite'].includes(t.type)) }
    ].filter(g => g.templates.length > 0)
})

const { t } = useI18n()

const testingTemplates = ref(new Set<string>())
const testResults = ref<Record<string, { success: boolean, message?: string }>>({})

// Selection state for bulk operations
const selectedTemplates = ref<string[]>([])

const isAllSelected = computed(() => {
    return templates.value.length > 0 && 
           templates.value.every(t => selectedTemplates.value.includes(t.id))
})

const toggleSelectAll = () => {
    if (isAllSelected.value) {
        selectedTemplates.value = []
    } else {
        selectedTemplates.value = templates.value.map(t => t.id)
    }
}

const clearSelection = () => {
    selectedTemplates.value = []
}

const bulkTestTemplates = async () => {
    for (const id of selectedTemplates.value) {
        const template = templates.value.find(t => t.id === id)
        if (template) {
            await testTemplate(template)
        }
    }
}

const bulkDeleteTemplates = () => {
    const count = selectedTemplates.value.length
    if (confirm(t('connections.confirmBulkDelete', { count }))) {
        selectedTemplates.value.forEach(id => store.removeTemplate(id))
        clearSelection()
    }
}

const cleanEmptyConnections = () => {
    const emptyConnections = templates.value.filter(t => !t.host || t.host.trim() === '')
    if (emptyConnections.length === 0) {
        alert('No empty connections found. All connections have a host configured.')
        return
    }
    
    if (confirm(`Are you sure you want to delete ${emptyConnections.length} empty connection(s)?`)) {
        emptyConnections.forEach(t => store.removeTemplate(t.id))
        clearSelection()
    }
}

// State
const showAddForm = ref(false)
const showPassword = ref(false)
const editingTemplate = ref<ConnectionTemplate | null>(null)
const reconfigureMode = ref(false)
const isUserConnectionMode = ref(false) // true when user clicked 'Add User'

const form = ref<Partial<ConnectionTemplate> & { productSettings?: any }>({
    name: '',
    host: 'localhost',
    port: 3306,
    database: '',
    username: 'root',
    password: '',
    type: 'mysql',
    environment: '',
    ssh: {
        enabled: false,
        host: '',
        port: 22,
        username: '',
        privateKeyPath: ''
    },
    productSettings: {
        domain: '',
        emailServer: ''
    }
})

const openForm = (template?: ConnectionTemplate, asUserMode = false) => {
    isUserConnectionMode.value = asUserMode
    if (template) {
        editingTemplate.value = template
        form.value = {
            name: template.name,
            host: template.host,
            port: template.port,
            database: template.database || '',
            username: template.username,
            password: template.password || '',
            type: template.type,
            environment: template.environment || '',
            ssh: template.ssh || { enabled: false, host: '', port: 22, username: '', privateKeyPath: '' },
            productSettings: (template as any).productSettings || { domain: '', emailServer: '' }
        }
    } else {
        editingTemplate.value = null
        form.value = {
            name: '',
            host: 'localhost',
            port: 3306,
            database: '',
            username: 'root',
            password: '',
            type: 'mysql',
            environment: '',
            ssh: { enabled: false, host: '', port: 22, username: '', privateKeyPath: '' },
            productSettings: { domain: '', emailServer: '' }
        }
    }
    showAddForm.value = true
}

const closeForm = () => {
    showAddForm.value = false
    editingTemplate.value = null
    reconfigureMode.value = false
    isUserConnectionMode.value = false
    showPassword.value = false
}

const openReconfigure = (template: ConnectionTemplate) => {
    editingTemplate.value = template
    form.value = {
        name: template.name,
        host: template.host,
        port: template.port,
        database: template.database || '',
        username: 'root',    // Admin credentials needed for REVOKE/GRANT
        password: '',        // Never pre-fill — must re-enter each time
        type: template.type,
        ssh: template.ssh || { enabled: false, host: '', port: 22, username: '', privateKeyPath: '' },
    }
    reconfigureMode.value = true
    showAddForm.value = true
}

const hasEnvironment = (env: string) => {
    if (!form.value.environment) return false;
    return form.value.environment.split(',').map(s=>s.trim()).includes(env)
}

const toggleEnvironment = (env: string) => {
    let envs = form.value.environment ? form.value.environment.split(',').map(s=>s.trim()).filter(Boolean) : []
    if (envs.includes(env)) {
        envs = envs.filter(e => e !== env)
    } else {
        envs.push(env)
    }
    form.value.environment = envs.join(',')
}

const saveTemplate = () => {
    if (!form.value.name) return // Simple validation

    // Harden clone protection: explicitly trim names inside form.
    form.value.name = form.value.name.trim()

    try {
        if (editingTemplate.value) {
            store.updateTemplate(editingTemplate.value.id, form.value)
        } else {
            store.addTemplate(form.value as any)
        }
        closeForm()
    } catch (e: any) {
        if (e.message === 'DUPLICATE_CONNECTION') {
            alert(t('connections.template.duplicateError'))
        } else {
            console.error(e)
            alert(t('common.error'))
        }
    }
}

const quickUpdateEnvironment = (template: ConnectionTemplate, env: string) => {
    if (!env) return
    try {
        store.updateTemplate(template.id, { environment: env === 'CLEAR' ? '' : env })
    } catch (e) {
        console.error(e)
    }
}

const handleSetupComplete = (data: any) => {
    try {
        if (editingTemplate.value) {
            store.updateTemplate(editingTemplate.value.id, {
                ...data,
                permissions: data.permissions ? { ...data.permissions } : undefined
            })
        } else {
            store.addTemplate(data)
        }
        closeForm()
    } catch (e: any) {
        if (e.message === 'DUPLICATE_CONNECTION') {
            alert(t('connections.template.duplicateError'))
        } else {
            console.error(e)
            alert(t('common.error'))
        }
    }
}

const duplicateTemplate = (template: ConnectionTemplate) => {
    const { id, createdAt, updatedAt, ...rest } = template
    const newName = `${rest.name} (Copy)`
    try {
        store.addTemplate({
            ...rest,
            name: newName
        })
    } catch (e: any) {
        if (e.message === 'DUPLICATE_CONNECTION') {
            alert(t('connections.template.duplicateError'))
        } else {
            console.error(e)
            alert(t('common.error'))
        }
    }
}

const testTemplate = async (template: ConnectionTemplate) => {
    if (testingTemplates.value.has(template.id)) return
    
    testingTemplates.value.add(template.id)
    delete testResults.value[template.id]

    try {
        // Construct temporary connection for testing
        const tempConn: DatabaseConnection = {
            id: template.id,
            name: template.name,
            host: template.host,
            port: template.port,
            database: template.database || '',
            username: template.username,
            password: template.password,
            type: template.type,
            status: 'testing',
            environment: 'DEV' // Doesn't matter for test
        }

        const result = await Andb.testConnection(tempConn)
        testResults.value[template.id] = result
        
        if (!result.success) {
            console.warn(`Connection test failed for ${template.name}:`, result.message)
        }
    } catch (e: any) {
        testResults.value[template.id] = { success: false, message: e.message }
    } finally {
        testingTemplates.value.delete(template.id)
    }
}

const deleteTemplate = (id: string) => {
    if (confirm(t('connections.confirmDeleteTemplate'))) {
        store.removeTemplate(id)
    }
}

// Auto-test all templates when they are loaded
watch(templates, (newTemplates) => {
    if (newTemplates.length > 0 && Object.keys(testResults.value).length === 0 && testingTemplates.value.size === 0) {
        newTemplates.forEach(template => {
            testTemplate(template)
        })
    }
}, { immediate: true })
</script>
