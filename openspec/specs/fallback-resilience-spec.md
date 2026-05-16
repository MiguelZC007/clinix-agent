# SDD Spec: FALLBACK Resilience Layer

**Change:** fallback-resilience
**Status:** spec
**Date:** 2026-05-16
**Scope:** backend — openai module + conversation module + prisma schema

---

## Overview

Implement a resilience layer for the OpenAI integration to handle:

1. Retry/timeout on LLM calls (FALLBACK-1)
2. Manual fallback mode when LLM fails (FALLBACK-2)
3. State preservation across failures (FALLBACK-3)

---

## FALLBACK-1: Retry y Timeout Handling

### Requirements (RFC 2119)

1. The system **MUST** wrap all `sendChatCompletion()` calls with a retry mechanism.
2. The system **MUST** classify OpenAI errors into 4 categories:
   - `TRANSIENT` (timeout, 500, 502, 503) — retryable
   - `RATE_LIMIT` (429) — retryable with backoff
   - `AUTH` (401, 403) — non-retryable, immediate failure
   - `CLIENT` (400, 422) — non-retryable, immediate failure
3. The system **MUST** apply exponential backoff for `RATE_LIMIT` errors with base delay of 1s and max delay of 30s.
4. The system **MUST** respect a timeout of 10 seconds per OpenAI call.
5. The system **MUST** retry up to 2 times for `TRANSIENT` and `RATE_LIMIT` errors.
6. The system **MUST NOT** retry for `AUTH` and `CLIENT` errors.
7. The system **SHOULD** log each retry attempt with error category, attempt number, and delay.
8. The system **MUST** return a structured `RetryResult` with `ok`, `data`, `error`, `retries` fields.

### Given/When/Then Scenarios

**Happy Path:**

```
Given the doctor sends a message
When OpenAI responds successfully on first attempt
Then the response is returned immediately
And retries is 0
```

**Timeout Retry:**

```
Given the doctor sends a message
When OpenAI times out (no response within 10s)
Then the system retries up to 2 times
And each retry waits with exponential backoff
When the 3rd attempt also times out
Then the system returns PROVIDER_RUNTIME error
```

**Rate Limit Backoff:**

```
Given the doctor sends a message
When OpenAI returns 429 (rate limit)
Then the system waits 1s before first retry
And waits 2s before second retry
When the 3rd attempt succeeds
Then the response is returned with retries=2
```

**Auth Error No Retry:**

```
Given the doctor sends a message
When OpenAI returns 401 (unauthorized)
Then the system returns an error immediately
And retries is 0
And no retry attempts are made
```

**Transient Error Recovery:**

```
Given the doctor sends a message
When OpenAI returns 500 on first attempt
And OpenAI succeeds on second attempt
Then the response is returned with retries=1
```

### Acceptance Criteria

- [ ] `RetryService` class with `executeWithRetry(fn, config)` method
- [ ] `RetryConfig` interface: `{ maxRetries: 2, timeout: 10000, baseDelay: 1000, maxDelay: 30000 }`
- [ ] Error classification covers all HTTP status codes from OpenAI
- [ ] Exponential backoff: `min(baseDelay * 2^attempt, maxDelay)`
- [ ] All existing tests pass after refactor
- [ ] New unit tests for retry scenarios

---

## FALLBACK-2: Modo Manual

### Requirements (RFC 2119)

1. The system **MUST** detect when the LLM is completely unavailable (all retries exhausted).
2. The system **MUST** switch the conversation to `MANUAL` mode when LLM fails.
3. In `MANUAL` mode, the system **MUST** present the doctor with a simplified guided questionnaire.
4. The system **MUST** store manual responses in the same conversation/message format.
5. The system **MUST** detect when the LLM recovers (next successful call).
6. When the LLM recovers, the system **SHOULD** inform the doctor and offer to return to normal mode.
7. The system **MUST** preserve all manually-entered data when switching back to LLM mode.
8. The system **MUST** maintain a consistent message history across mode switches.

### Given/When/Then Scenarios

**LLM Failure Triggers Manual Mode:**

```
Given the doctor is in an active conversation
When the LLM fails after all retry attempts
Then the conversation mode changes to MANUAL
And the doctor receives: "El asistente IA no está disponible. Podés continuar manualmente."
And the system presents the next required field as a guided question
```

**Manual Data Entry:**

```
Given the conversation is in MANUAL mode
When the doctor enters a response to a guided question
Then the response is stored as a user message
And the system validates the response format
And the system advances to the next required field
```

**LLM Recovery Detection:**

