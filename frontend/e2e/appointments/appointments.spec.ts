import { test, expect } from '@playwright/test';
import { AppointmentsPage } from '../pages/appointments/appointments-page';

test.describe('Appointments Management', () => {
  let appointmentsPage: AppointmentsPage;

  test.beforeEach(async ({ page }) => {
    appointmentsPage = new AppointmentsPage(page);
  });

  test.describe('Calendar View', () => {
    test('should display appointment calendar', async ({ page }) => {
      await appointmentsPage.goto();
      
      // Calendar or calendar container should be visible
      await expect(appointmentsPage.calendar).toBeVisible();
    });

    test('should switch between views', async ({ page }) => {
      await appointmentsPage.goto();
      
      // Switch to week view
      await appointmentsPage.switchToView('week');
      await page.waitForTimeout(500);
      
      // Switch to month view
      await appointmentsPage.switchToView('month');
      await page.waitForTimeout(500);
      
      // Switch back to day view
      await appointmentsPage.switchToView('day');
      await page.waitForTimeout(500);
    });

    test('should navigate to new appointment', async ({ page }) => {
      await appointmentsPage.goto();
      await appointmentsPage.clickNewAppointment();
      
      await expect(page).toHaveURL(/\/appointments\/new/);
    });

    test('should filter by status', async ({ page }) => {
      await appointmentsPage.goto();
      await appointmentsPage.filterByStatus('scheduled');
      await page.waitForTimeout(1000);
      
      // Calendar should still be visible after filtering
      await expect(appointmentsPage.calendar).toBeVisible();
    });

    test('should filter by pending status', async ({ page }) => {
      await appointmentsPage.goto();
      await appointmentsPage.filterByStatus('pending');
      await page.waitForTimeout(500);
      
      await expect(appointmentsPage.calendar).toBeVisible();
    });

    test('should filter by completed status', async ({ page }) => {
      await appointmentsPage.goto();
      await appointmentsPage.filterByStatus('completed');
      await page.waitForTimeout(500);
      
      await expect(appointmentsPage.calendar).toBeVisible();
    });
  });
});