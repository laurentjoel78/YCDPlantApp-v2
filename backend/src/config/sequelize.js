const { Sequelize } = require('sequelize');
const config = require('./database');
const dbLogger = require('../utils/dbLogger');
require('dotenv').config();

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    benchmark: true
  }
);

// Monitor connection pool
setInterval(() => {
  dbLogger.logPoolStatus(sequelize.connectionManager.pool);
}, 60000); // Log pool status every minute

// Log transaction events
const originalTransaction = sequelize.transaction.bind(sequelize);
sequelize.transaction = async function (...args) {
  const transaction = await originalTransaction.apply(this, args);
  dbLogger.logTransaction(transaction);
  return transaction;
};

module.exports = sequelize;