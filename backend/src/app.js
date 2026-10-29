const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const apiRoutes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const config = require('./config/env');

const app = express();

// Request logging in development
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Security & Cross-Origin Resource Sharing
const allowedOrigins = [
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  ...(config.corsOrigin ? config.corsOrigin.split(',').map(o => o.trim()) : [])
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g., curl, testing scripts, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Block unapproved browser origins safely
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'AI-Powered Cloud CRM API',
    version: '1.0.0',
    status: 'active',
    healthCheck: '/api/health'
  });
});

// Central API Router
app.use('/api', apiRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
