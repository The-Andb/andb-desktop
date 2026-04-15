/**
 * Formats a date string into a human-readable relative or absolute format.
 */
export const formatDate = (dateStr: string | number | Date | null | undefined) => {
  if (!dateStr) return 'never'
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    
    // For older dates, show MMM DD
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch (e) {
    return 'long ago'
  }
}
