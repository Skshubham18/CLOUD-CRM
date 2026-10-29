const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const authenticateJWT = require('../middleware/auth.middleware');

// Apply JWT authentication to all analytics endpoints
router.use(authenticateJWT);

// Consolidated Analytics Endpoint
router.get('/dashboard', analyticsController.getDashboardAnalytics);

// Module-Specific Analytics Endpoints
router.get('/overview', analyticsController.getOverviewMetrics);
router.get('/leads', analyticsController.getLeadAnalytics);
router.get('/deals', analyticsController.getDealAnalytics);

module.exports = router;
