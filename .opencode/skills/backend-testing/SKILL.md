---
name: backend-testing
description: "Trigger: backend unit, integration, or API tests. Apply NestJS + Prisma Jest testing and TDD rules."
license: Apache-2.0
metadata:
  author: clinix-agent
  version: "1.1"
---

## Activation Contract

Load this skill when writing, changing, debugging, or verifying backend tests in `backend/`, including NestJS services/controllers, Prisma-backed repositories, guards, and HTTP/API tests.

## Hard Rules

- Load `.opencode/rules/backend-testing.md` and `.opencode/rules/test-mandate.md` before writing testable backend code.
- Use TDD for new behavior: RED test first, GREEN minimum implementation, then refactor.
- Keep unit tests isolated with mocked dependencies; use real DB only for integration/API tests.
- Do not mark complete with failing tests, skipped tests, `it.only`, or uncovered critical paths.
- Before commit/PR, obey checkout runtime gates from `.opencode/rules/checkout-runtime-gate.md`.

## Decision Gates

| Target                              | Test type     | Location                               |
| ----------------------------------- | ------------- | -------------------------------------- |
| Service/controller/guard logic      | Unit          | `backend/src/**/*.spec.ts`             |
| Prisma repository/data behavior     | Integration   | `backend/test/**/*.repository.spec.ts` |
| HTTP endpoint behavior              | API/e2e       | `backend/test/**/*.e2e-spec.ts`        |
| Auth, validation, DB writes, errors | Critical path | Add success and failure cases          |

## Execution Steps

1. Identify the behavior and expected failures before touching implementation.
2. Write focused Jest cases with clear `describe()`/`it()` names.
3. Mock Prisma/services for unit tests; clean DB state for integration tests.
4. Run the narrow test first, then the required backend suite from `backend/`.
5. If Prisma changed, run generation and include that evidence.
6. Remove temporary debugging, skipped tests, and brittle assertions.

## Output Contract

Return test files changed, behavior covered, commands run, pass/fail evidence, coverage notes for critical paths, and any remaining risk.

## References

- `.opencode/rules/backend-testing.md`
- `.opencode/rules/test-mandate.md`
- `.opencode/rules/checkout-runtime-gate.md`
- `backend/package.json`
