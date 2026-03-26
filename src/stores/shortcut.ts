import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Shortcut {
  id: string
  keys: string[]
  label: string
  category: 'Tabs' | 'Navigation' | 'Schema' | 'General'
  meta?: boolean
  ctrl?: boolean
  shift?: boolean
}

export const useShortcutStore = defineStore('shortcut', () => {
  const isModalOpen = ref(false)
  
  const shortcuts = ref<Shortcut[]>([
    { id: 'toggle-sidebar', keys: ['b'], meta: true, label: 'Toggle Sidebar', category: 'General' },
    { id: 'close-tab', keys: ['w'], meta: true, label: 'Close Active Tab', category: 'Tabs' },
    { id: 'prev-tab', keys: ['['], meta: true, label: 'Previous Tab', category: 'Tabs' },
    { id: 'next-tab', keys: [']'], meta: true, label: 'Next Tab', category: 'Tabs' },
    { id: 'refresh-schema', keys: ['r'], meta: true, label: 'Refresh Schema', category: 'Schema' },
    { id: 'focus-search', keys: ['f'], meta: true, label: 'Focus Search', category: 'Navigation' },
    { id: 'show-shortcuts', keys: ['/'], meta: true, label: 'Show Shortcuts Help', category: 'General' }
  ])

  const openModal = () => isModalOpen.value = true
  const closeModal = () => isModalOpen.value = false

  return {
    isModalOpen,
    shortcuts,
    openModal,
    closeModal
  }
})
