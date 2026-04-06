# Prisma ORM - Skill para clinix-agent

## Versión del Proyecto
- Prisma: 7.2.0
- @prisma/client: 7.2.0
- Database: PostgreSQL
- Package Manager: pnpm

## Comandos Esenciales

### Flujo de Desarrollo (Local)

```bash
# 1. Crear y aplicar migración en desarrollo
cd backend
pnpm prisma migrate dev --name "nombre_descriptivo"

# 2. Regenerar el cliente Prisma (OBLIGATORIO después de migraciones)
pnpm prisma generate

# 3. Verificar estado de migraciones
pnpm prisma migrate status
```

### Flujo de Producción/CI

```bash
# 1. Aplicar migraciones pendientes (sin crear nuevas)
pnpm prisma migrate deploy

# 2. Regenerar cliente
pnpm prisma generate
```

### Comandos de Emergencia/Reset

```bash
# Resetear base de datos (DESARROLLO ONLY - pierde todos los datos)
pnpm prisma migrate reset --force

# Después del reset, recrear datos de prueba
npx tsx prisma/seed.ts
```

## Flujo de Trabajo Correcto

### Para Agregar Nuevas Tablas/Campos:

1. **Editar schema.prisma** - Agregar modelos/campos
2. **Crear migración**: `pnpm prisma migrate dev --name "add_audit_log"`
3. **Generar cliente**: `pnpm prisma generate`
4. **Reiniciar backend** para que use el nuevo cliente

### Después de Pull/Cambios de Otros:

```bash
cd backend
pnpm prisma migrate deploy  # Aplicar migraciones nuevas
pnpm prisma generate        # Regenerar cliente
```

## Estructura del Schema

- Ubicación: `prisma/schema.prisma`
- Migraciones: `prisma/migrations/`
- Seed: `prisma/seed.ts`

## Reglas Importantes

### ⚠️ NUNCA HAGAS ESTO:
- Editar archivos de migración ya aplicados
- Borrar migraciones manualmente
- Usar `migrate dev` en producción
- Olvidar `generate` después de migrar

### ✅ SIEMPRE HAZ ESTO:
- Usar `--name` descriptivo en migraciones
- Verificar `migrate status` antes de push
- Reiniciar backend después de cambios en schema
- Backup antes de reset en datos importantes

## Troubleshooting

### "The table X does not exist"
```bash
# La base de datos está desincronizada
pnpm prisma migrate reset --force
npx tsx prisma/seed.ts
```

### "Unknown argument Y"
```bash
# El cliente Prisma está desactualizado
pnpm prisma generate
# Reiniciar backend
```

### "Migration was modified after it was applied"
```bash
# Alguien editó una migración ya aplicada
pnpm prisma migrate reset --force
npx tsx prisma/seed.ts
```

## Diferencias Entre Comandos

| Comando | Uso | Crea Migración | Aplica a DB | Uso en Prod |
|---------|-----|----------------|-------------|-------------|
| `migrate dev` | Desarrollo | ✅ Sí | ✅ Sí | ❌ No |
| `migrate deploy` | Producción/CI | ❌ No | ✅ Sí | ✅ Sí |
| `migrate reset` | Reset total | ❌ No | ✅ Recrea | ❌ Nunca |
| `db push` | Prototipado | ❌ No | ✅ Sí | ❌ No |
| `generate` | Todos | ❌ No | ❌ No | ✅ Sí |

## Notas Específicas del Proyecto

### Configuración
- Engine Type: client
- Provider: postgresql
- Config file: `prisma.config.ts`

### Seed
El proyecto tiene un seed completo que crea:
- 10 especialidades
- 10 doctores
- 100 pacientes
- 1000 citas
- 1000 historias clínicas

Ejecutar después de cada reset:
```bash
npx tsx prisma/seed.ts
```

### Credenciales de Prueba
Ver en: `frontend/e2e/TEST_CREDENTIALS.md`

## Contexto de Versiones

### Prisma v7.x Cambios Importantes:
- `migrate dev` ya NO corre `generate` automáticamente
- Siempre ejecutar `generate` explícitamente después de migrar
- Mejor soporte para Driver Adapters

## Comandos de Verificación

```bash
# Verificar estado
pnpm prisma migrate status

# Validar schema sin generar
pnpm prisma validate

# Formatear schema
pnpm prisma format

# Ver versión
pnpm prisma version
```
