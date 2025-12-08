/* eslint-disable no-unused-vars */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new column size_hectares (allow null initially) only if it doesn't exist
    const tableInfo = await queryInterface.describeTable('farms');
    if (!tableInfo.size_hectares) {
      await queryInterface.addColumn('farms', 'size_hectares', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Farm size in hectares (explicit)'
      });

      // Copy values from existing `size` column if present
      try {
        await queryInterface.sequelize.query(`UPDATE farms SET size_hectares = size WHERE size IS NOT NULL`);
      } catch (err) {
        // If `size` doesn't exist or query fails, log and continue
        console.warn('Could not copy size to size_hectares during migration:', err.message || err);
      }
    } else {
      console.log('migration: skip addColumn farms.size_hectares (already exists)');
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('farms');
    if (tableInfo.size_hectares) {
      await queryInterface.removeColumn('farms', 'size_hectares');
    } else {
      console.log('migration down: farms.size_hectares not present, skip removeColumn');
    }
  }
};
