const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const errorHandler = require('./middleware/errorHandler');
const checkEnvironment = require('./utils/checkEnvironment');
require('dotenv').config();

// Check environment configuration
checkEnvironment();

const app = express();

// Middleware
app.use(cors());
app.use(helmet());

// Compression - reduces response size by ~70% for slow connections (Cameroon)
app.use(compression({
  level: 6, // Balance between speed and compression ratio
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));  // Allow large base64 audio payloads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Version check endpoint
app.get('/version', (req, res) => {
  res.json({ version: '2.0.1', deployed: new Date().toISOString(), features: ['password-reset-page'] });
});

// Password reset web page (served at root level, not under /api)
const passwordResetPage = require('./routes/passwordResetPage');
app.use('/', passwordResetPage);

// Routes
const routes = require('./routes');
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;