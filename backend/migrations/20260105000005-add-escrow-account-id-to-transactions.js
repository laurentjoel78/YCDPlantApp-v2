'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add escrow_account_id column to Transactions
    await queryInterface.addColumn('Transactions', 'escrow_account_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'escrow_accounts',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add index for escrow_account_id
    await queryInterface.addIndex('Transactions', ['escrow_account_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Transactions', 'escrow_account_id');
  }
};
