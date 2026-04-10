# Test Credentials for E2E Tests

These credentials are created by the Prisma seed and should be used for E2E testing.

Source of truth in code:

- `frontend/e2e/fixtures/test-credentials.ts`

## Admin User (Role: ADMIN)

- **Email:** admin@clinix.com
- **Phone:** +59170000001
- **Password:** Admin123!
- **Role:** ADMIN

Use this account for testing admin features like:
- Doctor management
- User management
- System configuration

## Doctor User (Role: DOCTOR)

- **Email:** doctor.test@clinix.com
- **Phone:** +59170000002
- **Password:** Doctor123!
- **Role:** DOCTOR

Use this account for testing doctor features like:
- Patient management
- Clinical histories
- Appointments

## Patient User (Role: PATIENT)

- **Email:** patient.test@clinix.com
- **Phone:** +59170000003
- **Password:** Patient123!
- **Role:** PATIENT

Use this account for testing patient features like:
- Viewing own medical records
- Scheduling appointments

## E2E Test User (Role: DOCTOR)

- **Email:** test-e2e@clinix.local
- **Phone:** +59170000000
- **Password:** Test123!
- **Role:** DOCTOR

This extra seeded doctor account is available for isolated/manual E2E scenarios, but it is not the default Playwright auth setup account.

## Usage in Playwright

```typescript
// e2e/auth-doctor.setup.ts
await phoneInput.fill(E2E_TEST_CREDENTIALS.doctor.phoneInput);
await passwordInput.fill(E2E_TEST_CREDENTIALS.doctor.password);

// e2e/auth-admin.setup.ts
await phoneInput.fill(E2E_TEST_CREDENTIALS.admin.phoneInput);
await passwordInput.fill(E2E_TEST_CREDENTIALS.admin.password);
```

## Reset Database

To reset the database and re-run the seed:

```bash
cd backend
pnpm prisma migrate reset
pnpm prisma db seed
```
