# AGENTS.md — clinix-agent

Orchestrator: load what you need, skip what you don't.

## Project

Dual-app medical assistant: conversational AI for doctors via WhatsApp + web dashboard.

- `backend/` → NestJS 11 + Prisma 7 + PostgreSQL
- `frontend/` → Next.js 15 + React 19

## Session Startup

1. Check if you're resuming mid-task → search engram: `sdd/{ticket-id}/`
2. If working on a ticket → load `.opencode/skills/ticket-workflow/SKILL.md`

## SDD Preferences

- **Execution mode:** Always `automatic` — run all phases back-to-back without pausing
- **Artifact store:** Always `engram` — persistent memory, no files created
- Don't ask, just run

## Rules (load on demand)

| When | Load | File |
|------|------|------|
| Starting any ticket | ticket-router | `.opencode/rules/ticket-router.md` |
| Starting any ticket | worktree-first | `.opencode/rules/worktree-first.md` |
| Before ANY commit | pre-commit-gate | `.opencode/rules/pre-commit-gate.md` |
| Before ANY commit | commit-language | `.opencode/rules/commit-language.md` |
| Before tests/commit/PR in a worktree | worktree-runtime-gate | `.opencode/rules/worktree-runtime-gate.md` |
| Writing new code | test-mandate | `.opencode/rules/test-mandate.md` |
| Writing backend tests | backend-testing | `.opencode/rules/backend-testing.md` |
| Writing E2E frontend tests | frontend-e2e | `.opencode/rules/frontend-e2e.md` |
| Creating/modifying project skills | skill-consistency | `.opencode/rules/skill-consistency.md` |
| Database schema changes, migrations, Prisma errors | prisma-orm | `.opencode/rules/prisma-orm.md` |

## Skills (load on demand)

| When | Load |
|------|------|
| Working a ticket end-to-end | `ticket-workflow` |
| Adversarial code review | `judgment-day` |
| SDD phases | `sdd-*` skills |
| Creating PR | `branch-pr` |
| Writing backend tests (unit/integration/API) | `backend-testing` |
| Writing frontend E2E tests (Playwright) | `frontend-e2e` |
| Starting/stopping dev services | `dev-services` |
| Database schema changes, migrations, Prisma errors | `prisma-orm` |

## Quick Commands

```bash
# Backend
cd backend && pnpm test && pnpm build && pnpm prisma:generate

# Frontend
cd frontend && pnpm test && pnpm lint && pnpm build
```

## Conventions

- **Commits:** Conventional commits only (`feat`, `fix`, `refactor`, `test`, `docs`) y SIEMPRE en español
- **Branches:** `feature/{TICKET-ID}-{desc}`, `fix/{TICKET-ID}-{desc}`
- **PR target:** NEVER merge to `main` — always target `develop`
- **Tests:** Every new code MUST have tests (see `test-mandate`)
- **SOLID:** Single responsibility, no business logic in controllers
- **Barrel files:** Only re-export from the same module's own files. Never re-export from other modules (e.g. `moduleX/dto/index.ts` must NOT `export * from '../../moduleY/dto/...'`)
- **No secrets:** Never commit `.env`, credentials, tokens
- **No `rm` destructive:** Use minimal, reversible changes
- **Git repo boundary:** `clinix-agent/` is a coordination folder, not a product git repo.
- Work from `clinix-agent/` for shared context, docs, backlog, `.opencode`, `.atl`, and Trello coordination.
- Execute all product git operations only from the correct repo:
  - `backend/` for backend branches, commits, pushes, and PRs
  - `frontend/` for frontend branches, commits, pushes, and PRs
- Never create branches, commits, pushes, or PRs from the parent `clinix-agent/` folder.
- **Worktree first:** todo ticket debe crear primero una worktree dedicada antes de analizar, editar, testear o commitear.
- **Runtime por worktree:** todas las worktrees comparten la misma base de datos, pero cada una debe usar puertos propios y libres para frontend/backend.
- **No tests, no commit, no PR:** si la worktree no puede ejecutar las pruebas requeridas con su entorno listo, se bloquea el handoff.

## Architecture

- Backend modules: `src/modules/{domain}/` — each has controller, service, DTOs
- Frontend features: `src/features/{domain}/` — types, schemas, api, hooks, ui
- Shared: `src/core/` (backend), `src/lib/` (frontend)
- DB: Prisma schema at `prisma/schema.prisma`
- API prefix: `/v1` on port 4000

## Trello

- **Usar SIEMPRE la API REST de Trello directamente** (`curl` a `https://api.trello.com/1/...`), NO el MCP de Trello (tiene problemas con el token).
- Credenciales en `.env.trello` en la raíz del proyecto.
- Tablero por defecto: **clinix-agent** (`69ccabd11d021eb19eae2829`).

```bash
# Ejemplo: obtener listas del tablero clinix-agent
source .env.trello
curl -s "https://api.trello.com/1/boards/$TRELLO_DEFAULT_BOARD_ID/lists?key=$TRELLO_API_KEY&token=$TRELLO_TOKEN&fields=name&filter=open"
```

## Reference Docs (read when needed)

| Document | When to read |
|----------|-------------|
| `PRD.md` | Understanding requirements |
| `product-backlog.md` | Full backlog with TDD per ticket |
| `DIAGRAM-CONVERSATION-FLOW.md` | How conversations work |
| `DIAGRAM-AGENT-ARCHITECTURE.md` | Agent/sub-agent architecture |
