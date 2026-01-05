const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash('Admin@123', salt);
    const userId = uuidv4();

    // Create admin user
    await queryInterface.bulkInsert('Users', [{
      id: userId,
      email: 'admin@ycd.com',
      password_hash: passwordHash,
      first_name: 'System',
      last_name: 'Administrator',
      role: 'admin',
      email_verified: true,
      is_active: true,
      approval_status: 'approved',
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // Create wallet for admin
    await queryInterface.bulkInsert('Wallets', [{
      id: uuidv4(),
      user_id: userId,
      balance: 0,
      currency: 'XAF',
      created_at: new Date(),
      updated_at: new Date()
    }]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', {
      email: 'admin@ycd.com'
    });
  }
};