<script setup lang="ts">
import { computed, markRaw } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { useSettingsStore, themeOptions } from '@/stores/settings'
import { useFeaturesStore } from '@/stores/features'
import { setLanguage } from '@/i18n'
import {
  Zap,
  Check,
  MousePointer2,
  Layers,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Database,
  ChevronDown,
  LayoutList,
  Columns as ColumnsIcon,
  Home,
  GitCompare,
  Workflow,
  Terminal,
  Network,
  Type,
  Code
} from 'lucide-vue-next'

const { t } = useI18n()
const appStore = useAppStore()
const settingsStore = useSettingsStore()
const featuresStore = useFeaturesStore()

const settings = computed(() => settingsStore.settings)

const updateLanguage = () => {
  setLanguage(settings.value.language)
}

const getFontSizeRange = (key: string) => {
  if (key === 'title') return [14, 16, 18, 20, 22, 24, 26, 28, 32]
  if (key === 'subtitle') return [11, 12, 13, 14, 15, 16, 18, 20, 22]
  if (key === 'quote') return [9, 10, 11, 12, 13, 14]
  return [10, 11, 12, 13, 14, 15, 16, 17, 18, 20] // content and code
}

const timezones = [
  { label: 'UTC (+00:00)', value: 'UTC' },
  { label: 'Asia/Ho_Chi_Minh (+07:00)', value: 'Asia/Ho_Chi_Minh' },
  { label: "Singapore (+08:00)", value: "Asia/Singapore" },
  { label: "Tokyo (+09:00)", value: "Asia/Tokyo" },
  { label: "Sydney (+11:00)", value: "Australia/Sydney" },
  { label: 'America/New_York (-05:00)', value: 'America/New_York' },
  { label: 'Europe/London (+00:00)', value: 'Europe/London' }
]

const navItems = computed(() => {
  const items = [
    { name: t('common.dashboard'), path: '/', icon: Home, visible: true },
    { name: t('common.schema'), path: '/schema', icon: Database, visible: true },
    { name: t('common.compare'), path: '/compare', icon: GitCompare, visible: true },
    { name: t('common.history'), path: '/history', icon: HistoryIcon, visible: true },
    { name: 'Instant Compare', path: '/instant-compare', icon: Workflow, visible: true },
    { name: 'Integrations', path: '/integrations', icon: Terminal, visible: true },
    { name: 'ER Diagram', path: '/er-diagram', icon: Network, visible: featuresStore.isEnabled('erDiagram') },
    { name: t('settings.project_settings'), path: '/project-settings', icon: SettingsIcon, visible: true },
  ]
  return items.filter(i => i.visible)
})

const toggleHorizontalTab = (path: string) => {
  const hidden = [...appStore.hiddenHorizontalTabs]
  const index = hidden.indexOf(path)
  if (index === -1) {
    hidden.push(path)
  } else {
    hidden.splice(index, 1)
  }
  appStore.hiddenHorizontalTabs = hidden
}

const buttonStyles = computed<{ id: 'full' | 'minimal' | 'icons', label: string, icon: any, desc: string }[]>(() => [
  { id: 'full', label: t('settings.interface.buttons.premium'), icon: markRaw(Zap), desc: t('settings.interface.buttons.premiumDesc') },
  { id: 'minimal', label: t('settings.interface.buttons.minimal'), icon: markRaw(MousePointer2), desc: t('settings.interface.buttons.minimalDesc') },
  { id: 'icons', label: t('settings.interface.buttons.iconOnly'), icon: markRaw(Layers), desc: t('settings.interface.buttons.iconOnlyDesc') }
])
</script>

