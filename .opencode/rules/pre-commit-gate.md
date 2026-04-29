# Rule: pre-commit-gate

Mandatory checklist before ANY commit. No exceptions.

## Gate Checklist

ALL must pass before `git commit`:

```
□ Unit tests for new code exist
□ Ticket branch checkout is active for the ticket
□ Checkout runtime is ready (env + free ports + required services)
□ Runtime was verified in THAT same checkout before commit
□ ALL project tests pass (no regressions)
□ Required lint/type/test checks pass for the affected repo
□ Prisma generates (backend, if schema changed)
□ Judgment Day completed → APPROVED
□ Conventional commit message prepared in Spanish
```

## Commands

### Backend
```bash
TARGET_ROOT="$(pwd)"
./scripts/setup-checkout-runtime.sh "$TARGET_ROOT"
./scripts/verify-checkout-runtime.sh "$TARGET_ROOT"
cd "$TARGET_ROOT"
pnpm test                    # MUST pass
pnpm test:e2e               # MUST pass (if applicable)
pnpm prisma:generate        # MUST pass (if schema changed)
pnpm exec tsc --noEmit      # MUST pass when backend code changed
```

### Frontend
```bash
TARGET_ROOT="$(pwd)"
./scripts/setup-checkout-runtime.sh "$TARGET_ROOT"
./scripts/verify-checkout-runtime.sh "$TARGET_ROOT"
cd "$TARGET_ROOT"
pnpm test                    # MUST pass
pnpm lint                    # MUST pass
pnpm exec tsc --noEmit       # MUST pass when frontend code changed
```

## Failure Protocol

If ANY gate fails:
1. STOP — do not commit
2. Fix the issue
3. Re-run runtime setup/verification if env or ports were involved
4. Re-run the failed gate
5. Re-run ALL gates
5. Only then proceed to commit

Never bypass this by committing from `develop`, from the wrong branch, or from a different checkout than the one you tested.

## Exceptions

NONE. Not even "small changes". Not even "it's just a comment". Every commit must pass all gates.
