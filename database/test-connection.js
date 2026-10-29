/**
 * PostgreSQL Connection Diagnostic Script
 * AI-Powered Cloud CRM for Small Businesses (Phase 1)
 *
 * Usage: node database/test-connection.js
 */

const path = require('path');

// Ensure modules installed in backend/node_modules can be resolved
module.paths.push(path.resolve(__dirname, '../backend/node_modules'));

const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'cloud_crm_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  connectionTimeoutMillis: 3000,
};

console.log('====================================================');
console.log('🐘 AI-Powered Cloud CRM: Database Connection Check');
console.log('====================================================');
console.log(`Target Host:     ${config.host}`);
console.log(`Target Port:     ${config.port}`);
console.log(`Database Name:   ${config.database}`);
console.log(`Database User:   ${config.user}`);
console.log(`Password Set:    ${config.password ? 'Yes (masked)' : 'No'}`);
console.log('----------------------------------------------------');
console.log('Attempting connection to PostgreSQL...');

const pool = new Pool(config);

async function runDiagnostic() {
  const startTime = Date.now();
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as version_info');
    client.release();
    const duration = Date.now() - startTime;

    console.log('✅ Connection Status: SUCCESS');
    console.log(`⚡ Response Time:    ${duration}ms`);
    console.log(`🕒 Server Time:      ${result.rows[0].current_time}`);
    console.log(`📦 PostgreSQL Info:  ${result.rows[0].version_info.split(',')[0]}`);
    console.log('====================================================');
    await pool.end();
    process.exit(0);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log('❌ Connection Status: FAILED (Database offline or not yet configured)');
    console.log(`⏱️  Attempt Duration: ${duration}ms`);
    console.log(`⚠️  Error Code:       ${error.code || 'N/A'}`);
    console.log(`📝 Error Detail:     ${error.message}`);
    console.log('----------------------------------------------------');
    console.log('ℹ️  Phase 1 Note:');
    console.log('   The CRM backend is built to run standalone in Phase 1.');
    console.log('   PostgreSQL setup instructions are documented in database/README.md.');
    console.log('====================================================');
    await pool.end();
    process.exit(0);
  }
}

runDiagnostic();
