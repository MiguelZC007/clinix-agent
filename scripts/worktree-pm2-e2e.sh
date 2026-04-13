#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Uso:
  ./scripts/worktree-pm2-e2e.sh <start|stop|restart|status> [worktree-path]

Ejemplos:
  ./scripts/worktree-pm2-e2e.sh start ../worktrees/clinix-agent/feature/FE-12-e2e-admin
  ./scripts/worktree-pm2-e2e.sh stop ../worktrees/clinix-agent/feature/FE-12-e2e-admin

Notas:
  - Solo administra procesos PM2 de ESA worktree/ticket.
  - No hace build: levanta backend/frontend en background con scripts de dev.
EOF
}

ACTION="${1:-}"
WORKTREE_PATH_INPUT="${2:-$(pwd)}"

if [[ "$ACTION" == "-h" || "$ACTION" == "--help" || -z "$ACTION" ]]; then
  usage
  exit 0
fi

if [[ "$ACTION" != "start" && "$ACTION" != "stop" && "$ACTION" != "restart" && "$ACTION" != "status" ]]; then
  printf 'Acción inválida: %s\n' "$ACTION" >&2
  usage
  exit 1
fi

if ! command -v pm2 >/dev/null 2>&1; then
  printf 'pm2 no está disponible en el PATH. Instalalo para correr E2E en background.\n' >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  printf 'curl no está disponible en el PATH.\n' >&2
  exit 1
fi

WORKTREE_PATH="$(python3 - "$WORKTREE_PATH_INPUT" <<'PY'
import os
import sys
print(os.path.realpath(sys.argv[1]))
PY
)"

if [[ ! -d "$WORKTREE_PATH" ]]; then
  printf 'La worktree no existe: %s\n' "$WORKTREE_PATH" >&2
  exit 1
fi

REPO_ROOT="$(git -C "$WORKTREE_PATH" rev-parse --show-toplevel)"
RUNTIME_FILE="$WORKTREE_PATH/.worktree-runtime/runtime.env"
PM2_META_FILE="$WORKTREE_PATH/.worktree-runtime/pm2-e2e.env"

if [[ ! -f "$RUNTIME_FILE" ]]; then
  "$REPO_ROOT/scripts/setup-worktree-runtime.sh" "$WORKTREE_PATH"
fi

"$REPO_ROOT/scripts/verify-worktree-runtime.sh" "$WORKTREE_PATH"

set -a
source "$RUNTIME_FILE"
set +a

BRANCH_NAME="$(git -C "$WORKTREE_PATH" rev-parse --abbrev-ref HEAD)"
SAFE_KEY="$(python3 - "$BRANCH_NAME" <<'PY'
import re
import sys
print(re.sub(r'[^a-zA-Z0-9_-]+', '-', sys.argv[1]).strip('-').lower())
PY
)"

BACKEND_PM2_NAME="clinix-${SAFE_KEY}-backend-e2e"
FRONTEND_PM2_NAME="clinix-${SAFE_KEY}-frontend-e2e"

mkdir -p "$(dirname "$PM2_META_FILE")"
cat > "$PM2_META_FILE" <<EOF
WORKTREE_PATH=$WORKTREE_PATH
BRANCH_NAME=$BRANCH_NAME
BACKEND_PM2_NAME=$BACKEND_PM2_NAME
FRONTEND_PM2_NAME=$FRONTEND_PM2_NAME
BACKEND_PORT=$BACKEND_PORT
FRONTEND_PORT=$FRONTEND_PORT
EOF

pm2_process_exists() {
  local process_name="$1"
  pm2 jlist | python3 - "$process_name" <<'PY'
import json
import sys

target = sys.argv[1]
try:
    data = json.load(sys.stdin)
except json.JSONDecodeError:
    sys.exit(1)

for proc in data:
    if proc.get("name") == target:
        sys.exit(0)

sys.exit(1)
PY
}

wait_http_ready() {
  local url="$1"
  local timeout_seconds="${2:-120}"
  local deadline=$((SECONDS + timeout_seconds))

  while (( SECONDS < deadline )); do
    if curl --silent --show-error --output /dev/null "$url"; then
      return 0
    fi
    sleep 1
  done

  return 1
}

