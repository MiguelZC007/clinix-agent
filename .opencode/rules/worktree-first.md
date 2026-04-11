# Rule: worktree-first

Every ticket MUST start by creating a dedicated git worktree. No exceptions.

This is a HARD BLOCKING RULE. If the worktree does not exist and is not the active path, STOP immediately.

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
- Never analyze ticket code from the main checkout once a ticket is selected.
- Never run ticket-related tests from the main checkout.
- Never create a commit or PR for a ticket if the branch work was not done from the worktree.
- Keep one active worktree per ticket branch.
- Never switch back to the main checkout to "just make a quick fix" for the same ticket.
- Never share one worktree across multiple tickets.
- If the current shell path is not the expected worktree path, STOP and move to the worktree first.

## Verification

Before doing any real work, confirm:

```bash
git worktree list
git -C "$WORKTREE_PATH" status
pwd
```

If the expected worktree does not exist, STOP and create it first.
If `pwd` is not the dedicated worktree path, STOP and switch to the worktree before analysis, edits, tests, commits, pushes, or PR commands.

## Non-Negotiable Execution Policy

Once the worktree exists, ALL of the following MUST happen from inside that worktree:

- analysis
- code edits
- test execution
- runtime setup
- commits
- pushes
- PR creation

No exceptions for "small changes", "quick checks", or "just one command".
