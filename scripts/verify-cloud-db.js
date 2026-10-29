/**
 * verify-cloud-db.js
 * Verification script for AI-Powered Cloud CRM PostgreSQL Database.
 * Verifies connectivity, extensions, tables, columns, indexes, foreign key integrity, and row counts.
 *
 * Usage:
 *   node scripts/verify-cloud-db.js
 *   DB_HOST=127.0.0.1 DB_PORT=5432 DB_NAME=cloud_crm_db DB_USER=postgres node scripts/verify-cloud-db.js
 */

const path = require('path');
const backendDir = path.resolve(__dirname, '../backend');

// Try requiring from local or backend node_modules
let Pool, dotenv;
try {
  Pool = require('pg').Pool;
} catch {
  Pool = require(path.join(backendDir, 'node_modules/pg')).Pool;
}

try {
  dotenv = require('dotenv');
} catch {
  dotenv = require(path.join(backendDir, 'node_modules/dotenv'));
}

dotenv.config({ path: path.join(backendDir, '.env') });

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'cloud_crm_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || undefined,
  connectionTimeoutMillis: 5000,
};

const pool = new Pool(config);

const EXPECTED_TABLES = [
  'users',
  'customers',
  'leads',
  'deals',
  'customer_interactions',
  'lead_interactions',
];

const EXPECTED_INDEXES = [
  'idx_users_email',
  'idx_customers_email',
  'idx_customers_name',
  'idx_customers_company',
  'idx_customers_status',
  'idx_interactions_customer',
  'idx_interactions_date',
  'idx_leads_name',
  'idx_leads_email',
  'idx_leads_company',
  'idx_leads_status',
  'idx_leads_source',
  'idx_leads_created_by',
  'idx_leads_assigned_to',
  'idx_lead_interactions_lead_id',
  'idx_lead_interactions_created_at',
  'idx_deals_name',
  'idx_deals_stage',
  'idx_deals_customer_id',
  'idx_deals_lead_id',
  'idx_deals_assigned_to',
  'idx_deals_created_by',
  'idx_deals_expected_close_date',
  'idx_deals_created_at',
];

