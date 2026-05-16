# Rule: pre-commit-gate

Mandatory checklist before ANY commit. No exceptions.

## Gate Checklist

ALL must pass before `git commit`:

```text
□ Unit tests for new code exist
□ Ticket branch checkout is active for the ticket
□ Dev runtime/env is ready for the active checkout when required
□ Required package checks were run in THAT same checkout before commit
□ ALL project tests pass (no regressions)
□ Required lint/type/test checks pass for the affected repo
□ Prisma generates (backend, if schema changed)
□ Judgment Day completed → APPROVED
□ Conventional commit message prepared in Spanish
```

## Commands

### Backend

```bash
pnpm test                    # MUST pass
pnpm test:e2e               # MUST pass (if applicable)
pnpm prisma:generate        # MUST pass (if schema changed)
pnpm exec tsc --noEmit      # MUST pass when backend code changed
```

### Frontend

```bash
pnpm test                    # MUST pass
pnpm lint                    # MUST pass
pnpm exec tsc --noEmit       # MUST pass when frontend code changed
```

## Failure Protocol

If ANY gate fails:

1. STOP — do not commit
2. Fix the issue
3. Re-run dev runtime/env verification if env or ports were involved
4. Re-run the failed gate
5. Re-run ALL gates
6. Only then proceed to commit

Never bypass this by committing from `develop`, from the wrong branch, or from a different checkout than the one you tested.

## Exceptions

NONE. Not even "small changes". Not even "it's just a comment". Every commit must pass all gates.
