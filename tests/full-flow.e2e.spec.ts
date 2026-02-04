import { _electron as electron, test, expect } from '@playwright/test';
import path from 'path';

test.describe('Full E2E Flow', () => {
  let app: any;
  let window: any;

  test.beforeAll(async () => {
    app = await electron.launch({
      args: ['.'], // Headed for debugging visually if needed, but playwright config usually handles override
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, NODE_ENV: 'test' } // Use test env to potentially hit mockable paths
    });
    window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Ensure window is large enough
    await window.setViewportSize({ width: 1400, height: 900 });
  });

  test.afterAll(async () => {
    if (app) await app.close();
  });

  // 1. Onboarding / Initial Load
  test('1. Initial Load & Dashboard Verification', async () => {
    // Wait for Loading to finish
    // Often there's a splash or loader
    await window.waitForSelector('text=Loading', { state: 'detached', timeout: 15000 });

    // Verify Dashboard Header
    await expect(window.locator('div', { hasText: 'Dashboard' }).first()).toBeVisible();

    // Verify Sidebar presence
    await expect(window.locator('aside')).toBeVisible();
  });

  // 2. Create connections (Source & Target)
  // We will use local SQL Dump mocks for stability if possible, or fallback to localhost configs if dumps aren't ready.
  // Given previous interactions, user has "Static Dump" feature. Let's try to add a Static Dump connection.
  test('2. Create Source Connection (Static Dump)', async () => {
    // Navigate to Settings -> Connections
    const settingsNav = window.locator('aside nav').locator('a[href="#/project-settings"]');
    if (await settingsNav.isVisible()) {
      await settingsNav.click();
    } else {
      await window.click('aside >> a[title="Project Settings"]');
    }

    // Wait for Settings
    await expect(window.locator('h1:has-text("Project Settings")')).toBeVisible();

    // Go to Connections Tab (if not already active)
    const connectionsTab = window.locator('button:has-text("Access Control & Credentials")'); // Actual label in UI
    if (await connectionsTab.isVisible()) {
      await connectionsTab.click();
    } else {
      // Fallback to "Connections" if using shorthand or different view
      await window.click('button:has-text("Connections")');
    }

    // Click Add
    await window.click('button:has-text("Add Connection")');

    // Fill Source Form
    await window.fill('input[placeholder="Enter connection name"]', 'E2E Source Dump');

    // Choose Type: Dump
    await window.locator('div.space-y-2', { hasText: 'Database Type' }).locator('select').selectOption('dump');

    // Fill path
    const dumpPathInput = window.locator('input[placeholder="Select or enter path to .sql file"]');
    const absPath = path.resolve(__dirname, '../e2e/fixtures/source.sql');
    await dumpPathInput.fill(absPath);

    // Select Environment: DEV
    // Uses native select
    await window.locator('div.space-y-2', { hasText: 'Environment' }).locator('select').selectOption('DEV');

    // Save
    await window.click('button:has-text("Save")');

    // Verify it appears in list
    await expect(window.locator('text=E2E Source Dump')).toBeVisible();
  });

  test('3. Create Target Connection (Static Dump)', async () => {
    // Add another
    await window.click('button:has-text("Add Connection")');

    await window.fill('input[placeholder="Enter connection name"]', 'E2E Target Dump');

    // Change Type to Dump
    await window.locator('div.space-y-2', { hasText: 'Database Type' }).locator('select').selectOption('dump');

    const dumpPathInput = window.locator('input[placeholder="Select or enter path to .sql file"]');
    const absPath = path.resolve(__dirname, '../e2e/fixtures/target.sql');
    await dumpPathInput.fill(absPath);

    // Environment: PROD
    await window.locator('div.space-y-2', { hasText: 'Environment' }).locator('select').selectOption('PROD');

    await window.click('button:has-text("Save")');

    await expect(window.locator('text=E2E Target Dump')).toBeVisible();
  });

  // 4. Create Pair
  test('4. Create Connection Pair', async () => {
    // Go to "Sync Pairs" Tab
    await window.click('button:has-text("Sync Pairs")');

    // Add Pair
    await window.click('button:has-text("Add Pair")');

    // Fill Name
    await window.fill('input[placeholder*="Pair name"]', 'E2E Sync Flow');

    // Select Source
    // "Select Source" dropdown
    await window.click('button:has-text("Select Connection")'); // Opens source dropdown
    await window.click('li:has-text("E2E Source Dump")');

    // Select Target
    await window.click('button:has-text("Select Target")'); // Opens target dropdown
    await window.click('li:has-text("E2E Target Dump")');

    // Save
    await window.click('button:has-text("Save")'); // Using generic text

    // Ensure it's active/verified
    await expect(window.locator('text=E2E Sync Flow')).toBeVisible();
  });

  // 5. Compare Flow
  test('5. Execute Comparison', async () => {
    // Click "Compare" icon/button for the new pair row
    // Assuming there's a distinct action button. 
    // Or navigate to Compare view via Sidebar
    await window.click('aside a[href="#/compare"]');

    // Select the pair if not auto-selected
    // If "No Pair Selected", we must select.
    if (await window.locator('text=No Pair Selected').isVisible()) {
      // Open Pair Selector (header)
      await window.click('button:has-text("Select Pair")');
      await window.click('li:has-text("E2E Sync Flow")');
    }

    // Click "Fetch" or "Compare"
    // Button text is "Fetch" or "Fetch from DB"
    const fetchBtn = window.locator('button[title*="Fetch"]');
    await fetchBtn.click();

    // Wait for results
    // "Analyzing schema..." -> Results
    await window.waitForSelector('text=tables', { timeout: 30000 });
  });

  // 6. Verification
  test('6. Verify Comparison Results (Including Identical Items)', async () => {
    // Check "Identical" filter
    const identicalFilter = window.locator('button:has-text("Identical")');
    await expect(identicalFilter).toBeVisible();

    // Click it to view identical items
    await identicalFilter.click();

    // Expect at least one item if dumps have overlaps
    // Wait for list to update
    await window.waitForTimeout(500);

    // Verify items appear in list
    const items = window.locator('.cursor-pointer'); // Generic list items class
    const count = await items.count();
    expect(count).toBeGreaterThan(0);

    // Check status icon is "Equal/Identical" (Teal color usually)
    // Hard to check color, but check text "Identical" in tooltip or status badge if visible
  });
});
