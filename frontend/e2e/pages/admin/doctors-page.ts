import { Page, Locator, expect } from '@playwright/test';

export class DoctorsPage {
  readonly page: Page;
  readonly table: Locator;
  readonly newDoctorBtn: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly specialtyFilter: Locator;
  readonly clearFiltersBtn: Locator;
  readonly pagination: Locator;
  readonly rows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.table = page.locator('[data-testid="doctors-table"], table, [data-testid="doctors-list"]').first();
    this.newDoctorBtn = page.locator('[data-testid="btn-new-doctor"], button:has-text("Nuevo"), a:has-text("Nuevo")').first();
    this.searchInput = page.locator('[data-testid="input-search"], input[placeholder*="buscar"], input[placeholder*="search"]').first();
    // Radix Select is a button with role="combobox", not a <select> element
    this.statusFilter = page.locator('[data-testid="select-status"], button[role="combobox"]').first();
    this.specialtyFilter = page.locator('[data-testid="select-specialty"], button[role="combobox"]').nth(1);
    // Note: There's no clear filters button in DoctorFilters component
    // Filters are cleared by selecting "all" option
    this.pagination = page.locator('[data-testid="pagination"], nav[aria-label*="pagin"]').first();
    this.rows = this.table.locator('tbody tr, [data-testid="doctor-row"]');
  }

  async goto() {
    await this.page.goto('/es/admin/doctors');
    await this.page.waitForLoadState('networkidle');
    await this.table.waitFor({ state: 'visible', timeout: 10000 });
  }

  async getDoctorRowByEmail(email: string) {
    return this.table.locator(`tr:has-text("${email}"), [data-testid="doctor-row"]:has-text("${email}")`).first();
  }

  async getDoctorRowByName(name: string) {
    return this.table.locator(`tr:has-text("${name}"), [data-testid="doctor-row"]:has-text("${name}")`).first();
  }

  async clickNewDoctor() {
    await this.newDoctorBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async searchDoctor(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Select an option from a Radix Select component
   * Radix Select uses a button trigger + dropdown menu, not a native <select>
   */
  private async selectRadixOption(triggerLocator: Locator, optionText: string) {
    // Click the trigger to open the dropdown
    await triggerLocator.click();
    
    // Wait for the dropdown to appear and select the option
    const option = this.page.locator('[role="option"], [data-radix-select-viewport] > div, [cmdk-item]').filter({ hasText: optionText }).first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
    
    // Wait for the dropdown to close and any network requests to complete
    await this.page.waitForLoadState('networkidle');
  }

  async filterByStatus(status: string) {
    await this.selectRadixOption(this.statusFilter, status);
  }

  async filterBySpecialty(specialty: string) {
    await this.selectRadixOption(this.specialtyFilter, specialty);
  }

  async clearFilters() {
    // Select "all" option to clear status filter
    await this.selectRadixOption(this.statusFilter, 'Todos');
    // Clear search input
    await this.searchInput.fill('');
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async getRowCount() {
    return await this.rows.count();
  }

  async clickEditDoctor(email: string) {
    const row = await this.getDoctorRowByEmail(email);
    // Open actions dropdown first
    await row.locator('[data-testid="btn-actions"]').first().click();
    // Then click edit
    await row.locator('[data-testid="btn-edit"]').first().click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickViewDoctor(email: string) {
    const row = await this.getDoctorRowByEmail(email);
    // Open actions dropdown first
    await row.locator('[data-testid="btn-actions"]').first().click();
    // Then click view
    await row.locator('[data-testid="btn-view"]').first().click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickDeactivateDoctor(email: string) {
    const row = await this.getDoctorRowByEmail(email);
    // Open actions dropdown first
    await row.locator('[data-testid="btn-actions"]').first().click();
    // Then click deactivate
    await row.locator('[data-testid="btn-deactivate"]').first().click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickFirstRowView() {
    const firstRow = this.rows.first();
    // Open actions dropdown first
    await firstRow.locator('[data-testid="btn-actions"]').first().click();
    // Wait for dropdown to open and click view (dropdown is in a portal, not inside row)
    await this.page.locator('[data-testid="btn-view"]').first().click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickFirstRowEdit() {
    const firstRow = this.rows.first();
    // Open actions dropdown first
    await firstRow.locator('[data-testid="btn-actions"]').first().click();
    // Wait for dropdown to open and click edit (dropdown is in a portal, not inside row)
    await this.page.locator('[data-testid="btn-edit"]').first().click();
    await this.page.waitForLoadState('networkidle');
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