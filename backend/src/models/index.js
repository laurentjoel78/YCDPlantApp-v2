'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
require('dotenv').config();

let sequelize;

// Create Sequelize instance
try {
  // Use DATABASE_URL if available (production), otherwise use individual vars
  if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
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
      }
    });
    console.log('Using DATABASE_URL for connection');
  } else {
    sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );
    console.log('Using individual DB_* variables for connection');
  }
} catch (error) {
  console.error('Failed to create Sequelize instance:', error);
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

console.log('Loading models:', modelFiles);

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
          console.log(`Loaded model: ${modelName}`);
        });
      } else {
        const model = modelDef(sequelize);
        if (model) {
          db[model.name] = model;
          console.log(`Loaded model: ${model.name}`);
        }
      }
    } catch (error) {
      console.error(`Error loading model ${file}:`, error);
      process.exit(1);
    }
  }
}

// Set up associations after all models are loaded
try {
  const defineAssociations = require('./associations');
  defineAssociations(db);
} catch (error) {
  console.error('Error setting up associations:', error);
  process.exit(1);
}

// Export the db object
module.exports = db;