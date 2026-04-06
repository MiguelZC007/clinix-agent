# Rule: frontend-e2e

End-to-End testing strategy for Next.js 15 + React 19 frontend using Playwright CLI.

## Testing Pyramid for Frontend

```
        /\
       /E2E\      ← Playwright (user flows, integration)
      /------\
     /Integ  \    ← MSW handlers, API mock tests
    /----------\
   /   Unit     \ ← Vitest (hooks, utils, components)
  /--------------\
```

## Playwright Configuration

### File Location

```
frontend/
├── playwright.config.ts    ← Main config
├── e2e/                  ← E2E tests folder
│   ├── auth.spec.ts
│   ├── admin-doctors.spec.ts
│   └── ...
├── test-results/         ← Videos, traces (gitignored)
└── playwright-report/    ← HTML reports (gitignored)
```

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3003',
    trace: 'on-first-retry',
    video: 'on',
    screenshot: 'on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3003',
    reuseExistingServer: true,
  },
});
```

## E2E Test Patterns

### 1. Page Object Model (POM)

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
```

### 2. Test File Structure

```typescript
// e2e/admin-doctors.spec.ts
import { test, expect } from '@playwright/test';
import { DoctorsPage } from './pages/admin/doctors-page';

test.describe('Admin Doctors Management', () => {
  let doctorsPage: DoctorsPage;

  test.beforeEach(async ({ page }) => {
    doctorsPage = new DoctorsPage(page);
    await doctorsPage.goto();
  });

  test('should display doctors list', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th').first()).toContainText('Nombre');
  });

  test('should create new doctor', async ({ page }) => {
    await doctorsPage.createDoctor({
      name: 'Dr. Test',
      email: 'test@example.com',
    });

    // Wait for React hydration (~5 seconds for slow machines)
    await page.waitForTimeout(3000);
    
    const row = await doctorsPage.getDoctorRow('test@example.com');
    await expect(row).toBeVisible();
  });
});
```

### 3. Authentication Handling

```typescript
// e2e/auth.setup.ts
import { test as setup } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="input-email"]', process.env.TEST_USER_EMAIL!);
  await page.fill('[data-testid="input-password"]', process.env.TEST_USER_PASSWORD!);
  await page.click('[data-testid="btn-login"]');
  await page.waitForURL('/dashboard');
  
  await page.context().storageState({ path: authFile });
});

// In playwright.config.ts
projects: [
  { name: 'setup', testMatch: /.*\.setup\.ts/ },
  {
    name: 'chromium',
    use: { storageState: 'playwright/.auth/user.json' },
    dependencies: ['setup'],
  },
]
```

### 4. Waiting Strategies

```typescript
// BAD: Arbitrary waits
await page.waitForTimeout(5000);

// GOOD: Wait for specific conditions
await expect(page.locator('table')).toBeVisible();
await page.waitForResponse('**/api/doctors');
await page.waitForLoadState('networkidle');

// GOOD for React hydration
await page.waitForSelector('[data-testid="hydrated"]', { timeout: 10000 });
```

### 5. Form Testing

```typescript
test('should validate form fields', async ({ page }) => {
  await page.goto('/admin/doctors/new');
  
  // Submit empty form
  await page.click('[data-testid="btn-submit"]');
  
  // Check validation errors
  await expect(page.locator('text=El nombre es requerido')).toBeVisible();
  await expect(page.locator('text=El email es requerido')).toBeVisible();
  
  // Fill valid data
  await page.fill('[data-testid="input-name"]', 'Dr. Valid');
  await page.fill('[data-testid="input-email"]', 'valid@test.com');
  await page.click('[data-testid="btn-submit"]');
  
  // Should not show errors
  await expect(page.locator('text=El nombre es requerido')).not.toBeVisible();
});
```

### 6. API Mocking (for isolated tests)

```typescript
// e2e/admin-doctors.mock.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Admin Doctors (Mocked API)', () => {
  test('should show empty state', async ({ page }) => {
    // Mock empty response
    await page.route('**/v1/doctors*', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ data: [], total: 0 }),
      });
    });

    await page.goto('/admin/doctors');
    
    await expect(page.locator('text=No hay médicos')).toBeVisible();
  });

  test('should handle API error', async ({ page }) => {
    // Mock error
    await page.route('**/v1/doctors*', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ message: 'Internal Error' }),
      });
    });

    await page.goto('/admin/doctors');
    
    await expect(page.locator('text=Error al cargar')).toBeVisible();
  });
});
```

