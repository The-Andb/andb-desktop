<template>
  <div class="space-y-6">
    <!-- Environment Selection - NOW AT THE TOP -->
    <div class="space-y-2">
      <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.environment') }} *</label>
      <div class="relative group">
        <select
          v-model="form.environment"
          class="w-full h-12 px-4 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all appearance-none outline-none font-bold leading-tight"
          :class="{ 'border-red-500 ring-4 ring-red-500/10': errors.environment }"
        >
          <option value="">{{ $t('common.select') }}</option>
          <option 
            v-for="env in enabledEnvironments" 
            :key="env.name" 
            :value="env.name"
          >
            {{ $t(`environments.${env.name.toLowerCase()}`) }}
          </option>
        </select>
        <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-primary-500 transition-colors" />
      </div>
      <p v-if="errors.environment" class="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{{ errors.environment }}</p>
    </div>

    <!-- Template Selection - MANDATORY -->
    <div class="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900/30">
        <div class="flex items-center justify-between mb-3">
            <label class="block text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <LayoutTemplate class="w-4 h-4" />
                {{ $t('connections.template.source') }}
            </label>
            <router-link to="/settings?cat=templates" class="text-[9px] font-black text-indigo-500 hover:text-indigo-600 dark:hover:hover:text-indigo-400 uppercase tracking-wider flex items-center gap-1 transition-colors">
                <Settings class="w-3 h-3" />
                {{ $t('connections.template.manage') }}
            </router-link>
        </div>
        
        <div class="relative">
            <select
                v-model="form.templateId"
                class="w-full h-12 px-4 pl-10 text-sm border border-indigo-200 dark:border-indigo-800 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none outline-none font-bold leading-tight"
            >
                <option value="" disabled>{{ $t('common.select') }}</option>
                <option v-for="t in templates" :key="t.id" :value="t.id">
                    {{ t.name }} ({{ t.host }})
                </option>
            </select>
            <div class="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none">
                <Lock class="w-4 h-4" />
            </div>
            <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        
        <p class="text-[10px] text-indigo-400 dark:text-indigo-500 mt-2 font-medium">
            {{ $t('connections.template.inheritedDesc') }}
        </p>
    </div>

    <!-- Inherited Connection Summary (Minimalist) -->
    <div v-if="selectedTemplate" class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
        <div class="space-y-1">
            <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">{{ $t('connections.host') }}</span>
            <div class="text-[11px] font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <Server class="w-3.5 h-3.5 opacity-50" />
                {{ selectedTemplate.host }}
            </div>
        </div>
        <div class="space-y-1">
            <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">{{ $t('connections.username') }}</span>
            <div class="text-[11px] font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <User class="w-3.5 h-3.5 opacity-50" />
                {{ selectedTemplate.username }}
            </div>
        </div>
        <div class="space-y-1">
            <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">{{ $t('connections.status') }}</span>
            <div class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <ShieldCheck class="w-3.5 h-3.5" />
                {{ selectedTemplate.ssh?.enabled ? 'SSH Active' : 'Direct Link' }}
            </div>
        </div>
    </div>

    <!-- Project Specific Information -->
    <div class="space-y-6 pt-4">
      <div class="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
        <h3 class="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">{{ $t('connections.basicInfo') }}</h3>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Display Name -->
        <div class="space-y-2">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.connectionName') }} *</label>
          <input
            v-model="form.name"
            type="text"
            :placeholder="$t('connections.connectionNamePlaceholder')"
            class="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none font-bold"
            :class="{ 'border-red-500 ring-4 ring-red-500/10': errors.name }"
          />
          <p v-if="errors.name" class="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{{ errors.name }}</p>
        </div>

        <!-- Database Name (Most Important Project-level Override) -->
        <div class="space-y-2">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.database') }} *</label>
          <div class="relative">
              <input
                v-model="form.database"
                type="text"
                :placeholder="$t('connections.databasePlaceholder')"
                class="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none font-bold"
                :class="{ 'border-red-500 ring-4 ring-red-500/10': errors.database }"
              />
              <Database class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
          </div>
          <p v-if="errors.database" class="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{{ errors.database }}</p>
        </div>

        <!-- Timeout (Keep here as it might vary by connection) -->
        <div class="space-y-2">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.connectionTimeout') }}</label>
          <input
            v-model.number="form.timeout"
            type="number"
            class="w-full h-12 px-4 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none font-bold leading-tight"
          />
        </div>
      </div>
    </div>


    <!-- Test Result -->
    <div v-if="testResult" class="p-4 rounded-xl border" :class="testResult.success ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30' : 'bg-rose-50/50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/30'">
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-lg" :class="testResult.success ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'">
            <ShieldCheck v-if="testResult.success" class="w-4 h-4" />
            <XCircle v-else class="w-4 h-4" />
        </div>
        <div>
            <div class="text-[11px] font-black uppercase tracking-widest" :class="testResult.success ? 'text-emerald-600' : 'text-rose-600'">{{ testResult.success ? $t('common.success') : $t('common.error') }}</div>
            <div class="text-[11px] font-bold" :class="testResult.success ? 'text-emerald-800 dark:text-emerald-200' : 'text-rose-800 dark:text-rose-200'">
                {{ testResult.message }}
            </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-between pt-8 border-t border-gray-100 dark:border-gray-800 shrink-0">
      <button
        @click="testConnection"
        :disabled="isTesting || !isFormValid"
        class="group flex items-center justify-center px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-500 transition-all active:scale-95 disabled:opacity-50"
      >
        <ShieldQuestion v-if="!isTesting" class="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
        <Loader v-else class="w-4 h-4 mr-2 animate-spin" />
        {{ isTesting ? $t('connections.testing') : $t('connections.test') }}
      </button>

      <div class="flex items-center gap-4">
        <button
          @click="$emit('cancel')"
          class="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          {{ $t('common.cancel') }}
        </button>
        <button
          @click="saveConnection"
          :disabled="isSaving || !isFormValid"
          class="group flex items-center justify-center px-8 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 transition-all active:scale-95 disabled:opacity-50"
        >
          <Loader v-if="isSaving" class="w-4 h-4 mr-2 animate-spin" />
          <Save v-else class="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
          {{ isSaving ? $t('common.saving') : $t('common.save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { 
  ChevronDown, 
  ShieldQuestion, 
  Loader, 
  ShieldCheck, 
  XCircle,
  LayoutTemplate,
  Lock,
  Server,
  User,
  Database,
  Save
} from 'lucide-vue-next'
import { useConnectionPairsStore } from '@/stores/connectionPairs'
import { useConnectionTemplatesStore } from '@/stores/connectionTemplates'
import type { DatabaseConnection, SshConfig } from '@/stores/app'
import Andb from '@/utils/andb'

const { t: $t } = useI18n()
const connectionPairsStore = useConnectionPairsStore()
const templatesStore = useConnectionTemplatesStore()

const enabledEnvironments = computed(() => connectionPairsStore.enabledEnvironments)
const templates = computed(() => {
  if (!form.value.environment) return templatesStore.templates;
  return templatesStore.templates.filter(t => !t.environment || t.environment.split(',').map(s=>s.trim()).includes(form.value.environment))
})

interface Props {
  connection?: Partial<DatabaseConnection>
}

const props = withDefaults(defineProps<Props>(), {
  connection: undefined
})

const emit = defineEmits<{
  save: [connection: Omit<DatabaseConnection, 'id'>]
  cancel: []
}>()

// Form state
const form = ref({
  name: '',
  host: '',
  port: 3306,
  database: '',
  username: '',
  password: '',
  environment: '',
  timeout: 30,
  useSSL: false,
  allowSelfSigned: false,
  charset: 'utf8mb4',
  timezone: '+00:00',
  type: 'mysql',
  templateId: '',
  ssh: {
    enabled: false,
    host: '',
    port: 22,
    username: '',
    privateKeyPath: undefined
  } as SshConfig
})

// UI state
const isTesting = ref(false)
const isSaving = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)

// Validation errors
const errors = ref<Record<string, string>>({})

// Initialize form with existing connection
if (props.connection) {
  form.value = {
    ...form.value,
    ...props.connection,
    name: props.connection.name || '',
    environment: props.connection.environment || '',
    templateId: props.connection.templateId || '',
    database: props.connection.database || ''
  }
}

// Template Handling
const selectedTemplate = computed(() => {
  return templates.value.find(t => t.id === form.value.templateId)
})

// Watch template selection - AUTOMATIC SYNC OF INFRAS FIELDS
watch(() => form.value.templateId, (newId) => {
  const template = templates.value.find(t => t.id === newId)
  if (template) {
    form.value.host = template.host
    form.value.port = template.port
    form.value.username = template.username
    form.value.password = template.password || ''
    form.value.type = template.type
    form.value.ssh = (template.ssh as any) || { enabled: false, host: '', port: 22, username: '', privateKeyPath: '' }
    
    // Auto-fill database only if empty
    if (template.database && !form.value.database) {
      form.value.database = template.database
    }
    
    // Auto-fill connection name if empty
    if (!form.value.name) {
      form.value.name = template.name
    }
  }
}, { immediate: true })

// Validation
const validateForm = () => {
  errors.value = {}
  
  if (!form.value.templateId) {
    errors.value.template = $t('validation.required', { field: $t('connections.template.source') })
  }

  if (!form.value.name.trim()) {
    errors.value.name = $t('validation.required', { field: $t('connections.connectionName') })
  }
  
  if (!form.value.environment) {
    errors.value.environment = $t('validation.required', { field: $t('connections.environment') })
  }

  if (!form.value.database.trim()) {
    errors.value.database = $t('validation.required', { field: $t('connections.database') })
  }
  
  return Object.keys(errors.value).length === 0
}

const isFormValid = computed(() => {
  return !!form.value.templateId && 
         !!form.value.name.trim() && 
         !!form.value.environment && 
         !!form.value.database.trim()
})

// Test connection
const testConnection = async () => {
  if (!validateForm()) return
  
  isTesting.value = true
  testResult.value = null
  
  try {
    const result = await Andb.testConnection(form.value as any)
    testResult.value = {
      success: result.success,
      message: result.success 
        ? $t('connections.testSuccess') 
        : result.message || $t('connections.testFailed')
    }
  } catch (error: any) {
    testResult.value = {
      success: false,
      message: error.message || $t('connections.testError')
    }
  } finally {
    isTesting.value = false
  }
}

// Save connection
const saveConnection = async () => {
  if (!validateForm()) return
  
  isSaving.value = true
  
  try {
    const isReference = !!form.value.templateId
    
    const connectionData: Omit<DatabaseConnection, 'id'> = {
      name: form.value.name,
      // Design: If using a template, don't clone the infra fields.
      // SSoT (Single Source of Truth) means these are resolved dynamically.
      host: isReference ? '' : form.value.host,
      port: isReference ? 0 : form.value.port,
      username: isReference ? '' : form.value.username,
      password: isReference ? undefined : (form.value.password || undefined),
      
      database: form.value.database,
      environment: form.value.environment as any,
      status: 'testing',
      type: form.value.type as any,
      templateId: form.value.templateId,
      ssh: isReference ? undefined : (form.value.ssh as any),
      timeout: form.value.timeout,
      useSSL: form.value.useSSL,
      allowSelfSigned: form.value.allowSelfSigned,
      charset: form.value.charset,
      timezone: form.value.timezone
    }
    
    emit('save', connectionData)
  } finally {
    isSaving.value = false
  }
}

// Clear test result when form changes
watch(form, () => {
  testResult.value = null
}, { deep: true })
</script>
