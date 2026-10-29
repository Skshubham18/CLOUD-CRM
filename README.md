# AI-Powered Cloud CRM for Small Businesses

> **Final-Year B.Tech Capstone Project — Local Verification & Hardened Baseline**  
> **Status:** Fully Integrated, Tested & Locally Verified (Phases 1–7)

---

## 📌 1. Project Overview

**AI-Powered Cloud CRM for Small Businesses** is a modular, full-stack Customer Relationship Management platform engineered to address the operational challenges of small businesses: fragmented customer data, manual lead qualification, disorganized follow-ups, and lack of real-time pipeline visibility.

The solution provides:
- **Centralized Customer Management**: Contact profiles, business attributes, status filters, and chronological touchpoint interaction timelines (calls, emails, meetings, notes).
- **Sales Lead Pipeline**: Multi-stage lead management (New, Contacted, Qualified, Proposal, Won, Lost), channel source attribution, and seamless lead-to-customer conversion with transactional duplicate prevention.
- **Deal Funnel & Revenue Tracking**: Multi-stage deal opportunities (Qualification, Proposal, Negotiation, Won, Lost), Kanban and tabular pipeline views, and real-time financial calculations formatted in Indian Rupees (INR ₹).
- **Explainable Rule-Based Lead Scoring**: Deterministic, 0–100 bounded scoring engine that breaks down scores across 5 objective business factors with transparent explanations and recommended next actions (not an unverified "black-box" model).
- **Executive Analytics & Reporting**: Real-time KPI dashboards calculating total customers, leads, won revenue, open pipeline value, conversion rates, and deal win rates directly from PostgreSQL.
- **Enterprise-Grade Security & RBAC**: JWT session authentication, salted bcrypt password hashing, origin-allowlisted CORS, strict UUID parameter validation, sanitized error responses, and role-based access control protecting all destructive actions (`admin` vs. `sales_executive`).

---

## 🏗️ 2. Technology Stack

| Layer | Technology | Details / Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | React 18 + Vite 6 | Fast modern SPA, component-driven layout, responsive CSS3 design system |
| **Icons & Visuals** | Lucide React | Clean, scalable vector icons without external component library bloat |
| **Backend API** | Node.js + Express 4 | Modular RESTful API services, structured controllers, and robust middleware |
| **Relational Database** | PostgreSQL 14+ (tested on v18.6) | ACID-compliant relational core with foreign key cascades and transactional locks |
| **Database Driver** | `pg` (node-postgres) | Resilient connection pooling with graceful termination handling |
| **Authentication & Tokens** | JSON Web Tokens (`jsonwebtoken`) | Signed, stateless session tokens with DB-verified role checks |
| **Password Security** | `bcryptjs` | Salted 10-round password hashing |
| **Security Hardening** | `cors` + Custom RBAC | Explicit origin allowlist, safe error sanitization, parameter UUID validation |
| **Currency Formatting** | Custom `formatINR()` | Indian Rupee financial standards (₹ Lakh / Crore notation) |

---

## 📁 3. Architecture & Directory Structure

