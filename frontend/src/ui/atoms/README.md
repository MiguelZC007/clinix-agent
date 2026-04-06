# Atoms

Componentes mínimos, de único propósito, sin lógica de negocio.
Reutilizables en toda la aplicación.
Compuestos solo por primitivos (`@/components/ui`) y/o elementos HTML nativos.

**Criterio:** ¿Es el componente más pequeño posible con un solo propósito?

## Componentes actuales

| Componente | Descripción |
|------------|-------------|
| Logo | Marca/logo de la aplicación |
| StatusBadge | Badge para estados (activo, cancelado, etc.) |
| LoadingSpinner | Indicador de carga (sm, md, lg) |

## Imports (directos, sin barrel)

```ts
import { Logo } from '@/ui/atoms/Logo';
import { StatusBadge } from '@/ui/atoms/StatusBadge';
import { LoadingSpinner } from '@/ui/atoms/LoadingSpinner';
```
