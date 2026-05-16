---
name: dev-services
description: "Trigger: starting, stopping, preparing, or debugging local backend/frontend dev services. Use checkout-scoped runtime safely."
license: Apache-2.0
metadata:
  author: clinix-agent
  version: "1.0"
---

## Activation Contract

Load this skill before starting, stopping, preparing, or debugging local backend/frontend services for development, tests, or Playwright E2E.

## Hard Rules

- Work from the active monorepo checkout; never start services for a different branch by accident.
- Prefer checkout-scoped runtime scripts when they exist; do not invent global ports or generic PM2 process names.
- Never run `pm2 delete all`, kill unrelated processes, or reuse another checkout's runtime state.
- If `scripts/setup-checkout-runtime.sh`, `scripts/verify-checkout-runtime.sh`, or `scripts/checkout-runtime.sh` are missing, report a blocker instead of bypassing gates.
- Load `.opencode/rules/checkout-runtime-gate.md` before tests, commit, push, or PR.

## Decision Gates

| Need                       | Action                                                             |
| -------------------------- | ------------------------------------------------------------------ |
| Normal dev server          | Use package script from `package.json`, `backend/`, or `frontend/` |
| Frontend E2E               | Prepare and start checkout-scoped runtime first                    |
| Runtime verification fails | Stop and fix env/ports/build artifacts before tests                |
| Cleanup                    | Stop only services created for this checkout                       |

## Execution Steps

1. Confirm `pwd`, branch, and package target.
2. Read runtime scripts and package scripts before starting anything.
3. Run setup/verify from repo root when checkout runtime is required.
4. Start backend/frontend with checkout-scoped env and ports.
5. Capture logs, readiness URLs, PIDs/process names, and env file used.
6. Stop only this checkout's services when done or on failure.

## Output Contract

Return branch/root, commands run, backend/frontend URLs, runtime env file, process names/PIDs, verification status, cleanup status, and blockers.

## References

- `.opencode/rules/checkout-runtime-gate.md`
- `.opencode/rules/e2e-runtime-prep.md`
- `package.json`
- `backend/package.json`
- `frontend/package.json`
