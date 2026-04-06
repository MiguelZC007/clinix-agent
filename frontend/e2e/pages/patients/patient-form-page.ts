import { Page, Locator, expect } from '@playwright/test';

export class PatientFormPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly birthDateInput: Locator;
  readonly addressInput: Locator;
  readonly genderSelect: Locator;
  readonly submitBtn: Locator;
  readonly cancelBtn: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.locator('[data-testid="input-name"], input[name="name"]').first();
    this.lastNameInput = page.locator('[data-testid="input-lastName"], input[name="lastName"]').first();
    this.emailInput = page.locator('[data-testid="input-email"], input[type="email"], input[name="email"]').first();
    this.phoneInput = page.locator('[data-testid="input-phone"], input[type="tel"], input[name="phone"]').first();
    this.birthDateInput = page.locator('[data-testid="input-birthDate"], input[type="date"], input[name="birthDate"]').first();
    this.addressInput = page.locator('[data-testid="input-address"], input[name="address"]').first();
    // Radix Select for gender - it's a button with role="combobox"
    this.genderSelect = page.locator('[data-testid="select-gender"], button[role="combobox"]').first();
    this.submitBtn = page.locator('[data-testid="btn-submit"], button[type="submit"]').first();
    this.cancelBtn = page.locator('[data-testid="btn-cancel"], button:has-text("Cancelar")').first();
    this.errorMessage = page.locator('[data-testid="error-message"], .error, [role="alert"]').first();
  }

  async gotoNew() {
    await this.page.goto('/es/patients/new');
    await this.page.waitForLoadState('networkidle');
    await this.nameInput.waitFor({ state: 'visible', timeout: 10000 });
  }

  async gotoEdit(patientId: string) {
    await this.page.goto(`/es/patients/${patientId}/edit`);
    await this.page.waitForLoadState('networkidle');
    await this.nameInput.waitFor({ state: 'visible', timeout: 10000 });
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
    lastName: string;
    email: string;
    phone?: string;
    birthDate?: string;
    gender?: string;
    address?: string;
  }) {
    await this.nameInput.fill(data.name);
    await this.lastNameInput.fill(data.lastName);
    await this.emailInput.fill(data.email);
    
    if (data.phone) {
      await this.phoneInput.fill(data.phone);
    }
    
    if (data.birthDate) {
      await this.birthDateInput.fill(data.birthDate);
    }
    
    if (data.gender) {
      // Map gender values to localized text
      const genderMap: Record<string, string> = {
        'male': 'Masculino',
        'female': 'Femenino',
        'other': 'Otro'
      };
      await this.selectRadixOption(this.genderSelect, genderMap[data.gender] || data.gender);
    }
    
    if (data.address) {
      await this.addressInput.fill(data.address);
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
}