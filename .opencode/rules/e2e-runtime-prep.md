# Rule: e2e-runtime-prep

Standard runtime preparation required before ANY frontend or backend E2E test run.

## Core Rule

Always prepare and verify the worktree runtime BEFORE running `pnpm test:e2e`.

- Frontend E2E must prepare runtime, then start `backend/` AND `frontend/` in background with PM2 using `prod` mode.
- Backend E2E currently runs in-process with Jest + Supertest and does NOT require PM2 external runtime.
- Ports must come from the worktree runtime and must already be verified as free.
- If runtime, ports, env, or readiness fail, STOP. Do not run E2E tests.

## Shared Prerequisites

Run inside the target worktree:

```bash
./scripts/setup-worktree-runtime.sh "$WORKTREE_PATH"
./scripts/verify-worktree-runtime.sh "$WORKTREE_PATH"
```

Required before booting PM2 services for frontend E2E:

- `pm2` must exist in `PATH`
- `curl` must exist in `PATH`
- Worktree runtime file must exist at `.worktree-runtime/runtime.env`
- Required prod boot artifacts must already exist for the app(s) you are going to start
- For frontend prod, `.next` must be complete enough for `next start` (`BUILD_ID`, `build-manifest.json`, `routes-manifest.json`)
- Missing or stale prod artifacts are not repaired automatically; they must be regenerated explicitly in that same worktree
- Do not bypass the assigned `FRONTEND_PORT` / `BACKEND_PORT`

## Canonical PM2 Wrapper

Use this single entrypoint for worktree-scoped PM2 runtime orchestration:

```bash
./scripts/worktree-runtime.sh <prepare|start|stop|restart|status> "$WORKTREE_PATH" [prod|dev]
```

Legacy wrappers may remain for compatibility, but future runs should use `worktree-runtime.sh`.

## Frontend E2E Runtime

Frontend E2E uses the full product runtime, so boot BOTH apps in PM2 `prod` mode:

```bash
./scripts/setup-worktree-runtime.sh "$WORKTREE_PATH"
./scripts/verify-worktree-runtime.sh "$WORKTREE_PATH"
./scripts/worktree-runtime.sh prepare "$WORKTREE_PATH" prod
./scripts/worktree-runtime.sh start "$WORKTREE_PATH" prod
cd "$WORKTREE_PATH/frontend" && pnpm test:e2e
```

What `prepare` enforces before PM2 boot:

- Runtime env exists and passes `verify-worktree-runtime.sh`
- `backend/dist/src/main.js` exists for `pnpm start:prod`
- `frontend/.next/BUILD_ID`, `frontend/.next/build-manifest.json`, and `frontend/.next/routes-manifest.json` exist for `next start`
- Failure output must tell the operator to regenerate the missing prod artifact in the same worktree and explain that a copied/stale `.next` can be incompatible

Readiness expectations:

- Backend answers on `http://127.0.0.1:$BACKEND_PORT/api/docs`
- Frontend answers on `http://127.0.0.1:$FRONTEND_PORT/es/login`
- Playwright must use the external runtime by default, not its own ad-hoc server

When finished:

```bash
./scripts/worktree-runtime.sh stop "$WORKTREE_PATH"
```

## Backend E2E Runtime

Backend E2E uses the in-process Nest test app from Jest/Supertest. It still benefits from the worktree runtime env because ports, `DATABASE_URL`, and `.env.worktree` are prepared consistently, but it must NOT require PM2 boot to run the current suite.

```bash
./scripts/setup-worktree-runtime.sh "$WORKTREE_PATH"
./scripts/verify-worktree-runtime.sh "$WORKTREE_PATH"
source "$WORKTREE_PATH/.worktree-runtime/runtime.env"
cd "$WORKTREE_PATH/backend" && pnpm test:e2e
```

Backend E2E must not start frontend or backend PM2 services unless the test suite changes away from the current in-process model.

## Failure Protocol

If any prerequisite fails:

1. STOP
2. Fix ports, env, missing artifacts, or PM2 prerequisites
3. Re-run `setup-worktree-runtime.sh`
4. Re-run `verify-worktree-runtime.sh`
5. If this is frontend E2E, re-run `worktree-runtime.sh prepare "$WORKTREE_PATH" prod`
6. Re-start the required PM2 service set in `prod` mode with `worktree-runtime.sh`
7. Only then run `pnpm test:e2e`

## Hard Enforcement

- No verified runtime = no E2E
- Frontend E2E without PM2 `prod` runtime = invalid run
- Frontend E2E without backend + frontend ready = invalid run
- Backend E2E must follow the prepared runtime env, but PM2 is not part of the current contract
