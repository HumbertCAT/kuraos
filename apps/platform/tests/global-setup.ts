import { chromium, FullConfig } from '@playwright/test';

/**
 * Global Setup - Auth Bypass Strategy
 * 
 * Performs login ONCE per test run and saves cookies to playwright/.auth/user.json.
 * All tests can then reuse this authenticated state.
 * 
 * Required environment variables:
 * - E2E_TEST_EMAIL: Test user email
 * - E2E_TEST_PASSWORD: Test user password
 * 
 * Or set them in .env.local:
 * E2E_TEST_EMAIL=your-test@email.com
 * E2E_TEST_PASSWORD=your-password
 */
async function globalSetup(config: FullConfig) {
  const testEmail = process.env.E2E_TEST_EMAIL;
  const testPassword = process.env.E2E_TEST_PASSWORD;
  
  if (!testEmail || !testPassword) {
    console.log('⚠️ E2E_TEST_EMAIL and E2E_TEST_PASSWORD not set. Skipping auth setup.');
    console.log('   Set these environment variables to enable authenticated tests.');
    // Create empty auth state so tests don't fail on missing file
    const fs = await import('fs');
    const path = await import('path');
    const authDir = path.join(process.cwd(), 'playwright/.auth');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(authDir, 'user.json'),
      JSON.stringify({ cookies: [], origins: [] })
    );
    return;
  }

  const { baseURL } = config.projects[0].use;
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🔐 Global setup: Logging in...');
    
    // Navigate to login
    await page.goto(`${baseURL}/es/login`);
    
    // Wait for page to be ready
    await page.waitForSelector('body[data-hydrated="true"]', { timeout: 30000 });
    
    // Fill login form
    await page.fill('input[type="email"], input[name="email"]', testEmail);
    await page.fill('input[type="password"], input[name="password"]', testPassword);
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard (indicates successful login)
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
    
    // Save authentication state
    await context.storageState({ path: 'playwright/.auth/user.json' });
    
    console.log('✅ Global setup: Authentication state saved');
  } catch (error) {
    console.error('❌ Global setup: Login failed:', error);
    // Create empty auth state so tests can still run (will redirect to login)
    const fs = await import('fs');
    const path = await import('path');
    fs.writeFileSync(
      path.join(process.cwd(), 'playwright/.auth/user.json'),
      JSON.stringify({ cookies: [], origins: [] })
    );
  } finally {
    await browser.close();
  }
}

export default globalSetup;
