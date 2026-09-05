#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"

stop_frontend() {
  local port=5183

  if command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -Command "
      \$pids = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique;
      if (\$pids) {
        \$pids | ForEach-Object {
          Stop-Process -Id \$_ -Force -ErrorAction SilentlyContinue
        }
      }
    " >/dev/null 2>&1 || true
  fi

  echo "Stopped frontend processes on port $port (if any)."
}

clean_frontend() {
  echo "Cleaning frontend..."
  (cd "$FRONTEND_DIR" && rm -rf dist node_modules/.vite)
}

install_frontend() {
  echo "Installing dependencies..."
  (cd "$FRONTEND_DIR" && npm install)
}

build_frontend() {
  echo "Building frontend..."
  (cd "$FRONTEND_DIR" && npm run build)
}

run_frontend() {
  echo "Starting frontend on http://localhost:5183 ..."
  (cd "$FRONTEND_DIR" && npm run dev)
}

show_menu() {
  cat <<'EOF'
=========================================
  TeaLeafLedger — Frontend Manager
=========================================
Select action:
1) Clean
2) Install dependencies
3) Build
4) Stop
5) Run
6) Clean + Build
7) Clean + Run (Recommended For Local Developing)
8) Clean + Build + Run (Recommended For Production)
9) Exit
=========================================
EOF
}

while true; do
  show_menu
  read -r -p "Enter choice [1-9]: " choice
  case "$choice" in
    1) clean_frontend ;;
    2) install_frontend ;;
    3) build_frontend ;;
    4) stop_frontend ;;
    5) run_frontend ;;
    6) clean_frontend && build_frontend ;;
    7) stop_frontend && clean_frontend && run_frontend ;;
    8) stop_frontend && clean_frontend && build_frontend && run_frontend ;;
    9) exit 0 ;;
    *) echo "Invalid choice. Try again." ;;
  esac
  echo
done
