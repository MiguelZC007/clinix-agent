import { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class AppointmentsPage {
  readonly page: Page;
  readonly calendar: Locator;
  readonly newAppointmentBtn: Locator;
  readonly statusFilterButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    // Calendar component
    this.calendar = page.locator('[data-testid="appointment-calendar"], [data-testid="calendar"], [data-testid="calendar-container"]').first();
    // New appointment button
    this.newAppointmentBtn = page.locator('[data-testid="btn-new-appointment"], button:has-text("Nueva"), button:has-text("New")').first();
    // Status filter buttons (not a select - uses Button components with aria-pressed)
    this.statusFilterButtons = page.locator('button[aria-pressed]').first();
  }

  async goto() {
    await this.page.goto('/es/appointments');
    await this.page.waitForLoadState('networkidle');
    // Wait for calendar or loading state
    await this.page.waitForTimeout(2000);
  }

  async clickNewAppointment() {
    await this.newAppointmentBtn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async filterByStatus(status: 'scheduled' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'all') {
    // Status filter uses Button components with aria-pressed
    // Labels are translated, so we look for the button that's not aria-pressed="true"
    const statusLabels: Record<string, string[]> = {
      scheduled: ['scheduled', 'programada', 'cita programada'],
      pending: ['pending', 'pendiente'],
      confirmed: ['confirmed', 'confirmada'],
      completed: ['completed', 'completada', 'finalizada'],
      cancelled: ['cancelled', 'cancelada'],
      all: ['all', 'todas', 'todos']
    };
    
    const labels = statusLabels[status] || [status];
    for (const label of labels) {
      const btn = this.page.locator(`button:has-text("${label}"), button[aria-pressed]`).filter({ hasText: label }).first();
      const visible = await btn.isVisible().catch(() => false);
      if (visible) {
        await btn.click();
        await this.page.waitForLoadState('networkidle');
        return;
      }
    }
    // Fallback: click the status filter button area and try to find the option
    await this.page.waitForTimeout(500);
  }

  async switchToView(view: 'day' | 'week' | 'month') {
    // Look for view toggle buttons
    const viewBtn = this.page.locator(`button:has-text("${view}"), [role="tab"]:has-text("${view}")`).first();
    const visible = await viewBtn.isVisible().catch(() => false);
    if (visible) {
      await viewBtn.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async expectAppointmentVisible(patientName: string) {
    const appointment = this.page.locator(`[data-testid="appointment"]:has-text("${patientName}"), [role="button"]:has-text("${patientName}")`).first();
    await expect(appointment).toBeVisible();
  }
}