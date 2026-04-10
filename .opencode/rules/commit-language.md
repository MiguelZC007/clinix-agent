# Rule: commit-language

Commit messages in this project MUST be conventional AND written in Spanish.

## Core Rule

```
Conventional commit + español = válido
Conventional commit + inglés = inválido
```

## Required Format

```text
<type>(<scope>): <descripción en español>
```

## Allowed Types

- `feat`
- `fix`
- `refactor`
- `test`
- `docs`

## Valid Examples

- `feat(RBAC-3): agrega pantalla de gestión de roles`
- `fix(T-3): corrige validación de ventana de 24 horas`
- `refactor(T-10): extrae mapeo compartido de prescripciones`
- `test(LLM-2): agrega regresiones para validación de JSON`
- `docs(PRD): actualiza alcance del flujo conversacional`

## Invalid Examples

- `refactor(T-10): extract shared prescription mapper`
- `fix: update auth flow`
- `feat(RBAC-3): add roles admin screen`

## Failure Rule

If the commit title is not in Spanish, STOP and rewrite it before committing.
