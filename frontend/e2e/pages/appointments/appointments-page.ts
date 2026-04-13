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
    this.newAppointmentBtn = page.locator('[data-testid="btn-new-appointment"], button:has-text("Nueva cita"), button:has-text("New appointment")').first();
    // Status filter buttons (not a select - uses Button components with aria-pressed)
    this.statusFilterButtons = page.locator('button[aria-pressed]').first();
  }

  async goto() {
    await this.page.goto('/es/appointments', { waitUntil: 'domcontentloaded' });
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.locator('main, [role="alert"]').first().waitFor({ state: 'visible', timeout: 30000 });
  }

  async clickNewAppointment() {
    await this.newAppointmentBtn.click();
    await expect(this.page).toHaveURL(/\/appointments(\/new)?/, { timeout: 15000 });
  }

  async filterByStatus(status: 'scheduled' | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'all') {
    const statusLabels: Record<string, string[]> = {
      scheduled: ['Programada', 'Scheduled'],
      pending: ['pending', 'pendiente'],
      confirmed: ['confirmed', 'confirmada', 'Confirmada'],
      completed: ['completed', 'completada', 'finalizada', 'Completada'],
      cancelled: ['cancelled', 'cancelada', 'Cancelada'],
      all: ['all', 'todas', 'todos', 'Todas']
    };
    
    const labels = statusLabels[status] || [status];
    for (const label of labels) {
      const btn = this.page
        .locator('div[role="group"][aria-label] button[aria-pressed]')
        .filter({ hasText: label })
        .first();
      const visible = await btn.isVisible().catch(() => false);
      if (visible) {
        const responsePromise = this.page.waitForResponse(
          (response) =>
            response.request().method() === 'GET' &&
            response.url().includes('/v1/appointments'),
          { timeout: 10000 },
        ).catch(() => null);
        await btn.click();
        await responsePromise;
        await expect(btn).toHaveAttribute('aria-pressed', 'true', { timeout: 5000 });
        await expect(this.calendar.or(this.page.locator('main'))).toBeVisible({ timeout: 10000 });
        return;
      }
    }
    return;
  }

  async switchToView(view: 'day' | 'week' | 'month') {
    const labels: Record<'day' | 'week' | 'month', string[]> = {
      day: ['Día', 'Day'],
      week: ['Semana', 'Week'],
      month: ['Mes', 'Month'],
    };

    const viewBtn = this.page
      .locator('div[role="group"][aria-label] button[aria-pressed]')
      .filter({ hasText: new RegExp(labels[view].join('|'), 'i') })
      .first();
    const visible = await viewBtn.isVisible().catch(() => false);
    if (visible) {
      await viewBtn.click();
      await expect(viewBtn).toHaveAttribute('aria-pressed', 'true', { timeout: 5000 });
      await expect(this.calendar.or(this.page.locator('main'))).toBeVisible({ timeout: 10000 });
    }
  }

  async expectAppointmentVisible(patientName: string) {
    const appointment = this.page.locator(`[data-testid="appointment"]:has-text("${patientName}"), [role="button"]:has-text("${patientName}")`).first();
    await expect(appointment).toBeVisible();
  }
}
