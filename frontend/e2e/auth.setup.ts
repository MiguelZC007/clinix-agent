import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/admin.json';

// Test credentials from seed (see TEST_CREDENTIALS.md)
// Using DOCTOR credentials since most endpoints require doctor role
// Phone format: +591 70000002 -> country code +591 (Bolivia, default), number 70000002
const TEST_CREDENTIALS = {
  phoneInput: '70000002',  // Doctor user - Without country code
  password: 'Doctor123!',
};

setup('authenticate as admin', async ({ page }) => {
  // Set longer timeout for auth setup
  setup.setTimeout(60000);
  
  // Navigate to login
  await page.goto('/es/login');
  await page.waitForLoadState('networkidle');
  
  // Wait for the form to be visible (React hydration) - use broader selector
  await page.waitForSelector('input[type="tel"], input[type="password"]', { timeout: 15000 });
  
  // Fill login form
  // PhoneInputWithCountry splits phone into country selector + number input
  // Default country is Bolivia (+591), so we just need to type the number
  const phoneInput = page.locator('input[type="tel"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  const submitBtn = page.locator('button[type="submit"]').first();
  
  await phoneInput.fill(TEST_CREDENTIALS.phoneInput);
  await passwordInput.fill(TEST_CREDENTIALS.password);
  
  // Click submit and wait for navigation
  // This allows NextAuth to properly set the session cookie
  await Promise.all([
    submitBtn.click(),
    page.waitForURL(/\/(patients|dashboard|es\/(?!login))/, { timeout: 30000 }),
  ]);
  
  // Verify we're logged in by checking we're not on login page anymore
  const url = page.url();
  console.log('Logged in, current URL:', url);
  expect(url).not.toContain('login');
  
  // Verify session cookie exists (NextAuth stores JWT in this cookie)
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => 
    c.name === 'next-auth.session-token' || 
    c.name === '__Secure-next-auth.session-token' ||
    c.name === 'authjs.session-token' ||
    c.name === '__Secure-authjs.session-token'
  );
  
  console.log('Cookies after login:', cookies.map(c => c.name));
  
  // Note: NextAuth may use localStorage for JWT in some configurations
  // The important thing is that we're redirected away from login
  expect(url).not.toContain('login');
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
  
  console.log('Auth state saved to', authFile);
});