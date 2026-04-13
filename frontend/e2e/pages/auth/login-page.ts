import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly phoneInput: Locator;
  readonly passwordInput: Locator;
  readonly submitBtn: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.phoneInput = page.getByTestId('input-phone');
    this.passwordInput = page.getByTestId('input-password');
    this.submitBtn = page.getByTestId('btn-login');
    this.forgotPasswordLink = page.getByTestId('link-forgot-password');
    this.errorMessage = page.locator('[data-testid="error-message"], .error, [role="alert"]').first();
  }

  async goto() {
    await this.page.goto('/es/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(this.phoneInput).toBeVisible({ timeout: 15000 });
    await expect(this.passwordInput).toBeVisible({ timeout: 15000 });
  }

  async login(phone: string, password: string) {
    await this.phoneInput.fill(phone);
    await this.passwordInput.fill(password);
    await expect(this.submitBtn).toBeEnabled({ timeout: 10000 });
    await this.submitBtn.click();
  }

  async clickForgotPassword() {
    await expect(this.forgotPasswordLink).toBeVisible({ timeout: 10000 });
    await this.forgotPasswordLink.click();
  }

  async expectErrorMessage(message: string) {
    await this.errorMessage.waitFor({ state: 'visible' });
    await this.errorMessage.textContent().then(text => {
      expect(text?.toLowerCase()).toContain(message.toLowerCase());
    });
  }
}
