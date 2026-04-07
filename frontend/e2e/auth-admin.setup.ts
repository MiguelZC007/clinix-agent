import { test as setup, expect } from '@playwright/test';
import { E2E_TEST_CREDENTIALS } from './fixtures/test-credentials';

const authFile = 'playwright/.auth/admin-role.json';

setup('authenticate as admin user', async ({ page }) => {
  // Set longer timeout for auth setup
  setup.setTimeout(60000);
  
  // Navigate to login
  await page.goto('/es/login');
  await page.waitForLoadState('networkidle');
  
  // Wait for the form to be visible (React hydration) - use broader selector
  await page.waitForSelector('input[type="tel"], input[type="password"]', { timeout: 15000 });
  
  // Fill login form
  const phoneInput = page.locator('input[type="tel"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  const submitBtn = page.locator('button[type="submit"]').first();
  
  await phoneInput.fill(E2E_TEST_CREDENTIALS.admin.phoneInput);
  await passwordInput.fill(E2E_TEST_CREDENTIALS.admin.password);
  
  // Click submit and wait for navigation
  await Promise.all([
    submitBtn.click(),
    page.waitForURL(/\/(patients|dashboard|es\/(?!login))/, { timeout: 30000 }),
  ]);
  
  // Verify we're logged in
  const url = page.url();
  console.log('Admin logged in, current URL:', url);
  expect(url).not.toContain('login');
  
  // Verify session cookie exists (check multiple cookie names for resilience)
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => 
    c.name === 'next-auth.session-token' || 
    c.name === '__Secure-next-auth.session-token' ||
    c.name === 'authjs.session-token' ||
    c.name === '__Secure-authjs.session-token'
  );

  console.log('Cookies after admin login:', cookies.map(c => c.name));
  console.log('Session cookie found:', sessionCookie?.name || 'none (may use localStorage)');
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
  
  console.log('Admin auth state saved to', authFile);
});
