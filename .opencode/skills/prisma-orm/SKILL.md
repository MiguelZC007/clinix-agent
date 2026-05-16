---
name: prisma-orm
description: "Trigger: Prisma schema changes, migrations, generate, or ORM errors. Apply safe Prisma 7 + PostgreSQL workflow."
license: Apache-2.0
metadata:
  author: clinix-agent
  version: "1.0"
---

## Activation Contract

Load this skill for any change to `backend/prisma/schema.prisma`, `backend/prisma/migrations/`, `backend/prisma/seed.ts`, Prisma client generation, or Prisma runtime/migration errors.

## Hard Rules

- Never edit an already-applied migration unless explicitly recovering with user approval.
- Never use `migrate dev`, `migrate reset`, or destructive DB commands against production data.
- Always run `pnpm prisma generate` after schema or migration changes; Prisma 7 does not make this optional.
- Use descriptive migration names and verify migration status before push/PR.
- Load `.opencode/rules/prisma-orm.md` before implementing database work.

## Decision Gates

| Situation                       | Action                                                                  |
| ------------------------------- | ----------------------------------------------------------------------- |
| New model/field/index           | Edit schema, run `pnpm prisma migrate dev --name <name>`, then generate |
| Existing migrations from others | Run `pnpm prisma migrate deploy`, then generate                         |
| Client type/runtime mismatch    | Run `pnpm prisma generate`, restart backend                             |
| Local DB desync                 | Ask before reset; if approved, reset and seed                           |

## Execution Steps

1. Work from `backend/` inside the active monorepo checkout.
2. Inspect `prisma/schema.prisma`, current migrations, and `prisma.config.ts`.
3. Apply schema changes and create a migration when persistence changes.
4. Run `pnpm prisma validate`, `pnpm prisma format` when needed, `pnpm prisma migrate status`, and `pnpm prisma generate`.
5. Update tests and seed data when behavior or fixtures changed.
6. Record migration/generate evidence in the final response.

## Output Contract

Return changed Prisma files, migration name, commands run, status of `migrate status`/`generate`, test evidence, and any DB reset or seed action.

## References

- `.opencode/rules/prisma-orm.md`
- `backend/prisma/schema.prisma`
- `backend/prisma/seed.ts`
- `backend/prisma.config.ts`
