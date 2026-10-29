const crypto = require('crypto');
const { pool } = require('../config/db');
const leadInteractionService = require('./leadInteraction.service');
const leadScoringService = require('./leadScoringService');

const VALID_STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];
const VALID_SOURCES = ['Website', 'Referral', 'Social Media', 'Email', 'Advertisement', 'Cold Call', 'Other'];

/**
 * Normalizes status string to PascalCase matching VALID_STATUSES
 */
function normalizeStatus(status) {
  if (!status) return 'New';
  const match = VALID_STATUSES.find(s => s.toLowerCase() === status.trim().toLowerCase());
  return match || status.trim();
}

/**
 * Normalizes source string to match VALID_SOURCES
 */
function normalizeSource(source) {
  if (!source) return 'Website';
  const match = VALID_SOURCES.find(s => s.toLowerCase() === source.trim().toLowerCase());
  return match || source.trim();
}

/**
 * Lists leads with optional search, status, and source filters from PostgreSQL
 */
async function listLeads({ search = '', status = '', source = '', page = 1, limit = 50 } = {}) {
  const searchQuery = search ? search.trim().toLowerCase() : '';
  const statusFilter = status && status !== 'all' ? status.trim().toLowerCase() : '';
  const sourceFilter = source && source !== 'all' ? source.trim().toLowerCase() : '';

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
  const offset = (parsedPage - 1) * parsedLimit;

  try {
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (searchQuery) {
      whereClause += ` AND (LOWER(l.name) LIKE $${paramIndex} OR LOWER(COALESCE(l.email, '')) LIKE $${paramIndex} OR LOWER(COALESCE(l.company, '')) LIKE $${paramIndex})`;
      params.push(`%${searchQuery}%`);
      paramIndex++;
    }

    if (statusFilter) {
      whereClause += ` AND LOWER(l.status) = $${paramIndex}`;
      params.push(statusFilter);
      paramIndex++;
    }

    if (sourceFilter) {
      whereClause += ` AND LOWER(l.source) = $${paramIndex}`;
      params.push(sourceFilter);
      paramIndex++;
    }

    // Total count query
    const countSql = `SELECT COUNT(*) AS total FROM leads l ${whereClause}`;
    const countResult = await pool.query(countSql, params);
    const total = parseInt(countResult.rows[0].total, 10);

    // Data query with creators, assignees, and converted customer names
    const dataSql = `
      SELECT l.id, l.name, l.email, l.phone, l.company, l.industry,
             l.source, l.status, l.estimated_value, l.notes,
             l.assigned_to, l.created_by, l.converted_customer_id, l.ai_score,
             l.created_at, l.updated_at,
             u1.name as created_by_name,
             u2.name as assigned_to_name,
             c.name as converted_customer_name
      FROM leads l
      LEFT JOIN users u1 ON l.created_by = u1.id
      LEFT JOIN users u2 ON l.assigned_to = u2.id
      LEFT JOIN customers c ON l.converted_customer_id = c.id
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataParams = [...params, parsedLimit, offset];
    const result = await pool.query(dataSql, dataParams);

    const enrichedLeads = result.rows.map(row => {
      const scoreResult = leadScoringService.calculateLeadScore(row);
      return {
        ...row,
        ai_score: scoreResult.score,
        priority: scoreResult.priority,
        priority_color: scoreResult.priority_color,
        score_details: scoreResult
      };
    });

    return {
      leads: enrichedLeads,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit) || 1
      }
    };
  } catch (error) {
    console.error('[PostgreSQL Error] listLeads failed:', error.message);
    const dbError = new Error('Database operation failed: ' + error.message);
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Gets a single lead by ID along with its interaction history from PostgreSQL
 */
async function getLeadById(id) {
  try {
    const result = await pool.query(
      `SELECT l.id, l.name, l.email, l.phone, l.company, l.industry,
              l.source, l.status, l.estimated_value, l.notes,
              l.assigned_to, l.created_by, l.converted_customer_id, l.ai_score,
              l.created_at, l.updated_at,
              u1.name as created_by_name,
              u2.name as assigned_to_name,
              c.name as converted_customer_name
       FROM leads l
       LEFT JOIN users u1 ON l.created_by = u1.id
       LEFT JOIN users u2 ON l.assigned_to = u2.id
       LEFT JOIN customers c ON l.converted_customer_id = c.id
       WHERE l.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const lead = result.rows[0];

    // Fetch lead interactions
    const interactions = await leadInteractionService.getInteractionsByLeadId(id);

    // Compute explainable score
    const scoreResult = leadScoringService.calculateLeadScore(lead, interactions);

    return {
      ...lead,
      ai_score: scoreResult.score,
      priority: scoreResult.priority,
      priority_color: scoreResult.priority_color,
      ai_metadata: scoreResult,
      interactions
    };
  } catch (error) {
    console.error('[PostgreSQL Error] getLeadById failed:', error.message);
    const dbError = new Error('Database operation failed: ' + error.message);
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Creates a new lead in PostgreSQL with calculated baseline score
 */
async function createLead(data, userId) {
  const {
    name,
    email = '',
    phone = '',
    company = '',
    industry = '',
    source = 'Website',
    status = 'New',
    estimated_value = 0,
    notes = '',
    assigned_to = null
  } = data;

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const normalizedStatus = normalizeStatus(status);
  const normalizedSource = normalizeSource(source);
  const numericValue = estimated_value !== undefined && estimated_value !== null && !isNaN(Number(estimated_value))
    ? Number(estimated_value)
    : 0;

  // Calculate initial score
  const scoreResult = leadScoringService.calculateLeadScore({
    id,
    name: name.trim(),
    email: email ? email.trim() : null,
    phone: phone ? phone.trim() : null,
    company: company ? company.trim() : null,
    industry: industry ? industry.trim() : null,
    source: normalizedSource,
    status: normalizedStatus,
    estimated_value: numericValue
  });

  try {
    const result = await pool.query(
      `INSERT INTO leads (
        id, name, email, phone, company, industry, source, status,
        estimated_value, notes, assigned_to, created_by, ai_score, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id, name, email, phone, company, industry, source, status,
                estimated_value, notes, assigned_to, created_by, ai_score, created_at, updated_at`,
      [
        id,
        name.trim(),
        email ? email.trim().toLowerCase() : null,
        phone ? phone.trim() : null,
        company ? company.trim() : null,
        industry ? industry.trim() : null,
        normalizedSource,
        normalizedStatus,
        numericValue,
        notes ? notes.trim() : null,
        assigned_to || null,
        userId || null,
        scoreResult.score,
        now,
        now
      ]
    );

    return {
      ...result.rows[0],
      priority: scoreResult.priority,
      ai_metadata: scoreResult
    };
  } catch (error) {
    console.error('[PostgreSQL Error] createLead failed:', error.message);
    const dbError = new Error('Database operation failed: ' + error.message);
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Updates an existing lead in PostgreSQL and recalculates baseline score
 */
async function updateLead(id, data) {
  const existing = await getLeadById(id);
  if (!existing) {
    const error = new Error('Lead not found');
    error.statusCode = 404;
    throw error;
  }

  const updatedName = data.name !== undefined ? data.name.trim() : existing.name;
  const updatedEmail = data.email !== undefined ? (data.email ? data.email.trim().toLowerCase() : null) : existing.email;
  const updatedPhone = data.phone !== undefined ? (data.phone ? data.phone.trim() : null) : existing.phone;
  const updatedCompany = data.company !== undefined ? (data.company ? data.company.trim() : null) : existing.company;
  const updatedIndustry = data.industry !== undefined ? (data.industry ? data.industry.trim() : null) : existing.industry;
  const updatedSource = data.source !== undefined ? normalizeSource(data.source) : existing.source;
  const updatedStatus = data.status !== undefined ? normalizeStatus(data.status) : existing.status;
  const updatedValue = data.estimated_value !== undefined
    ? (!isNaN(Number(data.estimated_value)) ? Number(data.estimated_value) : existing.estimated_value)
    : existing.estimated_value;
  const updatedNotes = data.notes !== undefined ? (data.notes ? data.notes.trim() : null) : existing.notes;
  const updatedAssignedTo = data.assigned_to !== undefined ? (data.assigned_to || null) : existing.assigned_to;
  const now = new Date().toISOString();

  // Recalculate score
  const scoreResult = leadScoringService.calculateLeadScore({
    id,
    name: updatedName,
    email: updatedEmail,
    phone: updatedPhone,
    company: updatedCompany,
    industry: updatedIndustry,
    source: updatedSource,
    status: updatedStatus,
    estimated_value: updatedValue
  }, existing.interactions || []);

  try {
    const result = await pool.query(
      `UPDATE leads
       SET name = $1, email = $2, phone = $3, company = $4, industry = $5,
           source = $6, status = $7, estimated_value = $8, notes = $9,
           assigned_to = $10, ai_score = $11, updated_at = $12
       WHERE id = $13
       RETURNING id, name, email, phone, company, industry, source, status,
                 estimated_value, notes, assigned_to, created_by, converted_customer_id,
                 ai_score, created_at, updated_at`,
      [
        updatedName,
        updatedEmail,
        updatedPhone,
        updatedCompany,
        updatedIndustry,
        updatedSource,
        updatedStatus,
        updatedValue,
        updatedNotes,
        updatedAssignedTo,
        scoreResult.score,
        now,
        id
      ]
    );

    return {
      ...result.rows[0],
      priority: scoreResult.priority,
      ai_metadata: scoreResult
    };
  } catch (error) {
    console.error('[PostgreSQL Error] updateLead failed:', error.message);
    const dbError = new Error('Database operation failed: ' + error.message);
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Gets explainable lead score breakdown for a lead
 */
async function getLeadScore(id) {
  const lead = await getLeadById(id);
  if (!lead) {
    const error = new Error(`Lead with ID '${id}' not found`);
    error.statusCode = 404;
    throw error;
  }
  return leadScoringService.calculateLeadScore(lead, lead.interactions || []);
}

/**
 * Deletes a lead directly from PostgreSQL (cascades interactions)
 */
async function deleteLead(id) {
  const existing = await getLeadById(id);
  if (!existing) {
    const error = new Error('Lead not found');
    error.statusCode = 404;
    throw error;
  }

  try {
    await pool.query('DELETE FROM leads WHERE id = $1', [id]);
    return { success: true, message: 'Lead deleted successfully' };
  } catch (error) {
    console.error('[PostgreSQL Error] deleteLead failed:', error.message);
    const dbError = new Error('Database operation failed: ' + error.message);
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Converts a lead to a customer using a PostgreSQL Transaction.
 * Prevents accidental duplicate customer creation.
 * Preserves the original lead with status 'Won' and links via converted_customer_id.
 */
async function convertLeadToCustomer(leadId, userId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Lock and fetch lead record
    const leadRes = await client.query('SELECT * FROM leads WHERE id = $1 FOR UPDATE', [leadId]);
    if (leadRes.rows.length === 0) {
      const error = new Error('Lead not found');
      error.statusCode = 404;
      throw error;
    }

    const lead = leadRes.rows[0];

    // 2. Check if lead is already converted
    if (lead.converted_customer_id) {
      const existingCustomerRes = await client.query('SELECT * FROM customers WHERE id = $1', [lead.converted_customer_id]);
      if (existingCustomerRes.rows.length > 0) {
        await client.query('COMMIT');
        return {
          lead,
          customer: existingCustomerRes.rows[0],
          isExistingCustomer: true,
          message: 'Lead has already been converted to a customer.'
        };
      }
    }

    let customer;
    let isExistingCustomer = false;

    // 3. Duplicate prevention: Check if customer with matching email already exists
    if (lead.email && lead.email.trim()) {
      const existingEmailRes = await client.query(
        'SELECT * FROM customers WHERE LOWER(email) = LOWER($1)',
        [lead.email.trim()]
      );

      if (existingEmailRes.rows.length > 0) {
        customer = existingEmailRes.rows[0];
        isExistingCustomer = true;
      }
    }

    const now = new Date().toISOString();

    // 4. Create customer if no duplicate found
    if (!customer) {
      const customerId = crypto.randomUUID();
      const customerName = lead.name;
      const customerEmail = lead.email || `${lead.name.toLowerCase().replace(/\s+/g, '.')}.${Date.now()}@placeholder.crm`;
      const customerPhone = lead.phone || null;
      const customerCompany = lead.company || null;
      const customerIndustry = lead.industry || 'Technology';
      const customerNotes = lead.notes
        ? `[Converted from Lead] ${lead.notes}`
        : `[Converted from Lead on ${new Date().toLocaleDateString()}]`;

      const insertCustomerRes = await client.query(
        `INSERT INTO customers (id, name, email, phone, company, industry, status, notes, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          customerId,
          customerName,
          customerEmail,
          customerPhone,
          customerCompany,
          customerIndustry,
          'active',
          customerNotes,
          userId || lead.created_by,
          now,
          now
        ]
      );
      customer = insertCustomerRes.rows[0];
    }

    // 5. Update lead status to 'Won', recompute score, and link converted_customer_id
    const wonScore = leadScoringService.calculateLeadScore({
      ...lead,
      status: 'Won'
    });

    const updatedLeadRes = await client.query(
      `UPDATE leads 
       SET status = 'Won', converted_customer_id = $1, ai_score = $2, updated_at = $3
       WHERE id = $4
       RETURNING *`,
      [customer.id, wonScore.score, now, leadId]
    );

    // 6. Log conversion interaction on the lead
    const interactionId = crypto.randomUUID();
    await client.query(
      `INSERT INTO lead_interactions (id, lead_id, type, description, created_by, created_at)
       VALUES ($1, $2, 'note', $3, $4, $5)`,
      [
        interactionId,
        leadId,
        `Lead converted to customer: ${customer.name} (${customer.company || 'Individual'})`,
        userId || null,
        now
      ]
    );

    await client.query('COMMIT');

    return {
      lead: updatedLeadRes.rows[0],
      customer,
      isExistingCustomer,
      message: isExistingCustomer
        ? `Lead converted and linked to existing customer record (${customer.name}).`
        : `Lead successfully converted into a new customer (${customer.name}).`
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[PostgreSQL Error] convertLeadToCustomer failed:', error.message);
    if (!error.statusCode) {
      error.statusCode = 500;
      error.message = 'Database operation failed during conversion: ' + error.message;
    }
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  listLeads,
  getLeadById,
  getLeadScore,
  createLead,
  updateLead,
  deleteLead,
  convertLeadToCustomer,
  VALID_STATUSES,
  VALID_SOURCES
};
