const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const hpp = require('hpp');
const db = require('./models');
const errorHandler = require('./middleware/errorHandler');
const socketService = require('./services/socketService');
const { version: appVersion } = require('../package.json');
const logger = require('./config/logger');

// Security configurations
const { corsOptions, socketCorsOptions } = require('./config/corsConfig');
const { helmetConfig, additionalHeaders } = require('./config/securityHeaders');
const { mongoSanitizer, xssProtection } = require('./middleware/sanitization');
const { apiLimiter } = require('./middleware/rateLimiter');

require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with secure CORS
socketService.initialize(server, socketCorsOptions);

// Trust proxy - important for rate limiting and IP detection behind Railway/Nginx
app.set('trust proxy', 1);

// Security Middleware (order matters!)
// 1. Helmet - Security headers first
app.use(helmetConfig);
app.use(additionalHeaders);

// 2. CORS - Control allowed origins
app.use(cors(corsOptions));

// 3. Request body size limits (prevent DoS)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Input sanitization - Clean malicious input
app.use(mongoSanitizer); // Remove MongoDB operators
app.use(xssProtection); // Remove XSS attempts

// 5. HTTP Parameter Pollution protection
app.use(hpp());

// 6. Logging - Use Winston logger with Morgan
app.use(morgan('combined', { stream: logger.stream }));

// 7. Rate limiting - Apply to all routes
app.use('/api/', apiLimiter);

// Routes
app.get('/version', (req, res) => {
  res.json({
    version: appVersion,
    commit:
      process.env.RAILWAY_GIT_COMMIT_SHA ||
      process.env.RAILWAY_GIT_COMMIT ||
      process.env.GIT_COMMIT_SHA ||
      null,
    security: {
      corsEnabled: true,
      rateLimitEnabled: true,
      helmetEnabled: true
    }
  });
});

// Password reset web page (served at root level, not under /api)
const passwordResetPage = require('./routes/passwordResetPage');
app.use('/', passwordResetPage);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to YCD Farmer Guide API' });
});

// API Routes
const routes = require('./routes');
app.use('/api', routes);

// Error handling
app.use(errorHandler);

const os = require('os');
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Log loaded models
    const modelNames = Object.keys(db).filter(key => key !== 'sequelize' && key !== 'Sequelize');
    logger.info(`Loaded ${modelNames.length} models:`, modelNames.sort().join(', '));

    // Test database connection
    await db.sequelize.authenticate();
    logger.info('Database connection has been established successfully');
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

    // DISABLED: Sync causes issues with column naming in production
    // Schema is handled by migrations only
    logger.info('Database sync disabled - using migrations for schema management');

    // Start server and bind to all interfaces
    server.listen(PORT, '0.0.0.0', () => {
      const nets = os.networkInterfaces();
      let localIp = 'localhost';
      for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
          if (net.family === 'IPv4' && !net.internal) {
            localIp = net.address;
            break;
          }
        }
        if (localIp !== 'localhost') break;
      }
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Accessible on LAN at http://${localIp}:${PORT}`);
      logger.info('Socket.io is ready for real-time connections');
      logger.info('Security features: CORS, Rate Limiting, Helmet, Input Sanitization, HPP');
    });

    return server;
  } catch (error) {
    logger.error('Unable to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  logger.info('🚀 Starting YCD Farmer Guide Backend...');
  logger.info(`Node version: ${process.version}`);
  logger.info(`LOG_LEVEL: ${process.env.LOG_LEVEL || 'info (default)'}`);
  
  startServer().catch(err => {
    logger.error('Fatal error during server startup:', err);
    process.exit(1);
  });
}

module.exports = { app, server, startServer };