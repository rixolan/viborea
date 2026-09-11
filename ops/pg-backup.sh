#!/bin/sh
# Nightly dump of the Viborea database to a volume, with retention.
#
# Runs as the `backup` service in compose.yaml. One-shot (for a pre-deploy
# snapshot):  docker compose -p viborea run --rm backup /usr/local/bin/pg-backup.sh --once
# Restore:    gunzip -c viborea-<stamp>.sql.gz | psql -U viborea -d viborea
set -eu

DIR=${BACKUP_DIR:-/backups}
KEEP=${BACKUP_KEEP_DAYS:-14}
INTERVAL=${BACKUP_INTERVAL_SECONDS:-86400}
HOST=${PGHOST:-db}
USER=${PGUSER:-viborea}
NAME=${PGDATABASE:-viborea}

mkdir -p "$DIR"

dump() {
  stamp=$(date -u +%Y%m%dT%H%M%SZ)
  tmp="$DIR/.viborea-$stamp.sql.gz"
  out="$DIR/viborea-$stamp.sql.gz"
  if pg_dump --no-owner --no-privileges -h "$HOST" -U "$USER" -d "$NAME" | gzip -9 >"$tmp"; then
    mv "$tmp" "$out"
    echo "backup ok: $out ($(wc -c <"$out") bytes)"
  else
    rm -f "$tmp"
    echo "backup FAILED at $stamp" >&2
    return 1
  fi
  # Retention is the whole point: a disk full of dumps is its own outage.
  find "$DIR" -name 'viborea-*.sql.gz' -type f -mtime "+$KEEP" -delete
}

if [ "${1:-}" = "--once" ]; then
  dump
  exit $?
fi

while :; do
  dump || true
  sleep "$INTERVAL"
done
