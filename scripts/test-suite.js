/**
 * Comprehensive Automated Test Suite
 * AI-Powered Cloud CRM for Small Businesses
 *
 * Covers:
 * - System Health & Database Diagnostics
 * - CORS Allowlist & Disallowed Origin Security
 * - Authentication & Token Verification (401)
 * - Role-Based Access Control (RBAC) & Privilege Escalation (403 vs 404)
 * - Complete UUID Parameter Validation (400)
 * - Customers, Leads, Deals, Analytics & Lead Scoring Workflows (200)
 * - Input Validation & Safe Error Responses (No SQL/Stack Trace Leaks)
 * - Database Integrity & Record Count Preservation (Zero Data Loss)
 *
 * Usage: node scripts/test-suite.js
 */

const path = require('path');
const http = require('http');

// Support loading packages from backend/node_modules
module.paths.push(path.resolve(__dirname, '../backend/node_modules'));

const { pool } = require('../backend/src/config/db');
const config = require('../backend/src/config/env');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://127.0.0.1:5000/api';
const DUMMY_UUID = '00000000-0000-0000-0000-000000000000';
const INVALID_UUID = 'malformed-uuid-123';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

async function assertTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name} -> ${err.message}`);
    failedTests++;
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('🚀 AI-Powered Cloud CRM: Automated Master Verification Suite');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // Baseline Database Row Counts
  // -------------------------------------------------------------
  console.log('📊 Step 1: Capturing Pre-Test Database Baseline...');
  const preUsers = await pool.query('SELECT count(*) FROM users');
  const preCustomers = await pool.query('SELECT count(*) FROM customers');
  const preLeads = await pool.query('SELECT count(*) FROM leads');
  const preDeals = await pool.query('SELECT count(*) FROM deals');
  const preCustInteractions = await pool.query('SELECT count(*) FROM customer_interactions');
  const preLeadInteractions = await pool.query('SELECT count(*) FROM lead_interactions');

  const baseline = {
    users: parseInt(preUsers.rows[0].count, 10),
    customers: parseInt(preCustomers.rows[0].count, 10),
    leads: parseInt(preLeads.rows[0].count, 10),
    deals: parseInt(preDeals.rows[0].count, 10),
    customer_interactions: parseInt(preCustInteractions.rows[0].count, 10),
    lead_interactions: parseInt(preLeadInteractions.rows[0].count, 10),
  };
  console.log('Baseline Record Counts:', JSON.stringify(baseline, null, 2));

  // Retrieve test users
  const adminRes = await pool.query("SELECT id, name, email, role FROM users WHERE role = 'admin' LIMIT 1");
  const salesRes = await pool.query("SELECT id, name, email, role FROM users WHERE role = 'sales_executive' LIMIT 1");

  if (!adminRes.rows.length || !salesRes.rows.length) {
    throw new Error('Database is missing required admin or sales_executive user accounts.');
  }

  const adminUser = adminRes.rows[0];
  const salesUser = salesRes.rows[0];

  const adminToken = jwt.sign({ id: adminUser.id, email: adminUser.email }, config.jwtSecret, { expiresIn: '1h' });
  const salesToken = jwt.sign({ id: salesUser.id, email: salesUser.email }, config.jwtSecret, { expiresIn: '1h' });

  // Get existing sample records for read-only workflow checks
  const existingCustRes = await pool.query('SELECT id, name, email FROM customers LIMIT 1');
  const existingLeadRes = await pool.query('SELECT id, name, email FROM leads LIMIT 1');
  const existingCustId = existingCustRes.rows[0]?.id;
  const existingLeadId = existingLeadRes.rows[0]?.id;

  // -------------------------------------------------------------
  // SUITE 1: Health & Diagnostics
  // -------------------------------------------------------------
  console.log('\n--- SUITE 1: System Health & Diagnostics ---');

  await assertTest('GET /api/health returns HTTP 200 with database connected', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error(`Expected status 'ok', got ${data.status}`);
    if (!data.database?.connected) throw new Error('Database not connected in health check');
    if (!data.database?.version) throw new Error('Database version missing in health check');
  });

  await assertTest('PostgreSQL connection latency check', async () => {
    const start = Date.now();
    const res = await pool.query('SELECT NOW()');
    const latency = Date.now() - start;
    if (!res.rows[0]) throw new Error('Query failed');
    if (latency > 2000) throw new Error(`Excessive latency: ${latency}ms`);
  });

  // -------------------------------------------------------------
  // SUITE 2: CORS Security & Origin Isolation
  // -------------------------------------------------------------
  console.log('\n--- SUITE 2: CORS Security & Origin Allowlist ---');

  await assertTest('CORS allows legitimate frontend origin 127.0.0.1:5173', async () => {
    const res = await fetch(`${BASE_URL}/health`, {
      headers: { 'Origin': 'http://127.0.0.1:5173' }
    });
    const allowOrigin = res.headers.get('access-control-allow-origin');
    if (allowOrigin !== 'http://127.0.0.1:5173') {
      throw new Error(`Expected Access-Control-Allow-Origin: http://127.0.0.1:5173, got ${allowOrigin}`);
    }
  });

  await assertTest('CORS allows legitimate frontend origin localhost:5173', async () => {
    const res = await fetch(`${BASE_URL}/health`, {
      headers: { 'Origin': 'http://localhost:5173' }
    });
    const allowOrigin = res.headers.get('access-control-allow-origin');
    if (allowOrigin !== 'http://localhost:5173') {
      throw new Error(`Expected Access-Control-Allow-Origin: http://localhost:5173, got ${allowOrigin}`);
    }
  });

  await assertTest('CORS safely blocks unapproved browser origin http://unauthorized-domain.com', async () => {
    const res = await fetch(`${BASE_URL}/health`, {
      headers: { 'Origin': 'http://unauthorized-domain.com' }
    });
    const allowOrigin = res.headers.get('access-control-allow-origin');
    if (allowOrigin === 'http://unauthorized-domain.com' || allowOrigin === '*') {
      throw new Error(`Unapproved origin was unexpectedly granted CORS header: ${allowOrigin}`);
    }
  });

  await assertTest('Requests with no origin header (curl/scripts) are permitted', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  // -------------------------------------------------------------
  // SUITE 3: Authentication & Token Verification (401)
  // -------------------------------------------------------------
  console.log('\n--- SUITE 3: Authentication & Token Handling ---');

  await assertTest('Request without Authorization header returns HTTP 401', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`);
    if (res.status !== 401) throw new Error(`Expected HTTP 401, got ${res.status}`);
    const data = await res.json();
    if (data.status !== 'error') throw new Error(`Expected error status, got ${data.status}`);
  });

  await assertTest('Request with malformed header (not Bearer) returns HTTP 401', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': 'Basic dXNlcjpwYXNz' }
    });
    if (res.status !== 401) throw new Error(`Expected HTTP 401, got ${res.status}`);
  });

  await assertTest('Request with invalid JWT signature returns HTTP 401', async () => {
    const fakeToken = jwt.sign({ id: adminUser.id }, 'wrong_secret_key');
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${fakeToken}` }
    });
    if (res.status !== 401) throw new Error(`Expected HTTP 401, got ${res.status}`);
  });

  await assertTest('Request with valid JWT retrieves profile via GET /api/auth/me', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${salesToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const data = await res.json();
    if (data.data?.user?.email !== salesUser.email) throw new Error('User profile email mismatch');
    if (data.data?.user?.role !== 'sales_executive') throw new Error('User role mismatch');
  });

  // -------------------------------------------------------------
  // SUITE 4: RBAC & Privilege Escalation Resistance (403 vs 404)
  // -------------------------------------------------------------
  console.log('\n--- SUITE 4: RBAC Enforcement & Anti-Tampering ---');

  const destructiveEndpoints = [
    { name: 'DELETE /api/customers/:id', url: `/customers/${DUMMY_UUID}` },
    { name: 'DELETE /api/leads/:id', url: `/leads/${DUMMY_UUID}` },
    { name: 'DELETE /api/deals/:id', url: `/deals/${DUMMY_UUID}` },
    { name: 'DELETE /api/leads/:id/interactions/:iid', url: `/leads/${DUMMY_UUID}/interactions/${DUMMY_UUID}` },
  ];

  for (const ep of destructiveEndpoints) {
    await assertTest(`${ep.name} unauthenticated returns HTTP 401`, async () => {
      const res = await fetch(`${BASE_URL}${ep.url}`, { method: 'DELETE' });
      if (res.status !== 401) throw new Error(`Expected HTTP 401, got ${res.status}`);
    });

    await assertTest(`${ep.name} by sales_executive returns HTTP 403 Forbidden`, async () => {
      const res = await fetch(`${BASE_URL}${ep.url}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${salesToken}` }
      });
      if (res.status !== 403) throw new Error(`Expected HTTP 403, got ${res.status}`);
      const data = await res.json();
      if (data.message !== 'Access denied: insufficient permissions') {
        throw new Error(`Unexpected message: ${data.message}`);
      }
    });
  }

  await assertTest('Privilege escalation via body { role: "admin" } is blocked with HTTP 403', async () => {
    const res = await fetch(`${BASE_URL}/customers/${DUMMY_UUID}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${salesToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: 'admin' })
    });
    if (res.status !== 403) throw new Error(`Expected HTTP 403, got ${res.status}`);
  });

  await assertTest('Privilege escalation via URL query ?role=admin is blocked with HTTP 403', async () => {
    const res = await fetch(`${BASE_URL}/customers/${DUMMY_UUID}?role=admin`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${salesToken}` }
    });
    if (res.status !== 403) throw new Error(`Expected HTTP 403, got ${res.status}`);
  });

  await assertTest('Privilege escalation via forged JWT role claim is blocked with HTTP 403', async () => {
    const forgedToken = jwt.sign(
      { id: salesUser.id, email: salesUser.email, role: 'admin' },
      config.jwtSecret
    );
    const res = await fetch(`${BASE_URL}/customers/${DUMMY_UUID}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${forgedToken}` }
    });
    if (res.status !== 403) throw new Error(`Expected HTTP 403, got ${res.status}`);
  });

  await assertTest('Admin delete customer passes RBAC and reaches controller (HTTP 404 for dummy UUID)', async () => {
    const res = await fetch(`${BASE_URL}/customers/${DUMMY_UUID}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.status !== 404) throw new Error(`Expected HTTP 404, got ${res.status}`);
  });

  await assertTest('Admin delete lead passes RBAC and reaches controller (HTTP 404 for dummy UUID)', async () => {
    const res = await fetch(`${BASE_URL}/leads/${DUMMY_UUID}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.status !== 404) throw new Error(`Expected HTTP 404, got ${res.status}`);
  });

  await assertTest('Admin delete deal passes RBAC and reaches controller (HTTP 404 for dummy UUID)', async () => {
    const res = await fetch(`${BASE_URL}/deals/${DUMMY_UUID}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.status !== 404) throw new Error(`Expected HTTP 404, got ${res.status}`);
  });

  // -------------------------------------------------------------
  // SUITE 5: Complete UUID Parameter Validation (400)
  // -------------------------------------------------------------
  console.log('\n--- SUITE 5: UUID Parameter Format Validation ---');

  const uuidEndpoints = [
    { method: 'GET', url: `/customers/${INVALID_UUID}` },
    { method: 'PUT', url: `/customers/${INVALID_UUID}`, body: { name: 'Test' } },
    { method: 'DELETE', url: `/customers/${INVALID_UUID}`, auth: adminToken },
    { method: 'GET', url: `/customers/${INVALID_UUID}/interactions` },
    { method: 'POST', url: `/customers/${INVALID_UUID}/interactions`, body: { subject: 'Test' } },
    { method: 'GET', url: `/leads/${INVALID_UUID}` },
    { method: 'PUT', url: `/leads/${INVALID_UUID}`, body: { name: 'Test' } },
    { method: 'DELETE', url: `/leads/${INVALID_UUID}`, auth: adminToken },
    { method: 'POST', url: `/leads/${INVALID_UUID}/convert` },
    { method: 'GET', url: `/leads/${INVALID_UUID}/score` },
    { method: 'GET', url: `/leads/${INVALID_UUID}/interactions` },
    { method: 'POST', url: `/leads/${INVALID_UUID}/interactions`, body: { description: 'Test' } },
    { method: 'DELETE', url: `/leads/${INVALID_UUID}/interactions/${INVALID_UUID}`, auth: adminToken },
    { method: 'GET', url: `/deals/${INVALID_UUID}` },
    { method: 'PUT', url: `/deals/${INVALID_UUID}`, body: { name: 'Test' } },
    { method: 'DELETE', url: `/deals/${INVALID_UUID}`, auth: adminToken },
  ];

  for (const ep of uuidEndpoints) {
    await assertTest(`${ep.method} ${ep.url} rejects invalid UUID with HTTP 400`, async () => {
      const res = await fetch(`${BASE_URL}${ep.url}`, {
        method: ep.method,
        headers: {
          'Authorization': `Bearer ${ep.auth || salesToken}`,
          'Content-Type': 'application/json'
        },
        ...(ep.body ? { body: JSON.stringify(ep.body) } : {})
      });
      if (res.status !== 400) throw new Error(`Expected HTTP 400, got ${res.status}`);
      const data = await res.json();
      if (data.message !== 'Invalid ID format') {
        throw new Error(`Expected 'Invalid ID format', got: ${data.message}`);
      }
    });
  }

  // -------------------------------------------------------------
  // SUITE 6: Customer Module Business Logic & Workflows
  // -------------------------------------------------------------
  console.log('\n--- SUITE 6: Customer Management Workflows ---');

  await assertTest('GET /api/customers lists customers with count', async () => {
    const res = await fetch(`${BASE_URL}/customers`, {
      headers: { 'Authorization': `Bearer ${salesToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.data?.customers)) throw new Error('customers array missing');
    if (data.count !== data.data.customers.length) throw new Error('Count mismatch');
  });

  if (existingCustId) {
    await assertTest(`GET /api/customers/${existingCustId} returns customer profile with interactions`, async () => {
      const res = await fetch(`${BASE_URL}/customers/${existingCustId}`, {
        headers: { 'Authorization': `Bearer ${salesToken}` }
      });
      if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
      const data = await res.json();
      if (data.data?.customer?.id !== existingCustId) throw new Error('Customer ID mismatch');
      if (!Array.isArray(data.data?.customer?.interactions)) throw new Error('Customer interactions array missing');
    });

    await assertTest(`GET /api/customers/${existingCustId}/interactions returns customer interaction history`, async () => {
      const res = await fetch(`${BASE_URL}/customers/${existingCustId}/interactions`, {
        headers: { 'Authorization': `Bearer ${salesToken}` }
      });
      if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data.data?.interactions)) throw new Error('Interactions array missing');
    });
  }

  await assertTest('POST /api/customers rejects missing customer name with HTTP 400', async () => {
    const res = await fetch(`${BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${salesToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: 'test@example.com' })
    });
    if (res.status !== 400) throw new Error(`Expected HTTP 400, got ${res.status}`);
    const data = await res.json();
    if (!data.message?.includes('name is required')) throw new Error(`Unexpected message: ${data.message}`);
  });

  await assertTest('POST /api/customers rejects invalid email format with HTTP 400', async () => {
    const res = await fetch(`${BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${salesToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'Valid Name', email: 'invalid-email-address' })
    });
    if (res.status !== 400) throw new Error(`Expected HTTP 400, got ${res.status}`);
    const data = await res.json();
    if (!data.message?.toLowerCase().includes('email format')) throw new Error(`Unexpected message: ${data.message}`);
  });

  // -------------------------------------------------------------
  // SUITE 7: Lead Module & Scoring Workflows
  // -------------------------------------------------------------
  console.log('\n--- SUITE 7: Lead Management & Deterministic Scoring ---');

  await assertTest('GET /api/leads lists leads with pagination and search metadata', async () => {
    const res = await fetch(`${BASE_URL}/leads`, {
      headers: { 'Authorization': `Bearer ${salesToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.data?.leads)) throw new Error('Leads array missing');
    if (!data.pagination) throw new Error('Pagination metadata missing');
  });

  if (existingLeadId) {
    await assertTest(`GET /api/leads/${existingLeadId} returns lead with interaction history`, async () => {
      const res = await fetch(`${BASE_URL}/leads/${existingLeadId}`, {
        headers: { 'Authorization': `Bearer ${salesToken}` }
      });
      if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
      const data = await res.json();
      if (data.data?.lead?.id !== existingLeadId) throw new Error('Lead ID mismatch');
    });

    await assertTest(`GET /api/leads/${existingLeadId}/score returns deterministic explainable breakdown`, async () => {
      const res = await fetch(`${BASE_URL}/leads/${existingLeadId}/score`, {
        headers: { 'Authorization': `Bearer ${salesToken}` }
      });
      if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
      const data = await res.json();
      const scoreData = data.data?.score_breakdown;
      if (!scoreData) throw new Error('score_breakdown missing');
      if (typeof scoreData.score !== 'number' || scoreData.score < 0 || scoreData.score > 100) {
        throw new Error(`Score out of bounds (0-100): ${scoreData.score}`);
      }
      if (!Array.isArray(scoreData.contributing_factors) || scoreData.contributing_factors.length !== 5) {
        throw new Error('Expected exactly 5 contributing factor categories');
      }
      if (scoreData.is_ai_enabled !== false) {
        throw new Error('Rule-based baseline must declare is_ai_enabled: false');
      }
      if (scoreData.is_ai_ready !== true) {
        throw new Error('Baseline must declare is_ai_ready: true');
      }
    });

    await assertTest(`GET /api/leads/${existingLeadId}/interactions returns lead interactions`, async () => {
      const res = await fetch(`${BASE_URL}/leads/${existingLeadId}/interactions`, {
        headers: { 'Authorization': `Bearer ${salesToken}` }
      });
      if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data.data?.interactions)) throw new Error('Interactions array missing');
    });
  }

  await assertTest('POST /api/leads rejects missing lead name with HTTP 400', async () => {
    const res = await fetch(`${BASE_URL}/leads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${salesToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: 'lead@example.com' })
    });
    if (res.status !== 400) throw new Error(`Expected HTTP 400, got ${res.status}`);
    const data = await res.json();
    if (!data.message?.includes('name is required')) throw new Error(`Unexpected message: ${data.message}`);
  });

  // -------------------------------------------------------------
  // SUITE 8: Deal Module & Financial Metrics
  // -------------------------------------------------------------
  console.log('\n--- SUITE 8: Deal Module & Pipeline Metrics ---');

  await assertTest('GET /api/deals returns deals list and handles empty deal state cleanly', async () => {
    const res = await fetch(`${BASE_URL}/deals`, {
      headers: { 'Authorization': `Bearer ${salesToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.data?.deals)) throw new Error('Deals array missing');
  });

  await assertTest('GET /api/deals/metrics/summary returns accurate financial metrics', async () => {
    const res = await fetch(`${BASE_URL}/deals/metrics/summary`, {
      headers: { 'Authorization': `Bearer ${salesToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const data = await res.json();
    const m = data.data?.metrics;
    if (!m) throw new Error('Metrics missing');
    if (typeof m.totalDeals !== 'number') throw new Error('totalDeals missing');
    if (typeof m.wonRevenue !== 'number') throw new Error('wonRevenue missing');
    if (typeof m.openPipelineValue !== 'number') throw new Error('openPipelineValue missing');
    if (typeof m.winRate !== 'number') throw new Error('winRate missing');
  });

  await assertTest('POST /api/deals rejects negative deal value with HTTP 400', async () => {
    const res = await fetch(`${BASE_URL}/deals`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${salesToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'Negative Deal', value: -500 })
    });
    if (res.status !== 400) throw new Error(`Expected HTTP 400, got ${res.status}`);
    const data = await res.json();
    if (!data.message?.includes('non-negative')) throw new Error(`Unexpected message: ${data.message}`);
  });

  await assertTest('POST /api/deals rejects invalid deal stage with HTTP 400', async () => {
    const res = await fetch(`${BASE_URL}/deals`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${salesToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'Invalid Stage Deal', stage: 'InvalidStageName' })
    });
    if (res.status !== 400) throw new Error(`Expected HTTP 400, got ${res.status}`);
    const data = await res.json();
    if (!data.message?.includes('Invalid deal stage')) throw new Error(`Unexpected message: ${data.message}`);
  });

  await assertTest('POST /api/deals rejects non-existent customer reference with HTTP 400', async () => {
    const res = await fetch(`${BASE_URL}/deals`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${salesToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'Orphan Deal', customer_id: DUMMY_UUID })
    });
    if (res.status !== 400) throw new Error(`Expected HTTP 400, got ${res.status}`);
    const data = await res.json();
    if (!data.message?.includes('does not exist')) throw new Error(`Unexpected message: ${data.message}`);
  });

  // -------------------------------------------------------------
  // SUITE 9: Analytics & Reporting Engine
  // -------------------------------------------------------------
  console.log('\n--- SUITE 9: Analytics & Reporting Workflows ---');

  await assertTest('GET /api/analytics/dashboard returns consolidated metrics without division-by-zero errors', async () => {
    const res = await fetch(`${BASE_URL}/analytics/dashboard`, {
      headers: { 'Authorization': `Bearer ${salesToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const data = await res.json();
    if (!data.data?.overview) throw new Error('Overview metrics missing');
    if (!data.data?.deals?.summary) throw new Error('Deals summary missing');
    if (!data.data?.leads?.leadsByStatus) throw new Error('leadsByStatus missing');
    if (!data.data?.leads?.priorityDistribution) throw new Error('priorityDistribution missing');
  });

  await assertTest('GET /api/analytics/overview returns KPI overview metrics', async () => {
    const res = await fetch(`${BASE_URL}/analytics/overview`, {
      headers: { 'Authorization': `Bearer ${salesToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const data = await res.json();
    if (!data.data?.kpis) throw new Error('KPIs data missing');
    if (typeof data.data?.kpis?.totalCustomers !== 'number') throw new Error('totalCustomers missing');
  });

  await assertTest('GET /api/analytics/leads returns lead conversion and source breakdowns', async () => {
    const res = await fetch(`${BASE_URL}/analytics/leads`, {
      headers: { 'Authorization': `Bearer ${salesToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const data = await res.json();
    if (typeof data.data?.totalLeads !== 'number') throw new Error('totalLeads missing');
    if (!Array.isArray(data.data?.leadsByStatus)) throw new Error('leadsByStatus missing');
    if (!Array.isArray(data.data?.leadsBySource)) throw new Error('leadsBySource missing');
  });

  await assertTest('GET /api/analytics/deals handles zero-deal state gracefully with 0% win rate', async () => {
    const res = await fetch(`${BASE_URL}/analytics/deals`, {
      headers: { 'Authorization': `Bearer ${salesToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    const data = await res.json();
    if (!data.data?.summary) throw new Error('Deal summary missing');
    if (data.data?.summary?.winRate !== 0) throw new Error(`Expected 0% win rate for 0 deals, got ${data.data?.summary?.winRate}`);
    if (!Array.isArray(data.data?.dealsByStage)) throw new Error('dealsByStage missing');
  });

  // -------------------------------------------------------------
  // SUITE 10: Safe Error Handling & Anti-Leakage
  // -------------------------------------------------------------
  console.log('\n--- SUITE 10: Safe Error Handling & Data Leakage Prevention ---');

  await assertTest('Undefined API route returns safe HTTP 404 without stack trace', async () => {
    const res = await fetch(`${BASE_URL}/non-existent-endpoint-${Date.now()}`);
    if (res.status !== 404) throw new Error(`Expected HTTP 404, got ${res.status}`);
    const data = await res.json();
    if (data.stack) throw new Error('Stack trace leaked in 404 response');
    if (!data.message?.includes('Resource not found')) throw new Error('Unexpected 404 message');
  });

  // -------------------------------------------------------------
  // SUITE 11: Database Record Count & State Preservation
  // -------------------------------------------------------------
  console.log('\n--- SUITE 11: Database Record Integrity Check ---');

  const postUsers = await pool.query('SELECT count(*) FROM users');
  const postCustomers = await pool.query('SELECT count(*) FROM customers');
  const postLeads = await pool.query('SELECT count(*) FROM leads');
  const postDeals = await pool.query('SELECT count(*) FROM deals');
  const postCustInteractions = await pool.query('SELECT count(*) FROM customer_interactions');
  const postLeadInteractions = await pool.query('SELECT count(*) FROM lead_interactions');

  const postCounts = {
    users: parseInt(postUsers.rows[0].count, 10),
    customers: parseInt(postCustomers.rows[0].count, 10),
    leads: parseInt(postLeads.rows[0].count, 10),
    deals: parseInt(postDeals.rows[0].count, 10),
    customer_interactions: parseInt(postCustInteractions.rows[0].count, 10),
    lead_interactions: parseInt(postLeadInteractions.rows[0].count, 10),
  };

  await assertTest('Post-test table counts match baseline exactly (zero record loss/mutation)', async () => {
    for (const key of Object.keys(baseline)) {
      if (baseline[key] !== postCounts[key]) {
        throw new Error(`Table ${key} changed from ${baseline[key]} to ${postCounts[key]}`);
      }
    }
  });

  console.log('\nPost-test Record Counts:', JSON.stringify(postCounts, null, 2));

  // -------------------------------------------------------------
  // Final Test Summary
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`Master Test Suite Summary:`);
  console.log(`Total Tests Run: ${totalTests}`);
  console.log(`Passed:          ${passedTests}`);
  console.log(`Failed:          ${failedTests}`);
  console.log(`Success Rate:    ${Math.round((passedTests / totalTests) * 100)}%`);
  console.log('================================================================');

  await pool.end();
  process.exit(failedTests > 0 ? 1 : 0);
}

runTestSuite().catch(err => {
  console.error('Master test suite unhandled crash:', err);
  process.exit(1);
});
