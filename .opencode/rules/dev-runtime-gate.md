# Rule: dev-runtime-gate

Before tests, commits, pushes, or PRs, verify the active monorepo checkout has a working local runtime without checkout/worktree runtime scripts.

## Runtime Model

- Work from the real monorepo root, not package subdirectories as separate repos.
- Use the package `.env` / `.env.local` / `.env.checkout` files already present for the active checkout.
- Use a single active local checkout by default; if running multiple checkouts manually, the operator must assign non-colliding ports.
- Do not use `.checkout-runtime/`, `.worktree-runtime/`, or the removed `scripts/*checkout-runtime*.sh` flow.

## Required Runtime Checklist

All must pass when the affected task needs runtime services:

```text
□ DATABASE_URL points to a reachable local dev database
□ Backend env contains required auth/provider/test placeholders
□ Frontend env points to the intended backend URL
□ Backend and frontend ports are explicit and not already occupied
□ Generated artifacts are current when required (for example Prisma client)
□ Required local services can start with package scripts
□ Required tests can run successfully from the active checkout
```

## Commands

Use package scripts directly from the monorepo root or package directory:

```bash
# Backend
cd backend
pnpm prisma:generate          # if Prisma/schema/client may be stale
pnpm test
pnpm test:e2e                # if applicable and DB is ready

# Frontend
cd frontend
pnpm test
pnpm lint
pnpm build                   # when frontend runtime/build evidence is required
```

For E2E-specific boot requirements, also load `.opencode/rules/e2e-runtime-prep.md`.

## Failure Protocol

If runtime setup or verification fails:

1. STOP
2. Fix env, ports, generated artifacts, or service prerequisites
3. Re-run the failed command
4. Re-run the required gate commands for the affected package(s)
5. If tests still cannot run, block commit, push, and PR

## Hard Enforcement

- No working dev runtime when runtime is required = no tests
- No required tests/lint/build = no commit
- No required tests/lint/build = no push
- No required tests/lint/build = no PR
- If ports collide, STOP and choose explicit free ports before continuing
- If generated artifacts are stale, regenerate them inside the same checkout before continuing
