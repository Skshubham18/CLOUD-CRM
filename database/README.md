# Database Module — AI-Powered Cloud CRM

## Overview
This module contains the database schema definitions and connectivity diagnostics for the **AI-Powered Cloud CRM for Small Businesses** application.

- **DBMS**: PostgreSQL 14+
- **Driver**: `pg` (Node-Postgres connection pool)
- **Role in Phase 1**: Foundation schema definition, configuration management, and non-blocking connectivity checks.

---

## Configuration

The database configuration is controlled via environment variables located in `/backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cloud_crm_db
DB_USER=postgres
DB_PASSWORD=your_secure_password
```

---

## Local Setup (PostgreSQL)

1. **Create Database**:
   ```bash
   psql -U postgres -c "CREATE DATABASE cloud_crm_db;"
   ```

2. **Execute Foundation Schema**:
   ```bash
   psql -U postgres -d cloud_crm_db -f database/schema.sql
   ```

3. **Test Connection Diagnostic**:
   ```bash
   node database/test-connection.js
   ```

---

## Schema Architecture (Phased Progression)

- **Phase 1 (Current)**: Base structure, `system_metadata`, connection pooling & diagnostics.
- **Phase 2**: Secure user credentials, role-based access control (RBAC), and session management.
- **Phase 3**: Core CRM entities: `accounts`, `contacts`, `leads`, `deals`, `activities`.
- **Phase 4**: AI features: `lead_scores`, `interaction_summaries`, `predictive_analytics`.
- **Phase 5**: Cloud scalability: AWS RDS deployment and automated migrations.
