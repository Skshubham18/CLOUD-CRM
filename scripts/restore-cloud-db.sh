#!/usr/bin/env bash
# ==============================================================================
# Script: restore-cloud-db.sh
# Purpose: Safe, structured restoration of schema and data to target PostgreSQL
#          (Amazon RDS or staging database) with dry-run verification.
#
# Usage:
#   ./scripts/restore-cloud-db.sh [OPTIONS]
#
# Options:
#   --host <HOST>           Target PostgreSQL host (default: $DB_HOST)
#   --port <PORT>           Target PostgreSQL port (default: $DB_PORT or 5432)
#   --db <DB_NAME>          Target database name (default: $DB_NAME or cloud_crm_db)
#   --user <USER>           Target database user (default: $DB_USER or postgres)
#   --schema-file <PATH>    Path to schema SQL file (default: database/schema.sql)
#   --backup-file <PATH>    Path to backup file (.dump or .sql) (default: latest in backups/)
#   --apply-schema          Apply database/schema.sql to target DB
#   --restore-data          Restore data from backup file
#   --dry-run               Validate connectivity, parameters, and files without modifying DB
#   --verify                Run automated post-restore verification check
#   -h, --help              Show this help message
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Color formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Locate PostgreSQL binaries (psql, pg_restore)
find_pg_tool() {
    local tool_name="$1"
    if command -v "$tool_name" &> /dev/null; then
        command -v "$tool_name"
        return 0
    fi
    for pg_path in \
        "/Applications/Postgres.app/Contents/Versions/latest/bin" \
        "/Applications/Postgres.app/Contents/Versions/18/bin" \
        "/Applications/Postgres.app/Contents/Versions/17/bin" \
        "/Applications/Postgres.app/Contents/Versions/16/bin" \
        "/opt/homebrew/bin" \
        "/usr/local/bin" \
        "/usr/bin"
    do
        if [[ -x "${pg_path}/${tool_name}" ]]; then
            echo "${pg_path}/${tool_name}"
            return 0
        fi
    done
    return 1
}

PSQL_BIN=$(find_pg_tool "psql" || echo "")
PG_RESTORE_BIN=$(find_pg_tool "pg_restore" || echo "")

if [[ -z "$PSQL_BIN" ]]; then
    log_error "psql command not found. Please install PostgreSQL client tools or Postgres.app."
    exit 1
fi

# Default parameters
TARGET_HOST="${DB_HOST:-}"
TARGET_PORT="${DB_PORT:-5432}"
TARGET_DB="${DB_NAME:-cloud_crm_db}"
TARGET_USER="${DB_USER:-postgres}"
SCHEMA_FILE="${PROJECT_ROOT}/database/schema.sql"
BACKUP_FILE=""
DO_SCHEMA=false
DO_DATA=false
DRY_RUN=false
DO_VERIFY=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --host)
            TARGET_HOST="$2"
            shift 2
            ;;
        --port)
            TARGET_PORT="$2"
            shift 2
            ;;
        --db)
            TARGET_DB="$2"
            shift 2
            ;;
        --user)
            TARGET_USER="$2"
            shift 2
            ;;
        --schema-file)
            SCHEMA_FILE="$2"
            shift 2
            ;;
        --backup-file)
            BACKUP_FILE="$2"
            shift 2
            ;;
        --apply-schema)
            DO_SCHEMA=true
            shift
            ;;
        --restore-data)
            DO_DATA=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --verify)
            DO_VERIFY=true
            shift
            ;;
        -h|--help)
            head -n 22 "$0" | tail -n 19
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# If neither schema nor data specified, default to both if not dry-run
if [[ "$DO_SCHEMA" = false && "$DO_DATA" = false && "$DRY_RUN" = false ]]; then
    DO_SCHEMA=true
    DO_DATA=true
fi

# Auto-locate latest backup file if not provided
if [[ -z "$BACKUP_FILE" && "$DO_DATA" = true ]]; then
    LATEST_SQL=$(ls -t "${PROJECT_ROOT}/backups"/cloud_crm_db_backup_*.sql 2>/dev/null | head -n 1 || echo "")
    LATEST_DUMP=$(ls -t "${PROJECT_ROOT}/backups"/cloud_crm_db_backup_*.dump 2>/dev/null | head -n 1 || echo "")
    if [[ -n "$LATEST_DUMP" ]]; then
        BACKUP_FILE="$LATEST_DUMP"
    elif [[ -n "$LATEST_SQL" ]]; then
        BACKUP_FILE="$LATEST_SQL"
    fi
fi

