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
    this.phoneInput = page.locator('[data-testid="input-phone"], input[type="tel"], input[name="phone"]').first();
    this.passwordInput = page.locator('[data-testid="input-password"], input[type="password"], input[name="password"]').first();
    this.submitBtn = page.locator('[data-testid="btn-login"], button[type="submit"]').first();
    this.forgotPasswordLink = page.locator('[data-testid="link-forgot-password"], a:has-text("olvid")').first();
    this.errorMessage = page.locator('[data-testid="error-message"], .error, [role="alert"]').first();
  }

  async goto() {
    await this.page.goto('/es/login');
    await this.page.waitForLoadState('networkidle');
  }

  async login(phone: string, password: string) {
    await this.phoneInput.fill(phone);
    await this.passwordInput.fill(password);
    await this.submitBtn.click();
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  async expectErrorMessage(message: string) {
    await this.errorMessage.waitFor({ state: 'visible' });
    await this.errorMessage.textContent().then(text => {
      expect(text?.toLowerCase()).toContain(message.toLowerCase());
    });
  }
}