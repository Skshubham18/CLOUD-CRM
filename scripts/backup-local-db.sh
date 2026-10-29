#!/usr/bin/env bash
# ==============================================================================
# Local Database Backup Script for AI-Powered Cloud CRM
# Creates a timestamped PostgreSQL backup of cloud_crm_db
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/cloud_crm_db_backup_${TIMESTAMP}.dump"
SQL_BACKUP_FILE="${BACKUP_DIR}/cloud_crm_db_backup_${TIMESTAMP}.sql"

# Locate pg_dump tool
PG_DUMP_BIN=""
if command -v pg_dump >/dev/null 2>&1; then
  PG_DUMP_BIN="$(command -v pg_dump)"
elif [ -f "/Applications/Postgres.app/Contents/Versions/18/bin/pg_dump" ]; then
  PG_DUMP_BIN="/Applications/Postgres.app/Contents/Versions/18/bin/pg_dump"
elif [ -f "/Applications/Postgres.app/Contents/Versions/17/bin/pg_dump" ]; then
  PG_DUMP_BIN="/Applications/Postgres.app/Contents/Versions/17/bin/pg_dump"
elif [ -f "/Applications/Postgres.app/Contents/Versions/16/bin/pg_dump" ]; then
  PG_DUMP_BIN="/Applications/Postgres.app/Contents/Versions/16/bin/pg_dump"
elif [ -f "/opt/homebrew/opt/postgresql@16/bin/pg_dump" ]; then
  PG_DUMP_BIN="/opt/homebrew/opt/postgresql@16/bin/pg_dump"
fi

if [ -z "${PG_DUMP_BIN}" ]; then
  echo "❌ Error: pg_dump utility not found. Please ensure PostgreSQL client tools are installed."
  exit 1
fi

echo "======================================================================"
echo "📦 AI-Powered Cloud CRM - Local Database Backup"
echo "======================================================================"
echo "🐘 Using pg_dump at: ${PG_DUMP_BIN}"
echo "📁 Backup Directory:  ${BACKUP_DIR}"
echo "⏰ Timestamp:         ${TIMESTAMP}"
echo "----------------------------------------------------------------------"

# Ensure backup directory exists with restricted permissions
mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-cloud_crm_db}"
DB_USER="${DB_USER:-postgres}"

echo "🔄 Initiating backup of database: ${DB_NAME} (Host: ${DB_HOST}:${DB_PORT})..."

# 1. Create custom format archive dump (compressed, suitable for pg_restore)
"${PG_DUMP_BIN}" \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -F c \
  -b \
  -v \
  -f "${BACKUP_FILE}" \
  "${DB_NAME}"

# 2. Create plain SQL text dump for review and direct schema execution
"${PG_DUMP_BIN}" \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -F p \
  -b \
  -f "${SQL_BACKUP_FILE}" \
  "${DB_NAME}"

# Set restricted permissions on backup files
chmod 600 "${BACKUP_FILE}" "${SQL_BACKUP_FILE}"

FILE_SIZE="$(du -h "${BACKUP_FILE}" | cut -f1)"
SQL_SIZE="$(du -h "${SQL_BACKUP_FILE}" | cut -f1)"

echo "----------------------------------------------------------------------"
echo "✅ Database backup completed successfully!"
echo "   • Binary Dump: ${BACKUP_FILE} (${FILE_SIZE})"
echo "   • SQL Script:  ${SQL_BACKUP_FILE} (${SQL_SIZE})"
echo "🔒 File permissions set to 600 (Owner read/write only)"
echo "🚫 Directory is excluded from Git via .gitignore"
echo "======================================================================"
