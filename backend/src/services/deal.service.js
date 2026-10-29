const crypto = require('crypto');
const { pool } = require('../config/db');

const VALID_STAGES = ['Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost'];

/**
 * Normalizes stage string to PascalCase matching VALID_STAGES
 */
function normalizeStage(stage) {
  if (!stage) return 'Qualification';
  const match = VALID_STAGES.find(s => s.toLowerCase() === String(stage).trim().toLowerCase());
  return match || stage.trim();
}

/**
 * Lists deals with optional search, stage, customer, and lead filtering from PostgreSQL
 */
async function listDeals({
  search = '',
  stage = '',
  customerId = '',
  leadId = '',
  assignedTo = '',
  page = 1,
  limit = 50
} = {}) {
  const searchQuery = search ? search.trim().toLowerCase() : '';
  const stageFilter = stage && stage !== 'all' ? stage.trim().toLowerCase() : '';
  const customerFilter = customerId ? customerId.trim() : '';
  const leadFilter = leadId ? leadId.trim() : '';
  const assignedFilter = assignedTo ? assignedTo.trim() : '';

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
  const offset = (parsedPage - 1) * parsedLimit;

  try {
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (searchQuery) {
      whereClause += ` AND (
        LOWER(d.name) LIKE $${paramIndex} OR
        LOWER(COALESCE(c.name, '')) LIKE $${paramIndex} OR
        LOWER(COALESCE(c.company, '')) LIKE $${paramIndex} OR
        LOWER(COALESCE(l.name, '')) LIKE $${paramIndex} OR
        LOWER(COALESCE(l.company, '')) LIKE $${paramIndex}
      )`;
      params.push(`%${searchQuery}%`);
      paramIndex++;
    }

    if (stageFilter) {
      whereClause += ` AND LOWER(d.stage) = $${paramIndex}`;
      params.push(stageFilter);
      paramIndex++;
    }

    if (customerFilter) {
      whereClause += ` AND d.customer_id = $${paramIndex}`;
      params.push(customerFilter);
      paramIndex++;
    }

    if (leadFilter) {
      whereClause += ` AND d.lead_id = $${paramIndex}`;
      params.push(leadFilter);
      paramIndex++;
    }

    if (assignedFilter) {
      whereClause += ` AND d.assigned_to = $${paramIndex}`;
      params.push(assignedFilter);
      paramIndex++;
    }

    // Count query
    const countSql = `
      SELECT COUNT(*) AS total
      FROM deals d
      LEFT JOIN customers c ON d.customer_id = c.id
      LEFT JOIN leads l ON d.lead_id = l.id
      ${whereClause}
    `;
    const countResult = await pool.query(countSql, params);
    const total = parseInt(countResult.rows[0].total, 10);

    // Data query
    const dataSql = `
      SELECT d.id, d.name, d.value, d.stage, d.expected_close_date,
             d.customer_id, d.lead_id, d.assigned_to, d.created_by,
             d.notes, d.created_at, d.updated_at,
             c.name as customer_name, c.company as customer_company, c.email as customer_email,
             l.name as lead_name, l.company as lead_company, l.email as lead_email,
             u1.name as created_by_name, u1.email as created_by_email,
             u2.name as assigned_to_name, u2.email as assigned_to_email
      FROM deals d
      LEFT JOIN customers c ON d.customer_id = c.id
      LEFT JOIN leads l ON d.lead_id = l.id
      LEFT JOIN users u1 ON d.created_by = u1.id
      LEFT JOIN users u2 ON d.assigned_to = u2.id
      ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataParams = [...params, parsedLimit, offset];
    const result = await pool.query(dataSql, dataParams);

    return {
      deals: result.rows,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit) || 1
      }
    };
  } catch (error) {
    console.error('[PostgreSQL Error] listDeals failed:', error.message);
    const dbError = new Error('Database operation failed: ' + error.message);
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Gets a single deal by ID with joined customer, lead, and user data
 */
async function getDealById(id) {
  try {
    const result = await pool.query(
      `SELECT d.id, d.name, d.value, d.stage, d.expected_close_date,
              d.customer_id, d.lead_id, d.assigned_to, d.created_by,
              d.notes, d.created_at, d.updated_at,
              c.name as customer_name, c.company as customer_company, c.email as customer_email, c.phone as customer_phone,
              l.name as lead_name, l.company as lead_company, l.email as lead_email, l.phone as lead_phone,
              u1.name as created_by_name, u1.email as created_by_email,
              u2.name as assigned_to_name, u2.email as assigned_to_email
       FROM deals d
       LEFT JOIN customers c ON d.customer_id = c.id
       LEFT JOIN leads l ON d.lead_id = l.id
       LEFT JOIN users u1 ON d.created_by = u1.id
       LEFT JOIN users u2 ON d.assigned_to = u2.id
       WHERE d.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('[PostgreSQL Error] getDealById failed:', error.message);
    const dbError = new Error('Database operation failed: ' + error.message);
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Creates a new deal in PostgreSQL
 */
async function createDeal(data, userId) {
  const {
    name,
    value = 0,
    stage = 'Qualification',
    expected_close_date = null,
    customer_id = null,
    lead_id = null,
    assigned_to = null,
    notes = ''
  } = data;

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const normalizedStage = normalizeStage(stage);
  const numericValue = value !== undefined && value !== null && !isNaN(Number(value))
    ? Number(value)
    : 0;

  try {
    const result = await pool.query(
      `INSERT INTO deals (
        id, name, value, stage, expected_close_date,
        customer_id, lead_id, assigned_to, created_by,
        notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, name, value, stage, expected_close_date, customer_id, lead_id, assigned_to, created_by, notes, created_at, updated_at`,
      [
        id,
        name.trim(),
        numericValue,
        normalizedStage,
        expected_close_date || null,
        customer_id || null,
        lead_id || null,
        assigned_to || null,
        userId || null,
        notes ? notes.trim() : null,
        now,
        now
      ]
    );

    return await getDealById(id);
  } catch (error) {
    console.error('[PostgreSQL Error] createDeal failed:', error.message);
    const dbError = new Error('Database operation failed: ' + error.message);
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Updates an existing deal in PostgreSQL
 */
async function updateDeal(id, data) {
  const existing = await getDealById(id);
  if (!existing) {
    const error = new Error('Deal not found');
    error.statusCode = 404;
    throw error;
  }

  const updatedName = data.name !== undefined ? data.name.trim() : existing.name;
  const updatedValue = data.value !== undefined
    ? (!isNaN(Number(data.value)) ? Number(data.value) : existing.value)
    : existing.value;
  const updatedStage = data.stage !== undefined ? normalizeStage(data.stage) : existing.stage;
  const updatedCloseDate = data.expected_close_date !== undefined
    ? (data.expected_close_date || null)
    : existing.expected_close_date;
  const updatedCustomerId = data.customer_id !== undefined
    ? (data.customer_id || null)
    : existing.customer_id;
  const updatedLeadId = data.lead_id !== undefined
    ? (data.lead_id || null)
    : existing.lead_id;
  const updatedAssignedTo = data.assigned_to !== undefined
    ? (data.assigned_to || null)
    : existing.assigned_to;
  const updatedNotes = data.notes !== undefined
    ? (data.notes ? data.notes.trim() : null)
    : existing.notes;
  const now = new Date().toISOString();

  try {
    await pool.query(
      `UPDATE deals
       SET name = $1, value = $2, stage = $3, expected_close_date = $4,
           customer_id = $5, lead_id = $6, assigned_to = $7, notes = $8,
           updated_at = $9
       WHERE id = $10`,
      [
        updatedName,
        updatedValue,
        updatedStage,
        updatedCloseDate,
        updatedCustomerId,
        updatedLeadId,
        updatedAssignedTo,
        updatedNotes,
        now,
        id
      ]
    );

    return await getDealById(id);
  } catch (error) {
    console.error('[PostgreSQL Error] updateDeal failed:', error.message);
    const dbError = new Error('Database operation failed: ' + error.message);
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Deletes a deal record from PostgreSQL
 */
async function deleteDeal(id) {
  const existing = await getDealById(id);
  if (!existing) {
    const error = new Error('Deal not found');
    error.statusCode = 404;
    throw error;
  }

  try {
    await pool.query('DELETE FROM deals WHERE id = $1', [id]);
    return { success: true, message: 'Deal deleted successfully' };
  } catch (error) {
    console.error('[PostgreSQL Error] deleteDeal failed:', error.message);
    const dbError = new Error('Database operation failed: ' + error.message);
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Calculates live aggregated deal & revenue metrics from PostgreSQL
 */
async function getDealMetrics() {
  try {
    const sql = `
      SELECT
        COUNT(*) AS total_deals,
        COUNT(CASE WHEN stage IN ('Qualification', 'Proposal', 'Negotiation') THEN 1 END) AS open_deals,
        COUNT(CASE WHEN stage = 'Won' THEN 1 END) AS won_deals,
        COUNT(CASE WHEN stage = 'Lost' THEN 1 END) AS lost_deals,
        COALESCE(SUM(CASE WHEN stage IN ('Qualification', 'Proposal', 'Negotiation') THEN value ELSE 0 END), 0) AS open_pipeline_value,
        COALESCE(SUM(CASE WHEN stage = 'Won' THEN value ELSE 0 END), 0) AS won_revenue,
        COALESCE(SUM(value), 0) AS total_value
      FROM deals
    `;
    const result = await pool.query(sql);
    const row = result.rows[0];

    const totalDeals = parseInt(row.total_deals, 10) || 0;
    const openDeals = parseInt(row.open_deals, 10) || 0;
    const wonDeals = parseInt(row.won_deals, 10) || 0;
    const lostDeals = parseInt(row.lost_deals, 10) || 0;
    const openPipelineValue = parseFloat(row.open_pipeline_value) || 0;
    const wonRevenue = parseFloat(row.won_revenue) || 0;
    const totalValue = parseFloat(row.total_value) || 0;

    const closedDeals = wonDeals + lostDeals;
    const winRate = closedDeals > 0 ? Math.round((wonDeals / closedDeals) * 100) : 0;

    // Stage breakdown
    const stageSql = `
      SELECT stage, COUNT(*) AS count, COALESCE(SUM(value), 0) AS total_value
      FROM deals
      GROUP BY stage
    `;
    const stageResult = await pool.query(stageSql);
    const stageBreakdown = {};
    VALID_STAGES.forEach(s => {
      stageBreakdown[s] = { count: 0, totalValue: 0 };
    });
    stageResult.rows.forEach(r => {
      const norm = normalizeStage(r.stage);
      stageBreakdown[norm] = {
        count: parseInt(r.count, 10) || 0,
        totalValue: parseFloat(r.total_value) || 0
      };
    });

    return {
      totalDeals,
      openDeals,
      wonDeals,
      lostDeals,
      openPipelineValue,
      wonRevenue,
      totalValue,
      winRate,
      stageBreakdown
    };
  } catch (error) {
    console.error('[PostgreSQL Error] getDealMetrics failed:', error.message);
    const dbError = new Error('Database operation failed: ' + error.message);
    dbError.statusCode = 500;
    throw dbError;
  }
}

module.exports = {
  listDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
  getDealMetrics,
  VALID_STAGES
};
