# Rule: worktree-first

Every ticket MUST start by creating a dedicated git worktree. No exceptions.

## Core Rule

```
NO worktree = NO analysis = NO code changes = NO tests = NO commit
```

## Mandatory Sequence

1. Select the ticket
2. Update `develop`
3. Create the branch
4. Create the dedicated worktree
5. Configure runtime inside the worktree
6. Only then start analysis, edits, tests, commit, push, and PR

## Blocking Rules

- Never implement a ticket in the main checkout.
- Never run ticket-related tests from the main checkout.
- Never create a commit or PR for a ticket if the branch work was not done from the worktree.
- Keep one active worktree per ticket branch.

## Verification

Before doing any real work, confirm:

```bash
git worktree list
git -C "$WORKTREE_PATH" status
```

If the expected worktree does not exist, STOP and create it first.
