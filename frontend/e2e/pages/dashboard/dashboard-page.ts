import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly welcomeMessage: Locator;
  readonly statsCards: Locator;
  readonly recentActivity: Locator;
  readonly upcomingAppointments: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    // Welcome message is a <p> inside a Card with specific classes
    // No data-testid, so use text content or class selector
    this.welcomeMessage = page.locator('p.text-lg.font-medium, [data-testid="welcome-message"], h1, h2').first();
    // StatCards are Card components in a grid
    this.statsCards = page.locator('.grid.gap-4 > div, [data-testid="stats-card"], [role="article"]');
    this.recentActivity = page.locator('[data-testid="recent-activity"], text=Recent Consultations').first();
    this.upcomingAppointments = page.locator('[data-testid="upcoming-appointments"]').first();
    // Loading spinner shown while data loads
    this.loadingSpinner = page.locator('.animate-spin, [role="status"]');
  }

  async goto() {
    await this.page.goto('/es/dashboard');
    await this.page.waitForLoadState('networkidle');
    
    // Wait for loading to finish (spinner disappears)
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
      // Loading spinner might not be present if data loads fast
    });
    
    // Wait a bit for content to render
    await this.page.waitForTimeout(1000);
  }

  async expectWelcomeMessage(message: string) {
    // Wait for any text content to appear
    await this.page.waitForSelector('p.text-lg, h1, h2', { timeout: 10000 });
    const text = await this.welcomeMessage.textContent();
    return text?.toLowerCase().includes(message.toLowerCase());
  }

  async getStatsCount() {
    // Wait for stats grid to appear
    await this.page.waitForSelector('.grid.gap-4', { timeout: 10000 }).catch(() => {});
    return await this.statsCards.count();
  }
}