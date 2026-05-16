# FALLBACK-1/2/3 Implementation Tasks

## Review Workload Forecast

| Field                   | Value           |
| ----------------------- | --------------- |
| Estimated changed lines | 350-450         |
| 400-line budget risk    | Medium          |
| Chained PRs recommended | No              |
| Suggested split         | Single PR       |
| Delivery strategy       | single-pr       |
| Chain strategy          | stacked-to-main |

```text
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: single-pr
400-line budget risk: Medium
```

---

## FALLBACK-1: Retry y Timeout Handling

### T-1: RetryService + Error Classification

**File:** `backend/src/modules/openai/retry.service.ts` (NEW)
**Test:** `backend/src/modules/openai/retry.service.spec.ts` (NEW)

**RED:**

- Test TRANSIENT errors (500, timeout) → retry with backoff
- Test RATE_LIMIT (429) → exponential backoff
- Test AUTH errors (401) → immediate failure, no retry
- Test CLIENT errors (400, 422) → immediate failure, no retry
- Test max retries exceeded → throws after last attempt
- Test backoff timing: 1s → 2s → 4s capped at 30s
- Test configurable timeout per attempt

**GREEN:**

- `RetryConfig` interface: maxRetries, timeout, baseDelay, maxDelay
- `ErrorCategory` enum: TRANSIENT, RATE_LIMIT, AUTH, CLIENT
- `classifyError(error): ErrorCategory` — inspects HTTP status codes
- `executeWithRetry<T>(fn, config): Promise<T>` — wraps any async function

**REFACTOR:**

- Extract retry logic into reusable utility
- Add JSDoc for all public methods

**Files:**

- `backend/src/modules/openai/retry.service.ts`
- `backend/src/modules/openai/retry.service.spec.ts`

---

### T-2: Integrate Retry into OpenAI Service

**File:** `backend/src/modules/openai/openai.service.ts` (MODIFY)
**Test:** `backend/src/modules/openai/openai.service.spec.ts` (MODIFY)

**RED:**

- Test OpenAI 500 error → retries once, then fails gracefully
- Test OpenAI timeout → retries, returns "intenta de nuevo"
- Test OpenAI 401 → immediate error, no retry
- Test OpenAI 429 → backoff then retry

**GREEN:**

- Wrap `openai.chat.completions.create()` calls with `executeWithRetry()`
- Use project default config: maxRetries=2, timeout=10s
- On final failure, return structured error to conversation

**REFACTOR:**

- Centralize retry config in environment or config object

**Files:**

- `backend/src/modules/openai/openai.service.ts`
- `backend/src/modules/openai/openai.service.spec.ts`

---

## FALLBACK-2: Modo Manual (Formulario Alternativo)

### T-3: FallbackService Core

**File:** `backend/src/modules/openai/fallback.service.ts` (NEW)
**Test:** `backend/src/modules/openai/fallback.service.spec.ts` (NEW)

**RED:**

- Test `activateManualMode(conversationId)` → sets mode=MANUAL, returns first manual question
- Test `handleManualResponse(conversationId, answer)` → advances question index, accumulates data
- Test `checkRecovery(conversationId)` → probes OpenAI health, returns boolean
- Test `getManualQuestions()` → returns ordered question set for anamnesis
- Test all questions answered → returns accumulated structured data
- Test recovery detected → suggests returning to LLM mode

**GREEN:**

- `ManualQuestion` type: { id, question, field, required }
- `MANUAL_QUESTIONS` constant: ordered list for anamnesis flow
- `activateManualMode()`: update conversation mode, return first question
- `handleManualResponse()`: store answer, advance to next question or complete
- `checkRecovery()`: attempt lightweight OpenAI call to verify availability

**REFACTOR:**

- Make question set configurable
- Extract answer accumulation logic

**Files:**

- `backend/src/modules/openai/fallback.service.ts`
- `backend/src/modules/openai/fallback.service.spec.ts`

---

### T-4: Integrate Fallback into Message Flow

**File:** `backend/src/modules/twilio/reply-message.handler.ts` (MODIFY)
**File:** `backend/src/modules/openai/conversation.service.ts` (MODIFY)
**Test:** `backend/src/modules/openai/conversation.service.spec.ts` (MODIFY)

