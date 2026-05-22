/**
 * Drizzle ORM Schema — GUI / Desktop Tables
 *
 * These 4 tables are the desktop-only entities that live alongside the core
 * TypeORM tables in the same VAULT SQLite file.
 *
 * Core tables (projects, project_settings, ddl_exports, comparisons, etc.)
 * continue to be managed by TypeORM/BaseStorageStrategy in andb-core.
 */

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// ─── Project-scoped connections ────────────────────────────────────────────────
export const projectConnections = sqliteTable('project_connections', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  environment: text('environment'),
  type: text('type').notNull().default('mysql'),
  host: text('host'),
  port: integer('port'),
  database: text('database'),
  username: text('username'),
  password: text('password'),       // encrypted via SecurityService
  sshConfigJson: text('ssh_config_json'),
  permissionsJson: text('permissions_json'),
  templateId: text('templateId'),
  domainMappingJson: text('domain_mapping_json'),
  productSettingsJson: text('product_settings_json'),
  projectId: text('project_id'), // Scopes this connection to a specific project
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
})


export type ProjectConnection = typeof projectConnections.$inferSelect
export type NewProjectConnection = typeof projectConnections.$inferInsert

// ─── Global connection templates ───────────────────────────────────────────────
export const globalConnections = sqliteTable('global_connections', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  environment: text('environment'),
  type: text('type').notNull().default('mysql'),
  host: text('host'),
  port: integer('port'),
  database: text('database'),
  username: text('username'),
  password: text('password'),       // encrypted via SecurityService
  sshConfigJson: text('ssh_config_json'),
  permissionsJson: text('permissions_json'),
  templateId: text('templateId'),
  domainMappingJson: text('domain_mapping_json'),
  productSettingsJson: text('product_settings_json'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
})

export type GlobalConnection = typeof globalConnections.$inferSelect
export type NewGlobalConnection = typeof globalConnections.$inferInsert

// ─── Key-value GUI preferences ─────────────────────────────────────────────────
export const guiPreferences = sqliteTable('gui_preferences', {
  key: text('key').primaryKey(),
  value: text('value'),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
})

export type GuiPreference = typeof guiPreferences.$inferSelect

// ─── Workspace tab state ───────────────────────────────────────────────────────
export const workspaceTabs = sqliteTable('workspace_tabs', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  title: text('title'),
  stateJson: text('state_json'),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
})

export type WorkspaceTab = typeof workspaceTabs.$inferSelect
export type NewWorkspaceTab = typeof workspaceTabs.$inferInsert

// ─── Instant Compare History ──────────────────────────────────────────────────
export const instantCompares = sqliteTable('instant_compares', {
  id: text('id').primaryKey(),
  projectId: text('project_id'), // Scopes this comparison to a specific project
  name: text('name').notNull(),
  sourcePath: text('source_path'), // Relative path in vault (projects/{projectName}/instant_compare/{id}_source.sql)
  targetPath: text('target_path'), // Relative path in vault (projects/{projectName}/instant_compare/{id}_target.sql)
  status: text('status'), // 'equal' | 'different' | etc.
  type: text('type'), // 'TABLES' | 'PROCEDURES' | 'VIEWS' | etc.
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
})

export type InstantCompare = typeof instantCompares.$inferSelect
export type NewInstantCompare = typeof instantCompares.$inferInsert

