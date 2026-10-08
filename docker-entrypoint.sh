#!/bin/sh
# Runs each time the container starts, before the app.
set -e

# DATABASE_URL looks like file:/app/data/app.db, so cut off "file:".
DB_FILE="${DATABASE_URL#file:}"

# First start: no database yet, so copy in the seeded starter one.
# With a volume on /app/data this only happens once.
if [ ! -f "$DB_FILE" ]; then
  echo "No database found, copying the seeded one to $DB_FILE"
  mkdir -p "$(dirname "$DB_FILE")"
  cp /app/prisma/dev.db "$DB_FILE"
fi

# Brings an older database in the volume up to date. Does nothing if
# it is already current.
npx prisma migrate deploy

# exec lets the app get Docker's stop signal.
exec npm run start
