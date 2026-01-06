import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for Kura OS
 * 
 * Phase 2: Adaptive Immunity - The Immune System QA Architecture
 * 
 * Features:
 * - Global setup for one-time auth (cookie injection)
 * - Hydration marker wait strategy (anti-flake)
 * - Base URL pointing to local dev server
 * 
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use */
  reporter: process.env.CI ? 'github' : 'html',
  
  /* Global setup for auth bypass - runs once before all tests */
  globalSetup: require.resolve('./tests/global-setup'),
  
  /* Shared settings for all projects */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: 'http://localhost:3001',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Use saved authentication state */
    storageState: 'playwright/.auth/user.json',
  },

  /* Configure projects for major browsers */
  projects: [
    // Unauthenticated tests (login flow, public pages)
    {
      name: 'unauthenticated',
      testMatch: /.*\.unauth\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        storageState: undefined, // No auth
      },
    },
    // Authenticated tests (dashboard, patients, etc.)
    {
      name: 'chromium',
      testMatch: /.*\.spec\.ts/,
      testIgnore: /.*\.unauth\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
      },
    },
  ],

  /* Run local dev server before starting tests */
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  
  /* Expect timeout for assertions */
  expect: {
    timeout: 10000,
  },
  
  /* Test timeout */
  timeout: 30000,
});
