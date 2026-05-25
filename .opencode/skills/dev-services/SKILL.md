---
name: dev-services
description: "Trigger: starting, stopping, preparing, or debugging local backend/frontend dev services. Use active checkout package scripts safely."
license: Apache-2.0
metadata:
  author: clinix-agent
  version: "1.0"
---

## Activation Contract

Load this skill before starting, stopping, preparing, or debugging local backend/frontend services for development, tests, or Playwright E2E.

## Hard Rules

- Work from the active monorepo checkout; never start services for a different branch by accident.
- Use package scripts and explicit env/ports for the active checkout; do not rely on removed checkout/worktree runtime scripts.
- Never run `pm2 delete all`, kill unrelated processes, or reuse another checkout's runtime state.
- Load `.opencode/rules/dev-runtime-gate.md` before tests, commit, push, or PR.

## Decision Gates

| Need                       | Action                                                             |
| -------------------------- | ------------------------------------------------------------------ |
| Normal dev server          | Use package script from `package.json`, `backend/`, or `frontend/` |
| Frontend E2E               | Start backend/frontend for the active checkout first               |
| Runtime verification fails | Stop and fix env/ports/build artifacts before tests                |
| Cleanup                    | Stop only services created for this checkout                       |

## Execution Steps

1. Confirm `pwd`, branch, and package target.
2. Read package scripts and env conventions before starting anything.
3. Verify required env/database/ports for the active checkout.
4. Start backend/frontend with explicit env and ports.
5. Capture logs, readiness URLs, PIDs/process names, and env file used.
6. Stop only this checkout's services when done or on failure.

## Output Contract

Return branch/root, commands run, backend/frontend URLs, env file used, process names/PIDs, verification status, cleanup status, and blockers.

## References

- `.opencode/rules/dev-runtime-gate.md`
- `.opencode/rules/e2e-runtime-prep.md`
- `package.json`
- `backend/package.json`
- `frontend/package.json`
