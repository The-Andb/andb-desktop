<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProjectsStore } from '@/stores/projects'
import { Terminal, Check, RefreshCw, Zap, Layers, Cpu } from 'lucide-vue-next'
import CopyableSnippet from '@/components/general/CopyableSnippet.vue'
import Andb from '@/utils/andb'

const { t } = useI18n()
const projectsStore = useProjectsStore()

const isCliInstalled = ref(false)
const isInstallingCli = ref(false)
const internalBinaryPath = ref('')
const mcpBinaryPath = ref('')
const defaultCliProject = ref('')

const checkCliStatus = async () => {
  isCliInstalled.value = await Andb.isCliInstalled()
}

const handleInstallCli = async () => {
  isInstallingCli.value = true
  try {
    const res = await Andb.installCli()
    if (res.success) {
      alert(t('settings.terminal.success'))
      await checkCliStatus()
    } else {
      alert(t('settings.terminal.failed') + ': ' + res.message)
    }
  } catch (e: any) {
    alert('Error: ' + e.message)
  } finally {
    isInstallingCli.value = false
  }
}

const copyCommand = () => {
  navigator.clipboard.writeText('andb compare dev prod --type tables')
  alert('Example command copied to clipboard')
}

const loadPaths = async () => {
  try {
    internalBinaryPath.value = await window.electronAPI?.cli?.getBinaryPath() || '/path/to/andb'
    mcpBinaryPath.value = await window.electronAPI?.mcp?.getMcpPath() || '/path/to/mcp/dist/index.js'

    // Load Default CLI Project Selection
    const settings = await (window.electronAPI?.storage as any)?.getUserSettings()
    if (settings && settings.default_cli_project_id) {
      defaultCliProject.value = settings.default_cli_project_id
    }
  } catch (error) {
    console.error('Failed to load internal paths', error)
  }
}

const saveDefaultCliProject = async () => {
  try {
    await (window.electronAPI?.storage as any)?.saveUserSetting('default_cli_project_id', defaultCliProject.value)
  } catch (error) {
    console.error('Failed to save default CLI project', error)
  }
}

onMounted(() => {
  checkCliStatus()
  loadPaths()
})
</script>

