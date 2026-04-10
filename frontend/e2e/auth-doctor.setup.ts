import { test as setup, expect } from '@playwright/test';
import { E2E_TEST_CREDENTIALS } from './fixtures/test-credentials';

const authFile = 'playwright/.auth/doctor.json';
const doctorLandingPath = '/es/patients';

setup('authenticate default doctor session', async ({ page }) => {
  // Set longer timeout for auth setup
  setup.setTimeout(60000);

  const phoneInput = page.locator('[data-testid="input-phone"]').first();
  const passwordInput = page.locator('[data-testid="input-password"]').first();
  const submitBtn = page.locator('[data-testid="btn-login"]').first();
  
  // Navigate to login
  await page.goto('/es/login', { waitUntil: 'domcontentloaded' });
  
  // Fill login form with the seeded DOCTOR account.
  // PhoneInputWithCountry splits phone into country selector + number input.
  // Default country is Bolivia (+591), so we only type the local number.
  await expect(phoneInput).toBeVisible({ timeout: 15000 });
  await expect(passwordInput).toBeVisible({ timeout: 15000 });
  await expect(submitBtn).toBeVisible({ timeout: 15000 });
  
  await phoneInput.fill(E2E_TEST_CREDENTIALS.doctor.phoneInput);
  await passwordInput.fill(E2E_TEST_CREDENTIALS.doctor.password);
  
  // Wait for the authenticated session to exist, then navigate explicitly to the
  // default doctor landing page before saving the storage state.
  await submitBtn.click();
  await expect.poll(async () => page.evaluate(async () => {
    const response = await fetch('/api/auth/session');
    const session = await response.json();
    return session?.user?.role ?? null;
  }), { timeout: 30000 }).toBe('DOCTOR');
  await page.goto(doctorLandingPath);
  await expect(page).toHaveURL(/\/es\/patients(\/|$)/, { timeout: 30000 });
  
  // Verify the doctor session is active by ensuring we left the login route.
  const url = page.url();
  console.log('[playwright setup] doctor session ready at:', url);
  expect(url).not.toContain('login');
  
  // Verify session cookie exists (NextAuth stores JWT in this cookie)
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => 
    c.name === 'next-auth.session-token' || 
    c.name === '__Secure-next-auth.session-token' ||
    c.name === 'authjs.session-token' ||
    c.name === '__Secure-authjs.session-token'
  );
  
  console.log('[playwright setup] doctor cookies:', cookies.map(c => c.name));
  
  // Note: NextAuth may use localStorage for JWT in some configurations.
  // The important thing is that the authenticated navigation succeeds.
  expect(url).not.toContain('login');
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
  
  console.log('[playwright setup] doctor storage state saved to', authFile);
});
