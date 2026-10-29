const crypto = require('crypto');
const { pool } = require('../config/db');

const ALLOWED_INTERACTION_TYPES = ['call', 'email', 'meeting', 'note'];

/**
 * Gets all interactions for a specific lead ordered chronologically descending
 */
async function getInteractionsByLeadId(leadId) {
  try {
    const result = await pool.query(
      `SELECT li.id, li.lead_id, li.type, li.description,
              li.created_by, li.created_at,
              u.name as created_by_name, u.email as created_by_email
       FROM lead_interactions li
       LEFT JOIN users u ON li.created_by = u.id
       WHERE li.lead_id = $1
       ORDER BY li.created_at DESC`,
      [leadId]
    );

    return result.rows;
  } catch (error) {
    console.error('[PostgreSQL Error] getInteractionsByLeadId failed:', error.message);
    const dbError = new Error('Database operation failed: ' + error.message);
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Adds a new interaction record to a lead in PostgreSQL
 */
async function addLeadInteraction(leadId, data, userId) {
  const { type = 'note', description } = data;

  if (!description || !description.trim()) {
    const error = new Error('Interaction description/notes cannot be empty');
    error.statusCode = 400;
    throw error;
  }

  const normalizedType = type.trim().toLowerCase();
  if (!ALLOWED_INTERACTION_TYPES.includes(normalizedType)) {
    const error = new Error(`Invalid interaction type. Allowed types: ${ALLOWED_INTERACTION_TYPES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    const result = await pool.query(
      `INSERT INTO lead_interactions (id, lead_id, type, description, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, lead_id, type, description, created_by, created_at`,
      [id, leadId, normalizedType, description.trim(), userId || null, now]
    );

    // Fetch user name for response consistency
    let createdByName = null;
    if (userId) {
      const userRes = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
      if (userRes.rows.length > 0) {
        createdByName = userRes.rows[0].name;
      }
    }

    return {
      ...result.rows[0],
      created_by_name: createdByName
    };
  } catch (error) {
    console.error('[PostgreSQL Error] addLeadInteraction failed:', error.message);
    const dbError = new Error('Database operation failed: ' + error.message);
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Deletes an interaction record from a lead in PostgreSQL
 */
async function deleteLeadInteraction(leadId, interactionId) {
  try {
    const result = await pool.query(
      `DELETE FROM lead_interactions 
       WHERE id = $1 AND lead_id = $2 
       RETURNING id`,
      [interactionId, leadId]
    );

    if (result.rows.length === 0) {
      const error = new Error('Interaction not found or does not belong to this lead');
      error.statusCode = 404;
      throw error;
    }

    return { success: true, message: 'Lead interaction deleted successfully' };
  } catch (error) {
    if (error.statusCode) throw error;
    console.error('[PostgreSQL Error] deleteLeadInteraction failed:', error.message);
    const dbError = new Error('Database operation failed: ' + error.message);
    dbError.statusCode = 500;
    throw dbError;
  }
}

module.exports = {
  getInteractionsByLeadId,
  addLeadInteraction,
  deleteLeadInteraction,
  ALLOWED_INTERACTION_TYPES
};
