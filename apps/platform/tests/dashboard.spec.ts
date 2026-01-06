import { test, expect } from '@playwright/test';

/**
 * Dashboard Smoke Tests
 * 
 * Verifies the dashboard loads and hydration completes successfully.
 * Uses authenticated session from global-setup.ts.
 */
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/es/dashboard');
    
    // Wait for hydration (anti-flake strategy)
    await page.waitForSelector('body[data-hydrated="true"]', { 
      timeout: 15000 
    });
  });

  test('should load dashboard with hydration complete', async ({ page }) => {
    // Verify hydration marker exists
    const body = page.locator('body');
    await expect(body).toHaveAttribute('data-hydrated', 'true');
    
    // Verify we're on the dashboard (not redirected to login)
    await expect(page).toHaveURL(/.*dashboard.*/);
  });

  test('should display main dashboard sections', async ({ page }) => {
    // Verify key dashboard elements are visible
    // Adjust selectors based on actual dashboard structure
    
    // Wait for main content to be visible
    const main = page.locator('main');
    await expect(main).toBeVisible();
    
    // Check for dashboard title or key indicator
    const title = page.locator('h1, [data-testid="dashboard-title"]');
    await expect(title.first()).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    // Verify sidebar/nav is present
    const nav = page.locator('nav, aside, [data-testid="sidebar"]');
    await expect(nav.first()).toBeVisible();
    
    // Test navigation to patients page
    const patientsLink = page.locator('a[href*="patients"], a[href*="soul-record"]');
    if (await patientsLink.first().isVisible()) {
      await patientsLink.first().click();
      await page.waitForURL(/.*patients.*|.*soul-record.*/);
    }
  });
});