```
business crm project/
├── backend/                         # Node.js + Express API Server
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js               # Validated environment loader (enforces JWT_SECRET)
│   │   │   └── db.js                # PostgreSQL connection pool & auto-table verifier
│   │   ├── controllers/
│   │   │   ├── auth.controller.js   # User registration, login, and profile (/me)
│   │   │   ├── customer.controller.js # Customer CRUD and search
│   │   │   ├── interaction.controller.js # Customer touchpoints logging
│   │   │   ├── lead.controller.js   # Lead CRUD, conversion, scoring, interactions
│   │   │   ├── deal.controller.js   # Deal CRUD, stage changes, pipeline metrics
│   │   │   ├── analytics.controller.js # Consolidated and module-specific KPI analytics
│   │   │   └── health.controller.js # Diagnostic health status (GET /api/health)
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js   # JWT authentication & requireRole RBAC middleware
│   │   │   ├── errorHandler.js      # Sanitized error handler (no SQL/stack leaks)
│   │   │   └── notFound.js          # 404 route handler
│   │   ├── routes/
│   │   │   ├── auth.routes.js       # Auth endpoints
│   │   │   ├── customer.routes.js   # Customer endpoints
│   │   │   ├── lead.routes.js       # Lead endpoints
│   │   │   ├── deal.routes.js       # Deal endpoints
│   │   │   ├── analytics.routes.js  # Analytics endpoints
│   │   │   ├── health.routes.js     # Health endpoint
│   │   │   └── index.js             # Central /api router
│   │   ├── services/
│   │   │   ├── auth.service.js      # Password hashing and token generation
│   │   │   ├── customer.service.js  # Customer database persistence
│   │   │   ├── interaction.service.js # Customer interaction logging
│   │   │   ├── lead.service.js      # Lead persistence and transactional conversion
│   │   │   ├── leadInteraction.service.js # Lead interaction history
│   │   │   ├── leadScoringService.js # Deterministic 0-100 rule-based scoring engine
│   │   │   ├── deal.service.js      # Deal persistence and pipeline metrics
│   │   │   └── analytics.service.js # SQL-based metrics and KPI aggregation
│   │   ├── app.js                   # Express application setup & CORS configuration
│   │   └── server.js                # Server entry point & graceful shutdown
│   ├── .env.example                 # Backend environment variable template
│   ├── .env                         # Local backend environment configuration
│   └── package.json                 # Backend scripts and dependencies
│
├── frontend/                        # React 18 Single-Page Application (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/              # Button, Card, StatusBadge reusable components
│   │   │   ├── layout/              # Navbar, Sidebar, AppLayout
│   │   │   └── dashboard/           # MetricCard, HealthCheckWidget
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Authentication context & local token management
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx         # Login & Registration with role selection
│   │   │   ├── CustomersPage.jsx    # Customer Registry & Interaction modals
│   │   │   ├── LeadsPage.jsx        # Lead Funnel, Scoring modal, Conversion modal
│   │   │   ├── DealsPage.jsx        # Deal Kanban / Table view & Pipeline summary
│   │   │   ├── AnalyticsPage.jsx    # Real-time Analytics Dashboard & KPI charts
│   │   │   ├── LandingPage.jsx      # Product landing presentation
│   │   │   └── DashboardPage.jsx    # Core executive dashboard & health status
│   │   ├── services/
│   │   │   └── api.js               # Centralized API service with error handling
│   │   ├── utils/
│   │   │   └── currency.js          # INR formatting utility (formatINR, Lakh/Crore)
│   │   ├── App.jsx                  # Main route view controller
│   │   ├── App.css                  # Comprehensive application styling
│   │   └── main.jsx                 # Application entry point
│   ├── .env.example                 # Frontend environment template
│   ├── .env                         # Frontend environment variables
│   ├── vite.config.js               # Vite bundler configuration
│   └── package.json                 # Frontend dependencies and build scripts
│
├── database/                        # Database scripts and documentation
│   ├── schema.sql                   # Complete relational schema DDL
│   ├── test-connection.js           # PostgreSQL direct connection test script
│   └── README.md                    # Database schema and setup documentation
│
├── scripts/                         # Operational & automated test scripts
│   ├── test-suite.js                # 61-point automated verification master test suite
│   ├── backup-local-db.sh           # Local database backup script (pg_dump)
│   ├── restore-cloud-db.sh          # Cloud database restoration script
│   └── verify-cloud-db.js           # Database integrity check script
│
├── .gitignore                       # Git ignore rules (.env, backups, node_modules)
├── package.json                     # Root orchestrator scripts
└── README.md                        # Master documentation
```

---

## 🔐 4. API Endpoints & Role-Based Access Control (RBAC)

The application enforces strict separation between:
- **HTTP 401 Unauthorized**: Missing, malformed, or expired authentication token.
- **HTTP 403 Forbidden**: Authenticated user lacking permission (`"Access denied: insufficient permissions"`).

### Role Taxonomy
- `admin`: Full system access, including all destructive deletion operations.
- `sales_executive`: Standard sales workflow access (create, read, update, convert, score), but prohibited from destructive deletions.

