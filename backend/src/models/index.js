'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const logger = require('../config/logger');
require('dotenv').config();

let sequelize;

// Create Sequelize instance
try {
  // Custom logging function for Sequelize
  const sqlLogger = (msg) => {
    if (process.env.LOG_SQL === 'true') {
      logger.database('query', 'sequelize', 0, { query: msg });
    }
  };

  // Use DATABASE_URL if available (production), otherwise use individual vars
  if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? sqlLogger : false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      pool: {
        max: 10,
        min: 2,
        acquire: 30000,
        idle: 10000
      },
      define: {
        underscored: true,
        underscoredAll: true
      }
    });
    logger.info('Using DATABASE_URL for connection');
  } else {
    sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? sqlLogger : false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        define: {
          underscored: true,
          underscoredAll: true
        }
      }
    );
    logger.info('Using individual DB_* variables for connection');
  }
} catch (error) {
  logger.error('Failed to create Sequelize instance', { error: error.message, stack: error.stack });
  process.exit(1);
}

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Read all model files in the directory
const modelFiles = fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  });

logger.debug('Loading models', { files: modelFiles });

// Import models
for (const file of modelFiles) {
  if (file !== 'associations.js') {  // Skip associations file
    try {
      const modelDef = require(path.join(__dirname, file));
      if (file === 'loggingModels.js') {
        // Handle special case for logging models which exports multiple models
        const loggingModels = modelDef(sequelize);
        Object.keys(loggingModels).forEach(modelName => {
          db[modelName] = loggingModels[modelName];
          logger.debug(`Loaded model: ${modelName}`);
        });
      } else {
        const model = modelDef(sequelize);
        if (model) {
          db[model.name] = model;
          logger.debug(`Loaded model: ${model.name}`);
        }
      }
    } catch (error) {
      logger.error(`Error loading model ${file}`, { error: error.message, stack: error.stack });
      process.exit(1);
    }
  }
}

// Set up associations after all models are loaded
try {
  const defineAssociations = require('./associations');
  defineAssociations(db);
} catch (error) {
  logger.error('Error setting up associations', { error: error.message, stack: error.stack });
  process.exit(1);
}

// Export the db object
module.exports = db;