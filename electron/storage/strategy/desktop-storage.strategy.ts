import { BaseStorageStrategy } from '@the-andb/core';
// Import GUI entities as well to bundle them into the same DataSource
import { GlobalConnectionEntity } from '../entities/gui/GlobalConnectionEntity';
import { ProjectConnectionEntity } from '../entities/gui/ProjectConnectionEntity';
import { GuiPreferenceEntity } from '../entities/gui/GuiPreferenceEntity';
import { WorkspaceTabEntity } from '../entities/gui/WorkspaceTabEntity';
import { InstantCompareEntity } from '../entities/gui/InstantCompareEntity';
import { SecurityService } from '../../services/security';

export class DesktopStorageStrategy extends BaseStorageStrategy {

  async initialize(dbPath: string, extraEntities: any[] = [], projectBaseDir?: string): Promise<void> {
    // Inject desktop-specific GUI entities
    await super.initialize(dbPath, [
      GlobalConnectionEntity, 
      ProjectConnectionEntity,
      GuiPreferenceEntity, 
      WorkspaceTabEntity,
      InstantCompareEntity,
      ...extraEntities
    ], projectBaseDir);
    
    // Sync secure keys folder location to match the active database vault path
    SecurityService.getInstance().reinitialize(dbPath);
  }

  async saveUserSetting(key: string, value: string): Promise<void> {
    let valueToSave = value;
    if (key === 'ai_api_key' && value) {
      valueToSave = SecurityService.getInstance().encrypt(value);
    }
    await super.saveUserSetting(key, valueToSave);
  }

  async getUserSettings(): Promise<Record<string, string>> {
    const settings = await super.getUserSettings();
    if (settings && settings.ai_api_key && settings.ai_api_key.startsWith('ENC:')) {
      settings.ai_api_key = SecurityService.getInstance().decrypt(settings.ai_api_key);
    }
    return settings;
  }
}
