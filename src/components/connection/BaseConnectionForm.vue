<template>
  <div class="space-y-8">
    <!-- Database Connection Section -->
    <div class="space-y-6">
      <div class="pb-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h3 class="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
          <Database class="w-4 h-4 text-primary-500" />
          {{ $t('connections.databaseConnection') }}
        </h3>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Type -->
        <div v-if="!hideType" class="space-y-2">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.databaseType') }} *</label>
          <div class="relative group">
            <select
              :value="modelValue.type"
              @change="updateField('type', ($event.target as HTMLSelectElement).value)"
              :disabled="readOnlyFields.includes('type')"
              class="w-full h-12 px-4 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all appearance-none outline-none disabled:opacity-50 disabled:cursor-not-allowed font-bold leading-tight"
            >
              <option value="mysql">{{ $t('connections.types.mysql') }}</option>
              <option value="postgres">{{ $t('connections.types.postgres') }}</option>
              <option value="sqlite">{{ $t('connections.types.sqlite') }}</option>
              <option value="dump">{{ $t('connections.types.dump') }}</option>
            </select>
            <ChevronDown v-if="!readOnlyFields.includes('type')" class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-primary-500 transition-colors" />
            <Lock v-else class="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <!-- Host / Dump Path / SQLite Path -->
        <div class="space-y-2">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            {{ ['dump', 'sqlite'].includes(modelValue.type) ? (modelValue.type === 'dump' ? $t('connections.dumpPath') : 'SQLite DB Path') : $t('connections.host') }} *
          </label>
          <div class="relative">
            <input
              :value="modelValue.host"
              @input="updateField('host', ($event.target as HTMLInputElement).value)"
              type="text"
              :disabled="readOnlyFields.includes('host')"
              :placeholder="['dump', 'sqlite'].includes(modelValue.type) ? (modelValue.type === 'dump' ? $t('connections.dumpPathPlaceholder') : 'Select or enter path to .sqlite file') : $t('connections.hostPlaceholder')"
              class="w-full h-12 px-4 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed font-bold leading-tight"
            />
            <button 
              v-if="['dump', 'sqlite'].includes(modelValue.type) && !readOnlyFields.includes('host')" 
              @click="modelValue.type === 'dump' ? pickDumpFile() : pickSqliteFile()"
              type="button"
              class="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors"
            >
              <FolderOpen class="w-4 h-4" />
            </button>
            <Lock v-if="readOnlyFields.includes('host')" class="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <!-- Port -->
        <div v-if="!['dump', 'sqlite'].includes(modelValue.type)" class="space-y-2">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.port') }} *</label>
          <div class="relative">
            <input
              :value="modelValue.port"
              @input="updateField('port', Number(($event.target as HTMLInputElement).value))"
              type="number"
              :disabled="readOnlyFields.includes('port')"
              class="w-full h-12 px-4 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed font-bold leading-tight"
            />
            <Lock v-if="readOnlyFields.includes('port')" class="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <!-- Database (Only for Project Connection, usually not in template, but can be) -->
        <div v-if="!['dump', 'sqlite'].includes(modelValue.type)" class="space-y-2">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.database') }}</label>
          <div class="relative">
            <input
              :value="modelValue.database"
              @input="updateField('database', ($event.target as HTMLInputElement).value)"
              type="text"
              :disabled="readOnlyFields.includes('database')"
              :placeholder="$t('connections.databasePlaceholder')"
              class="w-full h-12 px-4 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none font-bold leading-tight"
            />
            <Lock v-if="readOnlyFields.includes('database')" class="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>

    <!-- Authentication Section -->
    <div v-if="!['dump', 'sqlite'].includes(modelValue.type)" class="space-y-6 pt-4">
      <div class="pb-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h3 class="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
          <Key class="w-4 h-4 text-amber-500" />
          Authentication
        </h3>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Username -->
        <div class="space-y-2">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.username') }} *</label>
          <div class="relative">
            <input
              :value="modelValue.username"
              @input="updateField('username', ($event.target as HTMLInputElement).value)"
              type="text"
              :disabled="readOnlyFields.includes('username')"
              class="w-full h-12 px-4 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed font-bold leading-tight"
            />
            <Lock v-if="readOnlyFields.includes('username')" class="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <!-- Password -->
        <div class="space-y-2">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{{ $t('connections.password') }}</label>
          <div class="relative">
            <input
              :value="modelValue.password"
              @input="updateField('password', ($event.target as HTMLInputElement).value)"
              :type="showPassword ? 'text' : 'password'"
              :disabled="readOnlyFields.includes('password')"
              :placeholder="readOnlyFields.includes('password') ? '••••••••' : '••••••'"
              class="w-full h-12 px-4 pr-12 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed font-bold leading-tight"
            />
            <button
              v-if="!readOnlyFields.includes('password')"
              @click="showPassword = !showPassword"
              type="button"
              class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500 transition-colors"
            >
              <Eye v-if="!showPassword" class="w-4 h-4" />
              <EyeOff v-else class="w-4 h-4" />
            </button>
            <Lock v-else class="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>

    <!-- SSH Tunnel Section -->
    <div v-if="!['dump', 'sqlite'].includes(modelValue.type)" class="space-y-6 pt-4">
      <div class="pb-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h3 class="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck class="w-4 h-4 text-emerald-500" />
            SSH Tunnel
          </h3>
          <span 
            v-if="modelValue.ssh?.enabled"
            class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest border border-emerald-500/20"
          >
            Enabled
          </span>
        </div>

        <label class="flex items-center gap-2 cursor-pointer group" :class="{ 'pointer-events-none opacity-50': readOnlyFields.includes('ssh.enabled') }">
          <div class="relative">
            <input
              type="checkbox"
              :checked="modelValue.ssh?.enabled"
              @change="updateSshField('enabled', ($event.target as HTMLInputElement).checked)"
              :disabled="readOnlyFields.includes('ssh.enabled')"
              class="peer sr-only"
            />
            <div class="w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded-full peer-checked:bg-emerald-500 transition-colors"></div>
            <div class="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
          </div>
        </label>
      </div>

      <div v-if="modelValue.ssh?.enabled" class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
        <!-- SSH Host -->
        <div class="space-y-2">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">SSH Host *</label>
          <div class="relative">
            <input
              :value="modelValue.ssh?.host"
              @input="updateSshField('host', ($event.target as HTMLInputElement).value)"
              type="text"
              :disabled="readOnlyFields.includes('ssh.host')"
              placeholder="ssh.example.com"
              class="w-full h-12 px-4 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold leading-tight"
            />
            <Lock v-if="readOnlyFields.includes('ssh.host')" class="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <!-- SSH Port -->
        <div class="space-y-2">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">SSH Port *</label>
          <div class="relative">
            <input
              :value="modelValue.ssh?.port"
              @input="updateSshField('port', Number(($event.target as HTMLInputElement).value))"
              type="number"
              :disabled="readOnlyFields.includes('ssh.port')"
              placeholder="22"
              class="w-full h-12 px-4 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold leading-tight"
            />
            <Lock v-if="readOnlyFields.includes('ssh.port')" class="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <!-- SSH User -->
        <div class="space-y-2">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">SSH Username *</label>
          <div class="relative">
            <input
              :value="modelValue.ssh?.username"
              @input="updateSshField('username', ($event.target as HTMLInputElement).value)"
              type="text"
              :disabled="readOnlyFields.includes('ssh.username')"
              placeholder="root"
              class="w-full h-12 px-4 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold leading-tight"
            />
            <Lock v-if="readOnlyFields.includes('ssh.username')" class="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <!-- SSH Auth Type / Pass / Key -->
        <div class="space-y-2">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">SSH Auth Method</label>
          <div class="flex gap-2">
             <button 
                @click="sshAuthMethod = 'password'"
                class="flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all"
                :class="sshAuthMethod === 'password' ? 'bg-emerald-500 text-white border-emerald-500 shadow-md' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'"
             >
                Password
             </button>
             <button 
                @click="sshAuthMethod = 'key'"
                class="flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all"
                :class="sshAuthMethod === 'key' ? 'bg-emerald-500 text-white border-emerald-500 shadow-md' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'"
             >
                Private Key
             </button>
          </div>
        </div>

        <!-- SSH Password -->
        <div v-if="sshAuthMethod === 'password'" class="space-y-2 col-span-1 md:col-span-2">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">SSH Password</label>
          <div class="relative">
            <input
              :value="modelValue.ssh?.password"
              @input="updateSshField('password', ($event.target as HTMLInputElement).value)"
              :type="showSshPassword ? 'text' : 'password'"
              :disabled="readOnlyFields.includes('ssh.password')"
              placeholder="SSH password (not recommended)"
              class="w-full h-12 px-4 pr-12 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold leading-tight"
            />
            <button
               v-if="!readOnlyFields.includes('ssh.password')"
               @click="showSshPassword = !showSshPassword"
               class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-500"
            >
               <Eye v-if="!showSshPassword" class="w-4 h-4" />
               <EyeOff v-else class="w-4 h-4" />
            </button>
             <Lock v-else class="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <!-- SSH Key Path -->
        <div v-if="sshAuthMethod === 'key'" class="space-y-2 col-span-1 md:col-span-2">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">SSH Private Key Path</label>
          <div class="relative">
            <input
              :value="modelValue.ssh?.privateKeyPath"
              @input="updateSshField('privateKeyPath', ($event.target as HTMLInputElement).value)"
              type="text"
              :disabled="readOnlyFields.includes('ssh.privateKeyPath')"
              placeholder="~/.ssh/id_rsa"
              class="w-full h-12 px-4 pr-12 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold leading-tight"
            />
            <button 
                v-if="!readOnlyFields.includes('ssh.privateKeyPath')"
                @click="pickSshKey"
                class="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500"
            >
                <FolderOpen class="w-4 h-4" />
            </button>
             <Lock v-else class="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <!-- Jump Host -->
        <div class="space-y-2 col-span-1 md:col-span-2">
          <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Jump Host (Optional)</label>
          <div class="relative">
            <input
              :value="modelValue.ssh?.jumpHost"
              @input="updateSshField('jumpHost', ($event.target as HTMLInputElement).value)"
              type="text"
              :disabled="readOnlyFields.includes('ssh.jumpHost')"
              placeholder="bastion.example.com (SSH Jump)"
              class="w-full h-12 px-4 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold leading-tight"
            />
             <Lock v-if="readOnlyFields.includes('ssh.jumpHost')" class="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
  Database, 
  ChevronDown, 
  Eye, 
  EyeOff, 
  FolderOpen, 
  Lock,
  ShieldCheck
} from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  modelValue: any
  readOnlyFields?: string[]
  hideType?: boolean
}>(), {
  readOnlyFields: () => [],
  hideType: false
})

