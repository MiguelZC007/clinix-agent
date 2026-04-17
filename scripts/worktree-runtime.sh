#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Uso:
  ./scripts/worktree-runtime.sh <prepare|start|stop|restart|status> [worktree-path] [prod|dev]

Ejemplos:
  ./scripts/worktree-runtime.sh prepare ../worktrees/clinix-agent/feature/FE-12-e2e-admin prod
  ./scripts/worktree-runtime.sh start ../worktrees/clinix-agent/feature/FE-12-e2e-admin
  ./scripts/worktree-runtime.sh status ../worktrees/clinix-agent/feature/FE-12-e2e-admin

Notas:
  - Entrada canónica para runtime PM2 por worktree.
  - Para frontend E2E, usar `prepare` y luego `start` en `prod`.
  - `prepare` valida runtime y chequea artefactos prod sin arrancar PM2.
  - Backend `pnpm test:e2e` actual corre in-process y NO requiere este wrapper.
EOF
}

ACTION="${1:-}"
WORKTREE_PATH_INPUT="${2:-$(pwd)}"
RUNTIME_MODE="${3:-prod}"

if [[ "$ACTION" == "-h" || "$ACTION" == "--help" || -z "$ACTION" ]]; then
  usage
  exit 0
fi

if [[ "$ACTION" != "prepare" && "$ACTION" != "start" && "$ACTION" != "stop" && "$ACTION" != "restart" && "$ACTION" != "status" ]]; then
  printf 'Acción inválida: %s\n' "$ACTION" >&2
  usage
  exit 1
fi

if [[ "$RUNTIME_MODE" != "prod" && "$RUNTIME_MODE" != "dev" ]]; then
  printf 'Modo inválido: %s (usa dev o prod)\n' "$RUNTIME_MODE" >&2
  exit 1
fi

if ! command -v pm2 >/dev/null 2>&1; then
  printf 'pm2 no está disponible en el PATH.\n' >&2
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

if [[ ! -f "$RUNTIME_FILE" ]]; then
  "$REPO_ROOT/scripts/setup-worktree-runtime.sh" "$WORKTREE_PATH"
fi

"$REPO_ROOT/scripts/verify-worktree-runtime.sh" "$WORKTREE_PATH"

set -a
source "$RUNTIME_FILE"
set +a

APP_SCOPE="$(basename "$WORKTREE_PATH" | tr '/[:space:]' '-' | tr -cd '[:alnum:]-')"
BACKEND_APP_NAME="${APP_SCOPE}-backend"
FRONTEND_APP_NAME="${APP_SCOPE}-frontend"
BACKEND_READY_URL="http://127.0.0.1:${BACKEND_PORT}/api/docs"
FRONTEND_READY_URL="http://127.0.0.1:${FRONTEND_PORT}/es/login"

print_backend_prod_hint() {
  printf 'Falta backend/dist/src/main.js en esta worktree.\n' >&2
  printf 'El runtime prod usa `pnpm start:prod`, que necesita un build local vigente.\n' >&2
  printf 'Regeneralo en ESTA worktree con: pnpm --filter backend build\n' >&2
}

print_frontend_prod_hint() {
  local missing_path="$1"

  printf 'Artefacto prod de frontend incompleto o ausente: %s\n' "$missing_path" >&2
  printf 'El runtime prod usa `next start` y necesita un `.next` completo y vigente para ESTA worktree.\n' >&2
  printf 'Regeneralo en ESTA worktree con: pnpm --filter frontend build\n' >&2
  printf 'Si cambiaste Next/config/dependencias o copiaste un `.next` viejo, el artefacto puede ser incompatible.\n' >&2
}

prod_artifacts_ready() {
  [[ -f "$WORKTREE_PATH/backend/dist/src/main.js" ]] &&
  [[ -f "$WORKTREE_PATH/frontend/.next/BUILD_ID" ]] &&
  [[ -f "$WORKTREE_PATH/frontend/.next/build-manifest.json" ]] &&
  [[ -f "$WORKTREE_PATH/frontend/.next/routes-manifest.json" ]]
}

