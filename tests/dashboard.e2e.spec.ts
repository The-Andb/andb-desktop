import { test, expect } from '../e2e/fixtures/app.fixture';

test.describe('Dashboard View', () => {
  test('should display key specific stats cards', async ({ appFixture }) => {
    const { window } = appFixture;
    // Check for "Connections" card
    await expect(window.locator('text=Connections')).toBeVisible();

    // Check for "Environments" card
    await expect(window.locator('text=Environments')).toBeVisible();
  });

  test('should have quick action buttons', async ({ appFixture }) => {
    const { window } = appFixture;
    const switchBtn = window.locator('button', { hasText: 'Switch' });
    await expect(switchBtn).toBeVisible();

    const settingsBtn = window.locator('button', { hasText: 'Settings' }).first();
    await expect(settingsBtn).toBeVisible();
  });

  test('should show operations feed', async ({ appFixture }) => {
    const { window } = appFixture;
    const feed = window.locator('text=Operational Feed');
    await expect(feed).toBeVisible();
  });
});
