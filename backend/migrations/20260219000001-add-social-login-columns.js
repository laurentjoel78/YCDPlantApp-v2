'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Add google_id column
      await queryInterface.addColumn('Users', 'google_id', {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      }, { transaction });

      // Add facebook_id column
      await queryInterface.addColumn('Users', 'facebook_id', {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      }, { transaction });

      // Add index for faster lookups
      await queryInterface.addIndex('Users', ['google_id'], {
        name: 'users_google_id_idx',
        where: {
          google_id: {
            [Sequelize.Op.ne]: null
          }
        },
        transaction
      });

      await queryInterface.addIndex('Users', ['facebook_id'], {
        name: 'users_facebook_id_idx',
        where: {
          facebook_id: {
            [Sequelize.Op.ne]: null
          }
        },
        transaction
      });

      await transaction.commit();
      console.log('✅ Added social login columns (google_id, facebook_id) to Users table');
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      await queryInterface.removeIndex('Users', 'users_facebook_id_idx', { transaction });
      await queryInterface.removeIndex('Users', 'users_google_id_idx', { transaction });
      await queryInterface.removeColumn('Users', 'facebook_id', { transaction });
      await queryInterface.removeColumn('Users', 'google_id', { transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
