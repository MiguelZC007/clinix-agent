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
    this.table = page.locator('[data-testid="clinical-histories-table"], table, [data-testid="clinical-history-card"]').first();
    // New history button
    this.newHistoryBtn = page.locator('[data-testid="btn-new-history"], button:has-text("Nueva"), button:has-text("New")').first();
    // Search input (SearchInput component with data-testid="input-search")
    this.searchInput = page.locator('[data-testid="input-search"], input[placeholder*="buscar"], input[placeholder*="search"]').first();
    // Date range filters
    this.dateFromInput = page.locator('[data-testid="date-from"], input[type="date"], input:has-text("desde")').first();
    this.dateToInput = page.locator('[data-testid="date-to"], input[type="date"], input:has-text("hasta")').first();
    // Clear filters button
    this.clearFiltersBtn = page.locator('[data-testid="clinical-history-filters-clear"], button:has-text("Limpiar"), button:has-text("Clear")').first();
    // Pagination
    this.pagination = page.locator('[data-testid="pagination"], nav[aria-label*="pagin"]').first();
    // Table rows
    this.rows = page.locator('table tbody tr, [data-testid="clinical-history-row"]');
  }

  async goto() {
    await this.page.goto('/es/clinical-histories');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(2000);
  }

  async getHistoryRowById(id: string) {
    return this.table.locator(`tr:has-text("${id}"), [data-testid="clinical-history-card"]:has-text("${id}")`).first();
  }

  async clickNewHistory() {
    await this.newHistoryBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async searchHistory(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async filterByDateFrom(date: string) {
    // DateRangeFilters uses DatePicker with calendar button
    // Try to find a date input or calendar button
    const dateInput = this.page.locator('input[type="date"], [data-testid="date-from"]').first();
    const visible = await dateInput.isVisible().catch(() => false);
    if (visible) {
      await dateInput.fill(date);
      await this.page.waitForLoadState('networkidle');
    }
  }

  async filterByDateTo(date: string) {
    const dateInput = this.page.locator('input[type="date"], [data-testid="date-to"]').first();
    const visible = await dateInput.isVisible().catch(() => false);
    if (visible) {
      await dateInput.fill(date);
      await this.page.waitForLoadState('networkidle');
    }
  }

  async clearFilters() {
    const visible = await this.clearFiltersBtn.isVisible().catch(() => false);
    if (visible) {
      await this.clearFiltersBtn.click();
      await this.page.waitForLoadState('networkidle');
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
      await this.page.waitForLoadState('networkidle');
    }
  }

  async expectHistoryInTable(id: string) {
    const row = await this.getHistoryRowById(id);
    await expect(row).toBeVisible();
  }
}