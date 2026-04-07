# Clinix Backend

Backend API para Clinix, construido con **NestJS 11**, **Prisma 7** y **PostgreSQL**.

## Stack

- NestJS 11
- Prisma 7 + `@prisma/adapter-pg`
- PostgreSQL
- Jest para unit/e2e/integration tests
- Node.js >= 22
- pnpm >= 10

## Qué hace este proyecto

El backend expone la API principal del sistema médico:

- autenticación
- gestión de doctores, pacientes y citas
- historias clínicas
- integraciones conversacionales
- webhooks e integraciones externas

La API corre con prefijo:

- `http://localhost:4000/v1`

## Instalación

```bash
pnpm install
```

## Variables de entorno

Crear y completar:

- `.env`

Variables importantes:

- `DATABASE_URL`
- credenciales de auth / JWT
- variables de integraciones externas si aplica

## Desarrollo

```bash
# modo desarrollo con watch
pnpm dev

# modo normal
pnpm start

# modo debug
pnpm start:debug
```

## Prisma

```bash
# generar cliente
pnpm prisma:generate

# migraciones en desarrollo
pnpm prisma:migrate:dev

# aplicar migraciones en deploy
pnpm prisma:migrate:deploy

# validar schema
pnpm prisma:validate

# abrir studio
pnpm prisma:studio

# seed
pnpm prisma:seed
```

## Seed de datos de prueba

La seed crea especialidades, doctores, pacientes, citas, historias clínicas y usuarios de prueba para E2E.

Credenciales importantes creadas por `pnpm prisma:seed`:

| Rol | Email | Teléfono | Password |
|-----|-------|----------|----------|
| Admin | `admin@clinix.com` | `+59170000001` | `Admin123!` |
| Doctor | `doctor.test@clinix.com` | `+59170000002` | `Doctor123!` |
| Patient | `patient.test@clinix.com` | `+59170000003` | `Patient123!` |
| E2E doctor | `test-e2e@clinix.local` | `+59170000000` | `Test123!` |

## Tests

```bash
# unit tests
pnpm test

# coverage
pnpm test:cov

# e2e backend
pnpm test:e2e

# integración puntual
pnpm test:integration

# webhook tests
pnpm test:webhook
```

## Scripts útiles

```bash
# lint
pnpm lint

# build
pnpm build
```

## Estructura general

```text
src/
  modules/      # dominios NestJS
  core/         # piezas compartidas
prisma/
  schema.prisma
  seed.ts
test/
  *.e2e-spec.ts
```

## Notas

- Antes de correr integración real con frontend/E2E, asegurate de tener migraciones aplicadas y seed ejecutado.
- Si cambiás schema o contratos que afectan frontend, actualizá también la documentación del otro proyecto.
