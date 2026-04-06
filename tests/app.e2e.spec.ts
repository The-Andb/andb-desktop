import { test, expect } from '../e2e/fixtures/app.fixture';

test('launch app', async ({ appFixture }) => {
  const { window } = appFixture;

  // Verify Dashboard content present (sidebar navigation)
  await expect(window.locator('nav >> text=Dashboard')).toBeVisible();
  await expect(window.locator('nav >> text=Schema')).toBeVisible();

  const title = await window.title();
  console.log(`App title: ${title}`);
  expect(title).toBeDefined();
});
