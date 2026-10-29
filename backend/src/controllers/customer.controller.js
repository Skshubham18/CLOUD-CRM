const customerService = require('../services/customer.service');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id) {
  return typeof id === 'string' && UUID_REGEX.test(id.trim());
}

/**
 * Get list of customers (with optional search and status filter)
 * GET /api/customers
 */
const getCustomers = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const customers = await customerService.listCustomers({
      search,
      status,
      user: req.user
    });

    return res.status(200).json({
      status: 'success',
      count: customers.length,
      data: {
        customers
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single customer by ID
 * GET /api/customers/:id
 */
const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Invalid ID format'
      });
    }

    const customer = await customerService.getCustomerById(id);

    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: `Customer with ID '${id}' not found`
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        customer
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new customer
 * POST /api/customers
 */
const createCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, company, industry, status, notes } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Customer name is required'
      });
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Customer email is required'
      });
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid customer email format'
      });
    }

    const customer = await customerService.createCustomer(
      {
        name,
        email,
        phone,
        company,
        industry,
        status,
        notes
      },
      req.user?.id
    );

    return res.status(201).json({
      status: 'success',
      message: 'Customer created successfully',
      data: {
        customer
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
 * Update an existing customer
 * PUT /api/customers/:id
 */
const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Invalid ID format'
      });
    }

    const { name, email, phone, company, industry, status, notes } = req.body;

    if (email && !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid customer email format'
      });
    }

    if (name !== undefined && (!name || !name.trim())) {
      return res.status(400).json({
        status: 'error',
        message: 'Customer name cannot be empty'
      });
    }

    const customer = await customerService.updateCustomer(id, {
      name,
      email,
      phone,
      company,
      industry,
      status,
      notes
    });

    return res.status(200).json({
      status: 'success',
      message: 'Customer updated successfully',
      data: {
        customer
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
 * Delete a customer
 * DELETE /api/customers/:id
 */
const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Invalid ID format'
      });
    }

    const result = await customerService.deleteCustomer(id);

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
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
