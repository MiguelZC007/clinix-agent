import { loadEnvConfig } from '@next/env';
import { defineConfig, devices } from '@playwright/test';

loadEnvConfig(process.cwd());

const LOCAL_FRONTEND_PORT = 3000;
const LOCAL_BACKEND_URL = 'http://localhost:4300/v1';
const E2E_PORT = Number.parseInt(process.env.E2E_PORT ?? `${LOCAL_FRONTEND_PORT}`, 10);
const E2E_BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${E2E_PORT}`;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? LOCAL_BACKEND_URL;

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
    // Setup project for the default doctor session used by most specs.
    {
      name: 'setup-doctor',
      testMatch: /auth-doctor\.setup\.ts/,
    },
    // Setup project for the admin session used by admin-only specs.
    {
      name: 'setup-admin',
      testMatch: /auth-admin\.setup\.ts/,
    },
    // Main test project with the default doctor session.
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/doctor.json',
      },
      dependencies: ['setup-doctor'],
    },
    // Admin tests with the admin session.
    {
      name: 'chromium-admin',
      testMatch: /admin\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup-admin'],
    },
  ],

  // Run local dev server before tests (frontend only - backend should already be running)
  // Only starts if E2E_START_SERVER is set or if server is not running
  webServer: {
    command: 'pnpm dev',
    env: {
      ...process.env,
      PORT: `${E2E_PORT}`,
      E2E_PORT: `${E2E_PORT}`,
      E2E_BASE_URL,
      NEXTAUTH_URL: E2E_BASE_URL,
      NEXT_PUBLIC_API_URL: API_BASE_URL,
    },
    url: E2E_BASE_URL,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