delete_if_exists() {
  local process_name="$1"
  if pm2_process_exists "$process_name"; then
    pm2 delete "$process_name" >/dev/null
  fi
}

start_services() {
  if [[ ! -d "$WORKTREE_PATH/backend" || ! -d "$WORKTREE_PATH/frontend" ]]; then
    printf 'La worktree debe incluir backend/ y frontend/ para ejecutar E2E frontend.\n' >&2
    exit 1
  fi

  delete_if_exists "$BACKEND_PM2_NAME"
  delete_if_exists "$FRONTEND_PM2_NAME"

  printf 'Iniciando backend en PM2 (%s, puerto %s)...\n' "$BACKEND_PM2_NAME" "$BACKEND_PORT"
  DATABASE_URL="$DATABASE_URL" \
  PORT="$BACKEND_PORT" \
  BACKEND_PORT="$BACKEND_PORT" \
  FRONTEND_PORT="$FRONTEND_PORT" \
  pm2 start pnpm --name "$BACKEND_PM2_NAME" --cwd "$WORKTREE_PATH/backend" -- run dev >/dev/null

  printf 'Iniciando frontend en PM2 (%s, puerto %s)...\n' "$FRONTEND_PM2_NAME" "$FRONTEND_PORT"
  PORT="$FRONTEND_PORT" \
  NEXT_PUBLIC_PORT="$FRONTEND_PORT" \
  BACKEND_PORT="$BACKEND_PORT" \
  E2E_PORT="$FRONTEND_PORT" \
  E2E_BASE_URL="http://127.0.0.1:$FRONTEND_PORT" \
  NEXTAUTH_URL="http://127.0.0.1:$FRONTEND_PORT" \
  NEXT_PUBLIC_API_URL="http://127.0.0.1:$BACKEND_PORT/v1" \
  pm2 start pnpm --name "$FRONTEND_PM2_NAME" --cwd "$WORKTREE_PATH/frontend" -- run dev >/dev/null

  printf 'Esperando readiness backend/frontend...\n'
  if ! wait_http_ready "http://127.0.0.1:${BACKEND_PORT}/v1" 120; then
    printf 'Backend no respondió en tiempo esperado. Últimos logs:\n' >&2
    pm2 logs "$BACKEND_PM2_NAME" --lines 60 --nostream || true
    exit 1
  fi

  if ! wait_http_ready "http://127.0.0.1:${FRONTEND_PORT}" 120; then
    printf 'Frontend no respondió en tiempo esperado. Últimos logs:\n' >&2
    pm2 logs "$FRONTEND_PM2_NAME" --lines 60 --nostream || true
    exit 1
  fi

  printf '✅ Servicios PM2 listos para E2E en %s\n' "$WORKTREE_PATH"
  printf '   Backend:  http://127.0.0.1:%s/v1\n' "$BACKEND_PORT"
  printf '   Frontend: http://127.0.0.1:%s\n' "$FRONTEND_PORT"
}

stop_services() {
  delete_if_exists "$FRONTEND_PM2_NAME"
  delete_if_exists "$BACKEND_PM2_NAME"
  printf '✅ Procesos PM2 de la worktree detenidos/eliminados:\n'
  printf '   %s\n' "$BACKEND_PM2_NAME"
  printf '   %s\n' "$FRONTEND_PM2_NAME"
}

show_status() {
  printf 'Worktree: %s\n' "$WORKTREE_PATH"
  printf 'Branch:   %s\n' "$BRANCH_NAME"
  printf 'Backend process:  %s\n' "$BACKEND_PM2_NAME"
  printf 'Frontend process: %s\n' "$FRONTEND_PM2_NAME"

  if pm2_process_exists "$BACKEND_PM2_NAME"; then
    pm2 describe "$BACKEND_PM2_NAME" >/dev/null
    printf '  - backend: presente\n'
  else
    printf '  - backend: ausente\n'
  fi

  if pm2_process_exists "$FRONTEND_PM2_NAME"; then
    pm2 describe "$FRONTEND_PM2_NAME" >/dev/null
    printf '  - frontend: presente\n'
  else
    printf '  - frontend: ausente\n'
  fi
}

case "$ACTION" in
  start)
    start_services
    ;;
  stop)
    stop_services
    ;;
  restart)
    stop_services
    start_services
    ;;
  status)
    show_status
    ;;
esac
