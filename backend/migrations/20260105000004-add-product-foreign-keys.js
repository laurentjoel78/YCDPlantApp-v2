'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
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

    const safeAddIndex = async (table, columns) => {
      try {
        await queryInterface.addIndex(table, columns);
        console.log(`  ✅ Added index on ${table}(${columns.join(', ')})`);
      } catch (e) {
        if (e.message?.includes('already exists') || e.original?.code === '42P07') {
          console.log(`  ⏭️  Index on ${table}(${columns.join(', ')}) already exists`);
        } else {
          console.error(`  ❌ Failed to add index on ${table}(${columns.join(', ')}):`, e.message);
        }
      }
    };

    // Add crop_id column to Products (farm_id already exists)
    await safeAddColumn('Products', 'crop_id', {
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
    await safeAddColumn('Products', 'market_id', {
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
    await safeAddIndex('Products', ['crop_id']);
    await safeAddIndex('Products', ['market_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Products', 'crop_id').catch(() => {});
    await queryInterface.removeColumn('Products', 'market_id').catch(() => {});
  }
};
