import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/auth/login-page';

// Test credentials from seed (see TEST_CREDENTIALS.md)
// Note: PhoneInputWithCountry splits phone into country selector + number input
// Default country is Bolivia (+591), so we just need to type the number part
const DOCTOR_CREDENTIALS = {
  phone: '70000002',  // Doctor user - Without country code - Bolivia (+591) is default
  password: 'Doctor123!',
};

const INVALID_CREDENTIALS = {
  phone: '99999999',  // Invalid number
  password: 'WrongPassword123',
};

test.describe('Authentication', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should display login form', async ({ page }) => {
    await expect(loginPage.phoneInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitBtn).toBeVisible();
  });

  test('should show validation error for empty fields', async ({ page }) => {
    await loginPage.submitBtn.click();
    
    // Wait for validation
    await page.waitForTimeout(1000);
    
    // Check for validation messages or form errors
    const hasError = await page.locator('[data-testid="error"], .error, :text("requerido"), :text("required")').count() > 0;
    expect(hasError).toBeTruthy();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await loginPage.login(INVALID_CREDENTIALS.phone, INVALID_CREDENTIALS.password);
    
    // Wait for response
    await page.waitForTimeout(2000);
    
    // Should show error or stay on login page
    const currentUrl = page.url();
    const hasError = await page.locator('[data-testid="error"], .error, :text("inválido"), :text("incorrect")').count() > 0;
    
    expect(currentUrl.includes('login') || hasError).toBeTruthy();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await loginPage.login(DOCTOR_CREDENTIALS.phone, DOCTOR_CREDENTIALS.password);
    
    // Wait for redirect
    await page.waitForURL(/\/(dashboard|patients|es)/, { timeout: 15000 }).catch(() => {
      // If redirect fails, check for error message
    });
    
    // Should redirect away from login
    const currentUrl = page.url();
    expect(currentUrl.includes('login')).toBeFalsy();
  });

  test('should navigate to forgot password', async ({ page }) => {
    await loginPage.clickForgotPassword();
    
    // Should navigate to forgot password page
    await expect(page).toHaveURL(/forgot-password/);
  });
});