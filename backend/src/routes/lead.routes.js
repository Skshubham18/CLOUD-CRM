const express = require('express');
const router = express.Router();
const leadController = require('../controllers/lead.controller');
const { authenticateJWT, requireRole } = require('../middleware/auth.middleware');

// Apply JWT authentication to all lead endpoints
router.use(authenticateJWT);

// Lead CRUD Endpoints
router.get('/', leadController.getLeads);
router.post('/', leadController.createLead);
router.get('/:id', leadController.getLeadById);
router.put('/:id', leadController.updateLead);
router.delete('/:id', requireRole('admin'), leadController.deleteLead);

// Lead-to-Customer Conversion
router.post('/:id/convert', leadController.convertLead);

// Lead Scoring & Explainability
router.get('/:id/score', leadController.getLeadScore);

// Lead Interaction History
router.get('/:id/interactions', leadController.getInteractions);
router.post('/:id/interactions', leadController.addInteraction);
router.delete('/:id/interactions/:interactionId', requireRole('admin'), leadController.deleteInteraction);

module.exports = router;
