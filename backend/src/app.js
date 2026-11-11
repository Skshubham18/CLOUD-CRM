
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const config = require('./config/env');

// Resolve CommonJS, default, and named exports safely.
const resolveMiddleware = (moduleValue, exportName, moduleName) => {
  let value = moduleValue;
  const seen = new Set();

  while (
    value &&
    typeof value !== 'function' &&
    typeof value === 'object' &&
    !seen.has(value)
  ) {
    seen.add(value);

    if (typeof value.default === 'function') {
      value = value.default;
    } else if (typeof value[exportName] === 'function') {
      value = value[exportName];
    } else if (typeof value.router === 'function') {
      value = value.router;
    } else if (typeof value.middleware === 'function') {
      value = value.middleware;
    } else {
      break;
    }
  }

  if (typeof value !== 'function') {
    throw new TypeError(
      `${moduleName} must export a function or Express router. Received: ${typeof value}`
    );
  }

  return value;
};

// Import and validate API routes.
const apiRoutes = resolveMiddleware(
  require('./routes/index.js'),
  'router',
  'API routes'
);

// Import and validate error-handling middleware.
const notFound = resolveMiddleware(
  require('./middleware/notFound'),
  'notFound',
  'NotFound middleware'
);

const errorHandler = resolveMiddleware(
  require('./middleware/errorHandler'),
  'errorHandler',
  'ErrorHandler middleware'
);

const app = express();

// Request logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// CORS configuration
const allowedOrigins = [
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'https://cloudbus.netlify.app',
  ...(config.corsOrigin
    ? config.corsOrigin.split(',').map(origin => origin.trim())
    : [])
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests and tools such as curl.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      try {
        const url = new URL(origin);

        // Allow Vercel preview and production frontend domains.
        if (url.hostname.endsWith('.vercel.app')) {
          return callback(null, true);
        }
      } catch (error) {
        // Invalid origin.
      }

      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'AI-Powered Cloud CRM API',
    version: '1.0.0',
    status: 'active',
    healthCheck: '/api/health'
  });
});

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use(notFound);

// Global error handler (must remain last)
app.use(errorHandler);

module.exports = app;
