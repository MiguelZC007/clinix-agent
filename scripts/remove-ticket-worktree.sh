#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Uso:
  ./scripts/remove-ticket-worktree.sh <branch-name>

Ejemplos:
  ./scripts/remove-ticket-worktree.sh fix/T-12-arreglar-webhook
  ./scripts/remove-ticket-worktree.sh feature/HC-22-listado-liviano

Reglas:
  - Ejecutar desde el checkout principal, NO desde la worktree a remover.
  - La worktree solo se elimina si la branch fue pusheada y existe PR.
  - Si querés seguir iterando el ticket, NO remuevas la worktree.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" || $# -ne 1 ]]; then
  usage
  exit $([[ $# -eq 1 ]] && [[ "${1:-}" =~ ^(-h|--help)$ ]] && echo 0 || echo 1)
fi

BRANCH_NAME="$1"
REPO_ROOT="$(git rev-parse --show-toplevel)"
CURRENT_DIR="$(pwd)"
WORKTREE_ROOT="$(dirname "$REPO_ROOT")/worktrees/$(basename "$REPO_ROOT")"
WORKTREE_PATH="$WORKTREE_ROOT/$BRANCH_NAME"

if ! command -v gh >/dev/null 2>&1; then
  printf 'GitHub CLI (gh) no está disponible en el PATH.\n' >&2
  exit 1
fi

TMP_PR_JSON="$(mktemp)"
export TMP_PR_JSON
trap 'rm -f "$TMP_PR_JSON"' EXIT

if [[ "$CURRENT_DIR" == "$WORKTREE_PATH"* ]]; then
  printf 'No ejecutes este script desde la misma worktree que querés remover. Volvé al checkout principal.\n' >&2
  exit 1
fi

if [[ ! -d "$WORKTREE_PATH" ]]; then
  printf 'La worktree no existe: %s\n' "$WORKTREE_PATH" >&2
  exit 1
fi

if [[ -n "$(git -C "$WORKTREE_PATH" status --porcelain)" ]]; then
  printf 'La worktree tiene cambios sin guardar. Commit o stash antes de removerla.\n' >&2
  exit 1
fi

if ! git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
  printf 'La branch local %s no existe.\n' "$BRANCH_NAME" >&2
  exit 1
fi

if ! git rev-parse --verify --quiet "refs/remotes/origin/$BRANCH_NAME" >/dev/null; then
  printf 'La branch %s no fue pusheada a origin. No se puede remover la worktree todavía.\n' "$BRANCH_NAME" >&2
  exit 1
fi

if ! gh pr view "$BRANCH_NAME" --json number,url,state >"$TMP_PR_JSON" 2>/dev/null; then
  printf 'No existe PR para la branch %s. No se puede remover la worktree todavía.\n' "$BRANCH_NAME" >&2
  exit 1
fi

PR_NUMBER="$(python3 - <<'PY'
import json
import os
with open(os.environ['TMP_PR_JSON'], 'r', encoding='utf-8') as fh:
    data = json.load(fh)
print(data['number'])
PY
)"
PR_URL="$(python3 - <<'PY'
import json
import os
with open(os.environ['TMP_PR_JSON'], 'r', encoding='utf-8') as fh:
    data = json.load(fh)
print(data['url'])
PY
)"
PR_STATE="$(python3 - <<'PY'
import json
import os
with open(os.environ['TMP_PR_JSON'], 'r', encoding='utf-8') as fh:
    data = json.load(fh)
print(data['state'])
PY
)"

printf 'PR verificado: #%s (%s) [%s]\n' "$PR_NUMBER" "$PR_URL" "$PR_STATE"
printf 'Removiendo worktree %s...\n' "$WORKTREE_PATH"

git worktree remove "$WORKTREE_PATH"
git worktree prune

cat <<EOF

✅ Worktree removida

Branch: $BRANCH_NAME
Ruta removida: $WORKTREE_PATH
PR: $PR_URL

La branch local se conserva. Si querés borrarla más adelante, hacelo manualmente cuando corresponda.
EOF
