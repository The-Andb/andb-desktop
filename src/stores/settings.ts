import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type Theme = 'light' | 'dark' | 'system' | 'solarized-dark' | 'night-owl-dark' | 'night-owl-light' | 'dracula' | 'one-dark' | 'monokai' | 'nord' | 'github-dark' | 'github-light' | 'solarized-light' | 'nord-light'
export type Language = 'en' | 'vi'

export interface ThemeOption {
  id: Theme
  label: string
  dark: boolean
  preview: {
    main: string
    sidebar: string
  }
}

export const themeOptions: ThemeOption[] = [
  { id: 'light', label: 'Refined Light', dark: false, preview: { main: '#ffffff', sidebar: '#f9fafb' } },
  { id: 'github-light', label: 'GitHub Light', dark: false, preview: { main: '#ffffff', sidebar: '#f6f8fa' } },
  { id: 'solarized-light', label: 'Solarized Light', dark: false, preview: { main: '#fdf6e3', sidebar: '#eee8d5' } },
  { id: 'nord-light', label: 'Nord Light', dark: false, preview: { main: '#eceff4', sidebar: '#e5e9f0' } },
  { id: 'night-owl-light', label: 'Night Owl Light', dark: false, preview: { main: '#fbfbfb', sidebar: '#f0f0f0' } },
  { id: 'dark', label: 'Pro Dark', dark: true, preview: { main: '#111827', sidebar: '#1f2937' } },
  { id: 'solarized-dark', label: 'Solarized Dark', dark: true, preview: { main: '#002b36', sidebar: '#073642' } },
  { id: 'night-owl-dark', label: 'Night Owl Dark', dark: true, preview: { main: '#011627', sidebar: '#01111d' } },
  { id: 'dracula', label: 'Dracula', dark: true, preview: { main: '#282a36', sidebar: '#21222c' } },
  { id: 'one-dark', label: 'One Dark', dark: true, preview: { main: '#282c34', sidebar: '#21252b' } },
  { id: 'monokai', label: 'Monokai Pro', dark: true, preview: { main: '#2d2a2e', sidebar: '#221f22' } },
  { id: 'nord', label: 'Nord', dark: true, preview: { main: '#2e3440', sidebar: '#242933' } },
  { id: 'github-dark', label: 'GitHub Dark', dark: true, preview: { main: '#0d1117', sidebar: '#010409' } }
]

interface Settings {
  theme: Theme
  language: Language
  timezone: string
  domainNormalization: {
    pattern: string
    replacement: string
  }
  envReplacements?: Array<{
    key: string
    values: Record<string, string>
  }>
  isNotMigrateCondition: string
  excludeTags?: string[]
  sqlitePath: string
  setupCompleted: boolean
  aiApiKey?: string
}

const STORAGE_KEY = 'andb-ui-settings'

const defaultSettings: Settings = {
  theme: 'system',
  language: 'en',
  timezone: 'UTC',
  domainNormalization: {
    pattern: '@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    replacement: '@<EMAIL_DOMAIN>'
  },
  envReplacements: [],
  isNotMigrateCondition: 'test|OTE_',
  excludeTags: [],
  sqlitePath: '',
  setupCompleted: false,
  aiApiKey: ''
}

const loadSettingsAsync = async (currentSettings: any) => {
  try {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.storage) {
      const res = await (window as any).electronAPI.storage.get(STORAGE_KEY)
      if (res && res.success && res.data) {
        const parsed = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
        Object.assign(currentSettings.value, { ...defaultSettings, ...parsed })
      }
    }
  } catch (err) {
    console.warn('Failed to load settings from DB', err)
  }
}

const saveSettings = async (settings: Settings) => {
  try {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.storage) {
      await (window as any).electronAPI.storage.set(STORAGE_KEY, JSON.parse(JSON.stringify(settings)))
    }
  } catch (error: any) {
    if (window.electronAPI) {
      window.electronAPI.log.send('error', 'Failed to save ui settings to storage', error.message)
    }
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>({ ...defaultSettings })

  // Watch for changes and save to IPC Storage
  watch(settings, (newSettings) => {
    saveSettings(newSettings)
    applyTheme(newSettings.theme)
    setLanguage(newSettings.language)
  }, { deep: true })

  // Async load immediately
  loadSettingsAsync(settings)

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement

    // Clean up existing theme classes
    const themeClasses = themeOptions.map(t => t.id).concat(['dark'])
    root.classList.remove(...themeClasses)

    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', isDark)
    } else {
      // Add the specific theme class
      root.classList.add(theme)

      // Automatically add 'dark' class if the theme is marked as dark in options
      const option = themeOptions.find(o => o.id === theme)
      if (option?.dark) {
        root.classList.add('dark')
      }
    }
  }

  const setTheme = (theme: Theme) => {
    settings.value.theme = theme
  }

  const setLanguage = (language: Language) => {
    settings.value.language = language
  }

  const toggleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(settings.value.theme)
    const nextIndex = (currentIndex + 1) % themes.length
    settings.value.theme = themes[nextIndex]
  }

  // Initialize theme on store creation
  applyTheme(settings.value.theme)

  return {
    settings,
    setTheme,
    setLanguage,
    toggleTheme
  }
})
