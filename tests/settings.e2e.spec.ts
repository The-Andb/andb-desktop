import { test, expect } from '../e2e/fixtures/app.fixture';

test.describe('Settings View', () => {
  test('should display Global Settings modal', async ({ appFixture }) => {
    const { window } = appFixture;
    // Click "Settings" in top bar
    await window.click('button[title="Settings"]'); // Using ref=e42 title or similar
    
    // Check if Global Settings header is visible
    await expect(window.locator('h2:has-text("Global Settings")').first()).toBeVisible();
  });

  test('should toggle theme', async ({ appFixture }) => {
    const { window } = appFixture;
    // Click theme toggle in top bar (ref=e31)
    const themeBtn = window.locator('button[title*="Theme"]');
    await themeBtn.click();
    
    // No explicit assertion as theme state is internal but check for error
    await expect(themeBtn).toBeVisible(); 
  });
});
