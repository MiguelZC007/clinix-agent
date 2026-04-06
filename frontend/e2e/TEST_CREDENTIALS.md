# Test Credentials for E2E Tests

These credentials are created by the Prisma seed and should be used for E2E testing.

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

This is the primary account for E2E authentication setup.

## Usage in Playwright

```typescript
// e2e/auth.setup.ts
const TEST_PHONE = '+59170000000';
const TEST_PASSWORD = 'Test123!';

await phoneInput.fill(TEST_PHONE);
await passwordInput.fill(TEST_PASSWORD);
```

## Reset Database

To reset the database and re-run the seed:

```bash
cd backend
pnpm prisma migrate reset
pnpm prisma db seed
```