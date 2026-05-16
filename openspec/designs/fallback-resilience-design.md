# SDD Design: FALLBACK Resilience Layer

**Change:** fallback-resilience  
**Status:** design  
**Date:** 2026-05-16  
**Scope:** `backend` — OpenAI conversation flow, Twilio handler, Prisma conversation state

## Executive Summary

Implement FALLBACK-1/2/3 by introducing a small resilience layer around the existing OpenAI conversation flow:

1. **RetryService** wraps outbound LLM calls with timeout, retry classification, and exponential backoff.
2. **FallbackService** owns conversation mode transitions (`LLM` ↔ `MANUAL`) and the guided manual questionnaire.
3. **ConversationService** becomes the persistence boundary for draft state, autosave markers, and resume queries.
4. **OpenaiService** remains the orchestration point for doctor message processing, but delegates retry and mode behavior to the new services.
5. **ReplyMessageHandler** stays thin: it calls the same application flow, but now receives deterministic fallback behavior instead of a generic catch-all failure.

The design keeps the change centered in `backend/src/modules/openai` and minimizes blast radius by preserving existing message storage and conversation ownership.

---

## Goals

- Add resilient retry/timeout behavior without scattering retry logic across handlers.
- Allow doctor workflows to continue when OpenAI is unavailable.
- Persist partial progress so failures do not discard anamnesis work.
- Preserve one conversation timeline across normal and manual modes.

## Non-Goals

- No frontend/dashboard resume UX in this phase.
- No new cross-service queueing or background workers.
- No replacement of the existing conversation compaction/token-budget strategy.
- No separate persistence model for manual answers; reuse `Conversation` + `Message`.

---

## Architecture

### New/Changed Components

```text
ReplyMessageHandler
  -> OpenaiService.processMessageFromDoctor()
      -> ConversationService.getOrCreateActiveConversation()
      -> ConversationService.addMessage(user)
      -> FallbackService.checkRecoveryIfManual()
      -> RetryService.executeWithRetry(() => OpenAI API call)
      -> on success: assistant/tool flow as today
      -> on exhausted retry: FallbackService.activateManualMode()
      -> if manual mode: FallbackService.handleManualResponse()
      -> ConversationService.addMessage(assistant)
      -> ConversationService.maybeAutoSaveDraft()
```

### Responsibilities

#### `RetryService` (new)

Owns:

- timeout wrapping (`AbortController` or `Promise.race` wrapper)
- error classification
- retry count and delay math
- structured retry result for logging and fallback decisions

Does **not** own:

- user-facing fallback text
- persistence
- conversation mode changes

#### `FallbackService` (new)

Owns:

- switching conversation to `MANUAL`
- selecting next guided manual prompt
- validating/manual-answer progression
- detecting LLM recovery and switching back to `LLM`

Does **not** own:

- raw OpenAI invocation
- Twilio transport
- token budget or compaction

#### `ConversationService` (extended)

Owns:

- draft metadata fields (`mode`, `isDraft`, `lastSavedAt`)
- atomic conversation updates
- autosave checkpoints
- draft lookup/resume queries

#### `OpenaiService` (modified)

Owns:

- high-level message-processing orchestration
- choosing between LLM flow and manual flow
- passing retry exhaustion into fallback activation
- preserving existing tool-call behavior behind retry wrapper

---

## Domain Model Changes

### Prisma

Prefer a typed enum instead of free-text string:

```prisma
enum ConversationMode {
  LLM
  MANUAL
}

model Conversation {
  id                        String            @id @default(uuid())
  model                     String
  systemPrompt              String
  summary                   String?
  contextTokenLimitOverride Int?
  lastActivityAt            DateTime          @default(now())
  isActive                  Boolean           @default(true)
  mode                      ConversationMode  @default(LLM)
  isDraft                   Boolean           @default(true)
  lastSavedAt               DateTime?
  createdAt                 DateTime          @default(now())
  updatedAt                 DateTime          @updatedAt
  doctorId                  String
  doctor                    Doctor            @relation(fields: [doctorId], references: [id])
  messages                  Message[]
}
```

### Why enum over string

- safer service branching
- stricter Prisma typing in tests/services
- easier future analytics/reporting

---

## Class-Level Design

### `RetryService`

```ts
interface RetryConfig {
  maxRetries: number; // default 2
  timeoutMs: number; // default 10000
  baseDelayMs: number; // default 1000
  maxDelayMs: number; // default 30000
}

enum RetryErrorCategory {
  TRANSIENT,
  RATE_LIMIT,
  AUTH,
  CLIENT,
  UNKNOWN,
}

interface RetryResult<T> {
  ok: boolean;
  data?: T;
  error?: Error;
  category?: RetryErrorCategory;
  retries: number;
}
```

Methods:

