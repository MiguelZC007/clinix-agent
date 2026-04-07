---
name: ticket-workflow
description: >
  Automated ticket workflow: select from Trello, branch, SDD, test, judge, commit, PR.
  Trigger: When working on any Trello ticket, feature branch, or task from the product backlog.
license: Apache-2.0
metadata:
  author: clinix-agent
  version: "1.0"
---

## When to Use

- Working on any ticket from the Trello product backlog
- Implementing a new feature, bugfix, or improvement
- Any time code changes need to follow the full quality pipeline
- Works for **both backend and frontend** interchangeably

## Required Rules (load before starting)

| Rule | File | When |
|------|------|------|
| ticket-router | `.opencode/rules/ticket-router.md` | Before creating branches — determines which repo(s) |
| pre-commit-gate | `.opencode/rules/pre-commit-gate.md` | Before every commit — mandatory test/build gate |
| test-mandate | `.opencode/rules/test-mandate.md` | When writing code — every function needs tests |

## Overview

```
Trello (Backlog) → In Progress → Branch → SDD → Tests → Judge → Commit → PR
```

This skill defines the **mandatory pipeline** that every ticket must follow. No shortcuts.

---

## Phase 1: Ticket Selection & Setup

### 1.1 Select Ticket from Trello

```
1. Get board lists: trello_get-boards → trello_get-lists
2. Read tickets from "Backlog" list: trello_get-tickets-by-list
3. Present tickets to user OR select by priority:
   - 🔴 Crítico first
   - 🟠 Arquitectónico second
   - 🔵 Feature nueva third
   - 🟡 Menor last
4. User confirms which ticket to work on
```

### 1.2 Move to In Progress

```
1. Get the In Progress list ID
2. Move card: trello_move-card(cardId, inProgressListId)
3. Add comment to card: "🚀 Started — Branch: feature/{TICKET-ID}"
```

### 1.3 Update Develop & Create Branch

```bash
# For BOTH repos (backend AND frontend)

# 1. Switch to develop
git checkout develop

# 2. Pull latest changes
git pull origin develop

# 3. Create feature branch
git checkout -b feature/{TICKET-ID}-{short-description}

# Example: feature/ADMIN-2-auditoria-cambios
# Example: feature/FE-6-admin-ui
```

**Branch naming convention:**
| Prefix | Meaning | Example |
|--------|---------|---------|
| `feature/` | New feature | `feature/ADMIN-2-auditoria` |
| `fix/` | Bug fix | `fix/T-3-ventana-24h` |
| `refactor/` | Code improvement | `refactor/T-5-openaiservice` |
| `docs/` | Documentation | `docs/PRD-update` |

**Determine which repo needs the branch:**
| Ticket prefix | Repo(s) |
|---------------|---------|
| PAC-, CIT-, HC-, OAI-, TWA-, CTX-, AUTH-, DB-, ADMIN-1, ADMIN-2, RBAC-, AUDIT-, FALLBACK- | backend only |
| FE-, DSH- | frontend only |
| ADMIN-3, PDF-2, SYNC-3 | frontend only |
| ADMIN-1+frontend, cross-cutting | both repos |

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

```bash
# Backend — ALL tests
cd backend
pnpm test                    # unit tests
pnpm test:e2e               # e2e tests (if applicable)

# Frontend — ALL tests
cd frontend
pnpm test                    # unit tests
pnpm test:integration        # integration tests (if applicable)
```

**If ANY test fails:**
1. Identify the broken test
2. Determine if it's a real regression or needs updating
3. Fix BEFORE proceeding
4. Re-run ALL tests to confirm

### 3.3 Build Verification

```bash
# Backend
cd backend
npx prisma generate          # schema compiles
pnpm build                   # TypeScript compiles

# Frontend
cd frontend
pnpm lint                    # no lint errors
pnpm build                   # Next.js compiles
```

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

## Phase 5: Commit & Push

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
git commit -m "feat(ADMIN-2): add audit logging interceptor and UI"
git commit -m "fix(T-3): verify 24h window before sending WhatsApp"
git commit -m "refactor(T-5): extract ToolExecutorService from OpenaiService"
git commit -m "test(ADMIN-1): add unit tests for admin service CRUD"
```

### 5.2 Push Branch

```bash
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
- ✅ Build: clean
- ✅ Judgment Day: APPROVED (Round {N})
EOF
)"
```

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
├── YES → Branch in backend
└── NO → Skip backend

Ticket requires frontend changes?
├── YES → Branch in frontend
└── NO → Skip frontend

Both? → Branch in BOTH repos with SAME branch name
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
# Trello
trello_get-boards                           # List boards
trello_get-lists(boardId)                   # List columns
trello_get-tickets-by-list(listId)          # Get tickets
trello_move-card(cardId, listId)            # Move ticket
trello_add-comment(cardId, text)            # Add comment
trello_create-card(name, description, listId) # Create ticket

# Git
git checkout develop && git pull origin develop
git checkout -b feature/{TICKET-ID}-{desc}
git add . && git commit -m "feat({TICKET-ID}): {desc}"
git push -u origin feature/{TICKET-ID}-{desc}

# Backend tests
cd backend
pnpm test
pnpm test:e2e
pnpm build
npx prisma generate

# Frontend tests
cd frontend
pnpm test
pnpm test:integration
pnpm lint
pnpm build

# PR
gh pr create --base develop --head feature/{TICKET-ID}-{desc}
```

---

## Resources

- **PRD**: `clinix-agent/PRD.md` — Product Requirements Document v2.0
- **Product Backlog**: `clinix-agent/product-backlog.md` — All 73 items
- **AGENTS.md**: Project conventions and rules
- **Engram**: Persistent memory across sessions
