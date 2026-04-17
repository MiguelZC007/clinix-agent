#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(dirname "$(realpath "$0")")"

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" || -z "${1:-}" ]]; then
  cat <<'EOF'
Compatibilidad heredada: usar `./scripts/worktree-runtime.sh`.

Uso equivalente:
  ./scripts/worktree-runtime.sh <prepare|start|stop|restart|status> [worktree-path] [prod|dev]

Nota:
  - Este shim conserva el comportamiento viejo, pero la ruta canónica ahora es `worktree-runtime.sh`.
  - Frontend E2E debe usar `prepare` y `start` en `prod`.
EOF
  exit 0
fi

exec "$SCRIPT_DIR/worktree-runtime.sh" "$@"
