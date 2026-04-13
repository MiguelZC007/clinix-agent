#!/usr/bin/env bash
set -euo pipefail

WORKTREE_PATH_INPUT="${1:-$(pwd)}"
WORKTREE_PATH="$(python3 - "$WORKTREE_PATH_INPUT" <<'PY'
import os
import sys
print(os.path.realpath(sys.argv[1]))
PY
)"

APP_SCOPE="$(basename "$WORKTREE_PATH" | tr '/[:space:]' '-' | tr -cd '[:alnum:]-')"
BACKEND_APP_NAME="${APP_SCOPE}-backend"
FRONTEND_APP_NAME="${APP_SCOPE}-frontend"

npx pm2 delete "$BACKEND_APP_NAME" "$FRONTEND_APP_NAME" >/dev/null 2>&1 || true

printf 'Servicios PM2 detenidos para %s\n' "$WORKTREE_PATH"
printf 'Backend app: %s\n' "$BACKEND_APP_NAME"
printf 'Frontend app: %s\n' "$FRONTEND_APP_NAME"
