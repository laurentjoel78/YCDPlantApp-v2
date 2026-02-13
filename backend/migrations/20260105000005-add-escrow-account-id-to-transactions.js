'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add escrow_account_id column to Transactions
    try {
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
      console.log('  ✅ Added Transactions.escrow_account_id');
    } catch (e) {
      if (e.message?.includes('already exists') || e.original?.code === '42701') {
        console.log('  ⏭️  Transactions.escrow_account_id already exists');
      } else {
        console.error('  ❌ Failed to add Transactions.escrow_account_id:', e.message);
      }
    }

    // Add index for escrow_account_id
    try {
      await queryInterface.addIndex('Transactions', ['escrow_account_id']);
      console.log('  ✅ Added index on Transactions(escrow_account_id)');
    } catch (e) {
      if (e.message?.includes('already exists') || e.original?.code === '42P07') {
        console.log('  ⏭️  Index on Transactions(escrow_account_id) already exists');
      } else {
        console.error('  ❌ Failed to add index:', e.message);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Transactions', 'escrow_account_id').catch(() => {});
  }
};
