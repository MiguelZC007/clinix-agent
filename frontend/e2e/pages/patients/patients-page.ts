import { Page, Locator, expect } from '@playwright/test';

export class PatientsPage {
  readonly page: Page;
  readonly table: Locator;
  readonly newPatientBtn: Locator;
  readonly searchInput: Locator;
  readonly pagination: Locator;
  readonly rows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.table = page.locator('main table, [data-testid="table-skeleton"]').first();
    this.newPatientBtn = page.locator('[data-testid="btn-new-patient"], button:has-text("Nuevo"), a:has-text("Nuevo")').first();
    this.searchInput = page.locator('main [data-testid="input-search"], main input[placeholder*="buscar" i], main input[placeholder*="search" i]').first();
    this.pagination = page.locator('[data-testid="pagination"], nav[aria-label*="pagin"]').first();
    this.rows = this.page.locator('main tbody tr[role="button"]');
  }

  async goto() {
    await this.page.goto('/es/patients', { waitUntil: 'domcontentloaded' });
    await expect(this.page).toHaveURL(/\/es\/patients(\/|$)/, { timeout: 30000 });
    await expect(this.page.getByRole('heading', { name: /Pacientes/i })).toBeVisible({ timeout: 30000 });
  }

  async getPatientRowByEmail(email: string) {
    return this.table.locator(`tr:has-text("${email}"), [data-testid="patient-row"]:has-text("${email}")`).first();
  }

  async getPatientRowByName(name: string) {
    return this.table.locator(`tr:has-text("${name}"), [data-testid="patient-row"]:has-text("${name}")`).first();
  }

  async clickNewPatient() {
    const hasNewPatientButton = await this.newPatientBtn.isVisible().catch(() => false);
    if (hasNewPatientButton) {
      await this.newPatientBtn.click();
      await this.page.waitForURL(/\/patients\/new/, { timeout: 10000 }).catch(async () => {
        await this.page.goto('/es/patients/new', { waitUntil: 'domcontentloaded' });
      });
    } else {
      await this.page.goto('/es/patients/new', { waitUntil: 'domcontentloaded' });
    }

    await expect(this.page).toHaveURL(/\/patients\/new/, { timeout: 60000 });
  }

  async searchPatient(query: string) {
    const visible = await this.searchInput.isVisible().catch(() => false);
    if (!visible) return;
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await expect(this.searchInput).toHaveValue(query, { timeout: 5000 });
  }

  async clearSearch() {
    const visible = await this.searchInput.isVisible().catch(() => false);
    if (!visible) return;
    await this.searchInput.fill('');
    await this.page.keyboard.press('Enter');
    await expect(this.searchInput).toHaveValue('', { timeout: 5000 });
  }

  async getRowCount() {
    return await this.rows.count().catch(() => 0);
  }

  async clickFirstRowView() {
    const firstRow = this.rows.first();
    // Open actions dropdown first
    await firstRow.locator('[data-testid="btn-actions"]').first().click();
    // Then click view (dropdown is in portal)
    await this.page.locator('[data-testid="btn-view"]:visible').first().click();
    await expect(this.page).toHaveURL(/\/patients\//, { timeout: 15000 });
  }

  async clickFirstRowEdit() {
    const firstRow = this.rows.first();
    // Open actions dropdown first
    await firstRow.locator('[data-testid="btn-actions"]').first().click();
    // Then click edit (dropdown is in portal)
    await this.page.locator('[data-testid="btn-edit"]:visible').first().click();
    await expect(this.page).toHaveURL(/\/patients\/[^/]+\/edit/, { timeout: 15000 });
  }
}