- `executeWithRetry<T>(operation: (signal?: AbortSignal) => Promise<T>, config?: Partial<RetryConfig>): Promise<RetryResult<T>>`
- `classifyError(error: unknown): RetryErrorCategory`
- `computeDelay(attempt: number, category: RetryErrorCategory): number`
- `isRetryable(category: RetryErrorCategory): boolean`

Behavior:

- Each attempt gets its own timeout budget.
- `AUTH` and `CLIENT` short-circuit immediately.
- `RATE_LIMIT` and `TRANSIENT` retry up to `maxRetries`.
- `UNKNOWN` is treated as transient-once in implementation only if mapped from timeout/network failure; otherwise fail fast to avoid masking programmer errors.

### `FallbackService`

```ts
interface ManualStep {
  key: "reason" | "symptoms" | "exam" | "diagnosis";
  prompt: string;
  validator?: (input: string) => boolean;
}

interface ManualModeResult {
  reply: string;
  mode: "MANUAL" | "LLM";
  nextStep?: string;
}
```

Methods:

- `activateManualMode(conversationId: string, cause: RetryErrorCategory | 'UNAVAILABLE'): Promise<ManualModeResult>`
- `handleManualResponse(conversationId: string, doctorMessage: string): Promise<ManualModeResult>`
- `checkRecovery(conversationId: string, probe: () => Promise<boolean>): Promise<boolean>`
- `getCurrentManualStep(messages: Message[]): ManualStep`

Behavior:

- Uses message history to infer current step instead of introducing a second persistence structure.
- Prepends a single system-style assistant message announcing manual mode.
- Guided flow remains linear for MVP safety: `reason -> symptoms -> exam -> diagnosis`.
- When recovery succeeds, mode changes back to `LLM`; manual answers stay in message history and will be part of future context.

### `ConversationService` additions

Methods:

- `updateMode(conversationId: string, mode: ConversationMode): Promise<void>`
- `markDraftSaved(conversationId: string, at?: Date): Promise<void>`
- `markConversationCompleted(conversationId: string): Promise<void>`
- `listDraftConversationsByDoctorId(doctorId: string): Promise<Conversation[]>`
- `maybeAutoSaveDraft(conversationId: string): Promise<void>`
- `getConversationProgress(conversationId: string): Promise<{ totalMessages: number; mode: ConversationMode; isDraft: boolean }>`

Behavior:

- `maybeAutoSaveDraft()` runs after message inserts and updates `lastSavedAt` every 3 persisted user/assistant messages.
- Updates use a single Prisma transaction when mode/save status must change together.

---

## Data Flow

### 1) Normal LLM flow with retry

```text
Doctor message
 -> addMessage(user)
 -> maybeAutoSaveDraft()
 -> RetryService.executeWithRetry(LLM call)
    -> success
 -> addMessage(assistant)
 -> maybeAutoSaveDraft()
 -> response back to WhatsApp/API caller
```

### 2) LLM failure -> manual fallback

```text
Doctor message
 -> addMessage(user)
 -> RetryService exhausts retries
 -> FallbackService.activateManualMode()
    -> Conversation.mode = MANUAL
    -> Conversation.isDraft = true
    -> Conversation.lastSavedAt = now
    -> assistant fallback prompt generated
 -> addMessage(assistant fallback prompt)
 -> return manual-mode guidance
```

### 3) Manual mode continuation

```text
Doctor message in MANUAL mode
 -> addMessage(user)
 -> FallbackService.handleManualResponse()
    -> inspect history
    -> validate current step
    -> generate next guided question or completion summary
 -> addMessage(assistant)
 -> maybeAutoSaveDraft()
```

### 4) Recovery while in manual mode

```text
Doctor message in MANUAL mode
 -> checkRecovery(probe via lightweight OpenAI call or next real call)
 -> if recovered
    -> Conversation.mode = LLM
    -> assistant message: recovery announcement
    -> resume standard sendChatCompletion using full history
 -> else remain MANUAL
```

---

## Integration Patterns

### `OpenaiService`

Refactor around one internal method boundary:

- current `sendChatCompletion()` becomes `sendChatCompletionWithResilience()`
- extract current raw OpenAI call to `performChatCompletion()`

Proposed structure:

```text
processMessageFromDoctor()
  -> load active conversation
  -> add user message
  -> if conversation.mode === MANUAL
       try recovery path
       else handle manual response
  -> else run resilient LLM path
```

Why:

- keeps retry isolated from tool-call orchestration
- lets manual mode bypass OpenAI entirely
- avoids duplicating add-message logic between WhatsApp and dashboard callers

### `reply-message.handler.ts`

Keep current generic catch only for transport/process failures. Do **not** activate fallback in handler. Fallback is domain behavior and should live below transport.

### Tool-call flow

Retry should wrap:

- initial `chat.completions.create`
- each follow-up `chat.completions.create` inside `handleToolCalls`

This ensures tool-call rounds share the same resilience contract.

