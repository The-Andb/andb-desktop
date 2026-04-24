import { defineStore } from 'pinia'

export interface ChatMessage {
  role: 'ai' | 'user' | 'error'
  content: string
  lastQuestion?: string
  timestamp: number
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  updatedAt: number
}

export const useAiChatStore = defineStore('aiChat', {
  state: () => ({
    conversations: [] as Conversation[],
    currentConversationId: null as string | null,
    isInitialized: false,
  }),
  actions: {
    async init() {
      if (this.isInitialized) return
      try {
        const result = await (window as any).electronAPI.invoke('ai-get-chats')
        if (result.success && result.data) {
          this.conversations = result.data
        }
      } catch (e) {
        console.error('Failed to load AI chats', e)
      }
      this.isInitialized = true
    },
    async saveConversation(conv: Conversation) {
      try {
        await (window as any).electronAPI.invoke('ai-save-chat', JSON.parse(JSON.stringify({
            id: conv.id,
            title: conv.title,
            messages: conv.messages,
            updated_at: conv.updatedAt
        })))
      } catch (e) {
        console.error('Failed to save AI chat', e)
      }
    },
    newConversation() {
      this.currentConversationId = null
    },
    async addMessage(role: 'ai' | 'user' | 'error', content: string, lastQuestion?: string) {
      const msg: ChatMessage = { role, content, lastQuestion, timestamp: Date.now() }
      
      if (!this.currentConversationId) {
        // Create new conversation
        const newId = Date.now().toString()
        const title = role === 'user' ? (content.length > 30 ? content.substring(0, 30) + '...' : content) : 'AI Analysis'
        
        const newConv = {
          id: newId,
          title,
          messages: [msg],
          updatedAt: Date.now()
        }
        this.conversations.push(newConv)
        this.currentConversationId = newId
        await this.saveConversation(newConv)
      } else {
        const conv = this.conversations.find(c => c.id === this.currentConversationId)
        if (conv) {
          conv.messages.push(msg)
          conv.updatedAt = Date.now()
          // Update title if it was an AI analysis initially and user asks something
          if (conv.title === 'AI Analysis' && role === 'user') {
            conv.title = content.length > 30 ? content.substring(0, 30) + '...' : content
          }
          await this.saveConversation(conv)
        }
      }
    },
    async removeMessage(msgToRemove: ChatMessage) {
        if (!this.currentConversationId) return
        const conv = this.conversations.find(c => c.id === this.currentConversationId)
        if (conv) {
            conv.messages = conv.messages.filter(m => m !== msgToRemove)
            await this.saveConversation(conv)
        }
    },
    async deleteConversation(id: string) {
      this.conversations = this.conversations.filter(c => c.id !== id)
      if (this.currentConversationId === id) {
        this.currentConversationId = null
      }
      try {
        await (window as any).electronAPI.invoke('ai-delete-chat', id)
      } catch (e) {
        console.error('Failed to delete chat', e)
      }
    },
    selectConversation(id: string) {
      this.currentConversationId = id
    },
    async clearAll() {
        this.conversations = []
        this.currentConversationId = null
        try {
          await (window as any).electronAPI.invoke('ai-clear-chats')
        } catch (e) {
          console.error('Failed to clear chats', e)
        }
    }
  },
  getters: {
    currentMessages: (state): ChatMessage[] => {
      if (!state.currentConversationId) return []
      return state.conversations.find(c => c.id === state.currentConversationId)?.messages || []
    },
    sortedConversations: (state) => {
      return [...state.conversations].sort((a, b) => b.updatedAt - a.updatedAt)
    }
  }
})

