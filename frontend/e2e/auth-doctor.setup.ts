import { test as setup, expect } from '@playwright/test';
import { E2E_TEST_CREDENTIALS } from './fixtures/test-credentials';

const authFile = 'playwright/.auth/doctor.json';

setup('authenticate default doctor session', async ({ page }) => {
  // Set longer timeout for auth setup
  setup.setTimeout(120000);

  const csrfResponse = await page.request.get('/api/auth/csrf');
  expect(csrfResponse.ok()).toBeTruthy();
  const csrfBody = await csrfResponse.json() as { csrfToken?: string };
  expect(csrfBody.csrfToken).toBeTruthy();

  const callbackPayload = new URLSearchParams({
    csrfToken: csrfBody.csrfToken!,
    phone: E2E_TEST_CREDENTIALS.doctor.phone,
    password: E2E_TEST_CREDENTIALS.doctor.password,
    callbackUrl: '/es/patients',
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

  const cookies = await page.context().cookies();
  console.log('[playwright setup] doctor session ready using auth cookie');
  console.log('[playwright setup] doctor cookies:', cookies.map(c => c.name));
  
  // Save authentication state
  await page.context().storageState({ path: authFile });
  
  console.log('[playwright setup] doctor storage state saved to', authFile);
});