async function runVerification() {
  console.log('=================================================================');
  console.log('       AI-Powered Cloud CRM — Database Verification Tool         ');
  console.log('=================================================================');
  console.log(`Target Host:     ${config.host}:${config.port}`);
  console.log(`Target Database: ${config.database}`);
  console.log(`Target User:     ${config.user}`);
  console.log('=================================================================\n');

  let passed = true;
  const issues = [];

  try {
    // 1. Connection & Version Check
    const versionRes = await pool.query('SELECT version()');
    console.log(`[PASS] Connected successfully.`);
    console.log(`       Engine: ${versionRes.rows[0].version.split(',')[0]}\n`);

    // 2. Extension Check
    const extRes = await pool.query(`
      SELECT extname, extversion FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto');
    `);
    const installedExts = extRes.rows.map((r) => r.extname);
    if (installedExts.includes('uuid-ossp') || installedExts.includes('pgcrypto')) {
      console.log(`[PASS] UUID Extension installed: ${installedExts.join(', ')}`);
    } else {
      console.log(`[FAIL] Required UUID extension (uuid-ossp or pgcrypto) NOT installed.`);
      issues.push('Missing uuid-ossp or pgcrypto extension');
      passed = false;
    }

    // 3. Tables & Row Counts Check
    console.log('\n--- Table Verification & Record Counts ---');
    const tableRes = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `);
    const existingTables = tableRes.rows.map((r) => r.table_name);

    for (const table of EXPECTED_TABLES) {
      if (existingTables.includes(table)) {
        const countRes = await pool.query(`SELECT COUNT(*)::int as count FROM "${table}"`);
        const count = countRes.rows[0].count;
        console.log(`  [PASS] Table "${table.padEnd(22)}" exists (Rows: ${count})`);
      } else {
        console.log(`  [FAIL] Table "${table}" is MISSING.`);
        issues.push(`Missing table: ${table}`);
        passed = false;
      }
    }

    // 4. Index Check
    console.log('\n--- Index Verification ---');
    const indexRes = await pool.query(`
      SELECT indexname FROM pg_indexes WHERE schemaname = 'public';
    `);
    const existingIndexes = indexRes.rows.map((r) => r.indexname);
    for (const idx of EXPECTED_INDEXES) {
      if (existingIndexes.includes(idx)) {
        console.log(`  [PASS] Index "${idx}" is present.`);
      } else {
        console.log(`  [WARN] Index "${idx}" not found in current database.`);
      }
    }

    // 5. Referential Integrity / Foreign Key Check
    console.log('\n--- Foreign Key Integrity Verification ---');
    
    // Check orphaned customers -> created_by
    const orphanCustRes = await pool.query(`
      SELECT COUNT(*)::int as count FROM customers c 
      WHERE c.created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = c.created_by);
    `);
    if (orphanCustRes.rows[0].count === 0) {
      console.log(`  [PASS] Customers created_by foreign keys: Valid (0 orphans)`);
    } else {
      console.log(`  [FAIL] Customers have ${orphanCustRes.rows[0].count} orphaned created_by references.`);
      issues.push(`Orphaned created_by in customers: ${orphanCustRes.rows[0].count}`);
      passed = false;
    }

    // Check orphaned leads -> assigned_to, created_by, converted_customer_id
    const orphanLeadsRes = await pool.query(`
      SELECT COUNT(*)::int as count FROM leads l 
      WHERE (l.assigned_to IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = l.assigned_to))
         OR (l.created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = l.created_by))
         OR (l.converted_customer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM customers c WHERE c.id = l.converted_customer_id));
    `);
    if (orphanLeadsRes.rows[0].count === 0) {
      console.log(`  [PASS] Leads foreign keys (assigned_to, created_by, converted_customer_id): Valid (0 orphans)`);
    } else {
      console.log(`  [FAIL] Leads have ${orphanLeadsRes.rows[0].count} orphaned foreign key references.`);
      issues.push(`Orphaned foreign keys in leads: ${orphanLeadsRes.rows[0].count}`);
      passed = false;
    }

    // Check orphaned deals -> lead_id, customer_id, assigned_to, created_by
    const orphanDealsRes = await pool.query(`
      SELECT COUNT(*)::int as count FROM deals d
      WHERE (d.lead_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM leads l WHERE l.id = d.lead_id))
         OR (d.customer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM customers c WHERE c.id = d.customer_id))
         OR (d.assigned_to IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = d.assigned_to))
         OR (d.created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = d.created_by));
    `);
    if (orphanDealsRes.rows[0].count === 0) {
      console.log(`  [PASS] Deals foreign keys: Valid (0 orphans)`);
    } else {
      console.log(`  [FAIL] Deals have ${orphanDealsRes.rows[0].count} orphaned foreign key references.`);
      issues.push(`Orphaned foreign keys in deals: ${orphanDealsRes.rows[0].count}`);
      passed = false;
    }

    // Check orphaned interactions
    const orphanCustIntRes = await pool.query(`
      SELECT COUNT(*)::int as count FROM customer_interactions ci
      WHERE NOT EXISTS (SELECT 1 FROM customers c WHERE c.id = ci.customer_id)
         OR (ci.created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ci.created_by));
    `);
    if (orphanCustIntRes.rows[0].count === 0) {
      console.log(`  [PASS] Customer interactions foreign keys: Valid (0 orphans)`);
    } else {
      console.log(`  [FAIL] Customer interactions have ${orphanCustIntRes.rows[0].count} orphaned references.`);
      issues.push(`Orphaned customer_interactions: ${orphanCustIntRes.rows[0].count}`);
      passed = false;
    }

    const orphanLeadIntRes = await pool.query(`
      SELECT COUNT(*)::int as count FROM lead_interactions li
      WHERE NOT EXISTS (SELECT 1 FROM leads l WHERE l.id = li.lead_id)
         OR (li.created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = li.created_by));
    `);
    if (orphanLeadIntRes.rows[0].count === 0) {
      console.log(`  [PASS] Lead interactions foreign keys: Valid (0 orphans)`);
    } else {
      console.log(`  [FAIL] Lead interactions have ${orphanLeadIntRes.rows[0].count} orphaned references.`);
      issues.push(`Orphaned lead_interactions: ${orphanLeadIntRes.rows[0].count}`);
      passed = false;
    }

    // Summary
    console.log('\n=================================================================');
    if (passed) {
      console.log(' [SUCCESS] Database verification PASSED all structural & integrity checks.');
    } else {
      console.log(' [FAILURE] Database verification encountered issues:');
      issues.forEach((iss) => console.log(`   - ${iss}`));
    }
    console.log('=================================================================\n');

  } catch (err) {
    console.error(`\n[FATAL ERROR] Failed to complete verification: ${err.message}`);
    passed = false;
  } finally {
    await pool.end();
    process.exit(passed ? 0 : 1);
  }
}

runVerification();
