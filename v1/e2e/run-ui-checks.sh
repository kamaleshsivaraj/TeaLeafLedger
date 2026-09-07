#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
TARGET="${1:-all}"

echo "== Checking app is running =="
code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:5183/ || true)
if [ "$code" != "200" ]; then
  echo "Frontend is not responding on http://localhost:5183 (got HTTP $code)."
  echo "Start it with ./start.sh in the project root, then rerun this."
  exit 1
fi
echo "Frontend OK, app is up."

echo "== Installing dependencies + browsers (once) =="
npm install
if [ "$TARGET" = "all" ] || [ "$TARGET" = "firefox" ]; then
  npx playwright install firefox
fi

echo "== Running UI checks on: $TARGET =="
if [ "$TARGET" = "all" ]; then
  npx playwright test
else
  npx playwright test --project="$TARGET"
fi

echo
echo "Results saved to: C:/Users/Kamalesh Sivaraj/Projects/TeaLeafLedger/v1/playwright-results/"
