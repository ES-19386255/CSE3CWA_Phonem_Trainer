#!/usr/bin/env bash
# Starts the app on its OWN fresh database (prisma/load.db) on port 3200,
# so load tests never touch your dev data. Leave it running in one
# terminal, and run the JMeter stages from another. Stop it with Ctrl+C.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${PORT:-3200}"
DB="$PWD/prisma/load.db"

# Start from a clean database every time, so every run begins equal.
rm -f "$DB" "$DB-wal" "$DB-shm"
export DATABASE_URL="file:$DB"

npx prisma migrate deploy
npx tsx prisma/seed.ts
npm run build

# NODE_ENV=production is set by `next start`, the same as in Docker.
exec npm run start -- -p "$PORT"
