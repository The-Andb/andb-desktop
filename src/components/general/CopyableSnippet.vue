<script setup lang="ts">
import { ref } from 'vue'
import { Copy, Check } from 'lucide-vue-next'

const props = defineProps<{
  content: string
  language?: string
}>()

const copied = ref(false)

const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(props.content)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (err) {
    console.error('Failed to copy text: ', err)
  }
}
</script>

<template>
  <div class="relative group bg-gray-900 rounded-lg overflow-hidden flex border border-gray-800">
    <div class="flex-1 p-3 font-mono text-sm text-gray-300 overflow-x-auto whitespace-pre">
      {{ content }}
    </div>
    <div class="bg-gray-800 flex items-center justify-center p-2 border-l border-gray-700">
      <button 
        @click="handleCopy" 
        class="p-2 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        :title="copied ? 'Copied!' : 'Copy to clipboard'"
      >
        <Check v-if="copied" class="w-4 h-4 text-green-400" />
        <Copy v-else class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
