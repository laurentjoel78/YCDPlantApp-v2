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