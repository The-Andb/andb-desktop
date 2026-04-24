<template>
  <div ref="editorContainer" class="w-full h-full min-h-0 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/50 transition-all"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as monaco from 'monaco-editor'
import { format } from 'sql-formatter'

const props = defineProps<{
  modelValue: string
  language?: string
  theme?: string
  readOnly?: boolean
  options?: any
}>()

const emit = defineEmits(['update:modelValue', 'execute', 'executeNew'])

const editorContainer = ref<HTMLElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null

onMounted(async () => {
  if (!editorContainer.value) return

  // Basic Monaco Setup
  editor = monaco.editor.create(editorContainer.value, {
    value: props.modelValue,
    language: props.language || 'sql',
    theme: props.theme || (document.documentElement.classList.contains('dark') ? 'vs-dark' : 'vs'),
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 13,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    lineNumbers: 'on',
    readOnly: props.readOnly || false,
    padding: { top: 10, bottom: 10 },
    roundedSelection: true,
    cursorSmoothCaretAnimation: 'on',
    renderLineHighlight: 'all',
    bracketPairColorization: { enabled: true },
    ...props.options
  })

  // Value updates
  editor.onDidChangeModelContent(() => {
    const value = editor?.getValue() || ''
    if (value !== props.modelValue) {
      emit('update:modelValue', value)
    }
  })

  // Shortcuts
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
    emit('execute')
  })

  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
    emit('executeNew')
  })

  // Add format action
  editor.addAction({
    id: 'format-sql',
    label: 'Format SQL',
    keybindings: [monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF],
    run: () => {
      formatSql()
    }
  })
})

const formatSql = () => {
  if (!editor) return
  const val = editor.getValue()
  try {
    const formatted = format(val, {
      language: 'mysql', // Defaulting to mysql for general SQL
      uppercase: true,
    })
    editor.setValue(formatted)
  } catch (e) {
    console.error('Failed to format SQL', e)
  }
}

// Watchers for external changes
watch(() => props.modelValue, (newVal) => {
  if (editor && newVal !== editor.getValue()) {
    editor.setValue(newVal)
  }
})

watch(() => props.readOnly, (newVal) => {
  if (editor) {
    editor.updateOptions({ readOnly: newVal })
  }
})

// Sync Theme
const observer = new MutationObserver(() => {
  const isDark = document.documentElement.classList.contains('dark')
  if (editor) {
    monaco.editor.setTheme(isDark ? 'vs-dark' : 'vs')
  }
})

onMounted(() => {
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onUnmounted(() => {
  if (editor) {
    editor.dispose()
  }
  observer.disconnect()
})

defineExpose({
  getEditor: () => editor,
  format: formatSql
})
</script>

<style>
.monaco-editor {
  padding: 0 !important;
}
.margin {
  background-color: transparent !important;
}
</style>
