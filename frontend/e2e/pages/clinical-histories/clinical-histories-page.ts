import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class ClinicalHistoriesPage {
  readonly page: Page;
  readonly table: Locator;
  readonly newHistoryBtn: Locator;
  readonly searchInput: Locator;
  readonly dateFromInput: Locator;
  readonly dateToInput: Locator;
  readonly clearFiltersBtn: Locator;
  readonly pagination: Locator;
  readonly rows: Locator;

  constructor(page: Page) {
    this.page = page;
    // Table container
    this.table = page.locator('main table, main [data-testid="clinical-history-card"]').first();
    // New history button
    this.newHistoryBtn = page.locator('[data-testid="btn-new-history"], button:has-text("Nueva"), button:has-text("New")').first();
    // Search input (SearchInput component with data-testid="input-search")
    this.searchInput = page.locator('main [data-testid="input-search"], main input[placeholder*="buscar" i], main input[placeholder*="search" i]').first();
    // Date range filters
    this.dateFromInput = page.locator('[data-testid="date-from"], input[type="date"], input:has-text("desde")').first();
    this.dateToInput = page.locator('[data-testid="date-to"], input[type="date"], input:has-text("hasta")').first();
    // Clear filters button
    this.clearFiltersBtn = page.locator('[data-testid="clinical-history-filters-clear"], button:has-text("Limpiar"), button:has-text("Clear")').first();
    // Pagination
    this.pagination = page.locator('[data-testid="pagination"], nav[aria-label*="pagin"]').first();
    // Table rows
    this.rows = page.locator('main table tbody tr, main [data-testid="clinical-history-row"]');
  }

  async goto() {
    await this.page.goto('/es/clinical-histories', { waitUntil: 'domcontentloaded' });
    await expect(this.page.locator('[data-testid="clinical-history-filters"]')).toBeVisible({ timeout: 15000 });
  }

  async getHistoryRowById(id: string) {
    return this.table.locator(`tr:has-text("${id}"), [data-testid="clinical-history-card"]:has-text("${id}")`).first();
  }

  async clickNewHistory() {
    await this.newHistoryBtn.click();
    await expect(this.page).toHaveURL(/\/clinical-histories\/new/, { timeout: 15000 });
  }

  async searchHistory(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await expect(this.searchInput).toHaveValue(query, { timeout: 5000 });
  }

  async filterByDateFrom(date: string) {
    // DateRangeFilters uses DatePicker with calendar button
    // Try to find a date input or calendar button
    const dateInput = this.page.locator('input[type="date"], [data-testid="date-from"]').first();
    const visible = await dateInput.isVisible().catch(() => false);
    if (visible) {
      await dateInput.fill(date);
      await expect(dateInput).toHaveValue(date, { timeout: 5000 });
    }
  }

  async filterByDateTo(date: string) {
    const dateInput = this.page.locator('input[type="date"], [data-testid="date-to"]').first();
    const visible = await dateInput.isVisible().catch(() => false);
    if (visible) {
      await dateInput.fill(date);
      await expect(dateInput).toHaveValue(date, { timeout: 5000 });
    }
  }

  async clearFilters() {
    const visible = await this.clearFiltersBtn.isVisible().catch(() => false);
    if (visible) {
      await this.clearFiltersBtn.click({ timeout: 5000 });
      await expect(this.searchInput).toHaveValue('', { timeout: 5000 });
    }
  }

  async getRowCount() {
    return await this.rows.count();
  }

  async clickViewHistory(id: string) {
    const row = await this.getHistoryRowById(id);
    // Look for view button or link
    const viewBtn = row.locator('[data-testid="btn-view"], a:has-text("Ver"), button:has-text("Ver")').first();
    const visible = await viewBtn.isVisible().catch(() => false);
    if (visible) {
      await viewBtn.click();
      await expect(this.page).toHaveURL(/\/clinical-histories\//, { timeout: 15000 });
    }
  }

  async expectHistoryInTable(id: string) {
    const row = await this.getHistoryRowById(id);
    await expect(row).toBeVisible();
  }
}
