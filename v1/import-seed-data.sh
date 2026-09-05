#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SEED_DIR="$ROOT_DIR/backend/src/main/resources/mongo-seed"

# Load MongoDB credentials from .env
if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
else
  echo "Error: $ROOT_DIR/.env not found. Copy .env.example to .env and set MONGO_* values."
  exit 1
fi

MONGO_AUTH_ARGS="--host ${MONGODB_HOST:-localhost} --port ${MONGODB_PORT:-27017}"
if [ -n "${MONGODB_USER:-}" ] && [ -n "${MONGODB_PASSWORD:-}" ]; then
  MONGO_AUTH_ARGS="$MONGO_AUTH_ARGS -u $MONGODB_USER -p '$MONGODB_PASSWORD' --authenticationDatabase ${MONGODB_AUTH_DB:-admin}"
fi
MONGO_DB="${MONGODB_DB:-tealeafledger_seed}"

echo "Importing seed data into MongoDB database '$MONGO_DB'..."

mongoimport $MONGO_AUTH_ARGS --db "$MONGO_DB" --collection seed_rates --jsonArray --file "$SEED_DIR/seed_rates.json" --drop
mongoimport $MONGO_AUTH_ARGS --db "$MONGO_DB" --collection seed_farmers --jsonArray --file "$SEED_DIR/seed_farmers.json" --drop
mongoimport $MONGO_AUTH_ARGS --db "$MONGO_DB" --collection seed_config --jsonArray --file "$SEED_DIR/seed_config.json" --drop

echo "MongoDB seed data imported successfully!"