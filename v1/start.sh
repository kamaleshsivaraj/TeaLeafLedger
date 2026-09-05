#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

load_env() {
  if [ -f "$ROOT_DIR/.env" ]; then
    set -a
    # shellcheck disable=SC1091
    source "$ROOT_DIR/.env"
    set +a
    echo "Loaded environment from $ROOT_DIR/.env"
  else
    echo "Warning: $ROOT_DIR/.env not found. Copy .env.example to .env and set DB_PASSWORD."
  fi
}

load_env

stop_all() {
  local backend_port=8090
  local frontend_port=5183

  if command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -Command "
      @(8090, 5183) | ForEach-Object {
        \$port = \$_
        \$pids = Get-NetTCPConnection -LocalPort \$port -ErrorAction SilentlyContinue |
          Select-Object -ExpandProperty OwningProcess -Unique
        if (\$pids) {
          \$pids | ForEach-Object {
            Stop-Process -Id \$_ -Force -ErrorAction SilentlyContinue
          }
        }
      }
    " >/dev/null 2>&1 || true
  fi

  echo "Stopped all processes on ports $backend_port and $frontend_port (if any)."
}

install_all() {
  echo "Installing all dependencies..."
  (cd "$FRONTEND_DIR" && npm install)
}

build_all() {
  echo "Building backend..."
  (cd "$BACKEND_DIR" && mvn clean package -DskipTests)

  echo "Building frontend..."
  (cd "$FRONTEND_DIR" && npm run build)
}

run_all() {
  echo "Starting TeaLeafLedger..."
  echo "  Backend  → http://localhost:8090"
  echo "  Frontend → http://localhost:5183"
  echo ""

  (cd "$BACKEND_DIR" && mvn spring-boot:run) &
  BACKEND_PID=$!

  (cd "$FRONTEND_DIR" && npm run dev) &
  FRONTEND_PID=$!

  echo "Backend PID: $BACKEND_PID"
  echo "Frontend PID: $FRONTEND_PID"
  echo ""
  echo "Press Ctrl+C to stop both."
  echo ""

  trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

  wait
}

show_menu() {
  cat <<'EOF'
=========================================
  TeaLeafLedger — Full Stack Manager
=========================================
Select action:
1) Install dependencies
2) Build all (backend + frontend)
3) Stop all
4) Run all (backend + frontend)
5) Stop + Build + Run
6) Exit
=========================================
EOF
}

while true; do
  show_menu
  read -r -p "Enter choice [1-6]: " choice
  case "$choice" in
    1) install_all ;;
    2) build_all ;;
    3) stop_all ;;
    4) run_all ;;
    5) stop_all && build_all && run_all ;;
    6) exit 0 ;;
    *) echo "Invalid choice. Try again." ;;
  esac
  echo
done
