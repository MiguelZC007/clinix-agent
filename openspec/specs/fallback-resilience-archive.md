# Archive: FALLBACK Resilience Layer

**Status:** archived  
**Date:** 2026-05-16  
**Change:** fallback-resilience  
**Verify Status:** FAIL (see verify-reports/)

## Phase Artifacts

| Phase | Source | Archived To |
|-------|--------|-------------|
| Proposal | changes/fallback-resilience/proposal.md | `openspec/proposals/fallback-resilience-proposal.md` |
| Spec | changes/fallback-resilience/specs/fallback-spec.md | `openspec/specs/fallback-resilience-spec.md` |
| Design | changes/fallback-resilience/design.md | `openspec/designs/fallback-resilience-design.md` |
| Tasks | changes/fallback-resilience/tasks.md | `openspec/tasks/fallback-resilience-tasks.md` |
| Verify | changes/fallback-resilience/verify-report.md | `openspec/verify-reports/fallback-resilience-verify.md` |

## Implementation Status

Files created/modified:
- `backend/src/modules/openai/retry.service.ts` (174 lines) — NEW
- `backend/src/modules/openai/fallback.service.ts` (94 lines) — NEW
- `backend/src/modules/openai/__tests__/retry.service.spec.ts` (224 lines, 20 tests) — NEW
- `backend/src/modules/openai/__tests__/fallback.service.spec.ts` (112 lines, 8 tests) — NEW
- `backend/src/modules/openai/conversation.service.ts` — MODIFIED (auto-save)
- `backend/prisma/schema.prisma` — MODIFIED (ConversationMode enum, mode/isDraft/lastSavedAt)
- `backend/prisma/migrations/20260516000000_add_fallback_fields/migration.sql` — NEW

Test results at archive time: 45 suites, 416 tests passing.

## Known Blockers (from verify report)

1. RetryService not integrated into openai.service.ts
2. FallbackService not integrated into openai.service.ts / reply-message.handler.ts
3. Draft resume API not implemented (ConversationResponseDto missing fields)
4. No TDD apply-progress artifact
5. Missing e2e/tsc/build verification runs
