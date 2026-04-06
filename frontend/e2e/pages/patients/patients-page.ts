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
    // DataTable renders a standard HTML table without data-testid - use generic table selector
    this.table = page.locator('table').first();
    this.newPatientBtn = page.locator('[data-testid="btn-new-patient"], button:has-text("Nuevo"), a:has-text("Nuevo")').first();
    this.searchInput = page.locator('[data-testid="input-search"], input[placeholder*="buscar"], input[placeholder*="search"], [data-testid="patient-filters"] input').first();
    this.pagination = page.locator('[data-testid="pagination"], nav[aria-label*="pagin"]').first();
    this.rows = this.table.locator('tbody tr, [data-testid="patient-row"]');
  }

  async goto() {
    await this.page.goto('/es/patients');
    await this.page.waitForLoadState('networkidle');
    // Wait for loading to finish (skeleton disappears)
    await this.page.waitForTimeout(3000);
    // Try to find the table, or empty state, or error state
    const hasTable = await this.page.locator('table tbody tr').first().isVisible().catch(() => false);
    const hasEmptyState = await this.page.locator('[data-testid="empty-state"], :text("No hay pacientes")').first().isVisible().catch(() => false);
    const hasError = await this.page.locator('[data-testid="error-state"], [role="alert"]').first().isVisible().catch(() => false);
    
    if (!hasTable && !hasEmptyState && !hasError) {
      console.log('Warning: Patients page may still be loading or in unexpected state');
    }
  }

  async getPatientRowByEmail(email: string) {
    return this.table.locator(`tr:has-text("${email}"), [data-testid="patient-row"]:has-text("${email}")`).first();
  }

  async getPatientRowByName(name: string) {
    return this.table.locator(`tr:has-text("${name}"), [data-testid="patient-row"]:has-text("${name}")`).first();
  }

  async clickNewPatient() {
    await this.newPatientBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async searchPatient(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async clearSearch() {
    await this.searchInput.fill('');
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async getRowCount() {
    return await this.rows.count();
  }

  async clickFirstRowView() {
    const firstRow = this.rows.first();
    // Open actions dropdown first
    await firstRow.locator('[data-testid="btn-actions"]').first().click();
    // Then click view (dropdown is in portal)
    await this.page.locator('[data-testid="btn-view"]').first().click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickFirstRowEdit() {
    const firstRow = this.rows.first();
    // Open actions dropdown first
    await firstRow.locator('[data-testid="btn-actions"]').first().click();
    // Then click edit (dropdown is in portal)
    await this.page.locator('[data-testid="btn-edit"]').first().click();
    await this.page.waitForLoadState('networkidle');
  }
}