const authService = require('../services/auth.service');

// Regular expression for RFC 5322 compliant email validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Name is required'
      });
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is required'
      });
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid email address format'
      });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Password is required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters in length'
      });
    }

    // Register user via service
    const user = await authService.registerUser({
      name,
      email,
      password,
      role
    });

    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user
      }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Authenticate user & issue JWT
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate required inputs
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is required'
      });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Password is required'
      });
    }

    // Authenticate credentials
    const { user, token } = await authService.loginUser({
      email,
      password
    });

    return res.status(200).json({
      status: 'success',
      message: 'Authentication successful',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Get profile of currently authenticated user
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  return res.status(200).json({
    status: 'success',
    message: 'Profile retrieved successfully',
    data: {
      user: req.user
    }
  });
};

module.exports = {
  register,
  login,
  getMe
};
