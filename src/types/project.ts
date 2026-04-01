export interface Project {
  id: string
  name: string
  description: string
  icon?: string
  color?: string
  connectionIds: string[]
  pairIds: string[]
  isActive?: boolean
  isProtected?: boolean
  enabledEnvironmentIds: string[]
  pinnedColumnTypes?: string[]
  settings?: {
    domainNormalization?: {
      pattern: string
      replacement: string
    }
    envReplacements?: Array<{
      key: string
      values: Record<string, string>
    }>
    isNotMigrateCondition?: string
    excludeTags?: string[]
    projectBaseDir?: string
  }
  createdAt: string
  updatedAt: string
}
