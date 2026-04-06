# Rule: pre-commit-gate

Mandatory checklist before ANY commit. No exceptions.

## Gate Checklist

ALL must pass before `git commit`:

```
□ Unit tests for new code exist
□ ALL project tests pass (no regressions)
□ Build compiles clean
□ Lint passes (frontend)
□ Prisma generates (backend, if schema changed)
□ Judgment Day completed → APPROVED
□ Conventional commit message prepared
```

## Commands

### Backend
```bash
cd backend
pnpm test                    # MUST pass
pnpm test:e2e               # MUST pass (if applicable)
pnpm prisma:generate        # MUST pass (if schema changed)
pnpm build                   # MUST pass
```

### Frontend
```bash
cd frontend
pnpm test                    # MUST pass
pnpm lint                    # MUST pass
pnpm build                   # MUST pass
```

## Failure Protocol

If ANY gate fails:
1. STOP — do not commit
2. Fix the issue
3. Re-run the failed gate
4. Re-run ALL gates
5. Only then proceed to commit

## Exceptions

NONE. Not even "small changes". Not even "it's just a comment". Every commit must pass all gates.
