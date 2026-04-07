# Clinix Agent

Proyecto full-stack para un asistente médico con interfaz conversacional y dashboard web.

## Estructura

- `backend/` — API y lógica de negocio con **NestJS 11**, **Prisma 7** y **PostgreSQL**
- `frontend/` — dashboard web con **Next.js 15**, **React 19** y **Playwright/Vitest**
- `.opencode/` — skills, reglas y automatizaciones del flujo de trabajo
- `.atl/` — artefactos auxiliares del entorno/agentes

## Qué incluye

- autenticación
- gestión de doctores
- gestión de pacientes
- citas
- historias clínicas
- mensajería/conversación
- flujos de testing unitario, integración y E2E

## Requisitos

- Node.js >= 22
- pnpm >= 10
- PostgreSQL

## Instalación

```bash
# backend
cd backend
pnpm install

# frontend
cd ../frontend
pnpm install
```

## Desarrollo local

### Backend

```bash
cd backend
pnpm dev
```

API esperada en:

- `http://localhost:4000/v1`

### Frontend

```bash
cd frontend
pnpm dev
```

App esperada en:

- `http://localhost:4301`

## Base de datos y seed

```bash
cd backend
pnpm prisma:migrate:dev
pnpm prisma:seed
```

La seed crea datos base y usuarios de prueba para E2E.

Credenciales importantes:

| Rol | Email | Teléfono | Password |
|-----|-------|----------|----------|
| Admin | `admin@clinix.com` | `+59170000001` | `Admin123!` |
| Doctor | `doctor.test@clinix.com` | `+59170000002` | `Doctor123!` |
| Patient | `patient.test@clinix.com` | `+59170000003` | `Patient123!` |
| E2E doctor | `test-e2e@clinix.local` | `+59170000000` | `Test123!` |

## Testing

### Backend

```bash
cd backend
pnpm test
pnpm test:e2e
pnpm test:integration
```

### Frontend

```bash
cd frontend
pnpm test
pnpm test:integration
pnpm test:e2e
```

Ejemplo E2E puntual:

```bash
cd frontend
pnpm test:e2e --grep "RBAC-3" --project=chromium-admin
```

## Documentación por app

- `backend/README.md`
- `frontend/README.md`

## Convenciones importantes

- commits convencionales (`feat`, `fix`, `docs`, `refactor`, `test`)
- cada cambio nuevo debe venir con tests
- los storage states de Playwright en `frontend/playwright/.auth/` no se versionan
- `AGENTS.md` contiene reglas operativas y convenciones del proyecto
- `.gga` configura Gentleman Guardian Angel para revisión asistida

## Flujo recomendado

1. preparar backend + frontend
2. aplicar migraciones y seed
3. desarrollar por ticket/cambio
4. correr tests relevantes
5. correr `gga run` o `gga run --pr-mode`
6. recién después commitear
