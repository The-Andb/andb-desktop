import { test, expect } from '../e2e/fixtures/app.fixture';

test.describe('Project Management', () => {
  test('should create a new project', async ({ appFixture }) => {
    const { window } = appFixture;
    // Navigate to Projects page
    await window.click('button:has-text("Project Manager")');
    await expect(window.locator('text=All Projects')).toBeVisible();

    // Click "New Project"
    await window.click('button >> text=New Project');

    // Fill project name
    const nameInput = window.locator('input[placeholder*="Project Name"]');
    await nameInput.fill('Test Project E2E');

    // Save
    await window.click('button >> text=Create');

    // Verify new project appears in list
    await expect(window.locator('text=Test Project E2E')).toBeVisible();
  });

  test('should switch projects', async ({ appFixture }) => {
    const { window } = appFixture;
    // Click on Project Manager to see list
    await window.click('button:has-text("Project Manager")');
    
    // Click on a different project (The one we seeded: E2E Test Project)
    await window.click('text=E2E Test Project');

    // Verify project switch (The project name appears in a paragraph in the header area)
    await expect(window.locator('header p', { hasText: "E2E Test Project" })).toBeVisible();
  });
});
