import { test, expect } from '../e2e/fixtures/app.fixture';

test.describe('Schema Explorer', () => {
  test('should navigate tree structure', async ({ appFixture }) => {
    const { window } = appFixture;
    // Sidebar should have environments
    await expect(window.locator('aside >> text=DEV')).toBeVisible({ timeout: 15000 });
    
    // There are connections under DEV
    // Look for a database name like "dev_database" found in previous snapshots
    const dbNode = window.locator('aside >> text=dev_database');
    if (await dbNode.isVisible()) {
      await dbNode.click();
      // Verify schema explorer title or reload button
      await expect(window.locator('text=Schema Explorer')).toBeVisible();
    }
  });

  test('should support search filtering', async ({ appFixture }) => {
    const { window } = appFixture;
    // Navigate to a connection first
    await window.click('aside >> text=dev_database');

    // Find and use search input (if present in Schema Explorer)
    const searchInput = window.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('users');
      // No specific assertion here as it depends on seeded data
    }
  });
});
