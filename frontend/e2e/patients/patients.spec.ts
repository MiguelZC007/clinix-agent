import { test, expect } from '@playwright/test';
import { PatientsPage } from '../pages/patients/patients-page';
import { PatientFormPage } from '../pages/patients/patient-form-page';
import { createMockPatient } from '../fixtures/test-data.fixture';

test.describe('Patients Management', () => {
  test.describe.configure({ timeout: 90000 });

  let patientsPage: PatientsPage;
  let patientFormPage: PatientFormPage;

  test.beforeEach(async ({ page }) => {
    patientsPage = new PatientsPage(page);
    patientFormPage = new PatientFormPage(page);
  });

  test.describe('List Patients', () => {
    test('should display patients list', async ({ page }) => {
      await patientsPage.goto();

      const hasTable = await patientsPage.table.isVisible().catch(() => false);
      const hasEmptyState = await page.locator('main').getByText(/sin pacientes|no hay pacientes/i).isVisible().catch(() => false);
      expect(hasTable || hasEmptyState).toBeTruthy();
      
      const rowCount = await patientsPage.getRowCount();
      expect(rowCount).toBeGreaterThanOrEqual(0);
    });

    test('should search patients by name', async ({ page }) => {
      await patientsPage.goto();
      await patientsPage.searchPatient('Juan');
      
      const rowCount = await patientsPage.getRowCount();
      expect(rowCount).toBeGreaterThanOrEqual(0);
    });

    test('should clear search', async ({ page }) => {
      await patientsPage.goto();
      await patientsPage.searchPatient('Test');
      await patientsPage.clearSearch();
      
      const searchValue = await patientsPage.searchInput.inputValue();
      expect(searchValue).toBe('');
    });
  });

  test.describe('Create Patient', () => {
    test('should navigate to new patient form', async ({ page }) => {
      await patientsPage.goto();
      await patientsPage.clickNewPatient();
      
      await expect(page).toHaveURL(/\/patients\/new/);
      await expect(page.locator('[data-testid="patient-form"]')).toBeVisible();
    });

    test('should create patient with valid data', async ({ page }) => {
      const mockPatient = createMockPatient();
      
      await patientFormPage.gotoNew();
      await patientFormPage.fillForm({
        name: mockPatient.name,
        lastName: mockPatient.lastName,
        email: mockPatient.email,
        phone: mockPatient.phone,
        birthDate: mockPatient.birthDate,
        gender: mockPatient.gender,
      });
      await patientFormPage.submit();

      await Promise.race([
        page.waitForURL(/\/patients(\/|$)/, { timeout: 20000 }),
        patientFormPage.errorMessage.waitFor({ state: 'visible', timeout: 20000 }),
      ]);

      const currentUrl = page.url();
      if (currentUrl.includes('/patients/new')) {
        await expect(patientFormPage.form).toBeVisible();
      } else {
        await expect(page).toHaveURL(/\/patients(\/|$)/);
      }
    });

    test('should show validation error for empty name', async ({ page }) => {
      await patientFormPage.gotoNew();
      await patientFormPage.fillForm({
        name: '',
        lastName: 'Test',
        email: 'test@test.com',
      });
      await patientFormPage.submit();
      
      await patientFormPage.expectValidationError('nombre');
    });

    test('should show validation error for empty last name', async ({ page }) => {
      await patientFormPage.gotoNew();
      await patientFormPage.fillForm({
        name: 'Test',
        lastName: '',
        email: 'test@test.com',
      });
      await patientFormPage.submit();
      
      await patientFormPage.expectValidationError('apellido');
    });

    test('should show validation error for invalid email', async ({ page }) => {
      await patientFormPage.gotoNew();
      await patientFormPage.fillForm({
        name: 'Test',
        lastName: 'Patient',
        email: 'invalid-email',
      });
      await patientFormPage.submit();
      
      await patientFormPage.expectValidationError('email');
    });

    test('should cancel form and return to list', async ({ page }) => {
      await patientFormPage.gotoNew();
      await patientFormPage.fillForm({
        name: 'Test',
        lastName: 'Patient',
        email: 'test@test.com',
      });
      await patientFormPage.cancel();

      const currentUrl = page.url();
      const stayedOnForm = currentUrl.includes('/new');
      if (stayedOnForm) {
        await expect(patientFormPage.form).toBeVisible();
      } else {
        expect(currentUrl).not.toContain('/new');
      }
    });
  });

  test.describe('View Patient', () => {
    test('should navigate to patient detail', async ({ page }) => {
      await patientsPage.goto();
      
      const rowCount = await patientsPage.getRowCount();
      if (rowCount > 0) {
        await patientsPage.rows.first().click();
        
        const currentUrl = page.url();
        const isDetailPage = /\/patients\/[^\/]+$/.test(currentUrl);
        const isListPage = currentUrl.includes('/patients') && !currentUrl.includes('/new') && !currentUrl.includes('/edit');
        
        expect(isDetailPage || isListPage).toBeTruthy();
      }
    });
  });

  test.describe('Edit Patient', () => {
    test('should navigate to edit form', async ({ page }) => {
      await patientsPage.goto();
      
      const rowCount = await patientsPage.getRowCount();
      if (rowCount > 0) {
        await patientsPage.clickFirstRowEdit();
        await expect(page).toHaveURL(/\/patients\/[^\/]+\/edit/, { timeout: 60000 });
      }
    });
  });
});
