import { Page, Locator, expect } from '@playwright/test';

export class DoctorFormPage {
  readonly page: Page;
  readonly form: Locator;
  readonly nameInput: Locator;
  readonly lastNameInput: Locator;
  readonly licenseNumberInput: Locator;
  readonly specialtySelect: Locator;
  readonly passwordInput: Locator;
  readonly submitBtn: Locator;
  readonly cancelBtn: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.form = page.locator('[data-testid="doctor-form"], form').first();
    this.nameInput = page.locator('[data-testid="input-name"], input[name="name"]').first();
    this.lastNameInput = page.locator('[data-testid="input-lastName"], input[name="lastName"]').first();
    this.licenseNumberInput = page.locator('[data-testid="input-licenseNumber"], input[name="licenseNumber"]').first();
    // Radix Select for specialty - it's a button with role="combobox"
    this.specialtySelect = page.locator('[data-testid="select-specialty"], button[role="combobox"]').first();
    this.passwordInput = page.locator('[data-testid="input-password"], input[type="password"][name="password"]').first();
    this.submitBtn = page.locator('[data-testid="btn-submit"], button[type="submit"]').first();
    this.cancelBtn = page.locator('[data-testid="btn-cancel"], button:has-text("Cancelar")').first();
    this.errorMessage = page.locator('[data-testid="error-message"], .error, [role="alert"]').first();
  }

  async gotoNew() {
    await this.page.goto('/es/admin/doctors/new');
    await this.page.waitForLoadState('networkidle');
    await this.form.waitFor({ state: 'visible', timeout: 10000 });
    await this.nameInput.waitFor({ state: 'visible', timeout: 5000 });
  }

  async gotoEdit(doctorId: string) {
    await this.page.goto(`/es/admin/doctors/${doctorId}/edit`);
    await this.page.waitForLoadState('networkidle');
    await this.form.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Select an option from a Radix Select component
   */
  private async selectRadixOption(triggerLocator: Locator, optionText: string) {
    await triggerLocator.click();
    const option = this.page.locator('[role="option"], [data-radix-select-viewport] > div, [cmdk-item]').filter({ hasText: optionText }).first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
    await this.page.waitForLoadState('networkidle');
  }

  async fillForm(data: {
    name: string;
    lastName?: string;
    licenseNumber?: string;
    specialty?: string;
    password?: string;
  }) {
    await this.nameInput.fill(data.name);
    
    if (data.lastName) {
      await this.lastNameInput.fill(data.lastName);
    }
    
    if (data.licenseNumber) {
      await this.licenseNumberInput.fill(data.licenseNumber);
    }
    
    if (data.specialty) {
      await this.selectRadixOption(this.specialtySelect, data.specialty);
    }
    
    if (data.password) {
      await this.passwordInput.fill(data.password);
    }
  }

  async submit() {
    await this.submitBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async cancel() {
    await this.cancelBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async expectValidationError(field: string) {
    const error = this.page.locator(`[data-testid="error-${field}"], .error:has-text("${field}"), [role="alert"]`).first();
    await expect(error).toBeVisible();
  }

  async expectErrorMessage(message: string) {
    await this.errorMessage.waitFor({ state: 'visible' });
    const text = await this.errorMessage.textContent();
    expect(text?.toLowerCase()).toContain(message.toLowerCase());
  }
}