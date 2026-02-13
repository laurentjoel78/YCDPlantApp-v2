'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    const safeAddColumn = async (table, column, definition) => {
      try {
        await queryInterface.addColumn(table, column, definition);
        console.log(`  ✅ Added ${table}.${column}`);
      } catch (e) {
        if (e.message?.includes('already exists') || e.original?.code === '42701') {
          console.log(`  ⏭️  ${table}.${column} already exists`);
        } else {
          console.error(`  ❌ Failed to add ${table}.${column}:`, e.message);
        }
      }
    };

    console.log('--- Adding missing SystemLogs columns ---');

    await safeAddColumn('SystemLogs', 'stack_trace', {
      type: DataTypes.TEXT,
      allowNull: true
    });

    await safeAddColumn('SystemLogs', 'server_instance', {
      type: DataTypes.STRING(100),
      allowNull: true
    });

    await safeAddColumn('SystemLogs', 'process_id', {
      type: DataTypes.STRING(50),
      allowNull: true
    });

    console.log('--- Done ---');
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('SystemLogs', 'stack_trace').catch(() => {});
    await queryInterface.removeColumn('SystemLogs', 'server_instance').catch(() => {});
    await queryInterface.removeColumn('SystemLogs', 'process_id').catch(() => {});
  }
};
