/**
 * Middleware to handle 404 Not Found routes
 */
const notFound = (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
};

module.exports = notFound;
