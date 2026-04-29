---
name: ticket-workflow
description: >
  Automated ticket workflow: select from Trello, create or switch to a dedicated branch, run SDD, test, judge, commit, PR, verify completion, then hand off cleanly.
  Trigger: When working on any Trello ticket, feature branch, or task from the product backlog.
license: Apache-2.0
metadata:
  author: clinix-agent
  version: "1.3"
---

## When to Use

- Working on any ticket from the Trello product backlog
- Implementing a new feature, bugfix, or improvement
- Any time code changes need to follow the full quality pipeline
- Works for **both backend and frontend** interchangeably

## Required Rules (load before starting)

| Rule | File | When |
|------|------|------|
| ticket-router | `.opencode/rules/ticket-router.md` | Before creating branches — determines which package(s) are affected |
| branch-first | `.opencode/rules/branch-first.md` | Before ANY ticket work — blocks work outside the dedicated ticket branch |
| checkout-runtime-gate | `.opencode/rules/checkout-runtime-gate.md` | Before tests, commit, and PR — ensures env/ports/runtime are ready |
| pre-commit-gate | `.opencode/rules/pre-commit-gate.md` | Before every commit — mandatory test/build gate |
| commit-language | `.opencode/rules/commit-language.md` | Before every commit — conventional commits in Spanish only |
| test-mandate | `.opencode/rules/test-mandate.md` | When writing code — every function needs tests |

## Overview

```
Trello (Backlog) → In Progress → Branch Checkout → SDD → Tests → Judge → Commit → PR → Verify → Handoff
```

This skill defines the **mandatory pipeline** that every ticket must follow. No shortcuts.

---

## Phase 1: Ticket Selection & Setup

### 1.1 Select Ticket from Trello

```
1. Source `.env.trello`
2. Read board lists via Trello REST API
3. Read tickets from the "Backlog" list via Trello REST API
4. Present tickets to user OR select by priority:
   - 🔴 Crítico first
   - 🟠 Arquitectónico second
   - 🔵 Feature nueva third
   - 🟡 Menor last
5. User confirms which ticket to work on
```

### 1.2 Move to In Progress

```
1. Get the In Progress list ID
2. Move card with Trello REST API
3. Add comment to card: "🚀 Started — Branch: feature/{TICKET-ID}"
```

### 1.3 Create or Switch to the Ticket Branch BEFORE Any Real Work

```bash
# 1. Ensure develop is current in the monorepo root checkout
git checkout develop
git pull origin develop

# 2. Create branch name
BRANCH_NAME="feature/{TICKET-ID}-{short-description}"

# 3. Create or switch to the branch from the root repo checkout
git checkout -b "$BRANCH_NAME"

# 4. Allocate runtime for this active checkout
./scripts/setup-checkout-runtime.sh "$(pwd)"

# 5. Perform ALL implementation work from this checkout
git status

# Example: feature/ADMIN-2-auditoria-cambios
# Example: feature/FE-6-admin-ui
```

**Critical branch rule:**
- Branch checkout is the FIRST mandatory step after ticket selection. Do not analyze, edit, test, or commit ticket code before the branch is active.
- Once the branch is active, all code changes, tests, commits, pushes, and PR commands MUST run from that same checkout.
- Do NOT implement the ticket on `develop`.
- Keep one ticket scope per active branch.
- Do not create additional git worktrees for ticket execution in this project.

**Runtime rule per active ticket checkout:**
- Every active ticket checkout must reuse the SAME shared database connection.
- Every active ticket checkout must get its OWN free backend/frontend ports.
- The runtime setup must search free ports so active branches never collide with other local runs.
- If env variables or ports are missing, STOP and fix runtime before testing.
- If `setup-checkout-runtime.sh` and `verify-checkout-runtime.sh` did not pass for that exact checkout, STOP: no tests, no commit, no push, no PR.

**Branch naming convention:**
| Prefix | Meaning | Example |
|--------|---------|---------|
| `feature/` | New feature | `feature/ADMIN-2-auditoria` |
| `fix/` | Bug fix | `fix/T-3-ventana-24h` |
| `refactor/` | Code improvement | `refactor/T-5-openaiservice` |
| `docs/` | Documentation | `docs/PRD-update` |

**Determine which package(s) are affected inside the monorepo:**
| Ticket prefix | Package(s) |
|---------------|---------|
| PAC-, CIT-, HC-, OAI-, TWA-, CTX-, AUTH-, DB-, ADMIN-1, ADMIN-2, RBAC-, AUDIT-, FALLBACK- | backend only |
| FE-, DSH- | frontend only |
| ADMIN-3, PDF-2, SYNC-3 | frontend only |
| ADMIN-1+frontend, cross-cutting | backend + frontend |

