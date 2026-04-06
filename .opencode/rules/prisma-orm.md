# Prisma ORM - Rule para clinix-agent

## Cuándo Aplicar

Esta rule DEBE ser seguida cuando:
- Se modifican archivos en `prisma/schema.prisma`
- Se crean o aplican migraciones
- Hay errores de "table does not exist" o "unknown argument"
- Se resetea la base de datos
- Se hace pull de cambios con nuevas migraciones

## Flujo Obligatorio

### 1. Modificar Schema → Migrar → Generar → Reiniciar

```
Editar schema.prisma
        ↓
pnpm prisma migrate dev --name "descripcion"
        ↓
pnpm prisma generate
        ↓
Reiniciar backend (kill + restart)
        ↓
Verificar en logs que no hay errores
```

### 2. Después de Pull con Migraciones Nuevas

```bash
cd backend
pnpm prisma migrate deploy
pnpm prisma generate
# Reiniciar backend si es necesario
```

### 3. Reset de Base de Datos (Development Only)

```bash
cd backend
pnpm prisma migrate reset --force
npx tsx prisma/seed.ts
# Reiniciar backend
```

## Checklist Pre-Commit

- [ ] `prisma migrate status` muestra "Database schema is up to date"
- [ ] `prisma generate` ejecutado sin errores
- [ ] Backend reiniciado y funcionando
- [ ] Seed ejecutado si se hizo reset

## Comandos por Situación

### Situación: Agregar nueva tabla/campo
```bash
pnpm prisma migrate dev --name "add_user_preferences"
pnpm prisma generate
```

### Situación: Error "table does not exist"
```bash
# Database desincronizada
pnpm prisma migrate reset --force
npx tsx prisma/seed.ts
```

### Situación: Error "migration was modified"
```bash
# Migración editada después de aplicar
pnpm prisma migrate reset --force
npx tsx prisma/seed.ts
```

### Situación: Pull con cambios de otros
```bash
pnpm prisma migrate deploy
pnpm prisma generate
```

## Anti-Patrones a Evitar

❌ **NUNCA**:
- Editar `migration.sql` ya aplicado
- Borrar carpeta de migración aplicada
- Usar `migrate dev` en producción
- Olvidar `generate` después de `migrate`
- Hacer `db push` en lugar de migraciones en proyectos con equipo

✅ **SIEMPRE**:
- Usar nombres descriptivos en migraciones
- Verificar status antes de push
- Reiniciar backend después de schema changes
- Documentar breaking changes en migraciones

## Señales de Alerta

Estos mensajes indican que necesitas aplicar esta rule:

1. `The table X does not exist in the current database`
2. `Unknown argument Y. Available options are marked with ?`
3. `Migration was modified after it was applied`
4. `P2021: The table X does not exist`
5. `PrismaClientKnownRequestError: Table 'db.X' doesn't exist`

## Comandos Rápidos

```bash
# Status check
pnpm prisma migrate status

# Fix completo (development)
pnpm prisma migrate reset --force && npx tsx prisma/seed.ts

# Regenerar cliente
pnpm prisma generate

# Validar schema
pnpm prisma validate
```

## Recursos

- Skill completo: `.opencode/skills/prisma-orm/SKILL.md`
- Schema: `prisma/schema.prisma`
- Migraciones: `prisma/migrations/`
- Seed: `prisma/seed.ts`
