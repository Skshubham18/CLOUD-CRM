const { Pool } = require('pg');
const config = require('./env');

const poolConfig = {
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  // Reasonable connection timeouts for cloud and local databases
  connectionTimeoutMillis: 3000,
  idleTimeoutMillis: 30000,
  max: 10
};

if (process.env.DB_SSL === 'true') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[Database Pool Error]: Unexpected error on idle client', err.message);
});

/**
 * Diagnostic test function for PostgreSQL connection.
 * Returns structured status without crashing application.
 */
async function testDbConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() AS current_time, version() AS db_version');
    client.release();
    return {
      connected: true,
      timestamp: result.rows[0].current_time,
      version: result.rows[0].db_version
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    };
  }
}

/**
 * Automatically ensures necessary Phase 2 tables exist if connected to PostgreSQL
 */
async function initTables() {
  try {
    const client = await pool.connect();
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(150) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'sales_executive',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(150) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        company VARCHAR(150),
        industry VARCHAR(100),
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        notes TEXT,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
      CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
      CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company);
      CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

      CREATE TABLE IF NOT EXISTS customer_interactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        interaction_type VARCHAR(50) NOT NULL DEFAULT 'note',
        subject VARCHAR(200) NOT NULL,
        notes TEXT,
        interaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_interactions_customer ON customer_interactions(customer_id);

      CREATE TABLE IF NOT EXISTS leads (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(150) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        company VARCHAR(150),
        industry VARCHAR(100),
        source VARCHAR(50) DEFAULT 'Website',
        status VARCHAR(50) NOT NULL DEFAULT 'New',
        estimated_value NUMERIC(15, 2) DEFAULT 0,
        notes TEXT,
        assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        converted_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
        ai_score NUMERIC(5, 2) DEFAULT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_leads_name ON leads(name);
      CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
      CREATE INDEX IF NOT EXISTS idx_leads_company ON leads(company);
      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
      CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
      CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(created_by);
      CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);

      CREATE TABLE IF NOT EXISTS lead_interactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL DEFAULT 'note',
        description TEXT NOT NULL,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_lead_interactions_lead_id ON lead_interactions(lead_id);
      CREATE INDEX IF NOT EXISTS idx_lead_interactions_created_at ON lead_interactions(created_at);

      CREATE TABLE IF NOT EXISTS deals (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(150) NOT NULL,
        value NUMERIC(15, 2) NOT NULL DEFAULT 0,
        stage VARCHAR(50) NOT NULL DEFAULT 'Qualification',
        expected_close_date DATE,
        customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
        lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
        assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_deals_name ON deals(name);
      CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
      CREATE INDEX IF NOT EXISTS idx_deals_customer_id ON deals(customer_id);
      CREATE INDEX IF NOT EXISTS idx_deals_lead_id ON deals(lead_id);
      CREATE INDEX IF NOT EXISTS idx_deals_assigned_to ON deals(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_deals_created_by ON deals(created_by);
      CREATE INDEX IF NOT EXISTS idx_deals_expected_close_date ON deals(expected_close_date);
      CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at);
    `);
    client.release();
    console.log('✅ PostgreSQL tables (users, customers, leads, interactions, deals) verified & ready');
    return true;
  } catch (err) {
    console.error('[PostgreSQL Error] initTables failed:', err.message);
    return false;
  }
}

module.exports = {
  pool,
  testDbConnection,
  initTables
};
