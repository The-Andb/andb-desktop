import Store from 'electron-store';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { SecurityService } from './security';
import { desktopStorageStrategy } from '../bootstrap';
import { GlobalConnectionEntity } from '../storage/entities/gui/GlobalConnectionEntity';
import { GuiPreferenceEntity } from '../storage/entities/gui/GuiPreferenceEntity';

export class StorageMigrator {
  static async runMigration() {
    try {
      const dataSource = desktopStorageStrategy.getDataSource();
      if (!dataSource || !dataSource.isInitialized) {
        console.warn('StorageMigrator: Database not initialized');
        return;
      }

      // The userSettings are now managed by desktopStorageStrategy
      const userSettings = await desktopStorageStrategy.getUserSettings();
      if (userSettings['legacy_migration_done_v5'] === 'true') {
        return; // Already migrated
      }

      console.log('🔄 [StorageMigrator] Kicking off legacy electron-store to SQLite migration...');

      const store = new Store();
      const allData = store.store as any;

      // Migrate Connections & Templates
      const connectionRepo = dataSource.getRepository(GlobalConnectionEntity);
      const prefRepo = dataSource.getRepository(GuiPreferenceEntity);
      
      const connections = allData.connections || [];
      const templates = allData.connectionTemplates || [];
      
      const allGlobalConnections = [...connections, ...templates];

      for (const conn of allGlobalConnections) {
        await connectionRepo.upsert({
          id: conn.id,
          name: conn.name,
          environment: conn.environment || null,
          type: conn.type || 'mysql',
          host: conn.host || null,
          port: conn.port || null,
          database: conn.database || null,
          username: conn.username || null,
          password: conn.password || null, // Keeping encrypted payload as-is if it was encrypted
          ssh_config_json: conn.ssh ? JSON.stringify(conn.ssh) : null,
          permissions_json: conn.permissions ? JSON.stringify(conn.permissions) : null,
          templateId: conn.templateId || null,
          domain_mapping_json: conn.domainMapping ? JSON.stringify(conn.domainMapping) : null,
          product_settings_json: conn.productSettings ? JSON.stringify(conn.productSettings) : null,
          updated_at: new Date(conn.updatedAt || Date.now())
        }, ['id']);
      }

      // Migrate Settings/Preferences
      for (const key of Object.keys(allData)) {
        if (key !== 'connections' && key !== 'connectionTemplates') {
          const value = allData[key];
          await prefRepo.upsert({
            key,
            value: typeof value === 'object' ? JSON.stringify(value) : String(value)
          }, ['key']);
        }
      }

      // Mark as done
      await desktopStorageStrategy.saveUserSetting('legacy_migration_done_v5', 'true');
      console.log('✅ [StorageMigrator] Legacy fast-migration completed successfully.');

    } catch (e) {
      console.error('⚠️ [StorageMigrator] Failed to migrate electron-store:', e);
    }
  }
}
