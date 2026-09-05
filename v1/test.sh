#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

backend_tests() {
  (cd "$BACKEND_DIR" && find src/test -name "*Test.java" 2>/dev/null \
    | sed -E 's#.*/##; s/\.java$//' \
    | sort -u)
}

frontend_tests() {
  (cd "$FRONTEND_DIR" && find src -type f \( -name "*.test.js" -o -name "*.test.jsx" \
    -o -name "*.spec.js" -o -name "*.spec.jsx" \) 2>/dev/null \
    | sed -E 's#^src/##' | sort -u)
}

run_backend_all() {
  echo "Running ALL backend tests..."
  (cd "$BACKEND_DIR" && mvn test)
}

run_backend_component() {
  local name="$1"
  echo "Running backend test: $name"
  (cd "$BACKEND_DIR" && mvn test -Dtest="$name" -DfailIfNoTests=false)
}

generate_backend_html() {
  echo "Generating Surefire HTML report for backend..."
  (cd "$BACKEND_DIR" && mvn surefire-report:report-only) || {
    echo "Could not generate report. Ensure tests have been run so target/surefire-reports exists."
    return 1
  }
  local report=""
  if [ -f "$BACKEND_DIR/target/site/surefire-report.html" ]; then
    report="$BACKEND_DIR/target/site/surefire-report.html"
  elif [ -f "$BACKEND_DIR/target/reports/surefire.html" ]; then
    report="$BACKEND_DIR/target/reports/surefire.html"
  fi
  if [ -n "$report" ]; then
    echo "HTML report ready: $report"
    if command -v powershell.exe >/dev/null 2>&1; then
      powershell.exe -NoProfile -Command "Start-Process '$report'" >/dev/null 2>&1 &
      echo "Opened report in your browser."
    fi
  else
    echo "HTML report not found. Looked in target/site and target/reports."
  fi
}

run_frontend_all() {
  echo "Running ALL frontend tests..."
  if ! command -v npm >/dev/null 2>&1; then
    echo "npm not found. Skipping frontend tests."
    return
  fi
  (cd "$FRONTEND_DIR" && npm test)
}

run_frontend_component() {
  local name="$1"
  echo "Running frontend test: $name"
  if ! command -v npm >/dev/null 2>&1; then
    echo "npm not found. Skipping frontend tests."
    return
  fi
  (cd "$FRONTEND_DIR" && npm test -- "$name")
}

pick_component() {
  local -a tests=("$@")
  if [ "${#tests[@]}" -eq 0 ]; then
    echo "  (no test files found)"
    return 1
  fi
  echo "  Select a test component:"
  for i in "${!tests[@]}"; do
    printf "  %d) %s\n" "$((i + 1))" "${tests[$i]}"
  done
  printf "  %d) Back to previous menu\n" "$(( ${#tests[@]} + 1 ))"
}

run_backend_menu() {
  while true; do
    echo
    echo "===== BACKEND TESTS ====="
    read -r -p "What do you want to test? (1=All 2=Specific component 3=Generate HTML report 4=Exit): " scope
    case "$scope" in
      1)
        run_backend_all
        break
        ;;
      2)
        mapfile -t tests < <(backend_tests)
        if [ "${#tests[@]}" -eq 0 ]; then
          echo "No backend tests found under $BACKEND_DIR/src/test."
          break
        fi
        echo
        pick_component "${tests[@]}"
        read -r -p "Enter choice: " sel
        if [ "$sel" -ge 1 ] && [ "$sel" -le "${#tests[@]}" ]; then
          run_backend_component "${tests[$((sel - 1))]}"
          break
        else
          continue
        fi
        ;;
      3)
        generate_backend_html
        continue
        ;;
      4)
        return 1
        ;;
      *)
        echo "Invalid choice."
        ;;
    esac
  done
}

run_frontend_menu() {
  while true; do
    echo
    echo "===== FRONTEND TESTS ====="
    read -r -p "What do you want to test? (1=All 2=Specific component 3=Exit): " scope
    case "$scope" in
      1)
        run_frontend_all
        break
        ;;
      2)
        mapfile -t tests < <(frontend_tests)
        if [ "${#tests[@]}" -eq 0 ]; then
          echo "No frontend tests found under $FRONTEND_DIR/src. Add Vitest/Jest and *.test.* files first."
          break
        fi
        echo
        pick_component "${tests[@]}"
        read -r -p "Enter choice: " sel
        if [ "$sel" -ge 1 ] && [ "$sel" -le "${#tests[@]}" ]; then
          run_frontend_component "${tests[$((sel - 1))]}"
          break
        else
          continue
        fi
        ;;
      3)
        return 1
        ;;
      *)
        echo "Invalid choice."
        ;;
    esac
  done
}

show_menu() {
  cat <<'EOF'
=========================================
  TeaLeafLedger — Test Runner
=========================================
Select test module:
1) Backend tests
2) Frontend tests
3) All modules
4) Show available test components
5) Exit
=========================================
EOF
}

while true; do
  show_menu
  read -r -p "Enter choice [1-5]: " choice
  case "$choice" in
    1) run_backend_menu || true ;;
    2) run_frontend_menu || true ;;
    3)
      run_backend_menu || true
      run_frontend_menu || true
      ;;
    4)
      echo
      echo "Backend components:"
      backend_tests | sed 's/^/  - /' || true
      echo "Frontend components:"
      frontend_tests | sed 's/^/  - /' || true
      ;;
    5) exit 0 ;;
    *) echo "Invalid choice. Try again." ;;
  esac
  echo
done
