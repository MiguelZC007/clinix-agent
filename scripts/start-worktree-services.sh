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

RUNTIME_MODE="${2:-${WORKTREE_RUNTIME_MODE:-prod}}"
if [[ "$RUNTIME_MODE" != "prod" && "$RUNTIME_MODE" != "dev" ]]; then
  printf 'Modo inválido: %s (usa dev o prod)\n' "$RUNTIME_MODE" >&2
  exit 1
fi

APP_SCOPE="$(basename "$WORKTREE_PATH" | tr '/[:space:]' '-' | tr -cd '[:alnum:]-')"
BACKEND_APP_NAME="${APP_SCOPE}-backend"
FRONTEND_APP_NAME="${APP_SCOPE}-frontend"

if [[ "$RUNTIME_MODE" == "prod" ]]; then
  if [[ ! -f "$WORKTREE_PATH/backend/dist/src/main.js" ]]; then
    printf 'Falta build de backend (dist/src/main.js). Ejecutá: pnpm --filter backend build\n' >&2
    exit 1
  fi

  if [[ ! -d "$WORKTREE_PATH/frontend/.next" ]]; then
    printf 'Falta build de frontend (.next). Ejecutá: pnpm --filter frontend build\n' >&2
    exit 1
  fi

  BACKEND_START_CMD="PORT='$BACKEND_PORT' pnpm start:prod"
  FRONTEND_START_CMD="PORT='$FRONTEND_PORT' E2E_PORT='$FRONTEND_PORT' E2E_BASE_URL='http://127.0.0.1:$FRONTEND_PORT' pnpm exec next start --port '$FRONTEND_PORT'"
else
  BACKEND_START_CMD="PORT='$BACKEND_PORT' pnpm dev"
  FRONTEND_START_CMD="PORT='$FRONTEND_PORT' E2E_PORT='$FRONTEND_PORT' E2E_BASE_URL='http://127.0.0.1:$FRONTEND_PORT' pnpm exec next dev --port '$FRONTEND_PORT'"
fi

npx pm2 delete "$BACKEND_APP_NAME" "$FRONTEND_APP_NAME" >/dev/null 2>&1 || true

npx pm2 start bash \
  --name "$BACKEND_APP_NAME" \
  --cwd "$WORKTREE_PATH/backend" \
  --time \
  -- -lc "source '$RUNTIME_FILE'; $BACKEND_START_CMD"

npx pm2 start bash \
  --name "$FRONTEND_APP_NAME" \
  --cwd "$WORKTREE_PATH/frontend" \
  --time \
  -- -lc "source '$RUNTIME_FILE'; $FRONTEND_START_CMD"

for _ in {1..60}; do
  if curl -fsS "http://127.0.0.1:${BACKEND_PORT}/v1" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -fsS "http://127.0.0.1:${BACKEND_PORT}/v1" >/dev/null 2>&1; then
  printf 'Backend no respondió en http://127.0.0.1:%s/v1\n' "$BACKEND_PORT" >&2
  exit 1
fi

for _ in {1..60}; do
  if curl -fsS "http://127.0.0.1:${FRONTEND_PORT}/es/login" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -fsS "http://127.0.0.1:${FRONTEND_PORT}/es/login" >/dev/null 2>&1; then
  printf 'Frontend no respondió en http://127.0.0.1:%s/es/login\n' "$FRONTEND_PORT" >&2
  exit 1
fi

printf 'Servicios iniciados para %s\n' "$WORKTREE_PATH"
printf 'Modo runtime: %s\n' "$RUNTIME_MODE"
printf 'Backend PM2 app:  %s\n' "$BACKEND_APP_NAME"
printf 'Frontend PM2 app: %s\n' "$FRONTEND_APP_NAME"
printf 'Frontend URL: http://127.0.0.1:%s\n' "$FRONTEND_PORT"
printf 'Backend URL:  http://127.0.0.1:%s\n' "$BACKEND_PORT"
