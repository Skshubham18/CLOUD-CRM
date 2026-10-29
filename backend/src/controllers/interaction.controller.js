const interactionService = require('../services/interaction.service');
const customerService = require('../services/customer.service');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id) {
  return typeof id === 'string' && UUID_REGEX.test(id.trim());
}

/**
 * Get all interactions for a customer
 * GET /api/customers/:id/interactions
 */
const getCustomerInteractions = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Invalid ID format'
      });
    }

    // Check if customer exists
    const customer = await customerService.getCustomerById(id);
    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: `Customer with ID '${id}' not found`
      });
    }

    const interactions = await interactionService.getInteractionsByCustomerId(id);

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
 * Add a new interaction for a customer
 * POST /api/customers/:id/interactions
 */
const addCustomerInteraction = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Invalid ID format'
      });
    }

    const { interaction_type, subject, notes, interaction_date } = req.body;

    // Check if customer exists
    const customer = await customerService.getCustomerById(id);
    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: `Customer with ID '${id}' not found`
      });
    }

    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Interaction subject is required'
      });
    }

    const interaction = await interactionService.createInteraction(
      id,
      {
        interaction_type,
        subject,
        notes,
        interaction_date
      },
      req.user
    );

    return res.status(201).json({
      status: 'success',
      message: 'Interaction logged successfully',
      data: {
        interaction
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomerInteractions,
  addCustomerInteraction
};
