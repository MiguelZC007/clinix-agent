# Verify Report: FALLBACK Resilience Layer

**Status:** FAIL
**Change:** `fallback-resilience`
**Date:** 2026-05-16

## Executive Summary
Implementation is only partially aligned with the spec/tasks. The new backend files and unit tests exist, and `cd backend && pnpm test` is GREEN, but several required integrations and strict-TDD artifacts are missing. Most critically, strict TDD is active yet no `apply-progress` artifact or `TDD Cycle Evidence` table exists, which is a **CRITICAL** verification failure.

## Spec Coverage

### FALLBACK-1: Retry/Timeout
- ✅ `backend/src/modules/openai/retry.service.ts` exists.
- ✅ Error categories implemented: `TRANSIENT`, `RATE_LIMIT`, `AUTH`, `CLIENT`, `UNKNOWN`.
- ✅ Default config matches design intent (`maxRetries=2`, `timeoutMs=10000`, `baseDelayMs=1000`, `maxDelayMs=30000`).
- ✅ Unit tests exist in `backend/src/modules/openai/__tests__/retry.service.spec.ts`.
- ❌ `openai.service.ts` is **not** wrapped with `RetryService.executeWithRetry()`.
- ❌ Tool-call rounds are **not** covered by retry integration.
- ⚠️ Spec called out structured retry logging with attempt/delay; logging exists, but integration path is absent, so runtime requirement is unmet.

### FALLBACK-2: Manual Fallback
- ✅ `backend/src/modules/openai/fallback.service.ts` exists.
- ✅ Conversation schema has `mode` field.
- ✅ Manual step list contains the 4 expected steps: `reason -> symptoms -> exam -> diagnosis`.
- ✅ Unit tests exist in `backend/src/modules/openai/__tests__/fallback.service.spec.ts`.
- ❌ `reply-message.handler.ts` does not route to fallback behavior; it still returns a generic error string on OpenAI failure.
- ❌ `openai.service.ts` does not activate manual mode on exhausted retriable failure.
- ❌ `handleManualResponse()` does not actually progress by conversation state/history; it always returns the second question.
- ❌ `checkRecovery()` does not probe the real LLM path; it resolves a local `Promise.resolve({ status: 'ok' })` through `RetryService`.
- ❌ No integration test for `manual -> recovery -> LLM` flow.
- ❌ No audit-trail logging/evidence for mode transitions beyond logger output.

### FALLBACK-3: State Preservation
- ✅ Prisma schema adds `mode`, `isDraft`, `lastSavedAt`.
- ✅ Migration file exists: `backend/prisma/migrations/20260516000000_add_fallback_fields/migration.sql`.
- ✅ `ConversationService.addMessage()` calls `maybeAutoSaveDraft()`.
- ❌ No resume/query API for draft conversations was implemented.
- ❌ `ConversationResponseDto` was not updated to expose `mode`, `isDraft`, `lastSavedAt`.
- ❌ No UI/backend resume prompt flow exists.
- ❌ No completion path to set `isDraft=false`.
- ❌ No concurrent safety test for auto-save vs LLM completion.
- ⚠️ `lastSavedAt` has no DB default/backfill despite task text expecting existing rows/default behavior.

## Task Completion Status

### Implemented
- T-1 RetryService core: **partial** (service + tests exist, integration missing)
- T-3 FallbackService core: **partial**
- T-5 Schema migration: **partial**
- T-6 Auto-save marker in `ConversationService`: **partial**

### Not completed / materially incomplete
- T-2 Integrate retry into `openai.service.ts`: **not done**
- T-4 Integrate fallback into message flow: **not done**
- T-6 Draft resume flow: **not done**
- T-7 DTO/API exposure of `mode`, `isDraft`, `lastSavedAt`: **not done**

## Validation Commands

### Commands run
```bash
cd backend && pnpm test
```

### Result
```text
Test Suites: 45 passed, 45 total
Tests:       416 passed, 416 total
```

### Not run
```bash
cd backend && pnpm test:e2e
cd backend && pnpm prisma:generate
cd backend && pnpm exec tsc --noEmit
cd backend && pnpm build
```
These were listed in config/tasks as relevant verification commands but were not part of the reported apply evidence and were not executed in this verify pass.

