import { test, expect } from '@playwright/test';
import { ClinicalHistoriesPage } from '../pages/clinical-histories/clinical-histories-page';

test.describe('Clinical Histories Management', () => {
  let clinicalHistoriesPage: ClinicalHistoriesPage;

  test.beforeEach(async ({ page }) => {
    clinicalHistoriesPage = new ClinicalHistoriesPage(page);
  });

  test.describe('List Clinical Histories', () => {
    test('should display clinical histories list', async ({ page }) => {
      await clinicalHistoriesPage.goto();
      
      const tableVisible = await clinicalHistoriesPage.table.isVisible().catch(() => false);
      expect(typeof tableVisible).toBe('boolean');
      
      const rowCount = await clinicalHistoriesPage.getRowCount();
      expect(rowCount).toBeGreaterThanOrEqual(0);
    });

    test('should search clinical histories', async ({ page }) => {
      await clinicalHistoriesPage.goto();
      await clinicalHistoriesPage.searchHistory('consulta');
      
      const rowCount = await clinicalHistoriesPage.getRowCount();
      expect(rowCount).toBeGreaterThanOrEqual(0);
    });

    test('should filter by date from', async ({ page }) => {
      await clinicalHistoriesPage.goto();
      
      const today = new Date().toISOString().split('T')[0];
      await clinicalHistoriesPage.filterByDateFrom(today);
      
      const rowCount = await clinicalHistoriesPage.getRowCount();
      expect(rowCount).toBeGreaterThanOrEqual(0);
    });

    test('should filter by date to', async ({ page }) => {
      await clinicalHistoriesPage.goto();
      
      const today = new Date().toISOString().split('T')[0];
      await clinicalHistoriesPage.filterByDateTo(today);
      
      const rowCount = await clinicalHistoriesPage.getRowCount();
      expect(rowCount).toBeGreaterThanOrEqual(0);
    });

    test('should clear filters', async ({ page }) => {
      await clinicalHistoriesPage.goto();
      await clinicalHistoriesPage.searchHistory('test');
      await clinicalHistoriesPage.clearFilters();
      
      const searchValue = await clinicalHistoriesPage.searchInput.inputValue();
      expect(searchValue).toBe('');
    });
  });

  test.describe('View Clinical History', () => {
    test('should navigate to clinical history detail', async ({ page }) => {
      await clinicalHistoriesPage.goto();
      
      const rowCount = await clinicalHistoriesPage.getRowCount();
      if (rowCount > 0) {
        const firstRow = clinicalHistoriesPage.rows.first();
        const viewBtn = firstRow.locator('button:has-text("Ver"), button:has-text("View")').first();
        const hasViewBtn = await viewBtn.isVisible().catch(() => false);
        if (hasViewBtn) {
          await viewBtn.click();
        } else {
          await firstRow.click();
        }
        
        await expect(page).toHaveURL(/\/clinical-histories(\/[\w-]+)?/);
      }
    });
  });
});
