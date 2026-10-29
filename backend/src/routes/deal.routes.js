const express = require('express');
const router = express.Router();
const dealController = require('../controllers/deal.controller');
const { authenticateJWT, requireRole } = require('../middleware/auth.middleware');

// Apply JWT authentication to all deal endpoints
router.use(authenticateJWT);

// Deal Pipeline Metrics Summary
router.get('/metrics/summary', dealController.getDealMetrics);

// Deal CRUD Endpoints
router.get('/', dealController.getDeals);
router.post('/', dealController.createDeal);
router.get('/:id', dealController.getDealById);
router.put('/:id', dealController.updateDeal);
router.delete('/:id', requireRole('admin'), dealController.deleteDeal);

module.exports = router;
