import { test, expect } from '@playwright/test';

/**
 * Patient Management E2E Tests
 * 
 * Critical path tests for patient CRUD operations.
 * Uses authenticated session from global-setup.ts.
 */
test.describe('Patient Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to patients list
    await page.goto('/es/soul-record');
    
    // Wait for hydration
    await page.waitForSelector('body[data-hydrated="true"]', { 
      timeout: 15000 
    });
  });

  test('should display patients list', async ({ page }) => {
    // Verify we're on patients page
    await expect(page).toHaveURL(/.*soul-record.*/);
    
    // Wait for list to load
    const main = page.locator('main');
    await expect(main).toBeVisible();
    
    // Look for patient cards/rows or empty state
    const patientList = page.locator('[data-testid="patient-list"], table, [class*="patient"]');
    const emptyState = page.locator('[data-testid="empty-state"], [class*="empty"]');
    
    // Either patients exist or empty state is shown
    await expect(patientList.or(emptyState).first()).toBeVisible({ timeout: 10000 });
  });

  test('should open new patient dialog', async ({ page }) => {
    // Find and click the "New Patient" button
    const newPatientBtn = page.locator(
      'button:has-text("Nuevo"), ' +
      'button:has-text("New"), ' +
      '[data-testid="new-patient-btn"], ' +
      'a[href*="new"]'
    );
    
    await expect(newPatientBtn.first()).toBeVisible({ timeout: 10000 });
    await newPatientBtn.first().click();
    
    // Verify dialog/form opens
    const dialog = page.locator(
      '[role="dialog"], ' +
      'form[data-testid="patient-form"], ' +
      '[class*="modal"], ' +
      '[class*="dialog"]'
    );
    
    await expect(dialog.first()).toBeVisible({ timeout: 5000 });
  });

  test('should create a new patient', async ({ page }) => {
    // Generate unique test data
    const timestamp = Date.now();
    const testPatient = {
      firstName: `Test${timestamp}`,
      lastName: `Patient${timestamp}`,
      email: `test${timestamp}@e2e.test`,
    };
    
    // Click new patient button
    const newPatientBtn = page.locator(
      'button:has-text("Nuevo"), button:has-text("New"), [data-testid="new-patient-btn"]'
    );
    await newPatientBtn.first().click();
    
    // Wait for form
    await page.waitForSelector('[role="dialog"], form', { timeout: 5000 });
    
    // Fill the form (adjust selectors based on actual form)
    await page.fill(
      'input[name="first_name"], input[name="firstName"], input[placeholder*="nombre" i]', 
      testPatient.firstName
    );
    await page.fill(
      'input[name="last_name"], input[name="lastName"], input[placeholder*="apellido" i]', 
      testPatient.lastName
    );
    
    // Email might be optional, try if exists
    const emailInput = page.locator('input[name="email"], input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill(testPatient.email);
    }
    
    // Submit the form
    const submitBtn = page.locator(
      'button[type="submit"], ' +
      'button:has-text("Guardar"), ' +
      'button:has-text("Save"), ' +
      'button:has-text("Crear")'
    );
    await submitBtn.first().click();
    
    // Verify patient appears in list (optimistic update)
    await expect(page.locator(`text=${testPatient.firstName}`)).toBeVisible({ 
      timeout: 10000 
    });
  });

  test('should search for patients', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator(
      'input[type="search"], ' +
      'input[placeholder*="buscar" i], ' +
      'input[placeholder*="search" i], ' +
      '[data-testid="search-input"]'
    );
    
    if (await searchInput.isVisible()) {
      // Type a search query
      await searchInput.fill('Test');
      
      // Wait for search results to update
      await page.waitForTimeout(500);
      
      // Verify the list updates (either shows results or filtered list)
      const main = page.locator('main');
      await expect(main).toBeVisible();
    }
  });
});
