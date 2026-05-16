# Rule: e2e-runtime-prep

Standard runtime preparation required before ANY frontend or backend E2E test run.

## Core Rule

Always verify the active monorepo checkout has the required env, database, ports, and build artifacts BEFORE running `pnpm test:e2e`.

- Frontend E2E must run against the active checkout's backend and frontend services, started with package scripts or the documented Playwright/webServer flow.
- Backend E2E currently runs in-process with Jest + Supertest and does NOT require PM2 external runtime.
- Do not use the removed checkout/worktree runtime scripts or `.checkout-runtime/runtime.env`.
- If runtime, ports, env, or readiness fail, STOP. Do not run E2E tests.

## Shared Prerequisites

Run from the target checkout root and verify manually:

```bash
pwd
pnpm --filter ./backend prisma:generate
```

Required before frontend E2E:

- `DATABASE_URL` points to a reachable local dev database
- backend env contains required auth/provider/test placeholders
- frontend env points to the intended backend base URL
- backend and frontend ports are explicit and free
- required prod/dev boot artifacts exist for the selected mode
- `curl` exists in `PATH` for readiness checks when used

## Frontend E2E Runtime

Frontend E2E uses the full product runtime, so boot BOTH apps for the active checkout using package scripts or Playwright's configured server flow.

Typical manual flow:

```bash
# terminal 1
cd backend && pnpm dev

# terminal 2
cd frontend && pnpm dev

# terminal 3
cd frontend && pnpm test:e2e
```

Readiness expectations:

- Backend answers on the configured backend URL, normally `/api/docs` or `/v1` routes depending on the test.
- Frontend answers on the configured frontend URL, normally `/es/login` for auth smoke checks.
- Playwright must not silently target another branch's already-running services.

When finished, stop only the services you started for this checkout.

## Backend E2E Runtime

Backend E2E uses the in-process Nest test app from Jest/Supertest. It requires env and database readiness but must NOT require PM2 or external frontend/backend services for the current suite.

```bash
cd backend
pnpm test:e2e
```

Backend E2E must not start frontend or backend external services unless the test suite changes away from the current in-process model.

## Failure Protocol

If any prerequisite fails:

1. STOP
2. Fix ports, env, missing artifacts, or service prerequisites
3. Regenerate Prisma/client artifacts if needed
4. Restart only the affected package service(s)
5. Re-run readiness checks
6. Only then run `pnpm test:e2e`

## Hard Enforcement

- No working env/database when required = no E2E
- Frontend E2E targeting the wrong checkout's services = invalid run
- Frontend E2E without backend + frontend ready = invalid run
- Backend E2E must use the active checkout env/database, but PM2 is not part of the current contract
