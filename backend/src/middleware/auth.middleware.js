const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { findUserById } = require('../services/auth.service');

/**
 * JWT Authentication Middleware
 * Validates 'Authorization: Bearer <token>' header and attaches user to req.user
 */
const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication token is required (Authorization header missing)'
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid authorization format. Expected "Bearer <token>"'
      });
    }

    const token = parts[1];

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication token has expired. Please log in again.'
        });
      }
      return res.status(401).json({
        status: 'error',
        message: 'Invalid authentication token.'
      });
    }

    // Fetch fresh user profile from PostgreSQL
    try {
      const user = await findUserById(decoded.id);
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'User belonging to this token no longer exists.'
        });
      }
      req.user = user;
      next();
    } catch (dbErr) {
      console.error('[PostgreSQL Error] Failed to verify user token against DB:', dbErr.message);
      return res.status(503).json({
        status: 'error',
        message: 'Database is currently unavailable. Unable to verify user session: ' + dbErr.message
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Authentication middleware error: ' + error.message
    });
  }
};

/**
 * Role-Based Access Control (RBAC) Middleware
 * Checks if req.user has one of the allowed roles.
 * Must be executed after authenticateJWT.
 *
 * @param  {...string} roles - Allowed roles (e.g. 'admin', 'sales_executive')
 * @returns {Function} Express middleware handler
 */
const requireRole = (...roles) => {
  const allowedRoles = roles.flat();

  return (req, res, next) => {
    // 1. Unauthenticated check (no req.user attached by authenticateJWT)
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        success: false,
        message: 'Authentication required. No authenticated user session found.'
      });
    }

    // 2. Role authorization check
    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        status: 'error',
        success: false,
        message: 'Access denied: insufficient permissions'
      });
    }

    next();
  };
};

const authorizeRoles = requireRole;

// Maintain backward compatibility with direct function import
// as well as object destructuring: { authenticateJWT, requireRole }
authenticateJWT.authenticateJWT = authenticateJWT;
authenticateJWT.requireRole = requireRole;
authenticateJWT.authorizeRoles = authorizeRoles;

module.exports = authenticateJWT;
module.exports.authenticateJWT = authenticateJWT;
module.exports.requireRole = requireRole;
module.exports.authorizeRoles = authorizeRoles;