const emit = defineEmits(['update:modelValue'])

const showPassword = ref(false)
const showSshPassword = ref(false)
const sshAuthMethod = ref<'password' | 'key'>(props.modelValue.ssh?.privateKeyPath ? 'key' : 'password')

const updateField = (key: string, value: any) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value
  })
}

const updateSshField = (key: string, value: any) => {
  const ssh = { ...(props.modelValue.ssh || { enabled: false, host: '', port: 22, username: '' }) }
  ssh[key] = value
  updateField('ssh', ssh)
}

const pickDumpFile = async () => {
  if ((window as any).electronAPI?.pickFile) {
    const path = await (window as any).electronAPI.pickFile({
      title: 'Select MySQL Dump File',
      filters: [{ name: 'SQL Files', extensions: ['sql'] }]
    })
    if (path) updateField('host', path)
  }
}

const pickSqliteFile = async () => {
  if ((window as any).electronAPI?.pickFile) {
    const path = await (window as any).electronAPI.pickFile({
      title: 'Select SQLite Database File',
      filters: [
        { name: 'SQLite Databases', extensions: ['sqlite', 'sqlite3', 'db'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    if (path) {
      emit('update:modelValue', {
        ...props.modelValue,
        host: path,
        database: ''
      })
    }
  }
}

const pickSshKey = async () => {
    if ((window as any).electronAPI?.pickFile) {
      const path = await (window as any).electronAPI.pickFile({
        title: 'Select SSH Private Key',
        filters: [
            { name: 'Keys', extensions: ['pem', 'key', 'txt'] },
            { name: 'All Files', extensions: ['*'] }
        ]
      })
      if (path) updateSshField('privateKeyPath', path)
    }
}
</script>
