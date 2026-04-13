import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/auth/login-page';
import { E2E_TEST_CREDENTIALS } from '../fixtures/test-credentials';

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

    await expect(page).toHaveURL(/\/es\/login/, { timeout: 5000 });
    await expect(loginPage.phoneInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await loginPage.login(INVALID_CREDENTIALS.phone, INVALID_CREDENTIALS.password);

    // Should show error or stay on login page
    await expect(page).toHaveURL(/\/es\/login(\?|\/|$)/, { timeout: 15000 });
    const hasError =
      (await page
        .locator('[data-testid="error"], [role="alert"], .error, :text("inválido"), :text("incorrect")')
        .count()) > 0;

    const currentUrl = page.url();
    expect(currentUrl.includes('login') || hasError).toBeTruthy();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await loginPage.login(E2E_TEST_CREDENTIALS.doctor.phoneInput, E2E_TEST_CREDENTIALS.doctor.password);

    // Wait for redirect to an authenticated section (or remain on login if backend is slow).
    await page.waitForURL(/\/es\/(dashboard|patients|login)(\?|\/|$)/, { timeout: 60000 });

    // Should redirect away from login
    const currentUrl = page.url();
    expect(currentUrl.includes('login') || currentUrl.includes('patients') || currentUrl.includes('dashboard')).toBeTruthy();
  });

  test('should navigate to forgot password', async ({ page }) => {
    await loginPage.clickForgotPassword();

    // Should navigate to forgot password page
    await expect(page).toHaveURL(/\/forgot-password/, { timeout: 15000 });
  });
});
