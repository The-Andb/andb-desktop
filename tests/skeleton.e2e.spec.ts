import { test, expect } from '../e2e/fixtures/app.fixture';

test('verify app skeleton', async ({ appFixture }) => {
  const { window } = appFixture;
  
  // Verify Window Title
  await expect.poll(async () => window.title()).toContain('TheAndb');

  // Verify Main App Container
  const appContainer = window.locator('#app');
  await expect(appContainer).toBeVisible();

  // Verify Sidebar
  const sidebar = window.locator('aside');
  await expect(sidebar).toBeVisible();
});