| Resource / Endpoint | Method | Access Level | Description |
| :--- | :---: | :---: | :--- |
| `/api/health` | `GET` | Public | Real-time backend & PostgreSQL connectivity status |
| `/api/auth/register` | `POST` | Public | Register new user (`admin` or `sales_executive`) |
| `/api/auth/login` | `POST` | Public | Authenticate credentials and receive signed JWT |
| `/api/auth/me` | `GET` | Authenticated | Retrieve current user profile and verified role |
| `/api/customers` | `GET` | Authenticated | List customers with optional `?search=` and `?status=` |
| `/api/customers` | `POST` | Authenticated | Create a new customer profile |
| `/api/customers/:id` | `GET` | Authenticated | View customer profile and interaction history |
| `/api/customers/:id` | `PUT` | Authenticated | Update existing customer attributes |
| `/api/customers/:id` | `DELETE` | **Admin Only** | **Permanently delete customer (RBAC Protected)** |
| `/api/customers/:id/interactions` | `GET` | Authenticated | List all interactions for a customer |
| `/api/customers/:id/interactions` | `POST` | Authenticated | Log customer interaction (call, meeting, note) |
| `/api/leads` | `GET` | Authenticated | List leads with `?search=`, `?status=`, `?source=` |
| `/api/leads` | `POST` | Authenticated | Create new sales lead with auto baseline score |
| `/api/leads/:id` | `GET` | Authenticated | View lead profile and interaction touchpoints |
| `/api/leads/:id` | `PUT` | Authenticated | Update lead attributes and recalculate score |
| `/api/leads/:id` | `DELETE` | **Admin Only** | **Permanently delete lead (RBAC Protected)** |
| `/api/leads/:id/convert` | `POST` | Authenticated | Convert lead to customer (prevents duplicates) |
| `/api/leads/:id/score` | `GET` | Authenticated | Get explainable 0–100 rule-based score breakdown |
| `/api/leads/:id/interactions` | `GET` | Authenticated | View interaction logs for a lead |
| `/api/leads/:id/interactions` | `POST` | Authenticated | Add interaction touchpoint to lead |
| `/api/leads/:id/interactions/:iid` | `DELETE` | **Admin Only** | **Delete lead interaction (RBAC Protected)** |
| `/api/deals` | `GET` | Authenticated | List deals with stage, customer, and assignee filters |
| `/api/deals` | `POST` | Authenticated | Create new commercial deal opportunity |
| `/api/deals/:id` | `GET` | Authenticated | View deal details and linked contacts |
| `/api/deals/:id` | `PUT` | Authenticated | Update deal stage, value, or close date |
| `/api/deals/:id` | `DELETE` | **Admin Only** | **Permanently delete deal (RBAC Protected)** |
| `/api/deals/metrics/summary` | `GET` | Authenticated | Pipeline summary metrics (total, won, open value) |
| `/api/analytics/dashboard` | `GET` | Authenticated | Consolidated real-time analytics dashboard |
| `/api/analytics/overview` | `GET` | Authenticated | High-level executive KPI overview |
| `/api/analytics/leads` | `GET` | Authenticated | Lead conversion rates and source distribution |
| `/api/analytics/deals` | `GET` | Authenticated | Deal stage distribution and win rate analytics |

---

## 🎯 5. Explainable Lead-Scoring Methodology

The lead-scoring module (`leadScoringService.js`) employs a **deterministic, rule-based baseline engine (v1.0)** bounded strictly between **0 and 100 points**. 

> [!NOTE]
> This scoring engine is an explainable rule-based baseline with clean architectural boundaries. It is intentionally **not** a trained machine-learning model or synthetic AI simulation. Machine learning integration (e.g. AWS Bedrock / SageMaker) is designed as a future extension.

### Factor Breakdown (Max 100 Points)

1. **Qualification & Stage Status (Max 30 pts)**
   - `Won`: +30 pts (Contract closed)
   - `Proposal`: +25 pts (Formal quote under review)
   - `Qualified`: +20 pts (Vetted sales opportunity)
   - `Contacted`: +10 pts (Initial touchpoint established)
   - `New`: +5 pts (Fresh inbound lead)
   - `Lost`: 0 pts

