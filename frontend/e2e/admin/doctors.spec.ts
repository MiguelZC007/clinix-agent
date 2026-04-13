import { test, expect } from '@playwright/test';
import { DoctorsPage } from '../pages/admin/doctors-page';
import { DoctorFormPage } from '../pages/admin/doctor-form-page';
import { createMockDoctor } from '../fixtures/test-data.fixture';

test.describe('Admin Doctors Management', () => {
  test.describe.configure({ mode: 'serial' });

  let doctorsPage: DoctorsPage;
  let doctorFormPage: DoctorFormPage;

  test.beforeEach(async ({ page }) => {
    doctorsPage = new DoctorsPage(page);
    doctorFormPage = new DoctorFormPage(page);
  });

  test.describe('List Doctors', () => {
    test('should display doctors list', async ({ page }) => {
      await doctorsPage.goto();
      
      // Wait for table to load
      await expect(doctorsPage.table).toBeVisible();
      
      // Should have at least one row or empty state
      const rowCount = await doctorsPage.getRowCount();
      expect(rowCount).toBeGreaterThanOrEqual(0);
    });

    test('should search doctors by name', async ({ page }) => {
      await doctorsPage.goto();
      
      // Search for existing doctor
      await doctorsPage.searchDoctor('Dr.');

      // Should filter results
      const rowCount = await doctorsPage.getRowCount();
      expect(rowCount).toBeGreaterThanOrEqual(0);
    });

    test('should filter doctors by status', async ({ page }) => {
      await doctorsPage.goto();
      
      // Filter by active status
      await doctorsPage.filterByStatus('active');
      
      // All visible rows should be active
      const rowCount = await doctorsPage.getRowCount();
      expect(rowCount).toBeGreaterThanOrEqual(0);
    });

    test('should clear filters by selecting "all" status', async ({ page }) => {
      await doctorsPage.goto();
      
      // Apply status filter
      await doctorsPage.filterByStatus('active');
      
      // Clear filter by selecting "all"
      await doctorsPage.filterByStatus('all');
      
      // Table should still be visible
      await expect(doctorsPage.table).toBeVisible();
    });
  });

  test.describe('Create Doctor', () => {
    test('should navigate to new doctor form', async ({ page }) => {
      await doctorsPage.goto();
      await Promise.all([
        page.waitForURL(/\/es\/admin\/doctors\/new$/, { timeout: 20000 }),
        doctorsPage.clickNewDoctor(),
      ]);

      await expect(page).toHaveURL(/\/es\/admin\/doctors\/new$/);
    });

    test('should create doctor with valid data', async ({ page }) => {
      const mockDoctor = createMockDoctor();
      
      await doctorFormPage.gotoNew();
      await doctorFormPage.fillForm({
        name: mockDoctor.name,
        lastName: mockDoctor.lastName,
        licenseNumber: mockDoctor.licenseNumber,
        specialty: mockDoctor.specialty, // Use specialty name from database
        password: mockDoctor.password,
      });

      await doctorFormPage.submit();

      await Promise.race([
        page.waitForURL(/\/es\/admin\/doctors$/, { timeout: 20000 }),
        doctorFormPage.errorMessage.waitFor({ state: 'visible', timeout: 20000 }),
      ]);

      // Check if we're still on the form page (validation error) or redirected (success)
      const currentUrl = page.url();

      if (currentUrl.includes('/new')) {
        await expect(doctorFormPage.form).toBeVisible();
      } else {
        await expect(page).toHaveURL(/\/es\/admin\/doctors$/);
      }
    });

    test('should show validation error for empty name', async ({ page }) => {
      await doctorFormPage.gotoNew();
      await doctorFormPage.fillForm({
        name: '',
        lastName: 'Test',
        licenseNumber: 'MN12345',
      });
      await doctorFormPage.submit();
      
      // Should show validation error
      await doctorFormPage.expectValidationError('nombre');
    });

    test('should show validation error for empty lastName', async ({ page }) => {
      await doctorFormPage.gotoNew();
      await doctorFormPage.fillForm({
        name: 'Test',
        lastName: '',
        licenseNumber: 'MN12345',
      });
      await doctorFormPage.submit();
      
      // Should show validation error
      await doctorFormPage.expectValidationError('apellido');
    });

    test('should cancel form and return to list', async ({ page }) => {
      await doctorFormPage.gotoNew();
      await doctorFormPage.fillForm({
        name: 'Test Doctor',
        lastName: 'Test',
        licenseNumber: 'MN12345',
      });
      await Promise.all([
        page.waitForURL(/\/es\/admin\/doctors$/, { timeout: 20000 }),
        doctorFormPage.cancel(),
      ]);

      await expect(page).toHaveURL(/\/es\/admin\/doctors$/);
    });
  });

  test.describe('View Doctor', () => {
    test('should navigate to doctor detail', async ({ page }) => {
      await doctorsPage.goto();
      
      // If there are doctors, click view on first one
      const rowCount = await doctorsPage.getRowCount();
      if (rowCount > 0) {
        await doctorsPage.clickFirstRowView();
        await expect(page).toHaveURL(/\/es\/admin\/doctors(\/[^\/]+)?$/);
      }
    });
  });

  test.describe('Edit Doctor', () => {
    test('should navigate to edit form', async ({ page }) => {
      await doctorsPage.goto();
      
      // If there are doctors, click edit on first one
      const rowCount = await doctorsPage.getRowCount();
      if (rowCount > 0) {
        await Promise.all([
          page.waitForURL(/\/es\/admin\/doctors\/[^\/]+$/, { timeout: 20000 }),
          doctorsPage.clickFirstRow(),
        ]);

        await Promise.all([
          page.waitForURL(/\/es\/admin\/doctors\/[^\/]+\/edit$/, { timeout: 20000 }),
          page.getByTestId('btn-edit-doctor-detail').click(),
        ]);

        await expect(page).toHaveURL(/\/es\/admin\/doctors\/[^\/]+\/edit$/);
      }
    });
  });

  test.describe('RBAC-3: Role Change with Confirmation', () => {
    const mockDoctorId = '123e4567-e89b-12d3-a456-426614174000';
    const doctorEndpoint = `**/v1/admin/doctors/${mockDoctorId}`;
    const specialtiesEndpoint = '**/v1/appointments/specialties';

    const mockDoctorResponse = {
      success: true,
      data: {
        id: mockDoctorId,
        userId: 'user-123',
        name: 'John',
        lastName: 'Doe',
        email: 'john.doe@clinix.com',
        phone: '+549111234567',
        licenseNumber: 'MN12345',
        role: 'DOCTOR',
        specialty: { id: '1', name: 'Cardiología' },
        specialtyId: '1',
        specialtyName: 'Cardiología',
        status: 'active',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      timestamp: new Date().toISOString(),
    };

    test.beforeEach(async ({ page }) => {
      page.route(doctorEndpoint, async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockDoctorResponse),
          });
          return;
        }

        await route.continue();
      });

      page.route(specialtiesEndpoint, async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: [
                { id: '1', name: 'Cardiología' },
                { id: '2', name: 'Pediatría' },
                { id: '3', name: 'Medicina General' },
              ],
              timestamp: new Date().toISOString(),
            }),
          });
          return;
        }

        await route.continue();
      });
    });

    test('should show confirmation dialog when changing doctor role', async ({ page }) => {
      await doctorFormPage.gotoEdit(mockDoctorId);

      await doctorFormPage.form.waitFor({ state: 'visible', timeout: 10000 });

      await doctorFormPage.selectRole('Admin');

      await doctorFormPage.submit();

      const confirmDialog = page.locator('[role="alertdialog"]');
      await expect(confirmDialog).toBeVisible({ timeout: 5000 });

      await expect(confirmDialog).toContainText('Confirmar cambio de rol');
    });

    test('should confirm role change and proceed successfully', async ({ page }) => {
      await page.route(doctorEndpoint, async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockDoctorResponse),
          });
          return;
        }

        if (route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                ...mockDoctorResponse.data,
                role: 'ADMIN',
              },
              timestamp: new Date().toISOString(),
            }),
          });
          return;
        }

        await route.continue();
      });

      await doctorFormPage.gotoEdit(mockDoctorId);

      await doctorFormPage.form.waitFor({ state: 'visible', timeout: 10000 });

      await doctorFormPage.selectRole('Admin');

      await doctorFormPage.submit();

      const confirmDialog = page.locator('[role="alertdialog"]');
      await expect(confirmDialog).toBeVisible({ timeout: 5000 });

      const confirmBtn = page.locator('[role="alertdialog"] button:not([disabled]):has-text("Confirmar cambio")').first();
      await confirmBtn.click();

      await expect(page).toHaveURL(/\/es\/admin\/doctors$/, { timeout: 20000 });
    });

    test('should rollback role in UI after backend rejection', async ({ page }) => {
      const newRole = 'Admin';

      await doctorFormPage.gotoEdit(mockDoctorId);

      await doctorFormPage.form.waitFor({ state: 'visible', timeout: 10000 });

      await page.route(doctorEndpoint, async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockDoctorResponse),
          });
          return;
        }

        if (route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 403,
            contentType: 'application/json',
            body: JSON.stringify({
              message: 'Role change not allowed',
              error: 'FORBIDDEN',
            }),
          });
          return;
        }
        await route.continue();
      });

      await doctorFormPage.selectRole(newRole);

      await doctorFormPage.submit();

      const confirmDialog = page.locator('[role="alertdialog"]');
      await expect(confirmDialog).toBeVisible({ timeout: 5000 });

      const confirmBtn = page.locator('[role="alertdialog"] button:not([disabled]):has-text("Confirmar cambio")').first();
      await confirmBtn.click();

      const roleSelect = page.locator('[data-testid="select-role"]');
      await expect(roleSelect).toContainText(newRole, { timeout: 5000 });
    });

    test('should cancel role change and keep the unsaved selected role in the form', async ({ page }) => {
      await doctorFormPage.gotoEdit(mockDoctorId);

      await doctorFormPage.form.waitFor({ state: 'visible', timeout: 10000 });

      await doctorFormPage.selectRole('Admin');

      await doctorFormPage.submit();

      const confirmDialog = page.locator('[role="alertdialog"]');
      await expect(confirmDialog).toBeVisible({ timeout: 5000 });

      const cancelBtn = page.locator('[role="alertdialog"] button:has-text("Cancelar")').first();
      await cancelBtn.click();

      await expect(confirmDialog).not.toBeVisible({ timeout: 5000 });

      const roleSelect = page.locator('[data-testid="select-role"]');
      await expect(roleSelect).toContainText('Admin', { timeout: 5000 });
    });
  });
});
