import { test as base, _electron as electron, ElectronApplication, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execSync } from 'child_process';
import { BugReporter } from './bug-reporter';

export type AppFixture = {
  app: ElectronApplication;
  window: Page;
};

const APP_NAME = 'TheAndb';
const USER_DATA_SUFFIX = '_v3_test';

function getUserDataPath(uniqueId: string) {
  const home = os.homedir();
  const folderName = `${APP_NAME}${USER_DATA_SUFFIX}_${uniqueId}`;
  if (process.platform === 'darwin') {
    return path.join(home, 'Library/Application Support', folderName);
  }
  return path.join(home, '.config', folderName);
}

async function prepareUserData(userDataPath: string) {
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  const dbPath = path.join(userDataPath, 'andb-storage.db');
  const dbConfigPath = path.join(userDataPath, 'db-config.yaml');
  const projectBaseDir = path.join(userDataPath, 'projects');

  if (!fs.existsSync(projectBaseDir)) {
    fs.mkdirSync(projectBaseDir, { recursive: true });
  }

  fs.writeFileSync(dbConfigPath, `dbPath: "${dbPath}"\nprojectBaseDir: "${projectBaseDir}"\n`);

  const uiSettingsJson = JSON.stringify({
    setupCompleted: true,
    theme: 'dark',
    language: 'en',
    sqlitePath: dbPath
  });

  const envsJson = JSON.stringify([
    { id: 'DEV', name: 'DEV', description: 'Development environment', enabled: true, order: 1 },
    { id: 'STAGE', name: 'STAGE', description: 'Staging environment', enabled: true, order: 2 },
    { id: 'UAT', name: 'UAT', description: 'UAT environment', enabled: true, order: 3 },
    { id: 'PROD', name: 'PROD', description: 'Production environment', enabled: true, order: 4 }
  ]);

  const pairsJson = JSON.stringify([
    {
      id: 'pair-default',
      name: 'DEV to STAGE',
      sourceId: 'conn-dev',
      targetId: 'conn-stage',
      projectId: 'e2e-test-project',
      isDefault: true
    }
  ]);

  const sqlScript = `
    -- Internal preferences and environments
    CREATE TABLE IF NOT EXISTS "gui_preferences" ("key" text PRIMARY KEY NOT NULL, "value" text, "updated_at" datetime NOT NULL DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS "projects" ("id" text PRIMARY KEY NOT NULL, "name" text NOT NULL, "description" text, "is_favorite" integer NOT NULL DEFAULT (0), "order_index" integer NOT NULL DEFAULT (0), "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')));
    
    -- v3.3.5 TypeORM Tables
    CREATE TABLE IF NOT EXISTS "global_connections" ("id" text PRIMARY KEY NOT NULL, "name" text NOT NULL, "environment" text, "type" text NOT NULL DEFAULT 'mysql', "host" text, "port" integer, "database" text, "username" text, "password" text, "ssh_config_json" text, "permissions_json" text, "templateId" text, "domain_mapping_json" text, "product_settings_json" text, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS "project_connections" ("id" text PRIMARY KEY NOT NULL, "name" text NOT NULL, "environment" text, "type" text NOT NULL DEFAULT 'mysql', "host" text, "port" integer, "database" text, "username" text, "password" text, "ssh_config_json" text, "permissions_json" text, "templateId" text, "domain_mapping_json" text, "product_settings_json" text, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')));

    -- Seed Preferences
    REPLACE INTO gui_preferences (key, value) VALUES ('andb-ui-settings', '${uiSettingsJson}');
    REPLACE INTO gui_preferences (key, value) VALUES ('environments', '${envsJson}');
    REPLACE INTO gui_preferences (key, value) VALUES ('connectionPairs', '${pairsJson}');
    REPLACE INTO projects (id, name, description) VALUES ('e2e-test-project', 'E2E Test Project', 'Initialized by Playwright Fixture');

    -- Seed Global Templates
    REPLACE INTO global_connections (id, name, host, port, username, type) VALUES ('template-mysql', 'Standard MySQL', '127.0.0.1', 3306, 'root', 'mysql');
    REPLACE INTO global_connections (id, name, host, port, username, type) VALUES ('template-dump', 'Standard Dump', 'localhost', 0, 'dump_user', 'dump');

    -- Seed Project Connections (Mapped to Project One defaults)
    REPLACE INTO project_connections (id, name, environment, host, port, database, username, type) VALUES ('conn-dev', 'SRC', 'DEV', '127.0.0.1', 3306, 'dev_database', 'root', 'mysql');
    REPLACE INTO project_connections (id, name, environment, host, port, database, username, type) VALUES ('conn-stage', 'TGT', 'STAGE', '127.0.0.1', 3306, 'stage_database', 'root', 'mysql');
  `;

  const scriptPath = path.join(userDataPath, 'seed.sql');
  fs.writeFileSync(scriptPath, sqlScript);
  try {
    execSync(`sqlite3 "${dbPath}" < "${scriptPath}"`);
  } catch (err) {
    console.error('[E2E] Failed to seed SQLite:', err);
  } finally {
    if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath);
  }
}

// Higher-order test with integrated bug reporting and pre-seeding
export const test = base.extend<{ appFixture: AppFixture }>({
  appFixture: async ({ }, use, testInfo) => {
    // Generate a unique ID for this test run:
    // We use a shorter version of the test ID or the title to avoid path length limits
    const uniqueId = testInfo.testId.replace(/[^a-zA-Z0-9]/g, '').slice(-8);
    const userDataPath = getUserDataPath(uniqueId);
    
    await prepareUserData(userDataPath);

    const app = await electron.launch({
      args: ['.'],
      cwd: path.join(__dirname, '../..'),
      env: { 
        ...process.env, 
        NODE_ENV: 'test',
        // We must override the app's userData Path in the electron process too
        // In bootstrap.ts, configureAppPaths() handles this if it sees isTest
      },
    });

    const window = await app.firstWindow();
    
    // Initialize Bug Reporter
    const reporter = new BugReporter(window, testInfo);

    window.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        reporter.captureConsoleError(text);
      }
    });

    await window.waitForLoadState('domcontentloaded');
    await window.setViewportSize({ width: 1400, height: 900 });

    await use({ app, window });

    // After test completion, check for failure and report
    await reporter.reportIfFailed();

    await app.close();

    // Clean up unique user data path
    if (fs.existsSync(userDataPath)) {
      try {
        fs.rmSync(userDataPath, { recursive: true, force: true });
      } catch (err) {
        console.error(`[E2E] Failed to cleanup unique userData at ${userDataPath}:`, err);
      }
    }
  },
});

export { expect } from '@playwright/test';
