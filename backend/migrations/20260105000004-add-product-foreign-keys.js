'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add crop_id column to Products (farm_id already exists)
    await queryInterface.addColumn('Products', 'crop_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'crops',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });

    // Add market_id column to Products
    await queryInterface.addColumn('Products', 'market_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Markets',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add indexes
    await queryInterface.addIndex('Products', ['crop_id']);
    await queryInterface.addIndex('Products', ['market_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Products', 'crop_id');
    await queryInterface.removeColumn('Products', 'market_id');
  }
};