**RED:**

- Test conversation in MANUAL mode → routes to FallbackService
- Test LLM fails completely → activates manual mode, returns first question
- Test recovery detected in MANUAL mode → offers return to LLM
- Test user accepts return to LLM → resumes normal flow

**GREEN:**

- Add mode check at start of message processing
- If mode=MANUAL, delegate to FallbackService
- On LLM failure, call FallbackService.activateManualMode()
- On each message in MANUAL mode, call checkRecovery() opportunistically

**REFACTOR:**

- Extract mode routing into a clean decision function

**Files:**

- `backend/src/modules/twilio/reply-message.handler.ts`
- `backend/src/modules/openai/conversation.service.ts`

---

## FALLBACK-3: Preservación de Estado

### T-5: Schema Migration

**File:** `backend/prisma/schema.prisma` (MODIFY)
**Migration:** `backend/prisma/migrations/YYYYMMDDHHMMSS_add_fallback_fields/` (NEW)

**RED:**

- Test migration applies cleanly
- Test existing conversations get default values (mode=LLM, isDraft=true, lastSavedAt=now)

**GREEN:**

- Add to Conversation model:
  - `mode` String default "LLM" (enum: LLM | MANUAL)
  - `isDraft` Boolean default true
  - `lastSavedAt` DateTime default now()
- Create migration
- Run `prisma migrate deploy`

**REFACTOR:**

- Verify no regression on existing conversation queries

**Files:**

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/YYYYMMDDHHMMSS_add_fallback_fields/migration.sql`

---

### T-6: Auto-save and Draft Resume

**File:** `backend/src/modules/openai/conversation.service.ts` (MODIFY)
**Test:** `backend/src/modules/openai/conversation.service.spec.ts` (MODIFY)

**RED:**

- Test every 3rd message triggers auto-save (updates lastSavedAt)
- Test `saveDraft(conversationId)` → sets isDraft=true, persists partial state
- Test `resumeDraft(conversationId)` → returns accumulated data, sets isDraft=false
- Test `isDraft=true` on reconnection → offers resume prompt to user
- Test concurrent access → optimistic locking prevents overwrite

**GREEN:**

- Add `autoSaveCounter` per conversation
- On every 3rd message, update `lastSavedAt` and optionally `isDraft`
- `saveDraft()`: persist current anamnesis progress
- `resumeDraft()`: load last saved state, clear draft flag
- Add `getDraftStatus(conversationId)` for UI/notification

**REFACTOR:**

- Make save frequency configurable (default: 3 messages)
- Extract draft logic into a dedicated method

**Files:**

- `backend/src/modules/openai/conversation.service.ts`

---

### T-7: Mode Field in Conversation Response

**File:** `backend/src/modules/openai/dto/conversation-response.dto.ts` (MODIFY)
**Test:** `backend/src/modules/openai/conversations.controller.spec.ts` (MODIFY)

**RED:**

- Test GET /conversations/:id returns `mode`, `isDraft`, `lastSavedAt` fields
- Test PATCH /conversations/:id can update `mode` field

**GREEN:**

- Add `mode`, `isDraft`, `lastSavedAt` to ConversationResponseDto
- Update conversation PATCH handler to accept mode changes

**REFACTOR:**

- Verify OpenAPI schema reflects new fields

**Files:**

- `backend/src/modules/openai/dto/conversation-response.dto.ts`
- `backend/src/modules/openai/conversations.controller.spec.ts`

---

## Implementation Order

```
T-1 (retry core) → T-2 (retry integration) → T-5 (schema) →
T-3 (fallback core) → T-4 (fallback integration) →
T-6 (auto-save/draft) → T-7 (DTO updates)
```

## Dependencies

| Task | Depends On |
| ---- | ---------- |
| T-2  | T-1        |
| T-4  | T-3, T-5   |
| T-6  | T-5        |
| T-7  | T-5        |

## Verification Commands

```bash
# After each task
cd backend && pnpm test -- <specific-file>.spec.ts

# After all tasks
pnpm test                    # MUST pass
pnpm test:e2e               # MUST pass
pnpm prisma:generate        # MUST pass
pnpm exec tsc --noEmit      # MUST pass
```
