const dealService = require('../services/deal.service');
const { pool } = require('../config/db');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id) {
  return typeof id === 'string' && UUID_REGEX.test(id.trim());
}

/**
 * Validates that an optional UUID exists in a specified database table
 */
async function recordExists(tableName, id) {
  if (!id) return true;
  if (!isValidUUID(id)) return false;
  try {
    const result = await pool.query(`SELECT id FROM ${tableName} WHERE id = $1`, [id]);
    return result.rows.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get list of deals (with search, stage, customer, lead, and assignee filters)
 * GET /api/deals
 */
const getDeals = async (req, res, next) => {
  try {
    const { search, stage, customerId, leadId, assignedTo, page, limit } = req.query;
    const result = await dealService.listDeals({
      search,
      stage,
      customerId,
      leadId,
      assignedTo,
      page,
      limit
    });

    return res.status(200).json({
      status: 'success',
      count: result.deals.length,
      pagination: result.pagination,
      data: {
        deals: result.deals
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pipeline summary metrics
 * GET /api/deals/metrics/summary
 */
const getDealMetrics = async (req, res, next) => {
  try {
    const metrics = await dealService.getDealMetrics();
    return res.status(200).json({
      status: 'success',
      data: {
        metrics
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single deal by ID
 * GET /api/deals/:id
 */
const getDealById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Invalid ID format'
      });
    }

    const deal = await dealService.getDealById(id);

    if (!deal) {
      return res.status(404).json({
        status: 'error',
        message: `Deal with ID '${id}' not found`
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        deal
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new deal
 * POST /api/deals
 */
const createDeal = async (req, res, next) => {
  try {
    const {
      name,
      value,
      stage,
      expected_close_date,
      customer_id,
      lead_id,
      assigned_to,
      notes
    } = req.body;

    // 1. Validate name
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Deal name is required'
      });
    }

    // 2. Validate value
    if (value !== undefined && value !== null && value !== '') {
      const val = Number(value);
      if (isNaN(val) || val < 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Deal value must be a non-negative numeric amount'
        });
      }
    }

    // 3. Validate stage
    if (stage) {
      const isValidStage = dealService.VALID_STAGES.some(
        s => s.toLowerCase() === String(stage).trim().toLowerCase()
      );
      if (!isValidStage) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid deal stage. Allowed stages: ${dealService.VALID_STAGES.join(', ')}`
        });
      }
    }

    // 4. Validate expected_close_date
    if (expected_close_date) {
      const parsedDate = new Date(expected_close_date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid expected close date format'
        });
      }
    }

    // 5. Verify referenced foreign keys
    if (customer_id) {
      const customerValid = await recordExists('customers', customer_id);
      if (!customerValid) {
        return res.status(400).json({
          status: 'error',
          message: `Referenced customer with ID '${customer_id}' does not exist`
        });
      }
    }

    if (lead_id) {
      const leadValid = await recordExists('leads', lead_id);
      if (!leadValid) {
        return res.status(400).json({
          status: 'error',
          message: `Referenced lead with ID '${lead_id}' does not exist`
        });
      }
    }

    if (assigned_to) {
      const userValid = await recordExists('users', assigned_to);
      if (!userValid) {
        return res.status(400).json({
          status: 'error',
          message: `Referenced assignee user with ID '${assigned_to}' does not exist`
        });
      }
    }

    const deal = await dealService.createDeal(
      {
        name,
        value,
        stage,
        expected_close_date,
        customer_id,
        lead_id,
        assigned_to,
        notes
      },
      req.user?.id
    );

    return res.status(201).json({
      status: 'success',
      message: 'Deal created successfully',
      data: {
        deal
      }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Update an existing deal
 * PUT /api/deals/:id
 */
const updateDeal = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Invalid ID format'
      });
    }

    const {
      name,
      value,
      stage,
      expected_close_date,
      customer_id,
      lead_id,
      assigned_to,
      notes
    } = req.body;

    if (name !== undefined && (!name || !name.trim())) {
      return res.status(400).json({
        status: 'error',
        message: 'Deal name cannot be empty'
      });
    }

    if (value !== undefined && value !== null && value !== '') {
      const val = Number(value);
      if (isNaN(val) || val < 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Deal value must be a non-negative numeric amount'
        });
      }
    }

    if (stage) {
      const isValidStage = dealService.VALID_STAGES.some(
        s => s.toLowerCase() === String(stage).trim().toLowerCase()
      );
      if (!isValidStage) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid deal stage. Allowed stages: ${dealService.VALID_STAGES.join(', ')}`
        });
      }
    }

    if (expected_close_date) {
      const parsedDate = new Date(expected_close_date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid expected close date format'
        });
      }
    }

    if (customer_id) {
      const customerValid = await recordExists('customers', customer_id);
      if (!customerValid) {
        return res.status(400).json({
          status: 'error',
          message: `Referenced customer with ID '${customer_id}' does not exist`
        });
      }
    }

    if (lead_id) {
      const leadValid = await recordExists('leads', lead_id);
      if (!leadValid) {
        return res.status(400).json({
          status: 'error',
          message: `Referenced lead with ID '${lead_id}' does not exist`
        });
      }
    }

    if (assigned_to) {
      const userValid = await recordExists('users', assigned_to);
      if (!userValid) {
        return res.status(400).json({
          status: 'error',
          message: `Referenced assignee user with ID '${assigned_to}' does not exist`
        });
      }
    }

    const deal = await dealService.updateDeal(id, {
      name,
      value,
      stage,
      expected_close_date,
      customer_id,
      lead_id,
      assigned_to,
      notes
    });

    return res.status(200).json({
      status: 'success',
      message: 'Deal updated successfully',
      data: {
        deal
      }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Delete a deal
 * DELETE /api/deals/:id
 */
const deleteDeal = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Invalid ID format'
      });
    }

    const result = await dealService.deleteDeal(id);

    return res.status(200).json({
      status: 'success',
      message: result.message
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
};

module.exports = {
  getDeals,
  getDealMetrics,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal
};
