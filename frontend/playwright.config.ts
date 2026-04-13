import { loadEnvConfig } from '@next/env';
import { defineConfig, devices } from '@playwright/test';

loadEnvConfig(process.cwd());

const LOCAL_FRONTEND_PORT = 3000;
const LOCAL_BACKEND_URL = 'http://127.0.0.1:4000/v1';
const E2E_PORT = Number.parseInt(process.env.E2E_PORT ?? `${LOCAL_FRONTEND_PORT}`, 10);
const E2E_BASE_URL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${E2E_PORT}`;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? LOCAL_BACKEND_URL;
const SHOULD_START_WEBSERVER = process.env.E2E_START_SERVER === '1';

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
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
      testMatch: /e2e\/auth-doctor\.setup\.ts$/,
    },
    // Setup project for the admin session used by admin-only specs.
    {
      name: 'setup-admin',
      testMatch: /e2e\/auth-admin\.setup\.ts$/,
    },
    // Public/auth tests must run without an authenticated storage state.
    {
      name: 'chromium-public',
      testMatch: [
        /e2e\/auth\/.*\.spec\.ts$/,
        /e2e\/smoke\/.*\.spec\.ts$/,
      ],
      testIgnore: /.*\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    // Main doctor project with the default doctor session.
    {
      name: 'chromium-doctor',
      testIgnore: [
        /e2e\/auth\/.*\.spec\.ts$/,
        /e2e\/admin\/.*\.spec\.ts$/,
        /e2e\/smoke\/.*\.spec\.ts$/,
        /e2e\/.*\.setup\.ts$/,
      ],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/doctor.json',
      },
      dependencies: ['setup-doctor'],
    },
    // Admin tests with the admin session.
    {
      name: 'chromium-admin',
      testMatch: /e2e\/admin\/.*\.spec\.ts$/,
      testIgnore: /e2e\/.*\.setup\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup-admin'],
    },
  ],

  // Use external runtime by default (PM2/background services).
  // Only start Playwright-managed webServer when explicitly requested.
  webServer: SHOULD_START_WEBSERVER
    ? {
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
        timeout: 15000,
      }
    : undefined,
});