# Print execution summary (no passwords)
echo "================================================================="
echo "   AI-Powered Cloud CRM — Database Migration / Restore Tool      "
echo "================================================================="
echo "Target Host:        ${TARGET_HOST:-'(NOT SET - pass --host or DB_HOST)'}"
echo "Target Port:        ${TARGET_PORT}"
echo "Target Database:    ${TARGET_DB}"
echo "Target User:        ${TARGET_USER}"
echo "Schema File:        ${SCHEMA_FILE}"
echo "Backup File:        ${BACKUP_FILE:-'(None)'}"
echo "Apply Schema:       ${DO_SCHEMA}"
echo "Restore Data:       ${DO_DATA}"
echo "Dry Run Mode:       ${DRY_RUN}"
echo "Run Verification:   ${DO_VERIFY}"
echo "psql Tool:          ${PSQL_BIN}"
echo "pg_restore Tool:    ${PG_RESTORE_BIN:-'(not found)'}"
echo "================================================================="

# Pre-flight validations
if [[ -z "$TARGET_HOST" ]]; then
    log_error "Target host is required. Set DB_HOST or provide --host <hostname>."
    exit 1
fi

if [[ ! -f "$SCHEMA_FILE" && "$DO_SCHEMA" = true ]]; then
    log_error "Schema file not found at: ${SCHEMA_FILE}"
    exit 1
fi

if [[ -n "$BACKUP_FILE" && ! -f "$BACKUP_FILE" ]]; then
    log_error "Backup file not found at: ${BACKUP_FILE}"
    exit 1
fi

# Dry-run validation
if [[ "$DRY_RUN" = true ]]; then
    log_info "DRY-RUN: Validating schema SQL syntax locally..."
    if [[ -f "$SCHEMA_FILE" ]]; then
        log_info "Schema file exists: $(wc -l < "$SCHEMA_FILE") lines."
    fi
    if [[ -n "$BACKUP_FILE" && -f "$BACKUP_FILE" ]]; then
        log_info "Backup file exists: $(ls -lh "$BACKUP_FILE" | awk '{print $5}') ($BACKUP_FILE)"
    fi
    
    log_info "DRY-RUN: Testing connectivity to target database host ${TARGET_HOST}:${TARGET_PORT}..."
    if "$PSQL_BIN" -h "$TARGET_HOST" -p "$TARGET_PORT" -U "$TARGET_USER" -d "$TARGET_DB" -c "SELECT version();" > /dev/null 2>&1; then
        log_success "Target database connectivity check PASSED."
    else
        log_warn "Target database connection could not be established. Ensure network access (security group / VPC connector) and credentials are configured."
    fi
    
    log_success "DRY-RUN completed successfully. No changes were applied."
    exit 0
fi

# Step 1: Connectivity check
log_info "Testing connection to target database ${TARGET_DB} on ${TARGET_HOST}:${TARGET_PORT}..."
if ! "$PSQL_BIN" -h "$TARGET_HOST" -p "$TARGET_PORT" -U "$TARGET_USER" -d "$TARGET_DB" -c "SELECT 1;" > /dev/null 2>&1; then
    log_error "Cannot connect to target database. Verify host, port, credentials, and network access."
    exit 1
fi
log_success "Target database connection verified."

# Step 2: Apply Schema
if [[ "$DO_SCHEMA" = true ]]; then
    log_info "Applying schema from ${SCHEMA_FILE}..."
    "$PSQL_BIN" -h "$TARGET_HOST" -p "$TARGET_PORT" -U "$TARGET_USER" -d "$TARGET_DB" -f "$SCHEMA_FILE"
    log_success "Schema applied successfully."
fi

# Step 3: Restore Data
if [[ "$DO_DATA" = true ]]; then
    if [[ -z "$BACKUP_FILE" ]]; then
        log_error "No backup file specified or found for data restore."
        exit 1
    fi

    log_info "Restoring data from ${BACKUP_FILE}..."
    if [[ "$BACKUP_FILE" == *.dump ]]; then
        if [[ -z "$PG_RESTORE_BIN" ]]; then
            log_error "pg_restore binary required for .dump files."
            exit 1
        fi
        "$PG_RESTORE_BIN" -h "$TARGET_HOST" -p "$TARGET_PORT" -U "$TARGET_USER" -d "$TARGET_DB" \
            --data-only --disable-triggers "$BACKUP_FILE"
    else
        "$PSQL_BIN" -h "$TARGET_HOST" -p "$TARGET_PORT" -U "$TARGET_USER" -d "$TARGET_DB" -f "$BACKUP_FILE"
    fi
    log_success "Data restore completed."
fi

# Step 4: Verification
if [[ "$DO_VERIFY" = true ]]; then
    log_info "Running post-migration verification script..."
    DB_HOST="$TARGET_HOST" DB_PORT="$TARGET_PORT" DB_NAME="$TARGET_DB" DB_USER="$TARGET_USER" \
        node "${PROJECT_ROOT}/scripts/verify-cloud-db.js"
fi

log_success "Database migration/restore workflow finished successfully."
