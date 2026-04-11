# Rule: pre-commit-gate

Mandatory checklist before ANY commit. No exceptions.

## Gate Checklist

ALL must pass before `git commit`:

```
□ Unit tests for new code exist
□ Worktree exists and is the active execution path for the ticket
□ Worktree runtime is ready (env + free ports + required services)
□ Runtime was verified in THAT same worktree before commit
□ ALL project tests pass (no regressions)
□ Required lint/type/test checks pass for the affected repo
□ Prisma generates (backend, if schema changed)
□ Judgment Day completed → APPROVED
□ Conventional commit message prepared in Spanish
```

## Commands

### Backend
```bash
./scripts/setup-worktree-runtime.sh "$WORKTREE_PATH"
./scripts/verify-worktree-runtime.sh "$WORKTREE_PATH"
cd "$WORKTREE_PATH"
pnpm test                    # MUST pass
pnpm test:e2e               # MUST pass (if applicable)
pnpm prisma:generate        # MUST pass (if schema changed)
pnpm exec tsc --noEmit      # MUST pass when backend code changed
```

### Frontend
```bash
./scripts/setup-worktree-runtime.sh "$WORKTREE_PATH"
./scripts/verify-worktree-runtime.sh "$WORKTREE_PATH"
cd "$WORKTREE_PATH"
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

Never bypass this by committing from the main checkout or from a different worktree.

## Exceptions

NONE. Not even "small changes". Not even "it's just a comment". Every commit must pass all gates.
