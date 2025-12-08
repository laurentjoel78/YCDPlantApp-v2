const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('mkounga10', salt);
    const userId = uuidv4();

    // Create admin user
    await queryInterface.bulkInsert('Users', [{
      id: userId,
      email: 'laurentjoel52@gmail.com',
      password_hash: passwordHash,
      first_name: 'System',
      last_name: 'Administrator',
      role: 'admin',
      email_verified: true,
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
      email: 'laurentjoel52@gmail.com'
    });
  }
};