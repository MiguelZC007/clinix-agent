#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(dirname "$(realpath "$0")")"
exec "$SCRIPT_DIR/worktree-runtime.sh" start "${1:-$(pwd)}" "${2:-prod}"
