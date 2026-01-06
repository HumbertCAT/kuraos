import { test, expect } from '@playwright/test';

/**
 * Auth Flow E2E Tests with Email Testing
 * 
 * Phase 5: Communication Immunity
 * Tests password reset flow using Mailpit to extract magic links.
 */

// Mailpit API configuration
const MAILPIT_API = 'http://localhost:8025';

/**
 * Helper to poll Mailpit API for emails.
 * 
 * CRITICAL: Emails take time to arrive. Don't fetch immediately!
 * Uses expect.poll() for retry logic.
 */
async function waitForEmail(expectedRecipient: string, maxWaitMs = 10000): Promise<any> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(`${MAILPIT_API}/api/v1/messages`);
    const data = await response.json();
    const messages = data.messages || [];
    
    // Find email to our recipient
    const email = messages.find((msg: any) => 
      msg.To?.some((to: any) => to.Address === expectedRecipient)
    );
    
    if (email) {
      // Get full message with body
      const fullResponse = await fetch(`${MAILPIT_API}/api/v1/message/${email.ID}`);
      return await fullResponse.json();
    }
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  throw new Error(`No email found for ${expectedRecipient} within ${maxWaitMs}ms`);
}

/**
 * Extract reset link from email HTML/Text body.
 */
function extractResetLink(emailBody: string): string {
  const resetLinkPattern = /https?:\/\/[^\s]+\/reset-password\?token=[\w-]+/;
  const match = emailBody.match(resetLinkPattern);
  
  if (!match) {
    throw new Error('No reset link found in email body');
  }
  
  return match[0];
}

test.describe('Password Reset Flow (with Email)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear Mailpit inbox before each test
    await fetch(`${MAILPIT_API}/api/v1/messages`, { method: 'DELETE' });
    
    // Navigate to forgot password page
    await page.goto('/es/forgot-password');
    await page.waitForSelector('body[data-hydrated="true"]', { timeout: 30000 });
  });

  test('should send password reset email and allow reset', async ({ page }) => {
    const testEmail = `test-${Date.now()}@e2e.test`;
    
    // Step 1: Fill email and submit
    await page.fill('input[type="email"], input[name="email"]', testEmail);
    await page.click('button[type="submit"]');
    
    // Step 2: Wait for success message
    await expect(page.locator('text=/check your email|correo/i')).toBeVisible({ timeout: 10000 });
    
    // Step 3: THE MAGIC STEP - Poll Mailpit for email
    const email = await waitForEmail(testEmail, 15000);
    
    // Step 4: Verify email details
    expect(email.Subject).toMatch(/password|reset|contraseña/i);
    expect(email.To[0].Address).toBe(testEmail);
    
    // Step 5: Extract reset link from email
    const emailBody = email.HTML || email.Text;
    const resetLink = extractResetLink(emailBody);
    
    console.log('🔗 Extracted reset link:', resetLink);
    
    // Step 6: Navigate to reset link (the magic!)
    await page.goto(resetLink);
    await page.waitForSelector('body[data-hydrated="true"]');
    
    // Step 7: Verify landed on password reset page
    await expect(page).toHaveURL(/reset-password\?token=/);
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Step 8: Set new password
    const newPassword = 'NewSecurePass123!';
    await page.fill('input[name="password"], input[type="password"]', newPassword);
    await page.fill('input[name="confirmPassword"], input[type="password"]:nth-of-type(2)', newPassword);
    await page.click('button[type="submit"]');
    
    // Step 9: Should redirect to login or dashboard
    await expect(page).toHaveURL(/login|dashboard/);
  });

  test('should display email form correctly', async ({ page }) => {
    // Verify forgot password form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Verify form labels/text
    await expect(page.locator('text=/email|correo/i')).toBeVisible();
  });

  test('should handle invalid email gracefully', async ({ page }) => {
    // Submit with invalid email
    await page.fill('input[type="email"]', 'not-an-email');
    await page.click('button[type="submit"]');
    
    // Should show validation error or handle gracefully
    // (Exact behavior depends on your form validation)
  });
});

test.describe('Mailpit Integration Tests', () => {
  test('should be able to query Mailpit API', async () => {
    // Verify Mailpit is accessible
    const response = await fetch(`${MAILPIT_API}/api/v1/messages`);
    expect(response.ok).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('messages');
  });
});
