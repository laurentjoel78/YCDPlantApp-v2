require('dotenv').config();

const dbLogger = require('../utils/dbLogger');

const config = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'ycd_farmer_guide_dev',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: dbLogger.logQuery.bind(dbLogger),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    benchmark: true
  },
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'ycd_farmer_guide_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: dbLogger.logQuery.bind(dbLogger),
    benchmark: true,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: dbLogger.logQuery.bind(dbLogger),
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
  }
};

// Add use_env_variable if valid DATABASE_URL exists
if (process.env.DATABASE_URL) {
  config.development.use_env_variable = 'DATABASE_URL';
  config.test.use_env_variable = 'DATABASE_URL';
  config.production.use_env_variable = 'DATABASE_URL';
}

module.exports = config;