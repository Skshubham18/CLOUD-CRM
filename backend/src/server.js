const app = require('./app');
const config = require('./config/env');
const { pool, testDbConnection, initTables } = require('./config/db');

const PORT = config.port;
const HOST = config.host;

const server = app.listen(PORT, HOST, async () => {
  console.log('====================================================');
  console.log(`🚀 AI-Powered Cloud CRM Backend Server Started`);
  console.log(`📡 Environment: ${config.nodeEnv}`);
  console.log(`🌐 Server URL:  http://${HOST}:${PORT}`);
  console.log(`🩺 Health API:  http://${HOST}:${PORT}/api/health`);
  console.log(`🔐 Auth API:    http://${HOST}:${PORT}/api/auth`);
  console.log('====================================================');

  // Verify DB connection diagnostic silently at startup
  const dbStatus = await testDbConnection();
  if (dbStatus.connected) {
    console.log(`✅ Database connected successfully: PostgreSQL`);
    await initTables();
  } else {
    console.log(`ℹ️  Database not connected (${dbStatus.code || 'Check config'}). Server running in standalone resilient mode.`);
  }
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`${signal} signal received. Closing HTTP server and database pool...`);
  server.close(async () => {
    try {
      await pool.end();
      console.log('PostgreSQL database pool closed successfully.');
    } catch (err) {
      console.error('Error closing database pool:', err.message);
    }
    console.log('HTTP server closed. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = server;