2. **Contact Completeness (Max 20 pts)**
   - Verified Email: +10 pts
   - Provided Phone Number: +10 pts

3. **Company & Market Fit (Max 15 pts)**
   - Verified Company Name: +8 pts
   - High-Value Industry (Technology, Healthcare, Finance, Manufacturing, Consulting): +7 pts (Other: +3 pts)

4. **Lead Source Quality (Max 15 pts)**
   - High-intent channels (`Referral`, `Partner`): +15 pts
   - Digital inbound channels (`Website`, `LinkedIn`): +10 pts
   - Outbound / Other (`Outbound`, `Cold Call`, `Event`): +5 pts

5. **Estimated Deal Potential in INR (Max 20 pts)**
   - Enterprise Tier ($\ge ₹10,00,000$): +20 pts
   - Mid-Market Tier ($\ge ₹5,00,000$): +15 pts
   - Commercial Tier ($\ge ₹1,00,000$): +10 pts
   - Entry Tier ($< ₹1,00,000$): +5 pts
   - Unstated / Zero: 0 pts

### Priority Classification
- **High Priority ($\ge 70$)**: Emerald `#10B981` — Assign senior sales representative for immediate proposal closure.
- **Medium Priority ($40 - 69$)**: Amber `#F59E0B` — Schedule product discovery call and nurture lead.
- **Low Priority ($< 40$)**: Slate `#64748B` — Enrich contact information and verify budget before demo.

---

## ⚙️ 6. Environment Variables Reference

### Backend Configuration (`backend/.env`)

| Variable Name | Required | Default / Format | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | No | `5000` | Port on which the Express server listens |
| `HOST` | No | `127.0.0.1` | Network interface binding |
| `NODE_ENV` | No | `development` | Runtime environment (`development`, `test`, `production`) |
| `DB_HOST` | Yes | `localhost` | PostgreSQL host address |
| `DB_PORT` | Yes | `5432` | PostgreSQL port |
| `DB_NAME` | Yes | `cloud_crm_db` | PostgreSQL database name |
| `DB_USER` | Yes | `postgres` | Database username |
| `DB_PASSWORD` | Yes | `(masked)` | Database user password |
| `JWT_SECRET` | **Yes (Required)** | *(No fallback allowed)* | Secret key for signing JWTs (min 16 chars). Server halts if absent. |
| `JWT_EXPIRES_IN` | No | `1d` | Token lifetime (e.g., `1d`, `7d`, `24h`) |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Additional allowed origins (comma-separated if multiple) |

### Frontend Configuration (`frontend/.env`)

| Variable Name | Required | Example Value | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_BASE_URL` | Yes | `http://127.0.0.1:5000/api` | Base URL for REST API gateway |

---

## 🚀 7. Local Setup & Startup Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher (`node -v`)
- **npm**: v9.0.0 or higher (`npm -v`)
- **PostgreSQL**: v14.0 or higher running locally on port `5432`

### Step 1: Clone & Install Dependencies
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
cd ..
```

### Step 2: Configure Environment
Ensure `backend/.env` and `frontend/.env` exist with appropriate local settings (use `.env.example` as a template).

### Step 3: Run the Application
```bash
# Start backend server (Terminal 1)
npm run dev:backend

# Start frontend development server (Terminal 2)
npm run dev:frontend
```
- Frontend UI: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:5000`
- Health Endpoint: `http://127.0.0.1:5000/api/health`

---

## 🧪 8. Test Commands & Verification Results

The repository includes a comprehensive 61-point automated verification suite that exercises all modules end-to-end against the live backend and database without mutating or deleting real business records.

### Available Test Commands

| Command | Target / Script | Purpose |
| :--- | :--- | :--- |
| `npm test` | `node scripts/test-suite.js` | **Master Automated Test Suite (61 tests covering Health, CORS, Auth, RBAC, UUIDs, CRUD, Analytics)** |
| `npm run test:health` | `node -e fetch(...)` | Quick backend health diagnostic (`127.0.0.1:5000/api/health`) |
| `npm run test:db` | `node database/test-connection.js` | Direct PostgreSQL connection and latency benchmark |
| `npm run build:frontend` | `cd frontend && vite build` | Frontend production bundle compile and type verification |