Important: this project uses ONE git repository at the monorepo root. Create ONE branch per ticket from the root repo, then run package-specific commands inside `backend/` or `frontend/` as needed from that same checkout.

---

## Phase 2: SDD Workflow

### Execute /sdd-new in AUTOMATIC mode

```
1. Run sdd-explore: understand what exists
2. Run sdd-propose: create change proposal
3. Run sdd-spec: define requirements + scenarios
4. Run sdd-design: technical design with file paths
5. Run sdd-tasks: break into TDD task checklist
```

### Execute /sdd-apply

```
For each task in the checklist:
  1. 🔴 RED: Write failing test FIRST
  2. 🟢 GREEN: Implement minimum code to pass
  3. 🔵 REFACTOR: Clean up while keeping tests green
  4. Move to next task
```

### Save each phase to Engram

```
After EACH phase, save with topic_key:
- sdd/{ticket-id}/explore
- sdd/{ticket-id}/proposal
- sdd/{ticket-id}/spec
- sdd/{ticket-id}/design
- sdd/{ticket-id}/tasks
- sdd/{ticket-id}/apply-{batch}
```

This enables recovery if tokens are exhausted mid-workflow.

---

## Phase 3: Testing (MANDATORY — NO EXCEPTIONS)

### 3.1 Unit Tests for New Code

**EVERY new function, service, controller, component, hook MUST have unit tests.**

#### Backend (NestJS + Jest)
```bash
# Run tests for specific module
pnpm test -- --testPathPattern=admin

# Run with coverage
pnpm test:cov
```

#### Frontend (Next.js + Vitest)
```bash
# Run tests for specific feature
pnpm test -- --grep "admin"

# Run with coverage
pnpm test:coverage
```

**Test structure (TDD):**
```typescript
describe('AdminService', () => {
  describe('create()', () => {
    it('should create doctor with valid data', ...);
    it('should throw 409 on duplicate email', ...);
    it('should throw 409 on duplicate phone', ...);
    it('should throw 409 on duplicate licenseNumber', ...);
    it('should validate specialtyId exists', ...);
    it('should hash password', ...);
    it('should write audit log', ...);
  });
});
```

### 3.2 Global Tests (DON'T BREAK EXISTING)

**MANDATORY: Run ALL project tests to verify nothing is broken.**

Before any test command, validate runtime in the active checkout:

```bash
TARGET_ROOT="$(pwd)"
./scripts/setup-checkout-runtime.sh "$TARGET_ROOT"
./scripts/verify-checkout-runtime.sh "$TARGET_ROOT"
```

```bash
# Backend — ALL tests
cd "$TARGET_ROOT"
pnpm test                    # unit tests
pnpm test:e2e               # e2e tests (if applicable)

# Frontend — ALL tests
cd "$TARGET_ROOT"
pnpm test                    # unit tests
pnpm test:integration        # integration tests (if applicable)
```

### 3.2.1 Frontend E2E Runtime (PM2 background, per active checkout)

For Playwright frontend E2E, DO NOT rely on Playwright-managed dev mode. Use PM2 background services tied to the active ticket checkout.

```bash
# Always from monorepo root, targeting the SAME ticket checkout
TARGET_ROOT="$(pwd)"
./scripts/setup-checkout-runtime.sh "$TARGET_ROOT"
./scripts/verify-checkout-runtime.sh "$TARGET_ROOT"
./scripts/checkout-runtime.sh prepare "$TARGET_ROOT" prod

# Start backend + frontend in background with PM2 (checkout-scoped names)
./scripts/checkout-runtime.sh start "$TARGET_ROOT" prod

# Run frontend E2E from the ticket checkout
set -a; source "$TARGET_ROOT/.checkout-runtime/runtime.env"; set +a
cd "$TARGET_ROOT/frontend"
E2E_PORT="$FRONTEND_PORT" E2E_BASE_URL="http://127.0.0.1:$FRONTEND_PORT" NEXT_PUBLIC_API_URL="http://127.0.0.1:$BACKEND_PORT/v1" pnpm test:e2e

# Mandatory cleanup: stop/delete ONLY this checkout's PM2 processes
cd "$TARGET_ROOT"
./scripts/checkout-runtime.sh stop "$TARGET_ROOT"
```

**PM2 safety rules:**
- Start services only for frontend E2E runs that need browser runtime.
- Run `checkout-runtime.sh prepare "$TARGET_ROOT" prod` before `start` so missing or stale prod artifacts fail early.
- Process names MUST be unique per checkout/ticket and never generic.
- Never run `pm2 delete all` or global cleanup commands.
- Cleanup must remove only the PM2 processes created for that specific checkout.
- If PM2 start/readiness fails, STOP and fix runtime before E2E, commit, push, or PR.

