import { test, expect } from '../e2e/fixtures/app.fixture';

test.describe('Dump File Operations', () => {
  test('should add a new Dump connection', async ({ appFixture }) => {
    const { window } = appFixture;

    // Navigate directly to Project Settings
    await window.goto('app://-/index.html#/project-settings');
    
    // Explicitly select Connections Tab
    await window.click('button:has-text("Connections")');

    // Click "Add Connection"
    await window.click('button:has-text("Add Connection")');

    // Verify Form Opens
    await expect(window.locator('text=Register Endpoint')).toBeVisible({ timeout: 10000 });
    
    await window.waitForTimeout(500); // Wait for hydration

    // Select Template: Standard Dump
    // Using main select to avoid banner project switcher
    await window.locator('main select').selectOption({ label: 'Standard Dump (localhost)' });

    // Fill Display Name
    await window.fill('input[placeholder="Enter connection name"]', 'E2E Dump Conn');

    // Fill Database Name
    await window.fill('input[placeholder="database_name"]', 'e2e_dump_db');

    // Save
    await window.click('button:has-text("Save")');

    // Verify it appears in list (Target the main content specifically to avoid sidebar duplicates)
    await expect(window.locator('main >> text=E2E Dump Conn').first()).toBeVisible();

    // Verify sidebar node for the database
    const sidebarNode = window.locator('aside >> text=dev_database');
    await expect(sidebarNode).toBeVisible();
  });
});
