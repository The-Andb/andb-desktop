<template>
  <div class="space-y-6">
    <!-- View: Template List -->
    <div v-if="!showAddForm" class="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
      <!-- View Mode Selector & Tabs -->
      <div class="flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
          <nav class="flex -mb-px space-x-8">
              <button
              class="py-4 px-1 border-b-2 font-black text-xs uppercase tracking-widest whitespace-nowrap flex items-center gap-2 transition-all border-primary-500 text-primary-600 dark:text-primary-400"
              >
              <List class="w-4 h-4" />
              DATABASE CONNECTIONS
              </button>
              <button
              class="py-4 px-1 border-b-2 border-transparent font-black text-xs uppercase tracking-widest whitespace-nowrap flex items-center gap-2 transition-all text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-not-allowed opacity-50"
              title="Coming soon"
              >
              <LayoutGrid class="w-4 h-4" />
              BY TYPE
              </button>
          </nav>
      </div>

      <!-- Template List (Table View) -->
      <div class="space-y-4 pt-4">
          <div class="flex items-center justify-between">
              <h3 class="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">
              DATABASE CONNECTIONS
              </h3>
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
                      <th class="px-6 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {{ $t('connections.connectionName') }}
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {{ $t('connections.host') }}
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {{ $t('connections.database') }}
                      </th>
                      <th class="px-6 py-3 text-right text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {{ $t('common.actions') }}
                      </th>
                  </tr>
                  </thead>
                  <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                  <!-- DB Connections Group Header -->
                  <tr v-if="dbTemplates.length > 0">
                    <td colspan="5" class="px-6 py-2 bg-gray-50 dark:bg-gray-800/50 text-xs font-black text-gray-500 uppercase tracking-widest border-y border-gray-100 dark:border-gray-800">
                      <div class="flex items-center gap-2"><Database class="w-3.5 h-3.5" /> Database Connections</div>
                    </td>
                  </tr>
                  <tr v-for="template in dbTemplates" 
                      :key="template.id"
                      class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                      :class="{ 'bg-primary-50 dark:bg-primary-900/10': selectedTemplates.includes(template.id) }"
                  >
                      <td class="px-4 py-4 whitespace-nowrap w-10">
                        <input
                          type="checkbox"
                          :value="template.id"
                          v-model="selectedTemplates"
                          class="rounded border-gray-300 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-800"
                        />
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                          <div class="flex-shrink-0 h-10 w-10">
                          <div class="h-10 w-10 rounded-xl flex items-center justify-center transition-colors shadow-sm cursor-pointer hover:scale-105"
                              :class="{
                              'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400': template.type === 'mysql',
                              'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400': template.type === 'postgres',
                              'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400': template.type === 'sqlite'
                              }"
                              @click="openForm(template)"
                          >
                              <span v-if="template.type === 'postgres'" class="text-[10px] font-black">PG</span>
                              <span v-else-if="template.type === 'sqlite'" class="text-[10px] font-black">SL</span>
                              <span v-else class="text-[10px] font-black">MY</span>
                          </div>
                          </div>
                          <div class="ml-4 cursor-pointer" @click="openForm(template)">
                          <div class="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                              {{ template.name }}
                          </div>
                          <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                              {{ template.type }}
                          </div>
                          </div>
                      </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex flex-col max-w-[220px]">
                          <div class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 overflow-hidden">
                              <Server class="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span class="truncate" :title="template.host">{{ template.host }}</span>
                              <span class="shrink-0">:{{ template.port }}</span>
                          </div>
                          <div class="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <User class="w-3 h-3 opacity-70" />
                              {{ template.username }}
                          </div>
                      </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                      <div v-if="template.database" class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md w-fit">
                          <Database class="w-3.5 h-3.5 text-gray-400" />
                          {{ template.database }}
                      </div>
                      <span v-else class="text-xs text-gray-400 italic">No default DB</span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                          <button @click="openReconfigure(template)"
                                  class="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 p-1 rounded-lg transition-all hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                  title="Reconfigure Privileges">
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

                  <!-- User Connections Group Header -->
                  <tr v-if="userTemplates.length > 0">
                    <td colspan="5" class="px-6 py-2 bg-gray-50 dark:bg-gray-800/50 text-xs font-black text-gray-500 uppercase tracking-widest border-y border-gray-100 dark:border-gray-800">
                      <div class="flex items-center gap-2"><ShieldCheck class="w-3.5 h-3.5" /> User Connections</div>
                    </td>
                  </tr>
                  <tr v-for="template in userTemplates" 
                      :key="'user-'+template.id"
                      class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                      :class="{ 'bg-primary-50 dark:bg-primary-900/10': selectedTemplates.includes(template.id) }"
                  >
                      <td class="px-4 py-4 whitespace-nowrap w-10">
                        <input type="checkbox" :value="template.id" v-model="selectedTemplates" class="rounded border-gray-300 text-primary-600 focus:ring-primary-500 bg-white dark:bg-gray-800" />
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                          <div class="flex-shrink-0 h-10 w-10">
                          <div class="h-10 w-10 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shadow-sm cursor-pointer hover:scale-105" @click="openForm(template)">
                              <ShieldCheck class="w-4 h-4" />
                          </div>
                          </div>
                          <div class="ml-4 cursor-pointer" @click="openForm(template)">
                          <div class="text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{{ template.name }}</div>
                          <div class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{{ template.type }} · restricted</div>
                          </div>
                      </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex flex-col max-w-[220px]">
                          <div class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                              <Server class="w-3.5 h-3.5 text-gray-400" />
                              <span class="truncate">{{ template.host }}</span>
                              <span v-if="template.type !== 'sqlite'">:{{ template.port }}</span>
                          </div>
                          <div class="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <ShieldCheck class="w-3 h-3 text-emerald-500" /> {{ template.username }}
                          </div>
                      </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                      <div v-if="template.database" class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md w-fit">
                          <Database class="w-3.5 h-3.5 text-gray-400" /> {{ template.database }}
                      </div>
                      <span v-else class="text-xs text-gray-400 italic">No default DB</span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div class="flex items-center justify-end gap-2">
                          <button @click="openReconfigure(template)" class="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 p-1 rounded-lg transition-all hover:bg-emerald-50 dark:hover:bg-emerald-900/20" title="Reconfigure Privileges"><ShieldCheck class="w-4 h-4" /></button>
                          <button @click="openForm(template)" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 p-1" :title="$t('common.edit')"><Edit2 class="w-4 h-4" /></button>
                          <button @click="deleteTemplate(template.id)" class="text-red-600 dark:text-red-400 hover:text-red-900 p-1" :title="$t('common.delete')"><Trash2 class="w-4 h-4" /></button>
                      </div>
                      </td>
                  </tr>
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
    <div v-else class="animate-in fade-in slide-in-from-right-4 duration-300 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm h-full flex flex-col">
        
        <!-- Form Header & Global Mode Toggle -->
        <div class="px-8 pt-8 pb-4 flex items-center justify-between shrink-0 border-b border-gray-100 dark:border-gray-800">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center shadow-inner">
                    <LayoutTemplate class="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                    <h3 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                        {{ editingTemplate ? $t('settings.global_connections.edit') : $t('settings.global_connections.create') }}
                    </h3>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-60">Global Connection Configuration</p>
                </div>
            </div>
            <button @click="closeForm" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 transition-colors flex items-center gap-2">
                <span class="text-xs font-bold uppercase">{{ $t('common.cancel') }}</span>
                <X class="w-5 h-5" />
            </button>
        </div>

        <!-- Form Body Top: Database Type Selector -->
        <div class="px-8 pt-6 pb-2 shrink-0 border-b border-gray-100 dark:border-gray-800">
            <div class="space-y-2 max-w-sm mb-4">
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.databaseType') }} *</label>
                <div class="relative group">
                    <select
                        v-model="form.type"
                        :disabled="!!editingTemplate"
                        class="w-full h-12 px-4 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all appearance-none outline-none disabled:opacity-50 disabled:cursor-not-allowed font-bold leading-tight"
                    >
                        <option value="mysql">{{ $t('connections.types.mysql') }}</option>
                        <option value="postgres" disabled>{{ $t('connections.types.postgres') }}</option>
                        <option value="sqlite">{{ $t('connections.types.sqlite') }}</option>
                        <option value="dump">{{ $t('connections.types.dump') }}</option>
                    </select>
                    <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-primary-500 transition-colors" />
                </div>
            </div>
        </div>

        <!-- Mode Toggle (Only visible when creating a new connection AND type supports restricted auth) -->
        <div v-if="!editingTemplate && ['mysql', 'postgres'].includes(form.type || '')" class="px-8 pt-6 shrink-0">
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
            <div class="px-8 py-6 space-y-8 overflow-y-auto">
                <div class="space-y-2">
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.connectionName') }} *</label>
                    <input
                        v-model="form.name"
                        type="text"
                        :placeholder="$t('connections.connectionNamePlaceholder')"
                        class="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none font-bold"
                    />
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
    Plus, LayoutTemplate, Edit2, Trash2, Server, User, LayoutGrid, List, Database, X, Copy, 
    ShieldQuestion, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle, ChevronDown 
} from 'lucide-vue-next'
import { useConnectionTemplatesStore, type ConnectionTemplate } from '@/stores/connectionTemplates'
import BaseConnectionForm from '@/components/connection/BaseConnectionForm.vue'
import SetupUserTemplate from '@/components/connection/SetupUserTemplate.vue'
import { useI18n } from 'vue-i18n'
import Andb from '@/utils/andb'
import type { DatabaseConnection } from '@/stores/app'

const store = useConnectionTemplatesStore()
const templates = computed(() => store.templates)
const dbTemplates = computed(() => templates.value.filter(t => !(t as any).permissions))
const userTemplates = computed(() => templates.value.filter(t => !!(t as any).permissions))
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

const saveTemplate = () => {
    if (!form.value.name) return // Simple validation

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
