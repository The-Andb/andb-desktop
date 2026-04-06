import { test, expect } from '../e2e/fixtures/app.fixture';

test.describe('Full E2E Flow', () => {
  test('Full Application Lifecycle: Setup -> Connect -> Pair -> Compare', async ({ appFixture }) => {
    const { window } = appFixture;

    // 1. Initial Load & Dashboard Verification
    await window.waitForSelector('text=Loading', { state: 'detached', timeout: 15000 });
    await expect(window.locator('aside')).toBeVisible();
    await expect(window.locator('nav >> text=Dashboard')).toBeVisible();

    // 2. Add New Connection from Dashboard Quick Action
    await window.click('button:has-text("Settings")'); // Top bar settings or dashboard settings
    await expect(window.locator('h1:has-text("Project Settings")')).toBeVisible();
    await window.click('button:has-text("Connections")');
    await window.click('button:has-text("Add Connection")');

    // Select Template: Standard MySQL
    await window.locator('main select').selectOption({ label: 'Standard MySQL (127.0.0.1)' });

    await window.fill('input[placeholder="Enter connection name"]', 'E2E Source DB');
    await window.fill('input[placeholder="database_name"]', 'e2e_db');

    await window.click('button:has-text("Save")');
    await expect(window.locator('text=E2E Source DB')).toBeVisible();

    // 3. Create Connection Pair
    await window.click('button:has-text("Env & Sync Pairs")');
    await window.click('button:has-text("Add Pair")');
    await window.fill('input[placeholder*="Pair name"]', 'E2E Sync Flow');

    // Select Source (E2E Source DB)
    const sourceSelect = window.locator('main select').first();
    await sourceSelect.selectOption({ label: 'E2E Source DB' });

    // Select Target (TGT - pre-seeded)
    const targetSelect = window.locator('main select').last();
    await targetSelect.selectOption({ label: 'TGT' });

    await window.click('button:has-text("Save")'); 
    await expect(window.locator('main >> text=E2E Sync Flow')).toBeVisible();

    // 4. Compare Flow
    await window.click('aside nav >> text=Diff & Sync');
    await expect(window.locator('h1:has-text("Diff & Sync")')).toBeVisible();

    // Select the new pair if needed
    // In v3.3.5, clicking the pair in sidebar navigates there
    await window.click('aside >> text=E2E Sync Flow');

    // Click "Compare"
    const compareBtn = window.locator('button:has-text("Compare")');
    await expect(compareBtn).toBeVisible();
    await compareBtn.click();

    // Wait for comparison results (since these are live MySQL, we expect them to be identical if we use the same server)
    // Verify it appears in list (Target the main list, not sidebar)
    await expect(window.locator('main >> text=E2E Dump Conn')).toBeVisible({ timeout: 30000 });
  });
});
