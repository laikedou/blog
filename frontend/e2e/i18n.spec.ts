import { test, expect } from '@playwright/test';

test.describe('i18n / Multi-language Support', () => {
  test.describe('Language Provider renders and defaults to browser language', () => {
    test('should show the language switcher in the header', async ({ page }) => {
      await page.goto('/');
      // The globe icon button should be visible
      await expect(page.locator('button[aria-label="Switch language"]')).toBeVisible();
    });
  });

  test.describe('Manual language switching via LanguageSwitcher dropdown', () => {
    test('should switch to Chinese Simplified (zh-CN) and show Chinese nav labels', async ({ page }) => {
      await page.goto('/');
      // Open language switcher
      await page.locator('button[aria-label="Switch language"]').click();
      // Wait for dropdown
      await page.locator('text=简体中文').waitFor({ state: 'visible' });
      await page.locator('text=简体中文').click();

      // Verify language was switched - check for Chinese nav text
      await expect(page.locator('nav[aria-label="管理后台"] >> text=首页')).toBeVisible();
      // Check the accept-language header or verify the cookie was set
      const localeCookie = await page.context().cookies().then(
        cookies => cookies.find(c => c.name === 'i18next')
      );
      expect(localeCookie?.value).toBe('zh-CN');
    });

    test('should switch to English and show English nav labels', async ({ page }) => {
      await page.goto('/');
      await page.locator('button[aria-label="Switch language"]').click();
      await page.locator('text=English').waitFor({ state: 'visible' });
      await page.locator('text=English').click();

      await expect(page.locator('nav:has(a[href="/"]) >> text=Home').first()).toBeVisible();
      const localeCookie = await page.context().cookies().then(
        cookies => cookies.find(c => c.name === 'i18next')
      );
      expect(localeCookie?.value).toBe('en');
    });

    test('should switch to Japanese and show Japanese nav labels', async ({ page }) => {
      await page.goto('/');
      await page.locator('button[aria-label="Switch language"]').click();
      await page.locator('text=日本語').waitFor({ state: 'visible' });
      await page.locator('text=日本語').click();

      await expect(page.locator('nav:has(a[href="/"]) >> text=ホーム').first()).toBeVisible();
    });

    test('should switch to Chinese Traditional and show Traditional Chinese nav', async ({ page }) => {
      await page.goto('/');
      await page.locator('button[aria-label="Switch language"]').click();
      await page.locator('text=繁體中文').waitFor({ state: 'visible' });
      await page.locator('text=繁體中文').click();

      await expect(page.locator('nav:has(a[href="/"]) >> text=首頁').first()).toBeVisible();
    });
  });

  test.describe('Language switching affects footer', () => {
    test('footer quick links header changes with language', async ({ page }) => {
      await page.goto('/');

      // Default should show English or zh-CN quick links
      // Switch to English
      await page.locator('button[aria-label="Switch language"]').click();
      await page.locator('text=English').click();
      await expect(page.locator('h3:has-text("Quick Links")')).toBeVisible();
    });
  });

  test.describe('Language persistence', () => {
    test('should persist language choice across page reloads', async ({ page }) => {
      await page.goto('/');

      // Switch to Chinese
      await page.locator('button[aria-label="Switch language"]').click();
      await page.locator('text=简体中文').click();
      await expect(page.locator('nav[aria-label="管理后台"] >> text=首页').first()).toBeVisible();

      // Reload the page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should still show Chinese
      await expect(page.locator('nav[aria-label="管理后台"] >> text=首页').first()).toBeVisible();
    });
  });

  test.describe('API locale detection endpoint', () => {
    test('should return detected locale from backend', async ({ page }) => {
      const response = await page.request.get('/api/i18n/detect');
      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body).toHaveProperty('locale');
      expect(body).toHaveProperty('supportedLocales');
      expect(body.supportedLocales).toContain('zh-CN');
      expect(body.supportedLocales).toContain('en');
      expect(body.supportedLocales).toContain('zh-TW');
      expect(body.supportedLocales).toContain('ja');
    });
  });

  test.describe('Auth pages have translated content', () => {
    test('login page shows translated text when switching language', async ({ page }) => {
      await page.goto('/login');

      // Switch to Chinese
      await page.locator('button[aria-label="Switch language"]').click();
      await page.locator('text=简体中文').click();
      await page.waitForTimeout(500);

      // Login button should show Chinese text
      await expect(page.locator('button[type="submit"]')).toContainText('登录');
    });
  });
});
