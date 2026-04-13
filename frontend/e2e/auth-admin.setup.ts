import { test as setup, expect } from '@playwright/test';
import { E2E_TEST_CREDENTIALS } from './fixtures/test-credentials';

const authFile = 'playwright/.auth/admin.json';

setup('authenticate admin session', async ({ page }) => {
  // Set longer timeout for auth setup
  setup.setTimeout(120000);

  const csrfResponse = await page.request.get('/api/auth/csrf');
  expect(csrfResponse.ok()).toBeTruthy();
  const csrfBody = await csrfResponse.json() as { csrfToken?: string };
  expect(csrfBody.csrfToken).toBeTruthy();

  const callbackPayload = new URLSearchParams({
    csrfToken: csrfBody.csrfToken!,
    phone: E2E_TEST_CREDENTIALS.admin.phone,
    password: E2E_TEST_CREDENTIALS.admin.password,
    callbackUrl: '/es/admin/doctors',
    json: 'true',
  });

  const loginResponse = await page.request.post('/api/auth/callback/credentials', {
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    data: callbackPayload.toString(),
  });
  expect(loginResponse.ok()).toBeTruthy();

  await expect.poll(async () => {
    const cookies = await page.context().cookies();
    return cookies.some((cookie) =>
      cookie.name === 'next-auth.session-token' ||
      cookie.name === '__Secure-next-auth.session-token' ||
      cookie.name === 'authjs.session-token' ||
      cookie.name === '__Secure-authjs.session-token',
    );
  }, { timeout: 30000 }).toBeTruthy();
  // Keep setup resilient: persist storage state once credentials callback +
  // session cookie are in place. Admin specs navigate to protected routes.
  const url = page.url();
  console.log('[playwright setup] admin session ready at:', url);
  
  // Verify session cookie exists (check multiple cookie names for resilience)
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => 
    c.name === 'next-auth.session-token' || 
    c.name === '__Secure-next-auth.session-token' ||
    c.name === 'authjs.session-token' ||
    c.name === '__Secure-authjs.session-token'
  );

  console.log('[playwright setup] admin cookies:', cookies.map(c => c.name));
  console.log('[playwright setup] admin session cookie:', sessionCookie?.name || 'none (may use localStorage)');
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
  
  console.log('[playwright setup] admin storage state saved to', authFile);
});