---

## Error Handling Strategy

### Classification rules

| Category     | Examples                                | Retry | Outcome                                            |
| ------------ | --------------------------------------- | ----: | -------------------------------------------------- |
| `TRANSIENT`  | timeout, network reset, 500/502/503/504 |   yes | fallback after exhaustion                          |
| `RATE_LIMIT` | 429                                     |   yes | fallback after exhaustion                          |
| `AUTH`       | 401/403                                 |    no | fail immediately, do not promise recovery          |
| `CLIENT`     | 400/404/422                             |    no | fail immediately, surface provider/runtime problem |

### Fallback trigger policy

Fallback activates only for **provider unavailability** classes:

- exhausted `TRANSIENT`
- exhausted `RATE_LIMIT`
- timeout exhaustion

Fallback does **not** activate for:

- auth/configuration failures
- invalid client payloads
- local programming errors

Reason:
manual mode is a continuity strategy, not a blanket error suppressor.

### User-facing responses

- Manual activation: concise operational message + first guided prompt.
- Recovery: short notice that AI is available again.
- Auth/client error: explicit operational failure for logs; external copy can stay generic if product requires it.

---

## Concurrency and Consistency

### Risks

- simultaneous inbound messages for same conversation
- autosave marker racing with assistant response write
- manual-mode activation duplicated by concurrent failures

### Mitigations

1. **Mode transition in transaction**  
   `activateManualMode()` uses `prisma.$transaction` to:
   - re-read conversation
   - no-op if already `MANUAL`
   - update `mode`, `isDraft`, `lastSavedAt`

2. **Idempotent autosave marker**  
   `maybeAutoSaveDraft()` only updates conversation metadata, never rewrites messages.

3. **Message history remains append-only**  
   No in-place mutation of previous messages.

4. **Recovery check gates on current mode**  
   Before switching back to `LLM`, re-read conversation to confirm it is still `MANUAL`.

5. **Completion path clears draft flag explicitly**  
   When clinic history is successfully created, set `isDraft = false` in the same logical completion step.

---

## File Change Plan

### New files

- `backend/src/modules/openai/retry.service.ts`
- `backend/src/modules/openai/fallback.service.ts`
- `backend/src/modules/openai/retry.service.spec.ts`
- `backend/src/modules/openai/fallback.service.spec.ts`
- Prisma migration for `ConversationMode`, `mode`, `isDraft`, `lastSavedAt`

### Modified files

- `backend/src/modules/openai/openai.service.ts`
- `backend/src/modules/openai/conversation.service.ts`
- `backend/src/modules/openai/openai.module.ts`
- `backend/src/modules/twilio/reply-message.handler.ts`
- `backend/prisma/schema.prisma`
- integration/e2e tests touching OpenAI/Twilio conversation flow

---

## Testing Design

### Unit tests

#### `RetryService`

- succeeds first try
- retries transient then succeeds
- retries 429 with expected backoff progression
- does not retry auth/client errors
- returns exhausted result after timeout failures

#### `FallbackService`

- activates manual mode once
- returns first guided prompt
- advances questionnaire step by step
- rejects invalid blank/manual input when validator requires content
- switches back to `LLM` on recovery

#### `ConversationService`

- autosaves on every 3rd message
- updates `lastSavedAt`
- draft query returns only incomplete conversations
- completion clears `isDraft`

### Integration tests

- WhatsApp inbound -> retry exhaustion -> manual mode response
- manual response progression across multiple inbound messages
- manual mode -> recovery -> normal LLM response
- persistence of draft state across reconnect/resume query

### TDD sequencing

1. RED: retry classification/service tests
2. GREEN: retry service implementation
3. RED: fallback mode transition tests
4. GREEN: fallback service + schema updates
5. RED: autosave/draft tests
6. GREEN: conversation persistence changes
7. RED: integration flow tests
8. GREEN: orchestration wiring

---

## Rollout Notes

- Migration is backward-compatible via defaults.
- Existing active conversations will become `mode=LLM`, `isDraft=true`; this is acceptable until completion logic starts clearing drafts.
- If desired, a follow-up backfill can mark old inactive conversations as non-draft, but it is not required for this phase.

---

## Result Contract

- **status:** completed
- **executive_summary:** Designed a backend-centered resilience layer using `RetryService`, `FallbackService`, and conversation draft metadata. The design keeps retry logic isolated, uses append-only message history for manual mode continuity, and adds transactional mode/draft updates for safety.
- **artifacts:**
  - `openspec/changes/fallback-resilience/design.md`
- **next_recommended:** Proceed to `sdd-tasks`, then forecast review workload before `sdd-apply`.
- **risks:** Concurrent inbound messages can still interleave assistant/manual prompts; transaction boundaries reduce but do not eliminate ordering issues without future per-conversation locking.
- **skill_resolution:** none
