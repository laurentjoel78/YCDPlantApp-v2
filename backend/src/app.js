const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const checkEnvironment = require('./utils/checkEnvironment');
require('dotenv').config();

// Check environment configuration
checkEnvironment();

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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