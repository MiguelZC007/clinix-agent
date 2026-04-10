# Clinix Frontend

Frontend web para Clinix, construido con **Next.js 15**, **React 19**, **next-intl** y **NextAuth**.

## Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS 4
- Vitest + Testing Library
- Playwright para E2E
- Node.js >= 22
- pnpm >= 10

## Qué hace este proyecto

La app web cubre los flujos principales del dashboard médico:

- login y sesión
- administración de doctores
- pacientes
- citas
- historias clínicas
- mensajería y dashboard

## Instalación

```bash
pnpm install
```

## Variables de entorno

Crear y completar:

- `.env.local`

Variables importantes:

- `NEXT_PUBLIC_API_URL=http://localhost:4000/v1`
- `NEXTAUTH_URL=http://localhost:4301`
- variables de auth necesarias para NextAuth

## Desarrollo

```bash
pnpm dev
```

Por defecto el proyecto suele correrse en:

- `http://localhost:4301`

## Tests

### Unitarios

```bash
pnpm test
pnpm test:watch
pnpm test:ui
pnpm test:coverage
```

### Integración frontend-backend

```bash
pnpm test:integration
```

Requiere:

- backend levantado en `http://localhost:4000`
- base de datos preparada
- seed ejecutado en `backend/`

### E2E con Playwright

```bash
pnpm test:e2e
pnpm test:e2e:ui
pnpm test:e2e:debug
```

Ejemplo para correr solo RBAC-3:

```bash
pnpm test:e2e --grep "RBAC-3" --project=chromium-admin
```

## Credenciales E2E

La fuente de verdad para credenciales de prueba está en:

- `e2e/fixtures/test-credentials.ts`

Referencia humana:

- `e2e/TEST_CREDENTIALS.md`

Estas credenciales dependen de haber ejecutado:

```bash
cd ../backend
pnpm prisma:seed
```

## Auth de Playwright

Los storage states locales de Playwright **no deben subirse a git**.

La carpeta ignorada es:

- `playwright/.auth/`

Los setup files generan esos estados localmente:

- `e2e/auth-doctor.setup.ts`
- `e2e/auth-admin.setup.ts`

## Scripts útiles

```bash
# lint
pnpm lint

# build
pnpm build

# diagnóstico React
pnpm doctor
```

## Estructura general

```text
src/
  app/          # app router
  features/     # features por dominio
  lib/          # utilidades compartidas
  messages/     # i18n
e2e/
  admin/
  auth/
  pages/
  fixtures/
```

## Notas

- La API base por defecto apunta a `http://localhost:4000/v1`.
- Si corrés E2E admin, necesitás backend, frontend, DB y seed listos.
- El proyecto usa convenciones por feature (`src/features/{domain}`), así que cualquier README o doc futura debería respetar esa organización.
