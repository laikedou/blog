import { test, expect } from '@playwright/test';

test.describe('Admin Pages - Refactored UI Components', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', 'admin123');
    await page.click('button[type="submit"]');
    // Wait for redirect to admin dashboard
    await page.waitForURL('/admin');
  });

  test('admin dashboard renders stat cards', async ({ page }) => {
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
    // Stat cards should be rendered as Link > Card elements
    const cards = page.locator('a[href="/admin/posts"]');
    await expect(cards.first()).toBeVisible();
  });

  test('admin posts list page renders Table', async ({ page }) => {
    await page.goto('/admin/posts');
    await expect(page.locator('h2:has-text("Posts")')).toBeVisible();
    // Should render the Table component with header
    const table = page.locator('table');
    await expect(table).toBeVisible();
    // Should have table headers
    await expect(page.locator('th')).toHaveCount(5);
    // Filter buttons should work
    await expect(page.locator('button:has-text("All")')).toBeVisible();
    await expect(page.locator('button:has-text("published")')).toBeVisible();
  });

  test('admin posts new page renders Card and Input components', async ({ page }) => {
    await page.goto('/admin/posts/new');
    await expect(page.locator('h1:has-text("New Post")')).toBeVisible();
    // Sidebar cards should exist
    await expect(page.locator('h3:has-text("Publish")')).toBeVisible();
    await expect(page.locator('h3:has-text("Category")')).toBeVisible();
    await expect(page.locator('h3:has-text("Featured Image")')).toBeVisible();
    // The heading area should have the AI Tools component
    await expect(page.locator('h3:has-text("Tags")')).toBeVisible();
    await expect(page.locator('h3:has-text("SEO")')).toBeVisible();
  });

  test('admin banners page renders Card and Button components', async ({ page }) => {
    await page.goto('/admin/banners');
    await expect(page.locator('h1:has-text("Banners")')).toBeVisible();
    // Should have Add Banner button
    const addButton = page.locator('button:has-text("New Banner")');
    await expect(addButton).toBeVisible();
    // Click to open form
    await addButton.click();
    // Form fields should appear
    await expect(page.locator('label:has-text("Title *")')).toBeVisible();
    await expect(page.locator('label:has-text("Subtitle")')).toBeVisible();
    await expect(page.locator('label:has-text("Image URL")')).toBeVisible();
  });

  test('admin categories page renders Card and Input', async ({ page }) => {
    await page.goto('/admin/categories');
    await expect(page.locator('h1:has-text("Categories")')).toBeVisible();
    // Should have the form card with an input
    const nameInput = page.locator('input');
    await expect(nameInput.first()).toBeVisible();
    // Submit button should exist
    await expect(page.locator('button:has-text("Create")')).toBeVisible();
  });

  test('admin tags page renders Card components', async ({ page }) => {
    await page.goto('/admin/tags');
    await expect(page.locator('h1:has-text("Tags")')).toBeVisible();
    // Tag name input should be in a Card
    const tagInput = page.locator('input[placeholder*="Tag name"]');
    await expect(tagInput).toBeVisible();
    // Action buttons
    await expect(page.locator('button:has-text("Add")').first()).toBeVisible();
  });

  test('admin comments page renders Card components', async ({ page }) => {
    await page.goto('/admin/comments');
    await expect(page.locator('h1:has-text("Comments")')).toBeVisible();
    // Filter badges should be visible
    const allBadge = page.locator('text=All').first();
    await expect(allBadge).toBeVisible();
  });

  test('admin media page renders all core UI elements', async ({ page }) => {
    // First navigation can be slow (Next.js compilation); increase timeout
    await page.goto('/admin/media', { timeout: 60000 });
    // Page heading
    await expect(page.getByRole('heading', { name: 'Media' })).toBeVisible();
    // Upload button (rendered as span via asChild)
    await expect(page.getByText('Upload').first()).toBeVisible();
    // Sidebar: All Files and Uncategorized
    await expect(page.getByText('All Files').first()).toBeVisible();
    await expect(page.getByText('Uncategorized').first()).toBeVisible();
    // View mode toggle icons
    await expect(page.locator('button:has-text("grid_view")')).toBeVisible();
    await expect(page.locator('button:has-text("view_list")')).toBeVisible();
    // Filter button
    await expect(page.locator('button:has-text("Filters")')).toBeVisible();
    // Search input
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    // Create folder (+) button
    await expect(page.locator('button:has-text("add")').first()).toBeVisible();
  });

  test('admin logs page renders Cards and Tabs', async ({ page }) => {
    await page.goto('/admin/logs');
    await expect(page.locator('h1:has-text("Logs")')).toBeVisible();
    // Tabs should be rendered
    const logsTab = page.locator('button[role="tab"]:has-text("Logs")');
    await expect(logsTab).toBeVisible();
    const chartsTab = page.locator('button[role="tab"]:has-text("Charts")');
    await expect(chartsTab).toBeVisible();
  });

  test('admin SEO page renders Cards and Tabs', async ({ page }) => {
    await page.goto('/admin/seo');
    await expect(page.locator('h1:has-text("SEO")')).toBeVisible();
    // Tab navigation
    const dashboardTab = page.locator('button[role="tab"]:has-text("Dashboard")');
    await expect(dashboardTab).toBeVisible();
  });

  test('admin chat analytics page renders Cards', async ({ page }) => {
    await page.goto('/admin/chat-analytics');
    await expect(page.locator('h1:has-text("Chat Analytics")')).toBeVisible();
    // Tabs should exist
    await expect(page.locator('button[role="tab"]:has-text("Statistics")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Feedback")')).toBeVisible();
  });

  test('admin AI usage page renders Table', async ({ page }) => {
    await page.goto('/admin/ai-usage');
    await expect(page.locator('h1:has-text("AI Usage")')).toBeVisible();
    // Table should be present
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('admin crawl page renders Cards and Tabs', async ({ page }) => {
    await page.goto('/admin/crawl');
    await expect(page.locator('h1:has-text("Crawl")')).toBeVisible();
    // Sources tab should be active by default
    await expect(page.locator('button[role="tab"]:has-text("Sources")')).toBeVisible();
  });

  test('admin settings page renders Card components', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
    // Tabs should be rendered
    await expect(page.locator('button[role="tab"]:has-text("General")').first()).toBeVisible();
  });

  test('login page uses Card component', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1:has-text("Login")')).toBeVisible();
    // Input fields should exist
    await expect(page.locator('input[id="username"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    // Submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('register page uses Card component', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('h1:has-text("Register")')).toBeVisible();
    // Input fields should exist
    await expect(page.locator('input[id="displayName"]')).toBeVisible();
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="username"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    // Submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
