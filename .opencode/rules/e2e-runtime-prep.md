# Rule: e2e-runtime-prep

Standard runtime preparation required before ANY frontend or backend E2E test run.

## Core Rule

Always prepare and verify the runtime for the active ticket checkout BEFORE running `pnpm test:e2e`.

- Frontend E2E must prepare runtime, then start `backend/` AND `frontend/` in background with PM2 using `prod` mode.
- Backend E2E currently runs in-process with Jest + Supertest and does NOT require PM2 external runtime.
- Ports must come from the checkout runtime and must already be verified as free.
- If runtime, ports, env, or readiness fail, STOP. Do not run E2E tests.

## Shared Prerequisites

Run from the target checkout root:

```bash
TARGET_ROOT="$(pwd)"
./scripts/setup-checkout-runtime.sh "$TARGET_ROOT"
./scripts/verify-checkout-runtime.sh "$TARGET_ROOT"
```

Required before booting PM2 services for frontend E2E:

- `pm2` must exist in `PATH`
- `curl` must exist in `PATH`
- Runtime file must exist at `.checkout-runtime/runtime.env`
- Required prod boot artifacts must already exist for the app(s) you are going to start
- For frontend prod, `.next` must be complete enough for `next start` (`BUILD_ID`, `build-manifest.json`, `routes-manifest.json`)
- Missing or stale prod artifacts are not repaired automatically; they must be regenerated explicitly in that same checkout
- Do not bypass the assigned `FRONTEND_PORT` / `BACKEND_PORT`

## Canonical PM2 Wrapper

Use this single entrypoint for checkout-scoped PM2 runtime orchestration:

```bash
./scripts/checkout-runtime.sh <prepare|start|stop|restart|status> "$TARGET_ROOT" [prod|dev]
```

Use `checkout-runtime.sh` directly from the active repo checkout.

## Frontend E2E Runtime

Frontend E2E uses the full product runtime, so boot BOTH apps in PM2 `prod` mode:

```bash
TARGET_ROOT="$(pwd)"
./scripts/setup-checkout-runtime.sh "$TARGET_ROOT"
./scripts/verify-checkout-runtime.sh "$TARGET_ROOT"
./scripts/checkout-runtime.sh prepare "$TARGET_ROOT" prod
./scripts/checkout-runtime.sh start "$TARGET_ROOT" prod
cd "$TARGET_ROOT/frontend" && pnpm test:e2e
```

What `prepare` enforces before PM2 boot:

- Runtime env exists and passes `verify-checkout-runtime.sh`
- `backend/dist/src/main.js` exists for `pnpm start:prod`
- `frontend/.next/BUILD_ID`, `frontend/.next/build-manifest.json`, and `frontend/.next/routes-manifest.json` exist for `next start`
- Failure output must tell the operator to regenerate the missing prod artifact in the same checkout and explain that a copied/stale `.next` can be incompatible

Readiness expectations:

- Backend answers on `http://127.0.0.1:$BACKEND_PORT/api/docs`
- Frontend answers on `http://127.0.0.1:$FRONTEND_PORT/es/login`
- Playwright must use the external runtime by default, not its own ad-hoc server

When finished:

```bash
./scripts/checkout-runtime.sh stop "$TARGET_ROOT"
```

## Backend E2E Runtime

Backend E2E uses the in-process Nest test app from Jest/Supertest. It still benefits from the checkout runtime env because ports, `DATABASE_URL`, and `.env.checkout` are prepared consistently, but it must NOT require PM2 boot to run the current suite.

```bash
TARGET_ROOT="$(pwd)"
./scripts/setup-checkout-runtime.sh "$TARGET_ROOT"
./scripts/verify-checkout-runtime.sh "$TARGET_ROOT"
source "$TARGET_ROOT/.checkout-runtime/runtime.env"
cd "$TARGET_ROOT/backend" && pnpm test:e2e
```

Backend E2E must not start frontend or backend PM2 services unless the test suite changes away from the current in-process model.

## Failure Protocol

If any prerequisite fails:

1. STOP
2. Fix ports, env, missing artifacts, or PM2 prerequisites
3. Re-run `setup-checkout-runtime.sh`
4. Re-run `verify-checkout-runtime.sh`
5. If this is frontend E2E, re-run `checkout-runtime.sh prepare "$TARGET_ROOT" prod`
6. Re-start the required PM2 service set in `prod` mode with `checkout-runtime.sh`
7. Only then run `pnpm test:e2e`

## Hard Enforcement

- No verified runtime = no E2E
- Frontend E2E without PM2 `prod` runtime = invalid run
- Frontend E2E without backend + frontend ready = invalid run
- Backend E2E must follow the prepared runtime env, but PM2 is not part of the current contract
