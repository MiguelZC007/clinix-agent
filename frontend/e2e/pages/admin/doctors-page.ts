import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

export class DoctorsPage {
  readonly page: Page;
  readonly table: Locator;
  readonly newDoctorBtn: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly specialtyFilter: Locator;
  readonly pagination: Locator;
  readonly rows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.table = page.locator('main table').first();
    this.newDoctorBtn = page.getByTestId('btn-new-doctor');
    this.searchInput = page.locator('[data-testid="input-search"], input[placeholder*="buscar"], input[placeholder*="search"]').first();
    this.statusFilter = page.getByTestId('select-status');
    this.specialtyFilter = page.getByTestId('select-specialty-filter');
    // Note: There's no clear filters button in DoctorFilters component
    // Filters are cleared by selecting "all" option
    this.pagination = page.locator('[data-testid="pagination"], nav[aria-label*="pagin"]').first();
    // Use only interactive doctor rows to avoid clicking loading/skeleton rows.
    this.rows = this.page.locator('main tbody tr[role="button"]');
  }

  async goto() {
    await this.page.goto('/es/admin/doctors');
    await expect(this.page.getByRole('heading', { name: /Doctores/i })).toBeVisible({ timeout: 15000 });
  }

  async getDoctorRowByEmail(email: string) {
    return this.table.locator(`tr:has-text("${email}"), [data-testid="doctor-row"]:has-text("${email}")`).first();
  }

  async getDoctorRowByName(name: string) {
    return this.table.locator(`tr:has-text("${name}"), [data-testid="doctor-row"]:has-text("${name}")`).first();
  }

  async clickNewDoctor() {
    await this.newDoctorBtn.click();
  }

  private async runAndWaitForDoctorsRequest(action: () => Promise<void>) {
    const doctorsResponse = this.page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' &&
        response.url().includes('/v1/admin/doctors'),
      { timeout: 10000 },
    ).catch(() => null);

    await action();
    await doctorsResponse;
    await expect(this.page.getByRole('heading', { name: /Doctores/i })).toBeVisible({ timeout: 15000 });
    await expect(this.page.locator('main')).toBeVisible({ timeout: 15000 });
  }

  async searchDoctor(query: string) {
    await this.runAndWaitForDoctorsRequest(async () => {
      await this.searchInput.fill(query);
      await this.page.keyboard.press('Enter');
    });
  }

  /**
   * Select an option from a Radix Select component
   * Radix Select uses a button trigger + dropdown menu, not a native <select>
   */
  private async selectRadixOption(triggerLocator: Locator, optionText: string) {
    // Click the trigger to open the dropdown
    await triggerLocator.click();
    
    // Wait for the dropdown to appear and select the option
    const option = this.page.locator('[role="option"], [data-radix-select-item], [data-radix-select-viewport] > div, [cmdk-item]').filter({ hasText: optionText }).first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
    
    await expect(option).toBeHidden({ timeout: 5000 });
  }

  async filterByStatus(status: 'active' | 'inactive' | 'all' | string) {
    if (status === 'active') {
      await this.selectRadixOption(this.statusFilter, 'Activo');
      return;
    }

    if (status === 'inactive') {
      await this.selectRadixOption(this.statusFilter, 'Inactivo');
      return;
    }

    if (status === 'all') {
      await this.selectRadixOption(this.statusFilter, 'Todos');
      return;
    }

    await this.selectRadixOption(this.statusFilter, status);
  }

  async filterBySpecialty(specialty: string) {
    await this.selectRadixOption(this.specialtyFilter, specialty);
  }

  async clearFilters() {
    // Select "all" option to clear status filter
    await this.filterByStatus('all');
    // Clear search input
    await this.runAndWaitForDoctorsRequest(async () => {
      await this.searchInput.fill('');
      await this.page.keyboard.press('Enter');
    });
  }

  async getRowCount() {
    return await this.rows.count().catch(() => 0);
  }

  async clickEditDoctor(email: string) {
    const row = await this.getDoctorRowByEmail(email);
    // Open actions dropdown first
    await row.locator('[data-testid="btn-actions"]').first().click();
    // Then click edit
    await row.locator('[data-testid="btn-edit"]').first().click();
    await expect(this.page).toHaveURL(/\/es\/admin\/doctors\/[^/]+\/edit$/, { timeout: 15000 });
  }

  async clickViewDoctor(email: string) {
    const row = await this.getDoctorRowByEmail(email);
    // Open actions dropdown first
    await row.locator('[data-testid="btn-actions"]').first().click();
    // Then click view
    await row.locator('[data-testid="btn-view"]').first().click();
    await expect(this.page).toHaveURL(/\/es\/admin\/doctors\/[^/]+$/, { timeout: 15000 });
  }

  async clickDeactivateDoctor(email: string) {
    const row = await this.getDoctorRowByEmail(email);
    // Open actions dropdown first
    await row.locator('[data-testid="btn-actions"]').first().click();
    await this.runAndWaitForDoctorsRequest(async () => {
      // Then click deactivate
      await row.locator('[data-testid="btn-deactivate"]').first().click();
    });
  }

  async clickFirstRowView() {
    const firstRow = this.rows.first();
    // Open actions dropdown first
    await firstRow.locator('[data-testid="btn-actions"]').first().click();
    // Wait for dropdown to open and click view (dropdown is in a portal, not inside row)
    await this.page.locator('[data-testid="btn-view"]:visible').first().click();
    await expect(this.page).toHaveURL(/\/es\/admin\/doctors\/[^/]+$/, { timeout: 15000 });
  }

  async clickFirstRowEdit() {
    const firstRow = this.rows.first();
    // Open actions dropdown first
    await firstRow.locator('[data-testid="btn-actions"]').first().click();
    // Wait for dropdown to open and click edit (dropdown is in a portal, not inside row)
    await this.page.locator('[data-testid="btn-edit"]:visible').first().click();
    await expect(this.page).toHaveURL(/\/es\/admin\/doctors\/[^/]+\/edit$/, { timeout: 15000 });
  }

  async clickFirstRow() {
    const firstRow = this.rows.first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });
    await firstRow.click();
  }

  async expectDoctorInTable(email: string) {
    const row = await this.getDoctorRowByEmail(email);
    await expect(row).toBeVisible();
  }

  async expectDoctorNotInTable(email: string) {
    const row = await this.getDoctorRowByEmail(email);
    await expect(row).not.toBeVisible();
  }
}
