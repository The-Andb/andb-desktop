import { defineStore } from 'pinia'

export const useErrorModalStore = defineStore('errorModal', {
  state: () => ({
    isOpen: false,
    title: 'Error',
    message: '',
    onRetry: null as (() => void) | null,
    retryText: 'Retry'
  }),
  actions: {
    showError(options: { title?: string; message: string; onRetry?: () => void; retryText?: string }) {
      this.title = options.title || 'Error'
      this.message = options.message
      this.onRetry = options.onRetry || null
      this.retryText = options.retryText || 'Retry'
      this.isOpen = true
    },
    close() {
      this.isOpen = false
    }
  }
})
