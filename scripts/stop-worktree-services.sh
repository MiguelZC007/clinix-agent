#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(dirname "$(realpath "$0")")"
exec "$SCRIPT_DIR/worktree-runtime.sh" stop "${1:-$(pwd)}"
