const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticateJWT = require('../middleware/auth.middleware');

// Public endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected endpoint
router.get('/me', authenticateJWT, authController.getMe);

module.exports = router;
