#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"

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

stop_backend() {
  local port=8090

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

  echo "Stopped backend processes on port $port (if any)."
}

clean_backend() {
  echo "Cleaning backend..."
  (cd "$BACKEND_DIR" && mvn clean)
}

build_backend() {
  echo "Building backend..."
  read -r -p "Do you want to clean before package? [y/N]: " answer
  case "${answer,,}" in
    y|yes)
      (cd "$BACKEND_DIR" && mvn clean package -DskipTests)
      ;;
    *)
      (cd "$BACKEND_DIR" && mvn package -DskipTests)
      ;;
  esac
}

run_backend() {
  echo "Starting backend on http://localhost:8090 ..."
  (cd "$BACKEND_DIR" && mvn spring-boot:run)
}

show_menu() {
  cat <<'EOF'
=========================================
  TeaLeafLedger — Backend Manager
=========================================
Select action:
1) Clean
2) Build
3) Stop
4) Run
5) Clean + Build
6) Clean + Build + Run
7) Exit
=========================================
EOF
}

while true; do
  show_menu
  read -r -p "Enter choice [1-7]: " choice
  case "$choice" in
    1) clean_backend ;;
    2) build_backend ;;
    3) stop_backend ;;
    4) run_backend ;;
    5) clean_backend && build_backend ;;
    6) stop_backend && clean_backend && build_backend && run_backend ;;
    7) exit 0 ;;
    *) echo "Invalid choice. Try again." ;;
  esac
  echo
done
