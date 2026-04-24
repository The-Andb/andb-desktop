import * as fs from 'fs';
import * as path from 'path';
import { IPromptProvider } from '@the-andb/core';

/**
 * A prompt provider that reads from a private local directory.
 * This can be mapped to a private git repo cloned locally.
 */
export class SecretPromptProvider implements IPromptProvider {
  private baseDir: string;

  constructor(secretsPath?: string) {
    // Default to a folder relative to the workspace in dev, or a specific app path in prod
    this.baseDir = secretsPath || path.resolve(process.cwd(), 'andb-secrets');
    console.log(`[SecretPromptProvider] Initialized with base path: ${this.baseDir}`);
  }

  /**
   * Fetches a prompt by key and injects variables.
   * Key format: 'folder/file' (e.g., 'core/system_base', 'personas/dba')
   */
  public async get(key: string, variables: Record<string, any> = {}): Promise<string> {
    const filePath = path.join(this.baseDir, 'prompts', `${key.toLowerCase()}.md`);
    
    try {
      if (!fs.existsSync(filePath)) {
        console.warn(`[SecretPromptProvider] Prompt file not found: ${filePath}`);
        return '';
      }

      let content = fs.readFileSync(filePath, 'utf8');

      // Simple variable injection: {{variable}}
      for (const [vKey, vValue] of Object.entries(variables)) {
        const regex = new RegExp(`{{${vKey}}}`, 'g');
        content = content.replace(regex, String(vValue || ''));
      }

      return content;
    } catch (e: any) {
      console.error(`[SecretPromptProvider] Error reading prompt ${key}:`, e.message);
      return '';
    }
  }
}