### Actual Test Execution Output

```
================================================================
🚀 AI-Powered Cloud CRM: Automated Master Verification Suite
================================================================

📊 Step 1: Capturing Pre-Test Database Baseline...
Baseline Record Counts: {
  "users": 5, "customers": 7, "leads": 1, "deals": 0,
  "customer_interactions": 1, "lead_interactions": 1
}

--- SUITE 1: System Health & Diagnostics (2/2 Passed)
--- SUITE 2: CORS Security & Origin Allowlist (4/4 Passed)
--- SUITE 3: Authentication & Token Handling (4/4 Passed)
--- SUITE 4: RBAC Enforcement & Anti-Tampering (14/14 Passed)
--- SUITE 5: UUID Parameter Format Validation (16/16 Passed)
--- SUITE 6: Customer Management Workflows (5/5 Passed)
--- SUITE 7: Lead Management & Deterministic Scoring (5/5 Passed)
--- SUITE 8: Deal Module & Pipeline Metrics (5/5 Passed)
--- SUITE 9: Analytics & Reporting Workflows (4/4 Passed)
--- SUITE 10: Safe Error Handling & Anti-Leakage (1/1 Passed)
--- SUITE 11: Database Record Integrity Check (1/1 Passed)

Master Test Suite Summary:
Total Tests Run: 61 | Passed: 61 | Failed: 0 | Success Rate: 100%
================================================================
```

---

## 💾 9. Database Backup & Restore Procedures

The repository includes automated shell scripts in `scripts/` for safe database operations:

### Creating a Backup
```bash
./scripts/backup-local-db.sh
```
- Dumps the active `cloud_crm_db` database using `pg_dump` into a timestamped archive in `backups/`.
- Validates the dump size and integrity.

### Restoring from Backup
```bash
./scripts/restore-cloud-db.sh <path-to-dump-file>
```
- Restores database schema and records.
- Verifies post-restoration table counts.

---

## 🛡️ 10. Security Hardening & Implementation Highlights

1. **Origin Allowlisting (CORS)**: Wildcard origins (`*`) have been replaced with an explicit allowlist supporting `http://127.0.0.1:5173`, `http://localhost:5173`, and `CORS_ORIGIN`. Unapproved browser origins are safely declined without server crashes.
2. **Fail-Safe JWT Configuration**: Insecure default secret fallbacks have been removed. The application requires an explicitly declared `JWT_SECRET` ($\ge 16$ characters) and fails safely at startup if missing.
3. **Database-Backed RBAC**: Roles are retrieved directly from the verified PostgreSQL `users` table on each authenticated request (`req.user.role`). Spoofing attempts via request bodies, query strings, or altered token claims are strictly rejected with HTTP 403.
4. **Comprehensive UUID Parameter Validation**: All ID-based customer, lead, deal, conversion, score, and interaction endpoints validate UUID format prior to database querying, preventing SQL syntax exceptions and denial-of-service risks.
5. **Sanitized Error Responses**: Internal server errors (500) and database exceptions are sanitized to generic client messages (`"An internal server error occurred. Please try again later."`). Stack traces and SQL queries are never exposed to clients.
6. **Zero Data Loss Guarantee**: All verification tests run non-destructively. Pre-test and post-test table counts remain 100% identical.

---

## ⚠️ 11. Known Limitations & Future Roadmap

- **Local-Only Operational State**: The platform is currently configured and verified for local execution. Cloud deployment (e.g. AWS App Runner, RDS, S3, CloudFront) is ready in infrastructure templates (`infrastructure/aws/`) but has not been deployed.
- **Rule-Based Scoring Engine**: The lead-scoring engine is deterministic rule-based. Future phases can extend this with AWS Bedrock or SageMaker model endpoints.
- **User Administration Route**: There are currently no admin-only routes to delete or list other users (`/api/users`). User registration is self-service, and profile access is scoped to `/api/auth/me`.
