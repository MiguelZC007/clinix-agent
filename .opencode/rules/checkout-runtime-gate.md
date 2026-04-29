# Rule: checkout-runtime-gate

Every active ticket checkout must have a ready runtime before running tests, creating commits, or opening a PR.

This gate is STRICT. Runtime verification is not optional and must be repeated whenever env, ports, generated artifacts, or local services change.

> Note: the runtime scripts are checkout-scoped and apply to the current branch checkout in this repo.

## Runtime Model

- All ticket checkouts share the SAME database.
- Each active ticket checkout must use its OWN free ports.
- Port allocation must avoid collisions with other active checkouts and any other local process.

## Required Runtime Checklist

All must pass for the active checkout:

```text
□ Runtime file/config generated for the active checkout
□ Shared DATABASE_URL preserved
□ Free backend port assigned
□ Free frontend port assigned
□ Generated clients/artifacts ready if required (e.g. Prisma)
□ Required local services can start with the checkout runtime env
□ Required tests can run successfully from the active checkout
□ No other active checkout is using the same backend/frontend ports
```

## Commands

```bash
TARGET_ROOT="$(pwd)"
./scripts/setup-checkout-runtime.sh "$TARGET_ROOT"
./scripts/verify-checkout-runtime.sh "$TARGET_ROOT"
```

For E2E-specific boot requirements, also load `.opencode/rules/e2e-runtime-prep.md`.

## Port Policy

- Preferred pairs are sequential by active checkout: `3000/4000`, `3001/4001`, `3002/4002`, etc.
- If a preferred port is busy, search for the next free pair.
- Never reuse a busy port.

## Failure Protocol

If runtime setup or verification fails:

1. STOP
2. Fix env, ports, or service prerequisites
3. Re-run setup and verification
4. Only then run tests
5. If tests still cannot run, block commit and PR

## Hard Enforcement

- No verified runtime = no tests
- No verified runtime = no commit
- No verified runtime = no push
- No verified runtime = no PR
- If ports collide with another active checkout, STOP and reallocate ports before doing anything else
- If generated artifacts are stale (for example Prisma client), regenerate them inside the same checkout before continuing
