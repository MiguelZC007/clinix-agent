# Proposal: FALLBACK Resilience Layer for OpenAI Integration

## Intent
Add a resilience layer around the OpenAI-driven anamnesis flow so doctors can continue working when the LLM is slow, rate-limited, unavailable, or temporarily degraded. The change covers retry/timeout behavior, a manual fallback mode, and draft/state preservation for interrupted conversations.

## Problem
Current OpenAI integration fails hard:
- no timeout or retry policy exists at the `sendChatCompletion()` choke point;
- when the LLM fails, the doctor has no guided alternative path;
- conversation progress can be lost during mid-flow failures or reconnects.

This creates avoidable workflow interruption in a clinical setting.

## Scope
### In scope
- Add centralized retry/timeout handling for OpenAI requests.
- Add failure classification for timeout, 429, 5xx, and non-retriable auth/config errors.
- Add manual fallback mode when LLM interaction cannot continue.
- Preserve partial anamnesis progress as draft state and recover it on reconnect/resume.
- Add conversation state fields required to track mode and draft persistence.
- Update affected backend flow handlers/services and corresponding tests.

### Out of scope
- Reworking the full conversation architecture.
- Rich frontend redesign for manual fallback beyond what is required to continue the workflow.
- Multi-provider LLM failover.
- Historical backfill/migration of old conversations beyond safe defaults.

## Affected Areas
- `backend/src/modules/openai/openai.service.ts` — retry/timeout choke point.
- `backend/src/modules/openai/.../reply-message.handler.ts` — route to fallback behavior on terminal failure.
- `backend/src/modules/conversation/conversation.service.ts` — draft save/recovery hooks.
- Prisma conversation model/schema — `mode`, `isDraft`, `lastSavedAt`.
- New services:
  - `retry.service.ts`
  - `fallback.service.ts`
- Backend tests around OpenAI error handling, conversation persistence, and fallback transitions.
- Frontend/API touchpoints only if needed to expose manual-mode or resumed draft state.

## Implementation Approach
1. Introduce a retry policy service with configurable timeout, retry count, backoff, and error classification.
2. Wrap OpenAI completion requests with that policy:
   - timeout at 10s;
   - retry timeout once;
   - retry 429 with exponential backoff;
   - retry 5xx up to two times;
   - fail fast on 401/config/auth errors.
3. On terminal retriable failure, switch the active conversation to `MANUAL` mode instead of leaving the doctor blocked.
4. Implement a lightweight manual guided flow that continues anamnesis without LLM dependency.
5. Persist conversation state as draft during progression and on failure boundaries.
6. On reconnect/resume, restore draft/manual state and allow either continuation or return to LLM mode when healthy.
7. Cover the flow with strict TDD evidence across unit/integration tests.

## Dependencies
- Prisma schema migration for conversation state fields.
- Existing OpenAI conversation flow and message persistence.
- Backend test harness for OpenAI and conversation services.
- Possible frontend/API contract adjustments if manual mode needs explicit rendering/state handling.

## Risks
- Race conditions between message save and fallback transition.
- Inconsistent manual↔LLM continuity if state boundaries are unclear.
- Extra persistence writes from draft autosave.
- Retry behavior causing duplicate provider calls if idempotency is not handled carefully.

## Rollback
- Revert schema additions and disable fallback routing.
- Return OpenAI calls to direct execution without retry wrapper.
- Leave existing generic failure path intact.
- Because the change is cross-cutting, rollback should be done as a single revert of the resilience feature set.

## Success Criteria
- Timeout, 429, and 5xx failures follow the expected retry policy.
- 401/auth errors fail immediately and do not retry.
- After terminal LLM failure, the doctor can continue in manual mode.
- Conversation progress survives failure and reconnect via draft recovery.
- Manual mode can return to normal LLM-assisted flow when recovery is possible.
- Automated tests prove retry classification, fallback activation, and state recovery.

## Acceptance Criteria
1. **Retry/timeout**
   - OpenAI timeout at 10s retries once, then activates fallback on repeated failure.
   - HTTP 429 retries with exponential backoff within configured limits.
   - HTTP 5xx retries up to two times, then activates fallback.
   - HTTP 401 does not retry and returns immediate operational error.
2. **Manual fallback**
   - Terminal LLM failure marks the conversation as manual mode.
   - Doctor receives a usable guided alternative flow without LLM dependency.
   - If LLM health is restored, the system can offer return to normal mode without losing collected data.
3. **State preservation**
   - Partial anamnesis data is persisted as draft state during the interaction.
   - Draft/manual conversations can be resumed after reconnect or refresh.
   - Mode and last save metadata are available for recovery logic.

## Delivery Notes
This work is likely cross-cutting and may exceed the review budget if backend, schema, tests, and frontend recovery UI all move together. Expect follow-up design/tasks to confirm whether a chained delivery is safer.
