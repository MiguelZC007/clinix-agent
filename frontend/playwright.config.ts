import { defineConfig, devices } from '@playwright/test';

// Base URL for E2E tests - can be overridden via environment variable
// Defaults to port 4301 (local dev server)
const E2E_BASE_URL = process.env.E2E_BASE_URL || process.env.NEXTAUTH_URL || 'http://localhost:4301';
const E2E_PORT = parseInt(process.env.E2E_PORT || '4301', 10);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: E2E_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on',
  },

  projects: [
    // Setup project for doctor authentication (default for most tests)
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // Setup project for admin authentication (admin-only tests)
    {
      name: 'setup-admin',
      testMatch: /auth-admin\.setup\.ts/,
    },
    // Main test project with doctor authentication
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
    // Admin tests with admin authentication
    {
      name: 'chromium-admin',
      testMatch: /admin\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin-role.json',
      },
      dependencies: ['setup-admin'],
    },
  ],

  // Run local dev server before tests (frontend only - backend should already be running)
  // Only starts if E2E_START_SERVER is set or if server is not running
  webServer: {
    command: `PORT=${E2E_PORT} pnpm dev`,
    url: E2E_BASE_URL,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
