const config = require('../config/env');
const { testDbConnection } = require('../config/db');

/**
 * Health check controller
 * GET /api/health
 */
const getHealthStatus = async (req, res) => {
  try {
    const dbStatus = await testDbConnection();

    const responsePayload = {
      status: 'ok',
      message: 'AI-Powered Cloud CRM Backend is running',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      uptime: Math.floor(process.uptime()),
      database: {
        configured: Boolean(config.db.database),
        connected: dbStatus.connected,
        ...(dbStatus.connected ? { version: dbStatus.version } : { error: dbStatus.error || 'Database connection offline' })
      },
      service: 'AI-Powered Cloud CRM API',
      version: '1.0.0'
    };

    return res.status(200).json(responsePayload);
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      uptime: Math.floor(process.uptime()),
      error: error.message
    });
  }
};

module.exports = {
  getHealthStatus
};
