#!/bin/bash
# Backup remoto MySQL (MCSAI prod) → disco local en chucky.
# Secrets: ~/.config/mcsai-backup/backup.conf (DB_NAME, DB_PASS) — never commit.

export HOME="${HOME:-/home/$(id -un)}"

set -euo pipefail

# Prefer ~/bin (user-local mysqldump wrapper) then system paths
export PATH="${HOME}/bin:/usr/bin:/bin:/usr/local/bin:$PATH"

# Todos los .sql.gz aquí; retención 30 días con find al final
BACKUP_DIR="${HOME}/Backups/mcsai-remote"
RETENTION_DAYS=30

CONF="${HOME}/.config/mcsai-backup/backup.conf"
LOG="${HOME}/logs/mcsai-backup.log"

DB_HOST="173.254.31.164"
DB_PORT="3306"
DB_USER="mcsaicom_mchoras"

if [[ ! -f "$CONF" ]]; then
  echo "ERROR: Falta $CONF" >&2
  exit 1
fi
# shellcheck source=/dev/null
source "$CONF"

if [[ -z "${DB_NAME:-}" || -z "${DB_PASS:-}" ]]; then
  echo "ERROR: DB_NAME y DB_PASS deben estar definidos en backup.conf" >&2
  exit 1
fi

MYSQLDUMP=""
for c in "$(command -v mysqldump 2>/dev/null)" \
  "${HOME}/bin/mysqldump" \
  /usr/bin/mysqldump \
  /usr/local/bin/mysqldump; do
  [[ -n "$c" && -x "$c" ]] && MYSQLDUMP="$c" && break
done
if [[ -z "$MYSQLDUMP" ]]; then
  echo "ERROR: mysqldump no encontrado. Preferido: sudo apt-get install -y mysql-client" >&2
  echo "Alternativa sin sudo: user-local extract en ~/.local/mysql-client + ~/bin/mysqldump wrapper." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR" "$(dirname "$LOG")"
DATE=$(date "+%Y%m%d_%H%M%S")
BASE_NAME="${DB_NAME}_${DATE}.sql.gz"
OUT="${BACKUP_DIR}/${BASE_NAME}"

# --no-tablespaces: evita privilegio PROCESS (hosting compartido)
"$MYSQLDUMP" -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" \
  --single-transaction --no-tablespaces --routines --triggers \
  "$DB_NAME" | gzip > "$OUT"

# Borrar backups de esta base con más de RETENTION_DAYS días
find "$BACKUP_DIR" -maxdepth 1 -name "${DB_NAME}_*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" -delete 2>/dev/null || true

LINE="$(date "+%Y-%m-%d %H:%M:%S") OK ${DB_NAME} → $(basename "$OUT")"
echo "$LINE" >> "$LOG"
echo "$LINE"
SIZE=$(wc -c < "$OUT" | tr -d ' ')
echo "SIZE_BYTES=${SIZE}"
