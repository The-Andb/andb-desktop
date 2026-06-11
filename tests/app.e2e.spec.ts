import { test, expect } from '../e2e/fixtures/app.fixture';

test('launch app', async ({ appFixture }) => {
  const { window } = appFixture;

  // Verify Dashboard content present (sidebar navigation)
  await expect(window.locator('a[title="Dashboard"]')).toBeVisible({ timeout: 15000 });
  await expect(window.locator('a[title="Schema"]')).toBeVisible({ timeout: 15000 });

  const title = await window.title();
  console.log(`App title: ${title}`);
  expect(title).toBeDefined();
});