**If ANY test fails:**
1. Identify the broken test
2. Determine if it's a real regression or needs updating
3. Fix BEFORE proceeding
4. Re-run ALL tests to confirm

**If runtime is not ready:**
1. STOP
2. Fix env variables, generated clients, services, and free ports inside the active checkout
3. Re-run runtime verification
4. Only then run tests again

**Absolute checkout enforcement:**
- No active ticket branch = no analysis, no edits, no tests, no commit.
- No verified runtime in that checkout = no tests, no commit, no push, no PR.
- Do not create a separate git worktree for this flow; use the active repo checkout only.

### 3.3 Verification Gate

```bash
# Backend
TARGET_ROOT="$(pwd)"
cd "$TARGET_ROOT"
pnpm test
pnpm test:e2e               # if applicable
npx prisma generate         # if Prisma/schema changed

# Frontend
cd "$TARGET_ROOT"
pnpm test
pnpm test:integration       # if applicable
pnpm lint
```

**Important:** use the verification commands required by the affected package(s) and ticket, but do NOT proceed to handoff until all mandatory checks are green.

**Hard gate:** if you cannot run the required tests successfully from the active checkout with the correct runtime, you MUST NOT create a commit and MUST NOT create a PR.

---

## Phase 4: Judgment Day (Adversarial Review)

**Execute the judgment-day skill protocol:**

### 4.1 Launch Two Blind Judges

```
Judge A + Judge B in PARALLEL (delegate async)
Both review the SAME target files
Neither knows about the other
```

### 4.2 Synthesize Verdict

```
Confirmed → found by BOTH → fix immediately
Suspect   → found by ONE  → triage
Contradiction → flag for manual decision
```

### 4.3 Fix & Re-judge

```
Round 1: Find issues → Fix → Re-judge
Round 2: Find issues → Fix → Re-judge
Round 3: Clean → APPROVED ✅
         Issues remain → ASK user
```

### 4.4 Blocking Rules

- MUST NOT commit until Round 2+ returns CLEAN
- MUST NOT push until APPROVED
- MUST NOT skip re-judgment after fixes

---

## Phase 5: Commit, Push & Review Handoff

### 5.0 GGA Review Gate (MANDATORY BEFORE COMMIT)

**Run Gentleman Guardian Angel before creating any commit.**

```bash
# From repo root / product repo
gga --pr-mode
```

**Project-specific expectation:**
- `.gga` is the source of review configuration
- `AGENTS.md` provides the review rules
- If GGA reports actionable issues, fix them BEFORE commit
- Do not commit while GGA is still reporting unresolved problems for the change

### 5.1 Conventional Commits

**Format:**
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Language rule:**
- Commit messages MUST be written in Spanish.
- English commit descriptions are invalid for this project.

**Types:**
| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes nor adds |
| `test` | Adding or updating tests |
| `docs` | Documentation changes |
| `chore` | Build, tooling, dependencies |
| `style` | Formatting, no code change |
| `perf` | Performance improvement |

**Examples:**
```bash
cd "$(pwd)"
git add .
git commit -m "feat(ADMIN-2): agrega interceptor y vista de auditoría"
git commit -m "fix(T-3): valida ventana de 24 horas para WhatsApp"
git commit -m "refactor(T-5): extrae ToolExecutorService de OpenaiService"
git commit -m "test(ADMIN-1): agrega pruebas unitarias del servicio admin"
```

### 5.2 Push Branch from the Active Checkout

```bash
cd "$(pwd)"
git push -u origin feature/{TICKET-ID}-{description}
```

### 5.3 Move Trello Card to Review

```
1. Move card to "Review" list
2. Add comment: "✅ PR created — awaiting review"
```

---

## Phase 6: Create Pull Request

### Using GitHub CLI

```bash
cd "$(pwd)"
gh pr create \
  --base develop \
  --head feature/{TICKET-ID}-{description} \
  --title "{TYPE}({TICKET-ID}): {description}" \
  --body "$(cat <<'EOF'
## Summary
- {What was implemented}
- {Key changes}

## Related
- RF: {RF-XX from PRD}
- Trello: {card URL}

## Testing
- ✅ Unit tests: {count} passing
- ✅ Global tests: all passing
- ✅ Judgment Day: APPROVED (Round {N})
EOF
)"
```

### 6.1 Confirm Ticket Completion Before Handoff

Before closing the ticket, verify ALL of the following:

1. The implementation for the ticket scope is complete
2. Mandatory tests/checks are green
3. Runtime was prepared correctly with shared DB and dedicated free ports for the active checkout
4. Judgment Day (or equivalent review gate) passed
5. Commit exists on the ticket branch
6. Branch was pushed successfully
7. PR was created successfully and the PR URL was captured
8. Trello card was updated with status/comment/PR link as appropriate

