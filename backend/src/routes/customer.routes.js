const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const interactionController = require('../controllers/interaction.controller');
const { authenticateJWT, requireRole } = require('../middleware/auth.middleware');

// Apply JWT authentication to all customer endpoints
router.use(authenticateJWT);

// Customer CRUD
router.get('/', customerController.getCustomers);
router.post('/', customerController.createCustomer);
router.get('/:id', customerController.getCustomerById);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', requireRole('admin'), customerController.deleteCustomer);

// Customer Interactions
router.get('/:id/interactions', interactionController.getCustomerInteractions);
router.post('/:id/interactions', interactionController.addCustomerInteraction);

module.exports = router;
