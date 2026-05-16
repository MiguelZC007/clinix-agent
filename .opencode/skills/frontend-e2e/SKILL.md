---
name: frontend-e2e
description: "Trigger: frontend E2E tests, Playwright flows, UI validation, or browser runtime checks. Apply stable Next.js E2E patterns."
license: Apache-2.0
metadata:
  author: clinix-agent
  version: "1.1"
---

## Activation Contract

Load this skill when creating, modifying, debugging, or verifying Playwright E2E tests under `frontend/e2e/` or browser-facing flows in the Next.js frontend.

## Hard Rules

- Load `.opencode/rules/frontend-e2e.md` and `.opencode/rules/e2e-runtime-prep.md` before E2E work.
- Use the active ticket checkout runtime; do not rely on ad-hoc servers or another branch's ports.
- Prefer `data-testid`, user-visible assertions, Page Object Model helpers, and independent tests.
- Never use arbitrary long waits; wait for selectors, responses, load state, or explicit readiness.
- Preserve Playwright artifacts on failure and do not mark complete until the required E2E checks pass.

## Decision Gates

| Need                       | Action                                                   |
| -------------------------- | -------------------------------------------------------- |
| Critical happy path        | Add/update smoke E2E                                     |
| CRUD/admin workflow        | Use Page Object Model under `frontend/e2e/pages/`        |
| Error/empty/loading states | Mock API responses with Playwright routing               |
| Auth-dependent flow        | Use persisted auth setup and documented test credentials |
| Flaky runtime              | Stop and fix checkout runtime before re-running          |

## Execution Steps

1. Prepare and verify checkout runtime from the monorepo root.
2. Start only checkout-scoped services when the test needs browser runtime.
3. Write or update Playwright tests with stable selectors and isolated data.
4. Run the narrow spec, then the required frontend E2E command from `frontend/`.
5. Inspect trace/video/screenshot artifacts for failures before changing app code.
6. Stop only this checkout's runtime services after E2E execution.

## Output Contract

Return affected specs/pages, runtime command evidence, E2E command results, artifact locations for failures, and any skipped or flaky scenario.

## References

- `.opencode/rules/frontend-e2e.md`
- `.opencode/rules/e2e-runtime-prep.md`
- `.opencode/rules/checkout-runtime-gate.md`
- `frontend/playwright.config.ts`
- `frontend/e2e/TEST_CREDENTIALS.md`