Only after this confirmation is the ticket considered correctly completed for handoff.

## Phase 7: Checkout Hygiene (ONLY AFTER SUCCESSFUL HANDOFF)

### 7.1 Cleanup Rules

- NEVER switch away from the ticket branch before the branch is pushed and the PR exists
- NEVER mark the handoff complete if tests/review are still failing
- NEVER commit or open a PR if runtime verification failed in the active checkout
- If the user asks to continue iterating on the same ticket, keep working on the same branch checkout
- If both packages are involved, verify the required checks for each package from the SAME ticket branch checkout before handoff

### Move Trello Card to Done (after PR merge)

```
1. Move card to "Done" list
2. Add comment: "🎉 Merged to develop"
```

---

## SOLID Principles Checklist

Before marking any implementation as complete, verify:

| Principle | Check |
|-----------|-------|
| **S**ingle Responsibility | Each class/function has ONE reason to change |
| **O**pen/Closed | New features extend, don't modify existing code |
| **L**iskov Substitution | Derived classes are substitutable for base |
| **I**nterface Segregation | No forced dependencies on unused methods |
| **D**ependency Inversion | Depend on abstractions, not concretions |

**Applied to this project:**
- Services don't know about HTTP (controller handles that)
- Controllers don't contain business logic (service handles that)
- DTOs validate input (not services)
- Guards check auth (not controllers)

---

## Barrel Files Rule

**Only re-export from the same module's own files. Never re-export from other modules.**

✅ Correct:
```typescript
// src/modules/admin/dto/index.ts
export * from './create-doctor.dto';
export * from './update-doctor.dto';
```

❌ Incorrect:
```typescript
// src/modules/admin/dto/index.ts
export * from './create-doctor.dto';
export * from '../../audit/dto/audit-log-query.dto'; // ← cross-module leak
```

**Why:** Cross-module re-exports create implicit coupling. If `audit` module changes, `admin` breaks silently. Imports should be explicit and direct:
```typescript
// admin.controller.ts — import directly from the source module
import { AuditLogQueryDto } from '../audit/dto/audit-log-query.dto';
```

---

## Clean Architecture Checklist

| Layer | Responsibility | Depends On |
|-------|---------------|------------|
| **Controllers** | HTTP routing, request/response | Services, DTOs |
| **Services** | Business logic, orchestration | Repositories (Prisma), other services |
| **DTOs** | Input validation | Nothing (pure validation) |
| **Guards** | Auth/authorization | Auth service |
| **Prisma** | Data access | Database |

**Rules:**
- Controllers NEVER access Prisma directly
- Services NEVER access `req`/`res` objects
- DTOs NEVER contain business logic
- Guards NEVER contain business logic

---

## Decision Tree: Which Repo?

```
Ticket requires backend changes?
├── YES → Work in `backend/` from the active monorepo branch checkout
└── NO → Skip backend

Ticket requires frontend changes?
├── YES → Work in `frontend/` from the active monorepo branch checkout
└── NO → Skip frontend

Both? → Use the SAME monorepo branch checkout and touch both packages as needed
```

---

## Recovery: Token Exhaustion

If tokens run out mid-workflow:

1. **Don't panic** — all phases are saved in Engram
2. Search engram: `sdd/{ticket-id}/` to find last completed phase
3. Resume from the NEXT phase
4. Re-read the tasks from `sdd/{ticket-id}/tasks`
5. Continue apply from where you left off

---

## Commands Quick Reference

```bash
# Trello (REST API via curl + .env.trello)
source .env.trello
curl -s "https://api.trello.com/1/boards/$TRELLO_DEFAULT_BOARD_ID/lists?key=$TRELLO_API_KEY&token=$TRELLO_TOKEN&fields=name&filter=open"

# Git (desde la raíz del monorepo)
git checkout develop
git pull origin develop
git checkout -b feature/{TICKET-ID}-{desc}
git add .
git commit -m "feat({TICKET-ID}): descripción en español"
git push -u origin feature/{TICKET-ID}-{desc}

# Backend tests
cd /path/to/clinix-agent
pnpm test
pnpm test:e2e
npx prisma generate

# Frontend tests
cd /path/to/clinix-agent
pnpm test
pnpm test:integration
pnpm lint

# PR
cd /path/to/clinix-agent
gh pr create --base develop --head feature/{TICKET-ID}-{desc}
```

---

## Resources

- **PRD**: `clinix-agent/PRD.md` — Product Requirements Document v2.0
- **Product Backlog**: `clinix-agent/product-backlog.md` — All 73 items
- **AGENTS.md**: Project conventions and rules
- **Engram**: Persistent memory across sessions