## Strict TDD Compliance

### TDD Compliance
| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ❌ | No `apply-progress` artifact found in `openspec/changes/fallback-resilience/` |
| TDD Cycle Evidence table present | ❌ | Missing entirely |
| All tasks have tests | ⚠️ | Only new unit test files for RetryService/FallbackService were found |
| RED confirmed (tests exist) | ⚠️ | 2/2 new test files exist, but task-level RED evidence is missing |
| GREEN confirmed (tests pass) | ✅ | `cd backend && pnpm test` passes |
| Triangulation adequate | ⚠️ | Retry tests show scenario variety; fallback tests do not cover multi-step progression/recovery integration |
| Safety Net for modified files | ❌ | Missing apply-progress evidence |

**TDD Compliance**: 1/7 checks passed

**CRITICAL:** Strict TDD mode is active and `.pi/gentle-ai/support/strict-tdd-verify.md` exists, but no `apply-progress` with `TDD Cycle Evidence` was provided. This is a blocking protocol failure.

## Test Layer Distribution
| Layer | Tests | Files | Tools |
|-------|-------|-------|-------|
| Unit | 28 | 2 | Jest |
| Integration | 0 | 0 | Jest available |
| E2E | 0 | 0 | Not run |
| **Total** | **28** | **2** | |

Coverage note: critical business behavior (mode transitions, OpenAI integration, resume flow) is missing integration/E2E coverage.

## Assertion Quality
**Assertion quality**: ✅ No tautologies or ghost loops found in the newly added fallback/retry unit tests.

Warnings:
- `backend/src/modules/openai/__tests__/fallback.service.spec.ts` is behavior-light for a stateful workflow. It verifies static prompts and a boolean recovery result, but not persisted step progression or mode recovery integration.
- Some assertions are type/presence-oriented (`toBeDefined`, `toContain`) but paired with actual service calls, so they are not CRITICAL.

## Quality / Code Findings
- ⚠️ `FallbackService.handleManualResponse()` ignores conversation history and does not advance through all manual steps; current implementation is effectively a stub.
- ⚠️ `FallbackService.checkRecovery()` does not test provider recovery; it checks an always-successful local promise through RetryService.
- ⚠️ `RetryService.computeDelay()` ignores category-specific behavior; functionally OK for current spec base values but the category parameter is unused.
- ⚠️ `ConversationService.maybeAutoSaveDraft()` is private and untested in this diff; the existing `conversation.service.spec.ts` does not cover the new autosave behavior.
- ⚠️ Migration is additive and forward-safe, but no down migration/reversibility evidence was provided.

## Review Workload / PR Boundary
- Tasks forecast said:
  - Estimated changed lines: `350-450`
  - Chained PRs recommended: `No`
  - Delivery strategy: `single-pr`
  - Chain strategy text block: `single-pr`
- ⚠️ The table in `tasks.md` is internally inconsistent: it lists `Chain strategy: stacked-to-main` in the table, but `single-pr` in the decision block. That should have been clarified before apply.
- ✅ No obvious scope creep beyond FALLBACK-1/2/3 slice.

## Migration Safety
- ✅ Additive schema migration with defaults for `mode` and `isDraft` is low-risk for existing rows.
- ⚠️ `lastSavedAt` is nullable and not backfilled; acceptable technically, but does not fully match task text expecting stronger default behavior.
- ⚠️ No rollback/down migration artifact provided.

## Exact Blockers
1. **CRITICAL** — Missing `openspec/changes/fallback-resilience/apply-progress.md` with `TDD Cycle Evidence` while strict TDD is active.
2. **CRITICAL** — `RetryService` is not integrated into `backend/src/modules/openai/openai.service.ts` despite spec/task requirements.
3. **CRITICAL** — Manual fallback is not integrated into `openai.service.ts` / `reply-message.handler.ts`; runtime still degrades to a generic error message.
4. **CRITICAL** — Draft resume/API exposure requirements are not implemented (`ConversationResponseDto` missing fields, no resume endpoint/query flow).
5. **WARNING** — Verification did not include `pnpm test:e2e`, `pnpm prisma:generate`, `pnpm exec tsc --noEmit`, or `pnpm build`.
