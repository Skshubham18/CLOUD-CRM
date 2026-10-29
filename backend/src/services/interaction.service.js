const crypto = require('crypto');
const { pool } = require('../config/db');

/**
 * Gets all interactions for a specific customer directly from PostgreSQL
 */
async function getInteractionsByCustomerId(customerId) {
  try {
    const result = await pool.query(
      `SELECT i.id, i.customer_id, i.interaction_type, i.subject, i.notes,
              i.interaction_date, i.created_by, i.created_at,
              u.name as created_by_name
       FROM customer_interactions i
       LEFT JOIN users u ON i.created_by = u.id
       WHERE i.customer_id = $1
       ORDER BY i.interaction_date DESC, i.created_at DESC`,
      [customerId]
    );
    return result.rows;
  } catch (error) {
    console.error('[PostgreSQL Error] getInteractionsByCustomerId failed:', error.message);
    const dbError = new Error('Database operation failed: ' + error.message);
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Creates a new interaction record for a customer directly in PostgreSQL
 */
async function createInteraction(customerId, data, user) {
  const {
    interaction_type = 'note',
    subject,
    notes = '',
    interaction_date = new Date().toISOString()
  } = data;

  const validTypes = ['call', 'email', 'meeting', 'note'];
  const type = validTypes.includes(interaction_type.toLowerCase()) ? interaction_type.toLowerCase() : 'note';

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const userId = user?.id || null;
  const userName = user?.name || 'CRM User';

  try {
    const result = await pool.query(
      `INSERT INTO customer_interactions (id, customer_id, interaction_type, subject, notes, interaction_date, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, customer_id, interaction_type, subject, notes, interaction_date, created_by, created_at`,
      [
        id,
        customerId,
        type,
        subject.trim(),
        notes ? notes.trim() : '',
        interaction_date,
        userId,
        now
      ]
    );

    return {
      ...result.rows[0],
      created_by_name: userName
    };
  } catch (error) {
    console.error('[PostgreSQL Error] createInteraction failed:', error.message);
    const dbError = new Error('Database operation failed: ' + error.message);
    dbError.statusCode = 500;
    throw dbError;
  }
}

module.exports = {
  getInteractionsByCustomerId,
  createInteraction
};
