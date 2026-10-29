const leadService = require('../services/lead.service');
const leadInteractionService = require('../services/leadInteraction.service');
const leadScoringService = require('../services/leadScoringService');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id) {
  return typeof id === 'string' && UUID_REGEX.test(id.trim());
}

/**
 * Get list of leads (with optional search, status, and source filters)
 * GET /api/leads
 */
const getLeads = async (req, res, next) => {
  try {
    const { search, status, source, page, limit } = req.query;
    const result = await leadService.listLeads({
      search,
      status,
      source,
      page,
      limit
    });

    return res.status(200).json({
      status: 'success',
      count: result.leads.length,
      pagination: result.pagination,
      data: {
        leads: result.leads
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single lead by ID
 * GET /api/leads/:id
 */
const getLeadById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Invalid ID format'
      });
    }

    const lead = await leadService.getLeadById(id);

    if (!lead) {
      return res.status(404).json({
        status: 'error',
        message: `Lead with ID '${id}' not found`
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        lead
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get explainable lead score breakdown for a lead
 * GET /api/leads/:id/score
 */
const getLeadScore = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Invalid ID format'
      });
    }

    const scoreResult = await leadService.getLeadScore(id);

    return res.status(200).json({
      status: 'success',
      data: {
        score_breakdown: scoreResult
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
 * Create a new lead
 * POST /api/leads
 */
const createLead = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      industry,
      source,
      status,
      estimated_value,
      notes,
      assigned_to
    } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Lead name is required'
      });
    }

    if (email && (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim()))) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid lead email format'
      });
    }

    if (estimated_value !== undefined && estimated_value !== null && estimated_value !== '') {
      const val = Number(estimated_value);
      if (isNaN(val) || val < 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Estimated value must be a non-negative numeric amount'
        });
      }
    }

    if (status) {
      const isValidStatus = leadService.VALID_STATUSES.some(
        s => s.toLowerCase() === String(status).trim().toLowerCase()
      );
      if (!isValidStatus) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid lead status. Allowed statuses: ${leadService.VALID_STATUSES.join(', ')}`
        });
      }
    }

    if (source) {
      const isValidSource = leadService.VALID_SOURCES.some(
        s => s.toLowerCase() === String(source).trim().toLowerCase()
      );
      if (!isValidSource) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid lead source. Allowed sources: ${leadService.VALID_SOURCES.join(', ')}`
        });
      }
    }

    const lead = await leadService.createLead(
      {
        name,
        email,
        phone,
        company,
        industry,
        source,
        status,
        estimated_value,
        notes,
        assigned_to
      },
      req.user?.id
    );

    return res.status(201).json({
      status: 'success',
      message: 'Lead created successfully',
      data: {
        lead
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
 * Update an existing lead
 * PUT /api/leads/:id
 */
const updateLead = async (req, res, next) => {
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
      email,
      phone,
      company,
      industry,
      source,
      status,
      estimated_value,
      notes,
      assigned_to
    } = req.body;

    if (name !== undefined && (!name || !name.trim())) {
      return res.status(400).json({
        status: 'error',
        message: 'Lead name cannot be empty'
      });
    }

    if (email && !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid lead email format'
      });
    }

    if (estimated_value !== undefined && estimated_value !== null && estimated_value !== '') {
      const val = Number(estimated_value);
      if (isNaN(val) || val < 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Estimated value must be a non-negative numeric amount'
        });
      }
    }

    if (status) {
      const isValidStatus = leadService.VALID_STATUSES.some(
        s => s.toLowerCase() === String(status).trim().toLowerCase()
      );
      if (!isValidStatus) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid lead status. Allowed statuses: ${leadService.VALID_STATUSES.join(', ')}`
        });
      }
    }

    if (source) {
      const isValidSource = leadService.VALID_SOURCES.some(
        s => s.toLowerCase() === String(source).trim().toLowerCase()
      );
      if (!isValidSource) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid lead source. Allowed sources: ${leadService.VALID_SOURCES.join(', ')}`
        });
      }
    }

    const lead = await leadService.updateLead(id, {
      name,
      email,
      phone,
      company,
      industry,
      source,
      status,
      estimated_value,
      notes,
      assigned_to
    });

    return res.status(200).json({
      status: 'success',
      message: 'Lead updated successfully',
      data: {
        lead
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
 * Delete a lead
 * DELETE /api/leads/:id
 */
const deleteLead = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Invalid ID format'
      });
    }

    const result = await leadService.deleteLead(id);

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

/**
 * Convert lead to customer
 * POST /api/leads/:id/convert
 */
const convertLead = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Invalid ID format'
      });
    }

    const result = await leadService.convertLeadToCustomer(id, req.user?.id);

    return res.status(200).json({
      status: 'success',
      message: result.message,
      data: {
        lead: result.lead,
        customer: result.customer,
        isExistingCustomer: result.isExistingCustomer
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
 * Get lead interactions
 * GET /api/leads/:id/interactions
 */
const getInteractions = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Invalid ID format'
      });
    }

    const lead = await leadService.getLeadById(id);

    if (!lead) {
      return res.status(404).json({
        status: 'error',
        message: `Lead with ID '${id}' not found`
      });
    }

    const interactions = await leadInteractionService.getInteractionsByLeadId(id);

    return res.status(200).json({
      status: 'success',
      count: interactions.length,
      data: {
        interactions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add an interaction to a lead
 * POST /api/leads/:id/interactions
 */
const addInteraction = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Invalid ID format'
      });
    }

    const lead = await leadService.getLeadById(id);

    if (!lead) {
      return res.status(404).json({
        status: 'error',
        message: `Lead with ID '${id}' not found`
      });
    }

    const interaction = await leadInteractionService.addLeadInteraction(
      id,
      req.body,
      req.user?.id
    );

    return res.status(201).json({
      status: 'success',
      message: 'Interaction added to lead successfully',
      data: {
        interaction
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
 * Delete an interaction from a lead
 * DELETE /api/leads/:id/interactions/:interactionId
 */
const deleteInteraction = async (req, res, next) => {
  try {
    const { id, interactionId } = req.params;

    if (!isValidUUID(id) || !isValidUUID(interactionId)) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Invalid ID format'
      });
    }

    const result = await leadInteractionService.deleteLeadInteraction(id, interactionId);

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
  getLeads,
  getLeadById,
  getLeadScore,
  createLead,
  updateLead,
  deleteLead,
  convertLead,
  getInteractions,
  addInteraction,
  deleteInteraction
};