## Test Data Management

### Fixtures

```typescript
// e2e/fixtures/doctor.fixture.ts
export const mockDoctor = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Dr. John Doe',
  email: 'john.doe@example.com',
  status: 'active',
  createdAt: new Date().toISOString(),
};

export const mockDoctors = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    ...mockDoctor,
    id: `doctor-${i}`,
    name: `Dr. Test ${i}`,
    email: `test${i}@example.com`,
  }));
```

### Environment Variables

```bash
# .env.test
TEST_USER_EMAIL=admin@clinix.com
TEST_USER_PASSWORD=admin123
BASE_URL=http://localhost:3003
```

## Commands

```bash
# Run all E2E tests
cd frontend && pnpm test:e2e

# Run specific file
pnpm test:e2e -- admin-doctors.spec.ts

# Run single test
pnpm test:e2e -- -g "should create doctor"

# Run in headed mode (see browser)
pnpm test:e2e -- --headed

# Run specific browser
pnpm test:e2e -- --project=chromium

# Debug mode
pnpm test:e2e -- --debug

# Generate code (codegen)
pnpm playwright codegen http://localhost:3003

# View last run report
npx playwright show-report

# View test videos
ls test-results/*/videos/

# Trace viewer
npx playwright show-trace test-results/*/trace.zip
```

## Best Practices

### 1. Use data-testid

```typescript
// Component
<Input data-testid="input-email" />

// Test
await page.fill('[data-testid="input-email"]', email);
```

### 2. Avoid Brittle Selectors

```typescript
// BAD: Brittle
await page.click('.MuiButton-root.MuiButton-contained')

// GOOD: Stable
await page.click('[data-testid="btn-submit"]')
```

### 3. Wait for NetworkIdle on Critical Flows

```typescript
test('should save doctor', async ({ page }) => {
  await page.goto('/admin/doctors/new');
  await page.fill('[data-testid="input-name"]', 'Dr. Test');
  await page.fill('[data-testid="input-email"]', 'test@test.com');
  await page.click('[data-testid="btn-submit"]');
  
  // Wait for API call to complete
  await page.waitForLoadState('networkidle');
  
  // Verify redirect or success message
  await expect(page).toHaveURL(/\/admin\/doctors\/[\w-]+/);
});
```

### 4. React Hydration Waits

```typescript
// Next.js hydration needs time
test('should handle React hydration', async ({ page }) => {
  await page.goto('/admin/doctors');
  
  // Wait for hydration to complete
  await page.waitForFunction(() => {
    return document.readyState === 'complete';
  });
  
  // Alternative: wait for specific state
  await page.waitForSelector('[data-testid="hydrated"]', { timeout: 5000 });
});
```

## Test Categories

| Category | File Pattern | Purpose |
|----------|--------------|---------|
| Smoke | `e2e/smoke/*.spec.ts` | Critical paths only |
| Auth | `e2e/auth/*.spec.ts` | Login/logout flows |
| CRUD | `e2e/admin/*.spec.ts` | CRUD operations |
| Mock | `e2e/**/*.mock.spec.ts` | Isolated API tests |

## Reports & Artifacts

### Videos

Automatic when test fails:

```typescript
// playwright.config.ts
use: {
  video: 'on', // 'on' for all, 'on-first-retry' for failures only
}
```

Location: `test-results/{test-id}/video.webm`

### Traces

```typescript
use: {
  trace: 'on-first-retry',
}
```

View: `npx playwright show-trace test-results/{test-id}/trace.zip`

### Screenshots

```typescript
use: {
  screenshot: 'on', // 'only-on-failure' for less noise
}
```

Location: `test-results/{test-id}/screenshots/`

## CI/CD Integration

```yaml
# .github/workflows/e2e.yml
- name: Install Playwright
  run: pnpm exec playwright install --with-deps chromium

- name: Run E2E tests
  run: pnpm test:e2e

- name: Upload test artifacts
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 30
```

## Verification Checklist

Before marking complete:
- [ ] All tests pass locally
- [ ] All tests pass in CI
- [ ] Videos generated for failures
- [ ] Screenshots captured
- [ ] No hardcoded waits (>1000ms)
- [ ] All critical user flows covered
- [ ] Test uses data-testid where possible
- [ ] Mocks used for error scenarios
- [ ] Tests are independent (no order dependency)

## Resources

- Playwright docs: https://playwright.dev
- Best practices: https://playwright.dev/docs/best-practices
- Page Object Model: https://playwright.dev/docs/pom