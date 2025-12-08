const { sequelize } = require('../models');

beforeAll(async () => {
  // Sync database and create tables
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // Close database connection
  await sequelize.close();
});