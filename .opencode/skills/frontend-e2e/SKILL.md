---
name: frontend-e2e
description: >
  End-to-End testing strategy for Next.js 15 + React 19 frontend using Playwright CLI.
  Covers user flows, CRUD operations, authentication, and API mocking.
  Trigger: When writing E2E tests for frontend, needing test coverage, or verifying UI flows.
license: Apache-2.0
metadata:
  author: clinix-agent
  version: "1.0"
---

## When to Use

- Writing E2E tests for user flows
- Testing CRUD operations in admin panels
- Verifying authentication flows
- Testing form validation
- Debugging test failures
- Generating test code with Playwright codegen

## Testing Pyramid

```
        /\
       /E2E\      ← Playwright (this skill)
      /------\
     /Integ  \    ← MSW handlers
    /----------\
   /   Unit     \ ← Vitest (hooks, utils)
  /--------------\
```

## Critical Patterns

### 1. Test Structure (POM)

```typescript
// e2e/pages/admin/doctors-page.ts
export class DoctorsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/admin/doctors');
  }

  async createDoctor(data: CreateDoctorDto) {
    await this.page.click('[data-testid="btn-new-doctor"]');
    await this.page.fill('[data-testid="input-name"]', data.name);
    await this.page.fill('[data-testid="input-email"]', data.email);
    await this.page.click('[data-testid="btn-submit"]');
  }

  async getDoctorRow(email: string) {
    return this.page.locator(`tr:has-text("${email}")`);
  }
}

// e2e/admin-doctors.spec.ts
test.describe('Admin Doctors', () => {
  let doctorsPage: DoctorsPage;

  test.beforeEach(async ({ page }) => {
    doctorsPage = new DoctorsPage(page);
    await doctorsPage.goto();
  });

  test('should create doctor', async () => {
    await doctorsPage.createDoctor({ name: 'Dr. Test', email: 'test@test.com' });
    const row = await doctorsPage.getDoctorRow('test@test.com');
    await expect(row).toBeVisible();
  });
});
```

### 2. Wait Strategies (NO ARBITRARY WAITS)

```typescript
// BAD
await page.waitForTimeout(5000);

// GOOD
await expect(page.locator('table')).toBeVisible();
await page.waitForResponse('**/api/doctors');
await page.waitForLoadState('networkidle');

// React hydration
await page.waitForFunction(() => document.readyState === 'complete');
```

### 3. Form Testing

```typescript
test('should validate form', async ({ page }) => {
  await page.goto('/admin/doctors/new');
  
  // Empty submit
  await page.click('[data-testid="btn-submit"]');
  await expect(page.locator('text=El nombre es requerido')).toBeVisible();
  
  // Valid data
  await page.fill('[data-testid="input-name"]', 'Dr. Valid');
  await page.fill('[data-testid="input-email"]', 'valid@test.com');
  await page.click('[data-testid="btn-submit"]');
  await expect(page.locator('text=El nombre es requerido')).not.toBeVisible();
});
```

### 4. API Mocking (Isolated Tests)

```typescript
test('should show empty state', async ({ page }) => {
  await page.route('**/v1/doctors*', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ data: [], total: 0 }),
    });
  });

  await page.goto('/admin/doctors');
  await expect(page.locator('text=No hay médicos')).toBeVisible();
});
```

## Test File Structure

```
frontend/
├── e2e/
│   ├── pages/
│   │   └── admin/
│   │       └── doctors-page.ts      ← Page Object Model
│   ├── fixtures/
│   │   └── doctor.fixture.ts        ← Test data
│   ├── auth.setup.ts                ← Auth persistence
│   ├── smoke/
│   │   └── home.spec.ts             ← Critical paths
│   └── admin/
│       └── doctors.spec.ts          ← CRUD tests
├── playwright.config.ts
└── .env.test                        ← Test env vars
```

## Commands

```bash
# Run all E2E tests
cd frontend && pnpm test:e2e

# Run specific file
pnpm test:e2e -- admin-doctors.spec.ts

# Run single test by name
pnpm test:e2e -- -g "should create doctor"

# headed mode (see browser)
pnpm test:e2e -- --headed

# Debug mode
pnpm test:e2e -- --debug

# Generate code
pnpm playwright codegen http://localhost:3003

# View last report
npx playwright show-report

# View video from failure
ls test-results/*/videos/

# Trace viewer
npx playwright show-trace test-results/*/trace.zip
```

## Best Practices

### Use data-testid (Stable Selectors)

```typescript
// Component
<Input data-testid="input-email" />

// Test
await page.fill('[data-testid="input-email"]', email);

// Avoid brittle selectors
// BAD: .MuiButton-root.MuiButton-contained
// GOOD: [data-testid="btn-submit"]
```

### React Hydration Waits

```typescript
// Next.js needs time for hydration
test('should handle hydration', async ({ page }) => {
  await page.goto('/admin/doctors');
  await page.waitForFunction(() => document.readyState === 'complete');
  await page.waitForTimeout(500); // Small buffer for React
});
```

### Independent Tests

```typescript
// Each test should work in isolation
test.beforeEach(async ({ page }) => {
  // Reset state, login if needed, navigate
  await page.goto('/admin/doctors');
});

// No order dependency
```

## Playwright Config

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  
  use: {
    baseURL: 'http://localhost:3003',
    trace: 'on-first-retry',
    video: 'on',         // Videos for all tests
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3003',
    reuseExistingServer: true,
  },
});
```

## Artifacts

| Artifact | Location | When |
|----------|----------|------|
| Videos | `test-results/*/video.webm` | Always |
| Screenshots | `test-results/*/screenshots/` | On failure |
| Traces | `test-results/*/trace.zip` | On retry |
| Reports | `playwright-report/` | After run |

## Verification Checklist

Before marking complete:
- [ ] `pnpm test:e2e` passes locally
- [ ] `pnpm test:e2e` passes in CI
- [ ] No hardcoded waits (>1000ms)
- [ ] Uses `data-testid` for selectors
- [ ] Tests use Page Object Model
- [ ] Mocks for error scenarios
- [ ] Tests are independent
- [ ] React hydration handled
- [ ] Auth state persisted

## Test Categories

| Category | Pattern | Purpose |
|----------|---------|---------|
| Smoke | `smoke/*.spec.ts` | Critical paths|
| Auth | `auth/*.spec.ts` | Login/logout |
| CRUD | `admin/*.spec.ts` | CRUD operations |
| Mock | `*.mock.spec.ts` | Isolated API tests |

## Resources

- **Rule**: `.opencode/rules/frontend-e2e.md` ← Full patterns & best practices
- **Dev Skill**: `.opencode/skills/dev-services/SKILL.md` ← Start/stop servers
- Playwright docs: https://playwright.dev
- Best practices: https://playwright.dev/docs/best-practices