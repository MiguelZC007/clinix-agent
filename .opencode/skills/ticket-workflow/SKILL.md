---
name: ticket-workflow
description: "Trigger: Trello ticket, product backlog task, feature branch, or full delivery flow. Run branch-first SDD, tests, review, PR, and handoff."
license: Apache-2.0
metadata:
  author: clinix-agent
  version: "1.4"
---

## Activation Contract

Load this skill before any real work on a Trello ticket, backlog item, feature branch, bugfix, or implementation task that must reach commit/PR handoff.

## Hard Rules

- Branch first: no ticket analysis, edits, tests, commit, push, or PR until the dedicated branch is active from the monorepo root.
- Use the Trello MCP for this project; do not use the REST API or `.env.trello` for normal ticket management.
- Run SDD in automatic mode and save phase artifacts to Engram using `sdd/{ticket-id}/...` topic keys.
- Dev runtime gates are blocking: missing env/services or failing checks means no tests, commit, push, or PR.
- New code needs tests; no failing/skipped tests, unresolved GGA issues, or unapproved Judgment Day before commit.
- Commit messages must be conventional commits in Spanish and PRs must target `develop`, never `main`.
- Do not create extra git worktrees for ticket execution in this project.

## Decision Gates

| Situation                | Action                                                        |
| ------------------------ | ------------------------------------------------------------- |
| No ticket selected       | Read Trello backlog, pick/confirm ticket, move to In Progress |
| Backend scope            | Load backend/testing/prisma rules as applicable               |
| Frontend scope           | Load frontend/E2E rules as applicable                         |
| Cross-package scope      | Use one monorepo branch and verify both packages              |
| Diff/review risk is high | Use chained PR planning or ask before oversized delivery      |
| Any gate fails           | Stop, fix, rerun the gate; do not hand off                    |

## Execution Steps

1. Load required rules: ticket-router, branch-first, dev-runtime-gate, pre-commit-gate, commit-language, test-mandate, plus package-specific rules.
2. Select/confirm Trello ticket, move it to In Progress, and comment with the branch name.
3. From repo root, update `develop`, create/switch to `feature/{TICKET-ID}-{desc}` or `fix/{TICKET-ID}-{desc}`, then verify dev env/services for the active checkout.
4. Run SDD phases automatically: explore, proposal, spec, design, tasks, apply, verify; persist each phase to Engram.
5. Implement with TDD, run narrow then required global tests/builds/lint/generate for affected packages.
6. Run Judgment Day, fix confirmed issues, re-judge, then run `gga --pr-mode` before committing.
7. Commit in Spanish, push the branch, create PR to `develop`, update Trello to Review with PR link, and report handoff status.

## Output Contract

Return ticket ID/link, branch, SDD artifact keys, files changed summary, tests/builds/runtime evidence, review/GGA result, commit hash, PR URL, Trello status, blockers, and next step.

## References

- `AGENTS.md`
- `.opencode/rules/ticket-router.md`
- `.opencode/rules/branch-first.md`
- `.opencode/rules/dev-runtime-gate.md`
- `.opencode/rules/pre-commit-gate.md`
- `.opencode/rules/commit-language.md`
- `.opencode/rules/test-mandate.md`
- `.opencode/skills/backend-testing/SKILL.md`
- `.opencode/skills/frontend-e2e/SKILL.md`
- `.opencode/skills/prisma-orm/SKILL.md`