<template>
  <div class="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
    <!-- Main UI Settings -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">

      <div class="md:col-span-2 space-y-6">
        <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
          <label class="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">{{
            $t('settings.interface.theme.label') }}</label>
          <div
            class="flex items-center gap-6 bg-gray-50/50 dark:bg-gray-800/50 p-1 rounded-xl border border-gray-100 dark:border-gray-800">
            <button @click="settingsStore.setTheme('system')"
              class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all"
              :class="settings.theme === 'system' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'">
              <div class="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center"
                :class="settings.theme === 'system' ? 'border-primary-500' : 'border-gray-300'">
                <div v-if="settings.theme === 'system'" class="w-2 h-2 bg-primary-500 rounded-full"></div>
              </div>
              {{ $t('settings.interface.theme.sync') }}
            </button>
            <button @click="settingsStore.setTheme(settings.theme === 'system' ? 'dark' : settings.theme)"
              class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all"
              :class="settings.theme !== 'system' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'">
              <div class="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center"
                :class="settings.theme !== 'system' ? 'border-primary-500' : 'border-gray-300'">
                <div v-if="settings.theme !== 'system'" class="w-2 h-2 bg-primary-500 rounded-full"></div>
              </div>
              {{ $t('settings.interface.theme.manual') }}
            </button>
          </div>
        </div>

        <div
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-10">
          <div v-for="t in themeOptions" :key="t.id" @click="settingsStore.setTheme(t.id)"
            class="group cursor-pointer space-y-4">
            <div :data-theme-id="t.id"
              class="aspect-[16/10] rounded-xl border-2 transition-all duration-300 overflow-hidden relative"
              :class="[
                settings.theme === t.id
                  ? 'border-primary-500 shadow-xl shadow-primary-500/10 scale-[1.05]'
                  : 'border-transparent bg-gray-100 dark:bg-gray-800 group-hover:border-gray-200 dark:group-hover:border-gray-700'
              ]">
              <!-- Theme Thumbnail Mockup -->
              <div class="absolute inset-0 flex flex-col" :style="{ backgroundColor: t.preview.main }">
                <div class="h-1.5 w-full flex gap-0.5 p-0.5 border-b opacity-20"
                  :style="{ backgroundColor: t.preview.sidebar, borderColor: 'currentColor' }">
                  <div class="w-1 h-1 rounded-full bg-red-400"></div>
                  <div class="w-1 h-1 rounded-full bg-amber-400"></div>
                  <div class="w-1 h-1 rounded-full bg-green-400"></div>
                </div>
                <div class="flex-1 flex overflow-hidden">
                  <div class="w-1/4 h-full border-r opacity-20"
                    :style="{ backgroundColor: t.preview.sidebar, borderColor: 'currentColor' }"></div>
                  <div class="flex-1 p-2 space-y-1">
                    <div class="h-1 w-2/3 rounded-full opacity-20"
                      :class="t.dark ? 'bg-gray-600' : 'bg-gray-300'">
                    </div>
                    <div class="h-1.5 w-full rounded border border-dashed opacity-10"
                      :class="t.dark ? 'border-gray-500' : 'border-gray-400'"></div>
                    <div class="grid grid-cols-3 gap-1 mt-2">
                      <div class="h-3 rounded-sm opacity-20" :class="t.dark ? 'bg-gray-800' : 'bg-gray-100'">
                      </div>
                      <div class="h-3 rounded-sm opacity-20" :class="t.dark ? 'bg-gray-800' : 'bg-gray-100'">
                      </div>
                      <div class="h-3 rounded-sm border-l-2 border-primary-500"
                        :style="{ backgroundColor: t.id === 'light' ? '#f0fdf4' : t.preview.sidebar + '80' }">
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Checkmark overlay for selected -->
              <div v-if="settings.theme === t.id"
                class="absolute inset-0 bg-primary-500/5 flex items-center justify-center">
                <div
                  class="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-lg transform scale-110 animate-in zoom-in-50 duration-300">
                  <Check class="w-4 h-4" />
                </div>
              </div>
            </div>

            <div class="flex flex-col items-center gap-2 px-1 text-center min-h-[40px] justify-start">
              <span class="text-[10px] font-black uppercase tracking-[0.15em] transition-colors leading-relaxed"
                :class="settings.theme === t.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 group-hover:text-gray-600'">{{
                  $t('settings.themes.' + t.id) }}</span>
              <div class="w-1.5 h-1.5 rounded-full transition-all duration-300"
                :class="settings.theme === t.id ? 'bg-primary-500 scale-100' : 'bg-transparent scale-0'"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-2">
        <label class="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">{{
          $t('settings.interface.language.label') }}</label>
        <div class="relative group">
          <select v-model="settings.language" @change="updateLanguage"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary-500/20 group-hover:border-primary-500 transition-all">
            <option value="en">{{ $t('settings.english') }}</option>
            <option value="vi">{{ $t('settings.vietnamese') }}</option>
          </select>
          <ChevronDown
            class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <!-- Timezone Select -->
      <div class="md:col-span-2 space-y-2 pt-2">
        <label class="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">{{
          $t('settings.interface.timezone.label') }}</label>
        <div class="relative group">
          <select v-model="settings.timezone"
            class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold appearance-none outline-none focus:ring-2 focus:ring-primary-500/20 group-hover:border-primary-500 transition-all">
            <option v-for="tz in timezones" :key="tz.value" :value="tz.value">{{ tz.label }}</option>
          </select>
          <ChevronDown
            class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <!-- Navigation Style -->
      <div class="md:col-span-2 space-y-4 pt-4 animate-in fade-in slide-in-from-bottom-2">
        <div class="flex items-center justify-between">
          <label class="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-1">{{
            $t('settings.interface.navigation.label') }}</label>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button @click="appStore.navStyle = 'vertical-list'"
            class="flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 group"
            :class="appStore.navStyle === 'vertical-list'
              ? 'bg-white dark:bg-gray-800 border-primary-500 shadow-xl shadow-primary-500/10 ring-1 ring-primary-500/20'
              : 'bg-transparent border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center"
              :class="appStore.navStyle === 'vertical-list' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'">
              <LayoutList class="w-5 h-5" />
            </div>
            <div class="text-left">
              <div class="text-xs font-black text-gray-900 dark:text-white uppercase leading-none mb-1">{{
                $t('settings.interface.navigation.vertical') }}</div>
              <div class="text-[10px] text-gray-400 uppercase tracking-tighter">{{
                $t('settings.interface.navigation.verticalDesc') }}</div>
            </div>
          </button>

          <button @click="appStore.navStyle = 'horizontal-tabs'"
            class="flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 group"
            :class="appStore.navStyle === 'horizontal-tabs'
              ? 'bg-white dark:bg-gray-800 border-primary-500 shadow-xl shadow-primary-500/10 ring-1 ring-primary-500/20'
              : 'bg-transparent border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center"
              :class="appStore.navStyle === 'horizontal-tabs' ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'">
              <ColumnsIcon class="w-5 h-5" />
            </div>
            <div class="text-left">
              <div class="text-xs font-black text-gray-900 dark:text-white uppercase leading-none mb-1">{{
                $t('settings.interface.navigation.horizontal') }}</div>
              <div class="text-[10px] text-gray-400 uppercase tracking-tighter">{{
                $t('settings.interface.navigation.horizontalDesc') }}</div>
            </div>
          </button>
        </div>

        <!-- Visible Tabs Configuration -->
        <div v-if="appStore.navStyle === 'horizontal-tabs'"
          class="mt-4 p-5 bg-gray-50/50 dark:bg-gray-800/20 rounded-2xl border border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-top-2">
          <label
            class="block text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4">{{
              $t('settings.interface.visibleConfig') }}</label>
          <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <label v-for="item in navItems" :key="item.path"
              class="flex items-center px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 rounded-xl cursor-pointer gap-3 transition-colors shadow-sm group">
              <input type="checkbox" :checked="!appStore.hiddenHorizontalTabs.includes(item.path)"
                @change="toggleHorizontalTab(item.path)"
                class="w-4 h-4 rounded text-primary-500 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 focus:ring-primary-500 focus:ring-offset-0" />
              <component :is="item.icon"
                class="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
              <span class="text-xs font-black text-gray-700 dark:text-gray-300 truncate tracking-tight">{{
                item.name
                }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Typography Matrix -->
    <div class="pt-8 border-t border-gray-100 dark:border-gray-800">
      <div class="mb-8">
        <h3 class="text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest mb-1">{{
          $t('settings.interface.typography.title') }}</h3>
        <p class="text-[10px] text-gray-400 uppercase tracking-tighter">{{
          $t('settings.interface.typography.subtitle') }}</p>
      </div>

      <div class="mb-6 grid grid-cols-4 gap-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <button v-for="profile in ['small', 'medium', 'large', 'custom']" :key="profile"
          @click="appStore.applyFontSizeProfile(profile as any)"
          class="py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          :class="appStore.fontSizeProfile === profile
            ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5'
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'">
          <Type v-if="profile !== 'custom'" class="w-3.5 h-3.5"
            :class="{ 'w-3 h-3': profile === 'small', 'w-4 h-4': profile === 'large' }" />
          <SettingsIcon v-else class="w-3.5 h-3.5" />
          <span class="hidden sm:inline">{{ $t('settings.interface.typography.profiles.' + profile) }}</span>
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div class="space-y-2">
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-tight">{{
            $t('settings.interface.typography.mainFont') }}</label>
          <select v-model="appStore.fontFamilies.general"
            class="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-gray-900 dark:text-white appearance-none cursor-pointer">
            <option value="'Inter', sans-serif">{{ $t('settings.interface.typography.fonts.inter') }}</option>
            <option value="'Roboto', sans-serif">{{ $t('settings.interface.typography.fonts.roboto') }}</option>
            <option value="'Outfit', sans-serif">{{ $t('settings.interface.typography.fonts.outfit') }}</option>
            <option value="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">{{
              $t('settings.interface.typography.fonts.systemNative') }}</option>
          </select>
        </div>
        <div>
          <label
            class="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-3 flex items-center gap-2">
            <Code class="w-4 h-4 text-primary-500" />
            {{ $t('settings.interface.typography.codeFont') }}
          </label>
          <select v-model="appStore.fontFamilies.code"
            class="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-gray-900 dark:text-white appearance-none cursor-pointer font-mono">
            <option value="'JetBrains Mono', monospace">{{ $t('settings.interface.typography.fonts.jetbrains') }}</option>
            <option value="'Monaco', Consolas, monospace">Monaco</option>
            <option value="'Cascadia Code', monospace">Cascadia Code</option>
            <option value="'Fira Code', monospace">{{ $t('settings.interface.typography.fonts.fira') }}</option>
            <option value="'Source Code Pro', monospace">{{ $t('settings.interface.typography.fonts.sourceCode') }}</option>
            <option
              value="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace">
              {{ $t('settings.interface.typography.fonts.systemNativeMono') }}</option>
          </select>
        </div>

        <div v-if="appStore.fontSizeProfile === 'custom'"
          class="md:col-span-2 mt-4 animate-in fade-in slide-in-from-top-2">
          <label class="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">{{
            $t('settings.interface.typography.granularMatrix') }}</label>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div v-for="(_, key) in appStore.fontSizes" :key="key"
              class="p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all">
              <label class="block text-xs font-bold text-gray-400 uppercase tracking-tight mb-2 truncate">{{
                $t('settings.interface.typography.sizeLabels.' + key) }}</label>
              <select v-model.number="appStore.fontSizes[key]"
                class="w-full px-2 py-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-lg text-xs font-black outline-none focus:ring-1 focus:ring-primary-500">
                <option v-for="s in getFontSizeRange(key)" :key="s" :value="s">{{ s }}px</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Button Style / Visual Density -->
    <div class="pt-8 border-t border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-2">
      <div class="mb-8">
        <h3 class="text-sm font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest mb-1">{{
          $t('settings.interface.buttons.title') }}</h3>
        <p class="text-xs text-gray-400 uppercase tracking-tighter">{{ $t('settings.interface.buttons.subtitle')
          }}
        </p>
      </div>

      <div class="flex flex-col lg:flex-row gap-8">
        <div class="lg:w-1/3 space-y-3">
          <button v-for="style in buttonStyles" :key="style.id" @click="appStore.buttonStyle = style.id"
            class="w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group"
            :class="appStore.buttonStyle === style.id
              ? 'bg-white dark:bg-gray-800 border-primary-500 shadow-xl shadow-primary-500/10 ring-1 ring-primary-500/20'
              : 'bg-transparent border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                :class="appStore.buttonStyle === style.id ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:text-primary-500'">
                <component :is="style.icon" class="w-5 h-5" />
              </div>
              <div class="text-left">
                <div class="text-xs font-black text-gray-900 dark:text-white uppercase leading-none mb-1">{{
                  style.label }}</div>
                <div class="text-[10px] text-gray-500 uppercase tracking-tighter">{{ style.desc }}</div>
              </div>
            </div>
            <div v-if="appStore.buttonStyle === style.id"
              class="w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
              <Check class="w-2.5 h-2.5 text-white" />
            </div>
          </button>
        </div>

        <!-- Live Preview -->
        <div
          class="lg:w-2/3 bg-gray-50/50 dark:bg-gray-950/50 rounded-2xl p-8 border border-gray-100/50 dark:border-gray-800/50 flex flex-col items-center justify-center relative overflow-hidden group">
          <div
            class="absolute inset-0 bg-primary-500/[0.02] dark:bg-primary-500/[0.01] pointer-events-none group-hover:bg-primary-500/[0.04] transition-all">
          </div>
          <span
            class="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500 mb-10 bg-primary-50 dark:bg-primary-950/30 px-4 py-2 rounded-full border border-primary-100 dark:border-primary-900/50 shadow-sm">{{
              $t('settings.interface.preview.label') }}</span>

          <div class="flex flex-col items-center gap-10 w-full max-w-sm">
            <div class="w-full flex flex-col items-center">
              <span class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 opacity-60">{{
                $t('settings.interface.preview.primary') }}</span>
              <button
                class="flex items-center justify-center font-black uppercase transition-all duration-300 active:scale-95"
                :class="[
                  appStore.buttonStyle === 'full' ? 'px-10 py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-2xl text-[11px] tracking-[0.2em] shadow-xl shadow-primary-500/30' : '',
                  appStore.buttonStyle === 'minimal' ? 'px-8 py-2.5 bg-primary-500 text-white rounded-xl text-[10px] tracking-widest shadow-lg shadow-primary-500/10' : '',
                  appStore.buttonStyle === 'icons' ? 'w-14 h-14 bg-primary-500 text-white rounded-full shadow-2xl shadow-primary-500/30 hover:scale-110' : ''
                ]">
                <Zap class="w-5 h-5" :class="appStore.buttonStyle !== 'icons' ? 'mr-3' : ''"
                  :fill="appStore.buttonStyle === 'full' ? 'currentColor' : 'none'" />
                <span v-if="appStore.buttonStyle !== 'icons'">{{ appStore.buttonStyle === 'full' ?
                  $t('settings.interface.preview.initialize') : $t('settings.interface.preview.analyze')
                  }}</span>
              </button>
            </div>

            <div class="flex items-center gap-16">
              <div class="flex flex-col items-center">
                <span class="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 opacity-60">{{
                  $t('settings.interface.preview.secondary') }}</span>
                <button class="transition-all duration-300 active:scale-95 hover:scale-105" :class="[
                  appStore.buttonStyle === 'full' ? 'flex items-center gap-3 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-2xl text-[11px] font-black shadow-md' : '',
                  appStore.buttonStyle === 'minimal' ? 'flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl text-[10px] font-black' : '',
                  appStore.buttonStyle === 'icons' ? 'w-11 h-11 flex items-center justify-center bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm' : ''
                ]">
                  <HistoryIcon class="w-4 h-4" />
                  <span v-if="appStore.buttonStyle !== 'icons'">{{ $t('settings.interface.preview.checkHistory')
                    }}</span>
                </button>
              </div>
              <div class="flex flex-col items-center">
                <span class="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 opacity-60">{{
                  $t('settings.interface.preview.utility') }}</span>
                <button class="transition-all duration-300 active:scale-95 group/u" :class="[
                  appStore.buttonStyle === 'full' ? 'flex items-center justify-center w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl shadow-inner hover:bg-indigo-100 transition-colors' : '',
                  appStore.buttonStyle === 'minimal' ? 'flex items-center justify-center w-10 h-10 bg-gray-50 dark:bg-gray-800/80 text-gray-400 rounded-xl' : '',
                  appStore.buttonStyle === 'icons' ? 'text-gray-400 hover:text-primary-500 hover:scale-125 transition-transform' : ''
                ]">
                  <SettingsIcon class="w-4.5 h-4.5 group-hover/u:rotate-90 transition-transform duration-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
