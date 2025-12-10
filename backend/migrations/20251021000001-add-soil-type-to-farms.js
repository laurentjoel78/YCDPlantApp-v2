'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // make this migration idempotent: only add column when it doesn't already exist
    const tableInfo = await queryInterface.describeTable('Farms');
    if (!tableInfo.soil_type) {
      await queryInterface.addColumn('Farms', 'soil_type', {
        type: Sequelize.ENUM('Clay', 'Sandy', 'Silty', 'Loamy', 'Chalky', 'Peaty', 'Saline', 'Other'),
        allowNull: false,
        defaultValue: 'Other' // Use this to avoid issues with existing records
      });
    } else {
      // column already exists - skip
      console.log('migration: skip addColumn Farms.soil_type (already exists)');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // only remove the column if it exists
    const tableInfo = await queryInterface.describeTable('Farms');
    if (tableInfo.soil_type) {
      await queryInterface.removeColumn('Farms', 'soil_type');
    } else {
      console.log('migration down: Farms.soil_type not present, skip removeColumn');
    }
    // drop enum type if exists (safe cleanup)
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Farms_soil_type";');
  }
};
