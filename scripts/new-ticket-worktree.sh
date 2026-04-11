#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Uso:
  ./scripts/new-ticket-worktree.sh <branch-name> [base-branch]

Ejemplos:
  ./scripts/new-ticket-worktree.sh fix/T-12-arreglar-webhook
  ./scripts/new-ticket-worktree.sh feature/HC-22-listado-liviano develop

Reglas:
  - Crear la worktree ANTES de analizar, editar, testear o commitear.
  - Todo el trabajo del ticket debe hacerse dentro de la worktree creada.
  - El script corre setup y verify del runtime automáticamente.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" || $# -lt 1 || $# -gt 2 ]]; then
  usage
  exit $([[ $# -ge 1 ]] && [[ "${1:-}" =~ ^(-h|--help)$ ]] && echo 0 || echo 1)
fi

BRANCH_NAME="$1"
BASE_BRANCH="${2:-develop}"

REPO_ROOT="$(git rev-parse --show-toplevel)"
CURRENT_BRANCH="$(git branch --show-current)"
WORKTREE_ROOT="$(dirname "$REPO_ROOT")/worktrees/$(basename "$REPO_ROOT")"
WORKTREE_PATH="$WORKTREE_ROOT/$BRANCH_NAME"

if [[ -n "$(git status --porcelain)" ]]; then
  printf 'Working tree sucio en %s. Commit o stash antes de crear una worktree.\n' "$REPO_ROOT" >&2
  exit 1
fi

if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
  printf 'La branch %s ya existe localmente.\n' "$BRANCH_NAME" >&2
  exit 1
fi

if [[ "$CURRENT_BRANCH" != "$BASE_BRANCH" ]]; then
  printf 'Advertencia: estás en %s, no en %s.\n' "$CURRENT_BRANCH" "$BASE_BRANCH"
fi

mkdir -p "$WORKTREE_ROOT"
mkdir -p "$(dirname "$WORKTREE_PATH")"

printf 'Actualizando %s desde origin...\n' "$BASE_BRANCH"
git fetch origin "$BASE_BRANCH"

printf 'Creando worktree %s desde origin/%s...\n' "$WORKTREE_PATH" "$BASE_BRANCH"
git worktree add -b "$BRANCH_NAME" "$WORKTREE_PATH" "origin/$BASE_BRANCH"

printf 'Configurando runtime...\n'
"$REPO_ROOT/scripts/setup-worktree-runtime.sh" "$WORKTREE_PATH"

printf 'Verificando runtime...\n'
"$REPO_ROOT/scripts/verify-worktree-runtime.sh" "$WORKTREE_PATH"

cat <<EOF

✅ Worktree lista

Branch:    $BRANCH_NAME
Base:      $BASE_BRANCH
Ruta:      $WORKTREE_PATH

Siguientes pasos:
  cd "$WORKTREE_PATH"
  git status

Recordatorio:
  - NO hagas trabajo real desde el checkout principal.
  - SIEMPRE corré tests/commit/push/PR desde esta worktree.
EOF
