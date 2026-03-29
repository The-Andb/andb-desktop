import Store from 'electron-store';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { SecurityService } from './security';
import { desktopStorageStrategy } from '../bootstrap';
import { GlobalConnectionEntity } from '../storage/entities/gui/GlobalConnectionEntity';
import { ProjectConnectionEntity } from '../storage/entities/gui/ProjectConnectionEntity';
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
      if (userSettings['legacy_migration_done_v6'] === 'true') {
        return; // Already migrated
      }

      console.log('🔄 [StorageMigrator] Kicking off legacy electron-store to SQLite migration (v6)...');

      const store = new Store();
      const allData = store.store as any;

      // Migrate Connections & Templates into separate tables
      const connectionRepo = dataSource.getRepository(ProjectConnectionEntity);
      const templateRepo = dataSource.getRepository(GlobalConnectionEntity);
      const prefRepo = dataSource.getRepository(GuiPreferenceEntity);
      
      const connections = allData.connections || [];
      const templates = allData.connectionTemplates || [];
      
      // 1. Migrate Project Connections
      for (const conn of connections) {
        await connectionRepo.upsert({
          id: conn.id,
          name: conn.name,
          environment: conn.environment || null,
          type: conn.type || 'mysql',
          host: conn.host || null,
          port: conn.port || null,
          database: conn.database || null,
          username: conn.username || null,
          password: conn.password || null,
          ssh_config_json: conn.ssh ? JSON.stringify(conn.ssh) : null,
          permissions_json: conn.permissions ? JSON.stringify(conn.permissions) : null,
          templateId: conn.templateId || null,
          domain_mapping_json: conn.domainMapping ? JSON.stringify(conn.domainMapping) : null,
          product_settings_json: conn.productSettings ? JSON.stringify(conn.productSettings) : null,
          updated_at: new Date(conn.updatedAt || Date.now())
        }, ['id']);
      }

      // 2. Migrate Global Templates
      for (const conn of templates) {
        await templateRepo.upsert({
          id: conn.id,
          name: conn.name,
          environment: conn.environment || null,
          type: conn.type || 'mysql',
          host: conn.host || null,
          port: conn.port || null,
          database: conn.database || null,
          username: conn.username || null,
          password: conn.password || null,
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
      await desktopStorageStrategy.saveUserSetting('legacy_migration_done_v6', 'true');
      console.log('✅ [StorageMigrator] Legacy migration v6 completed successfully.');

      // --- START V7 CLEANUP ---
      if (userSettings['cleanup_pollution_v7'] !== 'true') {
        console.log('🧹 [StorageMigrator] Running V7 Cleanup (Deduplication)...');
        
        // 1. Remove project connections that leaked into global_connections
        const projectConnIds = (await connectionRepo.find({ select: ['id'] })).map(c => c.id);
        if (projectConnIds.length > 0) {
           await templateRepo.createQueryBuilder()
             .delete()
             .where('id IN (:...ids)', { ids: projectConnIds })
             .execute();
        }

        // 2. Further Deduplicate global_connections by unique config
        const allTemplates = await templateRepo.find();
        const seen = new Set<string>();
        const toDelete: string[] = [];

        for (const t of allTemplates) {
          const key = `${t.name}|${t.host}|${t.port}|${t.database}|${t.username}`;
          if (seen.has(key)) {
            toDelete.push(t.id);
          } else {
            seen.add(key);
          }
        }

        if (toDelete.length > 0) {
          await templateRepo.delete(toDelete);
        }

        await desktopStorageStrategy.saveUserSetting('cleanup_pollution_v7', 'true');
        console.log(`✅ [StorageMigrator] V7 Cleanup done. Removed ${toDelete.length} duplicates and project overlaps.`);
      }
      // --- END V7 CLEANUP ---

    } catch (e) {
      console.error('⚠️ [StorageMigrator] Failed to migrate/cleanup storage:', e);
    }
  }
}
