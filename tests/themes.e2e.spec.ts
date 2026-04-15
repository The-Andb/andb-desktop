import { test, expect } from '../e2e/fixtures/app.fixture';
import * as path from 'path';
import * as fs from 'fs';

const themes = [
  'light',
  'github-light',
  'solarized-light',
  'nord-light',
  'night-owl-light',
  'dark',
  'solarized-dark',
  'night-owl-dark',
  'dracula',
  'one-dark',
  'monokai',
  'nord',
  'github-dark'
];

test.describe('Theme Visual Regression', () => {
  const screenshotsDir = path.join(__dirname, 'screenshots', 'themes');

  test.beforeAll(async () => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  for (const theme of themes) {
    test(`Verify ${theme} theme aesthetics`, async ({ appFixture }) => {
      const { window } = appFixture;

      // 1. Handle Onboarding if present
      const initBtn = window.locator('button:has-text("Initialize Workspace")');
      if (await initBtn.isVisible()) {
        await initBtn.click();
        await window.waitForSelector('h1:has-text("Dashboard")');
      }

      // 2. Navigate to Settings to change theme
      await window.click('button[title="Settings"]');
      await window.waitForSelector('h1:has-text("Settings")');

      // 3. Find and click the theme option using the data attribute
      const themeCard = window.locator(`div[data-theme-id="${theme}"]`);
      await themeCard.click();

      // 4. Verify CSS Class on html element
      const html = window.locator('html');
      
      if (theme === 'light') {
        await expect(html).not.toHaveClass(/dark/);
      } else if (theme === 'github-light' || theme === 'solarized-light' || theme === 'nord-light' || theme === 'night-owl-light') {
        await expect(html).toHaveClass(new RegExp(theme));
        await expect(html).not.toHaveClass(/dark/);
      } else {
        // Dark themes
        await expect(html).toHaveClass(new RegExp(theme));
        await expect(html).toHaveClass(/dark/);
      }

      // 5. Capture Settings Screenshot
      await window.waitForTimeout(1000); // Wait for styles and transitions to settle
      await window.screenshot({ path: path.join(screenshotsDir, `${theme}-settings.png`) });
      
      // Navigate to Dashboard for the second screenshot
      // Standard UI pattern: Use the close button in the header (unintercepted by sidebar overlays)
      const closeBtn = window.getByTestId('close-settings');
      await closeBtn.click();
      
      // Wait for the Dashboard to load using the stable title ID
      await window.waitForSelector('[data-testid="dashboard-title"]', { state: 'visible', timeout: 15000 });
      await window.waitForTimeout(1000); // Wait for animations to settle
      await window.screenshot({ path: path.join(screenshotsDir, `${theme}-dashboard.png`) });
    });
  }
});
