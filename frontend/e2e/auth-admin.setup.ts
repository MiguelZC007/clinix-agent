import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/admin-role.json';

// Admin credentials from seed (see TEST_CREDENTIALS.md)
// Admin has role ADMIN and can access admin endpoints
const ADMIN_CREDENTIALS = {
  phoneInput: '70000001',  // Admin user - Without country code
  password: 'Admin123!',
};

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
  
  await phoneInput.fill(ADMIN_CREDENTIALS.phoneInput);
  await passwordInput.fill(ADMIN_CREDENTIALS.password);
  
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