/**
 * Analytics Controller for AI-Powered Cloud CRM (Phase 5)
 */

const analyticsService = require('../services/analytics.service');

/**
 * Extracts and sanitizes filter parameters from req.query
 */
function extractFilterParams(query) {
  const { timeRange, startDate, endDate } = query;
  return {
    timeRange: timeRange || 'all',
    startDate: startDate || null,
    endDate: endDate || null
  };
}

/**
 * Get consolidated dashboard analytics
 * GET /api/analytics/dashboard
 */
const getDashboardAnalytics = async (req, res, next) => {
  try {
    const filters = extractFilterParams(req.query);
    const data = await analyticsService.getDashboardAnalytics(filters);

    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get high-level overview KPIs
 * GET /api/analytics/overview
 */
const getOverviewMetrics = async (req, res, next) => {
  try {
    const filters = extractFilterParams(req.query);
    const data = await analyticsService.getOverviewMetrics(filters);

    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get lead management analytics
 * GET /api/analytics/leads
 */
const getLeadAnalytics = async (req, res, next) => {
  try {
    const filters = extractFilterParams(req.query);
    const data = await analyticsService.getLeadAnalytics(filters);

    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get deal & pipeline analytics
 * GET /api/analytics/deals
 */
const getDealAnalytics = async (req, res, next) => {
  try {
    const filters = extractFilterParams(req.query);
    const data = await analyticsService.getDealAnalytics(filters);

    return res.status(200).json({
      status: 'success',
      data
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardAnalytics,
  getOverviewMetrics,
  getLeadAnalytics,
  getDealAnalytics
};
