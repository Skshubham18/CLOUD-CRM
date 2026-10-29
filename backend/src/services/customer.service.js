const crypto = require('crypto');
const { pool } = require('../config/db');
const interactionService = require('./interaction.service');

/**
 * Lists customers with optional search and status filtering directly from PostgreSQL
 */
async function listCustomers({ search = '', status = '', user } = {}) {
  const searchQuery = search ? search.trim().toLowerCase() : '';
  const statusFilter = status ? status.trim().toLowerCase() : '';

  try {
    let sql = `
      SELECT c.id, c.name, c.email, c.phone, c.company, c.industry, c.status, c.notes,
             c.created_by, c.created_at, c.updated_at,
             u.name as created_by_name
      FROM customers c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (searchQuery) {
      sql += ` AND (LOWER(c.name) LIKE $${paramIndex} OR LOWER(c.email) LIKE $${paramIndex} OR LOWER(c.company) LIKE $${paramIndex})`;
      params.push(`%${searchQuery}%`);
      paramIndex++;
    }

    if (statusFilter && statusFilter !== 'all') {
      sql += ` AND LOWER(c.status) = $${paramIndex}`;
      params.push(statusFilter);
      paramIndex++;
    }

    sql += ` ORDER BY c.created_at DESC`;

    const result = await pool.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('[PostgreSQL Error] listCustomers failed:', error.message);
    const dbError = new Error('Database operation failed: ' + error.message);
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Gets a single customer by ID along with their interaction history from PostgreSQL
 */
async function getCustomerById(id) {
  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.email, c.phone, c.company, c.industry, c.status, c.notes,
              c.created_by, c.created_at, c.updated_at,
              u.name as created_by_name
       FROM customers c
       LEFT JOIN users u ON c.created_by = u.id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const customer = result.rows[0];

    // Fetch interactions from PostgreSQL
    const interactions = await interactionService.getInteractionsByCustomerId(id);

    return {
      ...customer,
      interactions
    };
  } catch (error) {
    console.error('[PostgreSQL Error] getCustomerById failed:', error.message);
    const dbError = new Error('Database operation failed: ' + error.message);
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Creates a new customer record directly in PostgreSQL
 */
async function createCustomer(data, userId) {
  const {
    name,
    email,
    phone = '',
    company = '',
    industry = '',
    status = 'active',
    notes = ''
  } = data;

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    const result = await pool.query(
      `INSERT INTO customers (id, name, email, phone, company, industry, status, notes, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, name, email, phone, company, industry, status, notes, created_by, created_at, updated_at`,
      [
        id,
        name.trim(),
        email.trim().toLowerCase(),
        phone ? phone.trim() : null,
        company ? company.trim() : null,
        industry ? industry.trim() : null,
        status || 'active',
        notes ? notes.trim() : null,
        userId || null,
        now,
        now
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('[PostgreSQL Error] createCustomer failed:', error.message);
    const dbError = new Error('Database operation failed: ' + error.message);
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Updates an existing customer record directly in PostgreSQL
 */
async function updateCustomer(id, data) {
  const existing = await getCustomerById(id);
  if (!existing) {
    const error = new Error('Customer not found');
    error.statusCode = 404;
    throw error;
  }

  const updatedName = data.name !== undefined ? data.name.trim() : existing.name;
  const updatedEmail = data.email !== undefined ? data.email.trim().toLowerCase() : existing.email;
  const updatedPhone = data.phone !== undefined ? data.phone.trim() : existing.phone;
  const updatedCompany = data.company !== undefined ? data.company.trim() : existing.company;
  const updatedIndustry = data.industry !== undefined ? data.industry.trim() : existing.industry;
  const updatedStatus = data.status !== undefined ? data.status : existing.status;
  const updatedNotes = data.notes !== undefined ? data.notes.trim() : existing.notes;
  const now = new Date().toISOString();

  try {
    const result = await pool.query(
      `UPDATE customers
       SET name = $1, email = $2, phone = $3, company = $4, industry = $5, status = $6, notes = $7, updated_at = $8
       WHERE id = $9
       RETURNING id, name, email, phone, company, industry, status, notes, created_by, created_at, updated_at`,
      [
        updatedName,
        updatedEmail,
        updatedPhone,
        updatedCompany,
        updatedIndustry,
        updatedStatus,
        updatedNotes,
        now,
        id
      ]
    );

    if (result.rows.length === 0) {
      const error = new Error('Customer not found');
      error.statusCode = 404;
      throw error;
    }

    return result.rows[0];
  } catch (error) {
    if (error.statusCode) throw error;
    console.error('[PostgreSQL Error] updateCustomer failed:', error.message);
    const dbError = new Error('Database operation failed: ' + error.message);
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Deletes a customer directly from PostgreSQL (cascades interactions)
 */
async function deleteCustomer(id) {
  const existing = await getCustomerById(id);
  if (!existing) {
    const error = new Error('Customer not found');
    error.statusCode = 404;
    throw error;
  }

  try {
    await pool.query('DELETE FROM customers WHERE id = $1', [id]);
    return { success: true, message: 'Customer deleted successfully' };
  } catch (error) {
    console.error('[PostgreSQL Error] deleteCustomer failed:', error.message);
    const dbError = new Error('Database operation failed: ' + error.message);
    dbError.statusCode = 500;
    throw dbError;
  }
}

module.exports = {
  listCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
