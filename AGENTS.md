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

| When                                                  | Load              | File                                   |
| ----------------------------------------------------- | ----------------- | -------------------------------------- |
| Starting any ticket                                   | ticket-router     | `.opencode/rules/ticket-router.md`     |
| Starting any ticket                                   | branch-first      | `.opencode/rules/branch-first.md`      |
| Before ANY commit                                     | pre-commit-gate   | `.opencode/rules/pre-commit-gate.md`   |
| Before ANY commit                                     | commit-language   | `.opencode/rules/commit-language.md`   |
| Before tests/commit/PR for the active ticket checkout | dev-runtime-gate  | `.opencode/rules/dev-runtime-gate.md`  |
| Before frontend or backend E2E tests                  | e2e-runtime-prep  | `.opencode/rules/e2e-runtime-prep.md`  |
| Writing new code                                      | test-mandate      | `.opencode/rules/test-mandate.md`      |
| Writing backend tests                                 | backend-testing   | `.opencode/rules/backend-testing.md`   |
| Writing E2E frontend tests                            | frontend-e2e      | `.opencode/rules/frontend-e2e.md`      |
| Creating/modifying project skills                     | skill-consistency | `.opencode/rules/skill-consistency.md` |
| Database schema changes, migrations, Prisma errors    | prisma-orm        | `.opencode/rules/prisma-orm.md`        |

## Skills (load on demand)

| When                                               | Load              |
| -------------------------------------------------- | ----------------- |
| Working a ticket end-to-end                        | `ticket-workflow` |
| Adversarial code review                            | `judgment-day`    |
| SDD phases                                         | `sdd-*` skills    |
| Creating PR                                        | `branch-pr`       |
| Writing backend tests (unit/integration/API)       | `backend-testing` |
| Writing frontend E2E tests (Playwright)            | `frontend-e2e`    |
| Starting/stopping dev services                     | `dev-services`    |
| Database schema changes, migrations, Prisma errors | `prisma-orm`      |

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
- **Base branch:** SIEMPRE partir de `develop`. NO negociable.
- **PR target:** SIEMPRE apuntar a `develop`. NUNCA merge a `main`. NO negociable.
- **Tests:** Every new code MUST have tests (see `test-mandate`)
- **SOLID:** Single responsibility, no business logic in controllers
- **Barrel files:** Only re-export from the same module's own files. Never re-export from other modules (e.g. `moduleX/dto/index.ts` must NOT `export * from '../../moduleY/dto/...'`)
- **No secrets:** Never commit `.env`, credentials, tokens
- **Git libre:** Todos los comandos de `git` y `gh` están permitidos sin autorización (add, commit, push, pull, rebase, merge, checkout, stash, branch, etc.)
- **Git destructivo:** Requieren autorización explícita del usuario: `git reset --hard`, `git push --force`, `git clean -fd`, `git branch -D`, `gh api -X DELETE` y cualquier operación que pueda perder trabajo no commiteado
- **No `rm` destructive:** Use minimal, reversible changes
- **Git repo boundary:** `clinix-agent/` is the REAL git repository root for the product.
- **Monorepo multipaquete:** `backend/` and `frontend/` are packages/apps inside the SAME git repo, not separate git repositories.
- Work from `clinix-agent/` for shared context, docs, backlog, `.opencode`, `.atl`, Trello coordination, git branches, commits, pushes, and PRs.
- Use package directories (`backend/`, `frontend/`) as execution targets for package-specific commands, but treat git history, branches, and PRs as root-repo concerns.
- Never assume `backend/` or `frontend/` are standalone git repos.
- **Branch first:** todo ticket debe crear o cambiar a su branch dedicada antes de analizar, editar, testear o commitear.
- **Checkout estricto:** una vez seleccionado el ticket, TODO el trabajo real debe hacerse desde el checkout activo de esa branch. Nada de mezclar cambios en otra branch o fuera del repo raíz.
- **Runtime activo por branch/ticket:** cada branch debe verificar env, base de datos y puertos libres antes de ejecutar servicios o E2E.
- **No tests, no commit, no PR:** si la branch activa no puede ejecutar las pruebas requeridas con su entorno listo, se bloquea el handoff.
- **develop es la única base:** todo ticket, branch y PR parte de `develop` y apunta a `develop`. `main` es solo para releases controlados. NO negociable.
- **Sin checks requeridos, no push:** si tests/lint/build aplicables no pasaron en ese checkout/branch activo, no se puede commitear, pushear ni abrir PR.

## Architecture

- Backend modules: `src/modules/{domain}/` — each has controller, service, DTOs
- Frontend features: `src/features/{domain}/` — types, schemas, api, hooks, ui
- Shared: `src/core/` (backend), `src/lib/` (frontend)
- DB: Prisma schema at `prisma/schema.prisma`
- API prefix: `/v1` on port 4000

## Trello

- **Usar SIEMPRE el MCP de Trello** para consultar y gestionar el tablero.
- Tablero por defecto: **clinix-agent** (`69ccabd11d021eb19eae2829`).

## Reference Docs (read when needed)

| Document                        | When to read                     |
| ------------------------------- | -------------------------------- |
| `PRD.md`                        | Understanding requirements       |
| `product-backlog.md`            | Full backlog with TDD per ticket |
| `DIAGRAM-CONVERSATION-FLOW.md`  | How conversations work           |
| `DIAGRAM-AGENT-ARCHITECTURE.md` | Agent/sub-agent architecture     |
