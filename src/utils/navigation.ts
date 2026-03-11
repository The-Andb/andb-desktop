/**
 * Utility to detect the word under the mouse cursor during an event.
 */
export function getWordAtEvent(event: MouseEvent): string {
  // Use caretRangeFromPoint to find the text node and offset at the clicked coordinates
  const range = (document as any).caretRangeFromPoint?.(event.clientX, event.clientY)
  if (!range) return ''

  const node = range.startContainer
  if (node.nodeType !== Node.TEXT_NODE) return ''

  const text = node.textContent || ''
  const offset = range.startOffset
  
  // Find start of word (letters, numbers, underscores, dollar signs, dots, and bracket/quote starts)
  let start = offset
  while (start > 0 && /[a-zA-Z0-9_$.#"`[]/.test(text[start - 1])) {
    const char = text[start - 1]
    if (char === '"' || char === '`' || char === '[' || char === '$') {
       // Only break if it's the start of a quoted segment we are currently in
       // This is a bit naive but covers common cases
       start--
       break
    }
    start--
  }
  
  // Find end of word
  let end = offset
  while (end < text.length && /[a-zA-Z0-9_$.#"`\]]/.test(text[end])) {
    const char = text[end]
    if (char === '"' || char === '`' || char === ']' || char === '$') {
       end++
       break
    }
    end++
  }
  
  let word = text.slice(start, end).trim()
  
  // Strip common SQL delimiters if they wrap the word
  if ((word.startsWith('"') && word.endsWith('"')) || 
      (word.startsWith('`') && word.endsWith('`')) || 
      (word.startsWith('[') && word.endsWith(']'))) {
    word = word.slice(1, -1)
  }

  // Handle dot notation (e.g., schema.table -> take the last part if full name not found)
  // This is handled better in the matching logic
  
  return word
}

/**
 * Handles the logic for detecting a navigatable identifier click with modifier keys.
 */
export function getNavigatableWord(event: MouseEvent, navigatableNames: string[]): string | null {
  const isCmdOrCtrl = event.metaKey || event.ctrlKey
  if (!isCmdOrCtrl) return null

  const word = getWordAtEvent(event)
  if (!word) return null

  // Case-insensitive check for SQL identifiers
  const lowerWord = word.toLowerCase()
  const match = navigatableNames.find(name => name.toLowerCase() === lowerWord)
  
  return match || null
}

// Cache for the navigable names RegExp to avoid redundant heavy creation
let cachedNames: string[] = []
let cachedRegex: RegExp | null = null

/**
 * Generates or retrieves a cached RegExp for navigatable names.
 */
export function getNavigableRegex(names: string[]): RegExp | null {
  if (!names || names.length === 0) return null
  
  // Check if names have changed (shallow check is usually enough for this pattern)
  if (cachedRegex && names.length === cachedNames.length && names[0] === cachedNames[0]) {
    return cachedRegex
  }

  // Sort by length descending to match longest possible names first
  const sortedNames = [...names].sort((a, b) => b.length - a.length)
  const escapedNames = sortedNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  
  cachedNames = [...names]
  cachedRegex = new RegExp(`\\b(${escapedNames})\\b`, 'gi')
  
  return cachedRegex
}

/**
 * Wraps navigatable identifiers in a span for precise underlining.
 * Handles both plain text and Prism-highlighted HTML.
 */
export function highlightLinks(content: string, names: string[], isHtml = true): string {
  const navRegex = getNavigableRegex(names)
  if (!navRegex) return content

  if (!isHtml) {
    return content.replace(navRegex, '<span class="nav-link">$1</span>')
  }

  // If HTML, we must avoid matching inside tags
  const parts = content.split(/(<[^>]+>)/g)
  return parts.map(part => {
    if (part.startsWith('<')) return part
    return part.replace(navRegex, '<span class="nav-link">$1</span>')
  }).join('')
}
