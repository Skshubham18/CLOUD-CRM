const express = require('express');
const router = express.Router();
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const customerRoutes = require('./customer.routes');
const leadRoutes = require('./lead.routes');
const dealRoutes = require('./deal.routes');
const analyticsRoutes = require('./analytics.routes');

// Mount health routes under /api/health
router.use('/health', healthRoutes);

// Mount authentication routes under /api/auth
router.use('/auth', authRoutes);

// Mount customer management routes under /api/customers
router.use('/customers', customerRoutes);

// Mount lead management routes under /api/leads
router.use('/leads', leadRoutes);

// Mount deal management routes under /api/deals
router.use('/deals', dealRoutes);

// Mount analytics & reporting routes under /api/analytics
router.use('/analytics', analyticsRoutes);

module.exports = router;
