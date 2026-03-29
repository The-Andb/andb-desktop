import { BaseStorageStrategy } from '@the-andb/core';
// Import GUI entities as well to bundle them into the same DataSource
import { GlobalConnectionEntity } from '../entities/gui/GlobalConnectionEntity';
import { ProjectConnectionEntity } from '../entities/gui/ProjectConnectionEntity';
import { GuiPreferenceEntity } from '../entities/gui/GuiPreferenceEntity';
import { WorkspaceTabEntity } from '../entities/gui/WorkspaceTabEntity';

export class DesktopStorageStrategy extends BaseStorageStrategy {

  async initialize(dbPath: string): Promise<void> {
    // Inject desktop-specific GUI entities
    await super.initialize(dbPath, [
      GlobalConnectionEntity, 
      ProjectConnectionEntity,
      GuiPreferenceEntity, 
      WorkspaceTabEntity
    ]);
  }
}
