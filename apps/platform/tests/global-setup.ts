import { chromium, FullConfig } from '@playwright/test';

/**
 * Global Setup - Auth Bypass Strategy
 * 
 * Performs login ONCE per test run and saves cookies to playwright/.auth/user.json.
 * All tests can then reuse this authenticated state.
 */
async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to login
    await page.goto(`${baseURL}/es/login`);
    
    // Wait for page to be ready
    await page.waitForSelector('body[data-hydrated="true"]', { timeout: 30000 });
    
    // Fill login form
    // Use test credentials (these should match a seeded test user)
    await page.fill('input[name="email"], input[type="email"]', 'admin@kuraos.test');
    await page.fill('input[name="password"], input[type="password"]', 'TestPassword123!');
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard (indicates successful login)
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
    
    // Save authentication state
    await context.storageState({ path: 'playwright/.auth/user.json' });
    
    console.log('✅ Global setup: Authentication state saved');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    // Don't throw - allow tests to run without auth for debugging
  } finally {
    await browser.close();
  }
}

export default globalSetup;
