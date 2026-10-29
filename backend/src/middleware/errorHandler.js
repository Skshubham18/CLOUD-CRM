const config = require('../config/env');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  // Log server-side diagnostic with stack trace (server logs only)
  console.error(`[Server Error ${statusCode}] ${err.message}`, err.stack);

  // Client safety: never leak SQL errors, database internals, or stack traces
  let safeMessage = err.message || 'Internal Server Error';
  const isInternal = statusCode >= 500 ||
    /database|postgres|syntax|relation|column|pg_|query failed|pool|connection timeout/i.test(safeMessage);

  if (isInternal) {
    safeMessage = 'An internal server error occurred. Please try again later.';
  }

  res.status(statusCode).json({
    status: 'error',
    success: false,
    message: safeMessage
  });
};

module.exports = errorHandler;