```
Given the conversation is in MANUAL mode
When the doctor sends a new message
Then the system attempts an LLM call first
When the LLM responds successfully
Then the system switches back to LLM mode
And informs the doctor: "El asistente IA volvió a estar disponible."
And all manual data is included in the context
```

**Manual Mode Persistence:**

```
Given the conversation is in MANUAL mode
When the conversation is closed or times out
Then all manually-entered data is persisted in the database
And the conversation is marked as isDraft if incomplete
```

### Acceptance Criteria

- [ ] `FallbackService` class with `activateManualMode()`, `handleManualResponse()`, `checkRecovery()`
- [ ] `Conversation` model has `mode` field: `LLM` (default) | `MANUAL`
- [ ] Manual mode guided questions based on anamnesis schema (reason → symptoms → exam → diagnosis)
- [ ] Mode switch logged in conversation audit trail
- [ ] Unit tests for mode transitions
- [ ] Integration test: manual mode → recovery → LLM mode

---

## FALLBACK-3: Preservación de Estado

### Requirements (RFC 2119)

1. The system **MUST** auto-save conversation progress every 3 messages.
2. The system **MUST** mark incomplete conversations with `isDraft: true`.
3. The system **MUST** record `lastSavedAt` timestamp on each auto-save.
4. When the doctor reconnects, the system **MUST** detect draft conversations and offer to resume.
5. The system **MUST** restore the full message history when resuming a draft.
6. Auto-save **SHOULD NOT** increase token budget consumption by more than 5%.
7. The system **MUST** handle concurrent auto-save and LLM call without data corruption.

### Given/When/Then Scenarios

**Auto-Save Trigger:**

```
Given the doctor has sent 3 messages in a conversation
When the 3rd message is processed
Then the conversation is auto-saved to the database
And lastSavedAt is updated
And isDraft remains true until conversation is completed
```

**Draft Detection on Reconnect:**

```
Given the doctor had an incomplete conversation (isDraft=true)
When the doctor opens the chat again
Then the system shows: "Tenés una consulta en progreso. ¿Querés continuar?"
When the doctor confirms
Then the full conversation history is loaded
And the doctor continues from where they left off
```

**Concurrent Safety:**

```
Given an auto-save is in progress
When an LLM call completes simultaneously
Then both operations complete without data corruption
And the message history reflects both the saved state and the new LLM response
```

**Completed Conversation:**

```
Given a conversation reaches completion (clinic history created)
When the final message is processed
Then isDraft is set to false
And lastSavedAt reflects the completion time
```

### Acceptance Criteria

- [ ] Auto-save logic in `ConversationService.addMessage()` checks message count
- [ ] `Conversation` model has `isDraft: Boolean` (default: true) and `lastSavedAt: DateTime`
- [ ] Draft resume API: `GET /conversations?isDraft=true` returns incomplete conversations
- [ ] Resume prompt UI in `ConversationList` for draft conversations
- [ ] Unit tests for auto-save trigger logic
- [ ] Unit tests for draft detection and resume
- [ ] Concurrent operation safety test

---

## Schema Changes

### Conversation Model Update

```prisma
model Conversation {
  id            String    @id @default(uuid())
  doctorId      String
  mode          String    @default("LLM")   // NEW: LLM | MANUAL
  isDraft       Boolean   @default(true)     // NEW
  lastSavedAt   DateTime?                     // NEW
  // ... existing fields unchanged
}
```

### Migration

```sql
ALTER TABLE "Conversation" ADD COLUMN "mode" TEXT NOT NULL DEFAULT 'LLM';
ALTER TABLE "Conversation" ADD COLUMN "isDraft" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Conversation" ADD COLUMN "lastSavedAt" TIMESTAMP(3);
```

---

## File Changes Summary

| File                                          | Change Type | Description                                            |
| --------------------------------------------- | ----------- | ------------------------------------------------------ |
| `src/modules/openai/retry.service.ts`         | NEW         | RetryService, RetryConfig, error classification        |
| `src/modules/openai/fallback.service.ts`      | NEW         | FallbackService, manual mode, recovery detection       |
| `src/modules/openai/openai.service.ts`        | MODIFY      | Wrap sendChatCompletion with retry, integrate fallback |
| `src/modules/openai/conversation.service.ts`  | MODIFY      | Auto-save, draft detection, resume logic               |
| `src/modules/twilio/reply-message.handler.ts` | MODIFY      | Error routing to fallback mode                         |
| `prisma/schema.prisma`                        | MODIFY      | Add mode, isDraft, lastSavedAt to Conversation         |
| `prisma/migrations/`                          | NEW         | Migration for Conversation schema changes              |
| Tests for all new services                    | NEW         | Unit + integration tests                               |
