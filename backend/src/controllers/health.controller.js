
const configModule = require('../config/env');
const config = configModule?.default || configModule;

const { testDbConnection } = require('../config/db');

/**
 * GET /api/health
 * Checks backend and PostgreSQL availability.
 */
const getHealthStatus = async (req, res) => {
  try {
    const dbStatus = await testDbConnection();

    // Support both config.db and config.database structures.
    const dbConfig = config?.db || config?.database || {};

    const databaseConfigured = Boolean(
      process.env.DATABASE_URL ||
      process.env.DB_NAME ||
      dbConfig.database
    );

    const isConnected = dbStatus.connected === true;

    const responsePayload = {
      status: isConnected ? 'ok' : 'degraded',
      message: 'AI-Powered Cloud CRM Backend is running',
      timestamp: new Date().toISOString(),
      environment: config?.nodeEnv || process.env.NODE_ENV || 'production',
      uptime: Math.floor(process.uptime()),
      database: {
        configured: databaseConfigured,
        connected: isConnected,
        ...(isConnected
          ? {
              version: dbStatus.version,
              timestamp: dbStatus.timestamp
            }
          : {
              error: dbStatus.error || 'Database connection unavailable',
              code: dbStatus.code || 'UNKNOWN_ERROR'
            })
      },
      service: 'AI-Powered Cloud CRM API',
      version: '1.0.0'
    };

    return res.status(isConnected ? 200 : 503).json(responsePayload);

  } catch (error) {
    console.error('[HEALTH CHECK ERROR]', {
      message: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      environment: config?.nodeEnv || process.env.NODE_ENV || 'production',
      uptime: Math.floor(process.uptime()),
      error: error.message
    });
  }
};

module.exports = {
  getHealthStatus
};