<template>
  <div class="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
    <div class="space-y-8">
      <div
        class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 relative overflow-hidden">
        <div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Terminal class="w-48 h-48" />
        </div>

        <div class="relative z-10">
          <div class="flex items-center gap-4 mb-6">
            <div
              class="w-12 h-12 rounded-2xl bg-primary-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Terminal class="w-6 h-6" />
            </div>
            <div>
              <h3 class="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{{
                $t('settings.terminal.cliTitle') }}</h3>
              <p class="text-xs text-gray-500 font-medium">{{ $t('settings.terminal.subtitle') }}</p>
            </div>
          </div>

          <div
            class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-xs font-black uppercase tracking-widest">{{ $t('settings.terminal.install')
                  }}</span>
                <div v-if="isCliInstalled"
                  class="flex items-center gap-1.5 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-[10px] font-black uppercase">
                  <Check class="w-3 h-3" />
                  {{ $t('settings.terminal.installed') }}
                </div>
                <div v-else
                  class="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-full text-[10px] font-black uppercase">
                  <div class="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                  {{ $t('settings.terminal.notInstalled') }}
                </div>
              </div>
              <p class="text-xs text-gray-400 max-w-md leading-relaxed">
                {{ $t('settings.terminal.installDesc') }}
              </p>
            </div>

            <button @click="handleInstallCli" :disabled="isInstallingCli"
              class="w-full md:w-auto px-8 py-4 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-500/20 active:scale-95 transition-all flex items-center justify-center gap-3">
              <RefreshCw v-if="isInstallingCli" class="w-4 h-4 animate-spin" />
              <Zap v-else class="w-4 h-4" />
              {{ isInstallingCli ? $t('common.processing') : (isCliInstalled ? 'Reinstall CLI' :
                $t('settings.terminal.install')) }}
            </button>
          </div>

          <!-- Code Block Example -->
          <div class="mt-10 p-6 bg-gray-950 rounded-2xl border border-white/5 relative group">
            <div class="flex items-center justify-between mb-4">
              <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest">Usage Example</span>
              <button @click="copyCommand"
                class="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors">
                <Layers class="w-3.5 h-3.5" />
              </button>
            </div>
            <div class="font-mono text-[11px] space-y-2">
              <div class="text-gray-500"># Use andb from anywhere</div>
              <div class="text-white"><span class="text-primary-400">$</span> andb compare dev prod --type
                tables
              </div>
              <div class="text-gray-600 mt-2">// Response from andb engine v4.x</div>
            </div>
          </div>
        </div>

      </div>

      <!-- Default CLI Project Selector -->
      <div
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm rounded-2xl relative">
        <div class="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div class="flex items-start gap-4 flex-1">
            <div
              class="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
              <Terminal class="w-5 h-5" />
            </div>
            <div>
              <h3
                class="text-sm font-black text-gray-900 dark:text-white tracking-widest mb-1 flex items-center gap-2">
                {{ $t('settings.terminal.defaultScope') }}
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-xl">
                Select the target project when executing global command line tools like <code
                  class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-primary-500 dark:text-primary-400">andb
              compare</code> without explicitly specifying a project context.
              </p>
            </div>
          </div>

          <div class="md:w-64 shrink-0">
            <select v-model="defaultCliProject" @change="saveDefaultCliProject"
              class="w-full pl-4 pr-10 h-11 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-gray-900 dark:text-white appearance-none cursor-pointer">
              <option value="">{{ $t('settings.terminal.noDefaultContext') }}</option>
              <option v-for="p in projectsStore.projects" :key="p.id" :value="p.id">
                Project: {{ p.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Path Settings added from Integrations -->
      <div v-if="isCliInstalled" class="mt-8 space-y-6 pt-6 border-t border-gray-100 dark:border-gray-800">
        <div class="text-sm text-gray-600 dark:text-gray-300">
          To run <code
            class="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400">andb</code>
          from your terminal without requiring administrator privileges, copy and paste one of the options below
          into your terminal.
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            class="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group">
            <h3 class="text-sm font-bold text-gray-900 dark:text-white mb-2">{{ $t('settings.terminal.option1')
              }}
            </h3>
            <p class="text-[10px] text-gray-500 dark:text-gray-400 mb-3">{{ $t('settings.terminal.option1Desc')
              }}
            </p>
            <CopyableSnippet
              :content="`export PATH=\&quot;$PATH:${internalBinaryPath.split('/andb').join('')}\&quot;`"
              language="bash" />
          </div>

          <div
            class="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group">
            <h3 class="text-sm font-bold text-gray-900 dark:text-white mb-2">{{ $t('settings.terminal.option2')
              }}
            </h3>
            <p class="text-[10px] text-gray-500 dark:text-gray-400 mb-3">{{ $t('settings.terminal.option2Desc')
              }}
            </p>
            <CopyableSnippet :content="`ln -sf &quot;${internalBinaryPath}&quot; ~/.local/bin/andb`"
              language="bash" />
          </div>
        </div>
      </div>

      <!-- Smart MCP Server (AI Architect) -->
      <div
        class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-md">
        <div
          class="p-8 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div
              class="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-lg shadow-orange-500/10">
              <Cpu class="w-6 h-6" />
            </div>
            <div>
              <h2 class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{{
                $t('settings.terminal.mcpTitle') }}</h2>
              <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">{{ $t('settings.terminal.mcpDesc')
                }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div
              class="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-black border bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400 uppercase tracking-widest whitespace-nowrap">
              <span class="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              {{ $t('settings.terminal.mcpMode') }}
            </div>
          </div>
        </div>

        <div class="p-8 space-y-6">
          <div class="text-sm text-gray-600 dark:text-gray-300" v-html="$t('settings.terminal.mcpInfo')"></div>

          <div class="bg-gray-950 rounded-2xl p-5 border border-white/5 shadow-inner">
            <CopyableSnippet
              :content="`{\n  \&quot;mcpServers\&quot;: {\n    \&quot;the-andb\&quot;: {\n      \&quot;command\&quot;: \&quot;node\&quot;,\n      \&quot;args\&quot;: [\&quot;${mcpBinaryPath}\&quot;]\n    }\n  }\n}`"
              language="json" />
          </div>

          <div
            class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <div
              class="p-5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-blue-500/50 transition-colors">
              <h4 class="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-2">{{
                $t('settings.terminal.cursorConfig') }}</h4>
              <code
                class="text-xs text-gray-600 dark:text-gray-400 break-all select-all block bg-white dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">~/Library/Application
            Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json</code>
            </div>
            <div
              class="p-5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-teal-500/50 transition-colors">
              <h4 class="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-2">{{
                $t('settings.terminal.windsurfConfig') }}</h4>
              <code
                class="text-xs text-gray-600 dark:text-gray-400 break-all select-all block bg-white dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">~/.codeium/windsurf/mcp_config.json</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