check_prod_artifacts() {
  if [[ ! -f "$WORKTREE_PATH/backend/dist/src/main.js" ]]; then
    print_backend_prod_hint
    exit 1
  fi

  if [[ ! -d "$WORKTREE_PATH/frontend/.next" ]]; then
    print_frontend_prod_hint "$WORKTREE_PATH/frontend/.next"
    exit 1
  fi

  local frontend_required_files=(
    "$WORKTREE_PATH/frontend/.next/BUILD_ID"
    "$WORKTREE_PATH/frontend/.next/build-manifest.json"
    "$WORKTREE_PATH/frontend/.next/routes-manifest.json"
  )

  local required_file
  for required_file in "${frontend_required_files[@]}"; do
    if [[ ! -f "$required_file" ]]; then
      print_frontend_prod_hint "$required_file"
      exit 1
    fi
  done
}

build_prod_artifacts() {
  printf 'Artefactos prod ausentes o incompletos — iniciando build en %s...\n' "$WORKTREE_PATH"
  (cd "$WORKTREE_PATH" && pnpm --filter backend build)
  (cd "$WORKTREE_PATH" && pnpm --filter frontend build)
  printf 'Build prod completado.\n'
}

prepare_runtime() {
  if [[ "$RUNTIME_MODE" == "prod" ]]; then
    if ! prod_artifacts_ready; then
      build_prod_artifacts
    fi
    check_prod_artifacts
    printf 'Runtime verificado y artefactos prod listos para %s\n' "$WORKTREE_PATH"
    printf 'Siguiente paso: ./scripts/worktree-runtime.sh start "%s" prod\n' "$WORKTREE_PATH"
    return 0
  fi

  printf 'Runtime verificado para %s en modo %s\n' "$WORKTREE_PATH" "$RUNTIME_MODE"
}

if [[ "$RUNTIME_MODE" == "prod" ]]; then
  BACKEND_START_CMD="PORT='$BACKEND_PORT' pnpm start:prod"
  FRONTEND_START_CMD="PORT='$FRONTEND_PORT' E2E_PORT='$FRONTEND_PORT' E2E_BASE_URL='http://127.0.0.1:$FRONTEND_PORT' pnpm start"
else
  BACKEND_START_CMD="PORT='$BACKEND_PORT' pnpm dev"
  FRONTEND_START_CMD="PORT='$FRONTEND_PORT' E2E_PORT='$FRONTEND_PORT' E2E_BASE_URL='http://127.0.0.1:$FRONTEND_PORT' pnpm exec next dev --port '$FRONTEND_PORT'"
fi

wait_ready() {
  local url="$1"
  local label="$2"

  for _ in {1..60}; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done

  printf '%s no respondió en %s\n' "$label" "$url" >&2
  return 1
}

delete_processes() {
  npx pm2 delete "$BACKEND_APP_NAME" "$FRONTEND_APP_NAME" >/dev/null 2>&1 || true
}

start_services() {
  delete_processes

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

  wait_ready "$BACKEND_READY_URL" "Backend"
  wait_ready "$FRONTEND_READY_URL" "Frontend"

  printf 'Servicios iniciados para %s\n' "$WORKTREE_PATH"
  printf 'Modo runtime: %s\n' "$RUNTIME_MODE"
  printf 'Backend PM2 app:  %s\n' "$BACKEND_APP_NAME"
  printf 'Frontend PM2 app: %s\n' "$FRONTEND_APP_NAME"
  printf 'Frontend URL: http://127.0.0.1:%s\n' "$FRONTEND_PORT"
  printf 'Backend URL:  http://127.0.0.1:%s\n' "$BACKEND_PORT"
}

stop_services() {
  delete_processes
  printf 'Servicios PM2 detenidos para %s\n' "$WORKTREE_PATH"
  printf 'Backend app: %s\n' "$BACKEND_APP_NAME"
  printf 'Frontend app: %s\n' "$FRONTEND_APP_NAME"
}

show_status() {
  printf 'Worktree: %s\n' "$WORKTREE_PATH"
  printf 'Modo runtime: %s\n' "$RUNTIME_MODE"
  printf 'Backend app: %s\n' "$BACKEND_APP_NAME"
  printf 'Frontend app: %s\n' "$FRONTEND_APP_NAME"

  npx pm2 describe "$BACKEND_APP_NAME" >/dev/null 2>&1 && printf '  - backend: presente\n' || printf '  - backend: ausente\n'
  npx pm2 describe "$FRONTEND_APP_NAME" >/dev/null 2>&1 && printf '  - frontend: presente\n' || printf '  - frontend: ausente\n'
}

case "$ACTION" in
  prepare)
    prepare_runtime
    ;;
  start)
    prepare_runtime
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
