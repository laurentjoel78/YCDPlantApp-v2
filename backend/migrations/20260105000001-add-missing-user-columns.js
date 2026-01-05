'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add missing columns to Users table
    const columns = [
      { name: 'location_lat', type: DataTypes.DECIMAL(10, 8), allowNull: true },
      { name: 'location_lng', type: DataTypes.DECIMAL(11, 8), allowNull: true },
      { name: 'address', type: DataTypes.TEXT, allowNull: true },
      { name: 'region', type: DataTypes.STRING(100), allowNull: true },
      { name: 'preferred_language', type: DataTypes.STRING(10), defaultValue: 'fr' },
      { name: 'created_by_admin_id', type: DataTypes.UUID, allowNull: true },
      { name: 'approval_status', type: DataTypes.STRING(20), defaultValue: 'pending' },
      { name: 'approved_at', type: DataTypes.DATE, allowNull: true },
      { name: 'last_login', type: DataTypes.DATE, allowNull: true },
      { name: 'is_active', type: DataTypes.BOOLEAN, defaultValue: true },
      { name: 'profile_image_url', type: DataTypes.TEXT, allowNull: true }
    ];

    for (const col of columns) {
      try {
        await queryInterface.addColumn('Users', col.name, {
          type: col.type,
          allowNull: col.allowNull !== false,
          defaultValue: col.defaultValue
        });
        console.log(`Added column: ${col.name}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`Column ${col.name} already exists, skipping`);
        } else {
          console.error(`Error adding column ${col.name}:`, error.message);
        }
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const columns = [
      'location_lat', 'location_lng', 'address', 'region', 
      'preferred_language', 'created_by_admin_id', 'approval_status',
      'approved_at', 'last_login', 'is_active', 'profile_image_url'
    ];

    for (const col of columns) {
      try {
        await queryInterface.removeColumn('Users', col);
      } catch (error) {
        console.log(`Could not remove column ${col}:`, error.message);
      }
    }
  }
};
