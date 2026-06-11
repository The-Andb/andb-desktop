<template>
  <div
    ref="editorContainer"
    class="w-full h-full min-h-0 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/50 transition-all"
  ></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as monaco from 'monaco-editor'
import { format } from 'sql-formatter'

const props = defineProps<{
  modelValue: string
  language?: string
  theme?: string
  readOnly?: boolean
  options?: any
  schemaMetadata?: { tables: string[], columns: Record<string, string[]> }
}>()

const emit = defineEmits(['update:modelValue', 'execute', 'executeNew'])

const editorContainer = ref<HTMLElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null
let completionDisposable: monaco.IDisposable | null = null

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

  // Register dynamic SQL autocomplete completion provider
  completionDisposable = monaco.languages.registerCompletionItemProvider('sql', {
    provideCompletionItems: (model, position) => {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      })

      const words = textUntilPosition.trim().split(/\s+/)
      const lastWord = words[words.length - 1] || ''
      const suggestions: monaco.languages.CompletionItem[] = []

      if (props.schemaMetadata) {
        const { tables, columns } = props.schemaMetadata

        // 1. Suggest columns if we see table_name.
        if (lastWord.includes('.')) {
          const parts = lastWord.split('.')
          const tableName = parts[parts.length - 2]
          const colList = columns[tableName]
          if (colList) {
            colList.forEach(col => {
              suggestions.push({
                label: col,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: col,
                detail: `Column of ${tableName}`,
                range: {
                  startLineNumber: position.lineNumber,
                  startColumn: position.column - (parts[parts.length - 1].length),
                  endLineNumber: position.lineNumber,
                  endColumn: position.column
                }
              } as any)
            })
            return { suggestions } as any
          }
        }

        // 2. Suggest tables after FROM, JOIN, UPDATE, INTO, TABLE keywords
        const sqlKeywordsBeforeTable = ['FROM', 'JOIN', 'UPDATE', 'INTO', 'TABLE']
        const hasKeywordBefore = words.some((w, idx) => {
          const isKeyword = sqlKeywordsBeforeTable.includes(w.toUpperCase())
          return isKeyword && (words.length - idx) <= 3
        })

        if (hasKeywordBefore) {
          tables.forEach(table => {
            suggestions.push({
              label: table,
              kind: monaco.languages.CompletionItemKind.Class,
              insertText: `\`${table}\``,
              detail: 'Table',
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column - lastWord.length,
                endLineNumber: position.lineNumber,
                endColumn: position.column
              }
            } as any)
          })
          return { suggestions } as any
        }

        // 3. General suggestions (both tables and columns)
        tables.forEach(table => {
          suggestions.push({
            label: table,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: `\`${table}\``,
            detail: 'Table',
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column - lastWord.length,
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }
          } as any)
        })

        Object.entries(columns).forEach(([tableName, colList]) => {
          colList.forEach(col => {
            suggestions.push({
              label: `${tableName}.${col}`,
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: `\`${col}\``,
              detail: `Column of ${tableName}`,
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column - lastWord.length,
                endLineNumber: position.lineNumber,
                endColumn: position.column
              }
            } as any)
          })
        })
      }

      return { suggestions } as any
    }
  })
})

const formatSql = () => {
  if (!editor) return
  const val = editor.getValue()
  try {
    const formatted = format(val, {
      language: 'mysql', // Defaulting to mysql for general SQL
      keywordCase: 'upper'
    })
    editor.setValue(formatted)
  } catch (e) {
    console.error('Failed to format SQL', e)
  }
}

// Watchers for external changes
watch(
  () => props.modelValue,
  newVal => {
    if (editor && newVal !== editor.getValue()) {
      editor.setValue(newVal)
    }
  }
)

watch(
  () => props.readOnly,
  newVal => {
    if (editor) {
      editor.updateOptions({ readOnly: newVal })
    }
  }
)

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
  if (completionDisposable) {
    completionDisposable.dispose()
  }
  observer.disconnect()
})

const getSelectedText = () => {
  if (!editor) return ''
  const selection = editor.getSelection()
  return selection ? editor.getModel()?.getValueInRange(selection) : ''
}

defineExpose({
  getEditor: () => editor,
  getSelectedText,
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
