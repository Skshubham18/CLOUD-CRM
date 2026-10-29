const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/db');
const config = require('../config/env');

/**
 * Normalizes email address (lowercase, trimmed)
 */
function normalizeEmail(email) {
  return email ? email.trim().toLowerCase() : '';
}

/**
 * Generates a signed JWT for an authenticated user
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
}

/**
 * Finds user by email directly from PostgreSQL
 */
async function findUserByEmail(email) {
  const normalized = normalizeEmail(email);

  try {
    const result = await pool.query(
      'SELECT id, name, email, password_hash, role, created_at, updated_at FROM users WHERE LOWER(email) = LOWER($1)',
      [normalized]
    );
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error('[PostgreSQL Error] findUserByEmail failed:', error.message);
    const dbError = new Error('Database operation failed: ' + error.message);
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Finds user by ID directly from PostgreSQL (safe - no password hash)
 */
async function findUserById(id) {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error('[PostgreSQL Error] findUserById failed:', error.message);
    const dbError = new Error('Database operation failed: ' + error.message);
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Registers a new user directly in PostgreSQL with bcrypt password hashing
 */
async function registerUser({ name, email, password, role = 'sales_executive' }) {
  const normalized = normalizeEmail(email);

  // Validate allowed roles
  const validRoles = ['admin', 'sales_executive'];
  const userRole = validRoles.includes(role) ? role : 'sales_executive';

  // Check if user already exists
  const existingUser = await findUserByEmail(normalized);
  if (existingUser) {
    const error = new Error('A user with this email address already exists');
    error.statusCode = 409;
    throw error;
  }

  // Hash password with bcrypt
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const userId = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    const result = await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, role, created_at, updated_at`,
      [userId, name.trim(), normalized, passwordHash, userRole, now, now]
    );

    return result.rows[0];
  } catch (error) {
    console.error('[PostgreSQL Error] registerUser failed:', error.message);
    const dbError = new Error('Database operation failed: ' + error.message);
    dbError.statusCode = 500;
    throw dbError;
  }
}

/**
 * Authenticates user credentials directly against PostgreSQL and generates JWT token
 */
async function loginUser({ email, password }) {
  const normalized = normalizeEmail(email);

  // Find user by email
  const user = await findUserByEmail(normalized);
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Verify password using bcrypt
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Generate JWT token
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at
  };

  const token = generateToken(safeUser);

  return {
    user: safeUser,
    token
  };
}

module.exports = {
  registerUser,
  loginUser,
  findUserById,
  findUserByEmail,
  normalizeEmail,
  generateToken
};
