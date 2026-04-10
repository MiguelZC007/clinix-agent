#!/usr/bin/env bash
set -euo pipefail

WORKTREE_PATH_INPUT="${1:-$(pwd)}"
WORKTREE_PATH="$(python3 - "$WORKTREE_PATH_INPUT" <<'PY'
import os
import sys
print(os.path.realpath(sys.argv[1]))
PY
)"

RUNTIME_FILE="$WORKTREE_PATH/.worktree-runtime/runtime.env"

if [[ ! -f "$RUNTIME_FILE" ]]; then
  printf 'Falta runtime env: %s\n' "$RUNTIME_FILE" >&2
  exit 1
fi

set -a
source "$RUNTIME_FILE"
set +a

required_vars=(DATABASE_URL FRONTEND_PORT BACKEND_PORT NEXT_PUBLIC_API_URL)
for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    printf 'Variable requerida ausente: %s\n' "$var_name" >&2
    exit 1
  fi
done

if [[ "$FRONTEND_PORT" == "$BACKEND_PORT" ]]; then
  printf 'Los puertos de frontend y backend no pueden ser iguales\n' >&2
  exit 1
fi

if [[ -d "$WORKTREE_PATH/backend" && ! -f "$WORKTREE_PATH/backend/.env.worktree" ]]; then
  printf 'Falta backend/.env.worktree en la worktree\n' >&2
  exit 1
fi

if [[ -d "$WORKTREE_PATH/frontend" && ! -f "$WORKTREE_PATH/frontend/.env.worktree" ]]; then
  printf 'Falta frontend/.env.worktree en la worktree\n' >&2
  exit 1
fi

printf 'Runtime verificado para %s\n' "$WORKTREE_PATH"
printf 'Frontend port: %s\n' "$FRONTEND_PORT"
printf 'Backend port: %s\n' "$BACKEND_PORT"
