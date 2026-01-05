'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add missing columns to Farms table
    const columns = [
      { name: 'description', type: DataTypes.TEXT, allowNull: true },
      { name: 'location_lat', type: DataTypes.DECIMAL(10, 8), allowNull: true },
      { name: 'location_lng', type: DataTypes.DECIMAL(11, 8), allowNull: true },
      { name: 'address', type: DataTypes.TEXT, allowNull: true },
      { name: 'region', type: DataTypes.STRING(100), allowNull: true },
      { name: 'water_source', type: DataTypes.STRING(50), allowNull: true },
      { name: 'farming_type', type: DataTypes.STRING(20), defaultValue: 'conventional' },
      { name: 'irrigation_system', type: DataTypes.STRING(50), allowNull: true },
      { name: 'certification', type: DataTypes.STRING(100), allowNull: true },
      { name: 'is_active', type: DataTypes.BOOLEAN, defaultValue: true }
    ];

    for (const col of columns) {
      try {
        await queryInterface.addColumn('Farms', col.name, {
          type: col.type,
          allowNull: col.allowNull !== false,
          defaultValue: col.defaultValue
        });
        console.log(`Added column to Farms: ${col.name}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`Column Farms.${col.name} already exists, skipping`);
        } else {
          console.error(`Error adding Farms.${col.name}:`, error.message);
        }
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const columns = [
      'description', 'location_lat', 'location_lng', 'address', 'region',
      'water_source', 'farming_type', 'irrigation_system', 'certification', 'is_active'
    ];

    for (const col of columns) {
      try {
        await queryInterface.removeColumn('Farms', col);
      } catch (error) {
        console.log(`Could not remove Farms.${col}:`, error.message);
      }
    }
  }
};
