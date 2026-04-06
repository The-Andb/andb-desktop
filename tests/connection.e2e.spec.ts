import { test, expect } from '../e2e/fixtures/app.fixture';

test.describe('Connection Management', () => {
  test.beforeEach(async ({ appFixture }) => {
    const { window } = appFixture;
    // Base navigation for all tests in this suite
    await window.click('aside nav >> text=Project Settings');
    await expect(window.locator('h1', { hasText: /Project Settings/i }).first()).toBeVisible();
    await window.click('button:has-text("Connections")');
  });

  test('should open add connection form', async ({ appFixture }) => {
    const { window } = appFixture;
    // Click "Add Connection"
    await window.click('button:has-text("Add Connection")');

    // Verify Form Opens
    await expect(window.locator('text=Register Endpoint')).toBeVisible();
  });

  test('should have disabled Save button initially', async ({ appFixture }) => {
    const { window } = appFixture;
    await window.click('button:has-text("Add Connection")');
    
    // Verify Save button is disabled
    const saveBtn = window.locator('button:has-text("Save")');
    await expect(saveBtn).toBeDisabled();

    // Verify required fields show labels
    await expect(window.locator('label:has-text("Connection Name")')).toBeVisible();
    await expect(window.locator('label:has-text("Database")')).toBeVisible();
  });
});
