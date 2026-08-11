#!/usr/bin/env bash
# Creates the local `nyambika` role + database and restores nyambika_export.sql.
# Needs sudo because the `jacques` postgres role has no CREATEDB privilege.
#
#   ./scripts/setup-local-db.sh
#
# Safe to re-run: the role and database are only created if missing. The restore
# is skipped when the database already has tables, so it will not clobber data.
set -euo pipefail

DB_NAME=nyambika
DB_USER=nyambika
DB_PASS=nyambika_dev
DUMP="$(cd "$(dirname "$0")/.." && pwd)/nyambika_export.sql"

if [ ! -f "$DUMP" ]; then
  echo "error: dump not found at $DUMP" >&2
  exit 1
fi

echo "==> Creating role '$DB_USER' (if missing)"
sudo -u postgres psql -v ON_ERROR_STOP=1 -q <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASS';
  END IF;
END
\$\$;
SQL

echo "==> Creating database '$DB_NAME' (if missing)"
if ! sudo -u postgres psql -tAc \
     "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
  sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"
else
  echo "    already exists"
fi

export PGPASSWORD="$DB_PASS"
CONN="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"

TABLES=$(psql "$CONN" -tAc \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")

if [ "$TABLES" -gt 0 ]; then
  echo "==> Database already has $TABLES table(s) — skipping restore"
else
  echo "==> Restoring $DUMP"
  psql "$CONN" -v ON_ERROR_STOP=1 -q -f "$DUMP"
fi

echo "==> Done. Tables now present:"
psql "$CONN" -tAc \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'"
echo
echo "DATABASE_URL=$CONN"
echo "(already written to backend/.env)"
