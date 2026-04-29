# Rule: branch-first

Every ticket MUST start by creating or switching to a dedicated git branch in this repo. Do NOT create git worktrees for ticket execution.

This is a HARD BLOCKING RULE. If the correct ticket branch is not the active checkout, STOP immediately.

## Core Rule

```
NO ticket branch = NO analysis = NO code changes = NO tests = NO commit
```

## Mandatory Sequence

1. Select the ticket
2. Update `develop`
3. Create or switch to the ticket branch from the repo root checkout
4. Configure runtime for the active checkout
5. Only then start analysis, edits, tests, commit, push, and PR

## Blocking Rules

- Never implement a ticket directly on `develop`.
- Never analyze, edit, or test ticket code from the wrong branch.
- Never create a commit or PR if the ticket branch was not the active checkout for the work.
- Keep one ticket scope per branch.
- Do not mix unrelated ticket changes in the same branch.
- Do not create parallel git worktrees for ticket execution; stay on the active branch checkout of this repo.

## Verification

Before doing any real work, confirm:

```bash
git status -sb
git branch --show-current
pwd
```

If the expected ticket branch is not checked out, STOP and switch to it first.
If `pwd` is not inside the monorepo root checkout for the active branch, STOP and move to the correct checkout before analysis, edits, tests, commits, pushes, or PR commands.

## Non-Negotiable Execution Policy

Once the ticket branch is active, ALL of the following MUST happen from that checkout:

- analysis
- code edits
- test execution
- runtime setup
- commits
- pushes
- PR creation

No exceptions for "small changes", "quick checks", or "just one command".
