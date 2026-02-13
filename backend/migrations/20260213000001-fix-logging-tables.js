'use strict';

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('=== Fix Logging Tables Migration ===');

    // Helper: safely add column (skip if exists)
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

    // ========== 1. Fix SystemLogs Table ==========
    // The original migration only created: id, level, message, context, created_at
    // The model & service need: log_level, module, category, error_details, source,
    //   environment, request_id, performance_metrics, etc.
    console.log('\n--- Fixing SystemLogs Table ---');

    await safeAddColumn('SystemLogs', 'log_level', {
      type: DataTypes.STRING(20),
      allowNull: true
    });

    await safeAddColumn('SystemLogs', 'module', {
      type: DataTypes.STRING(100),
      allowNull: true
    });

    await safeAddColumn('SystemLogs', 'category', {
      type: DataTypes.STRING(100),
      allowNull: true
    });

    await safeAddColumn('SystemLogs', 'error_details', {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    });

    await safeAddColumn('SystemLogs', 'details', {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    });

    await safeAddColumn('SystemLogs', 'environment', {
      type: DataTypes.STRING(50),
      allowNull: true
    });

    await safeAddColumn('SystemLogs', 'timestamp', {
      type: DataTypes.DATE,
      allowNull: true
    });

    // These may already exist from previous migration 20260105000003
    await safeAddColumn('SystemLogs', 'source', {
      type: DataTypes.STRING(100),
      allowNull: true
    });
    await safeAddColumn('SystemLogs', 'request_id', {
      type: DataTypes.STRING(100),
      allowNull: true
    });
    await safeAddColumn('SystemLogs', 'performance_metrics', {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    });

    // ========== 2. Create user_activity_logs Table ==========
    console.log('\n--- Creating user_activity_logs Table ---');

    // Check if table exists first
    try {
      const tableExists = await queryInterface.sequelize.query(
        `SELECT to_regclass('public.user_activity_logs') AS exists`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (tableExists[0]?.exists) {
        console.log('  ⏭️  user_activity_logs table already exists');
      } else {
        await queryInterface.createTable('user_activity_logs', {
          id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
          },
          user_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
              model: 'Users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          activity_type: {
            type: DataTypes.STRING(100),
            allowNull: true
          },
          description: {
            type: DataTypes.TEXT,
            allowNull: true
          },
          metadata: {
            type: DataTypes.JSONB,
            defaultValue: {}
          },
          duration: {
            type: DataTypes.INTEGER,
            allowNull: true
          },
          device_info: {
            type: DataTypes.JSONB,
            defaultValue: {}
          },
          location: {
            type: DataTypes.JSONB,
            allowNull: true
          },
          status: {
            type: DataTypes.STRING(50),
            defaultValue: 'success'
          },
          created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          }
        });
        console.log('  ✅ Created user_activity_logs table');
      }
    } catch (error) {
      console.error('  ❌ Error with user_activity_logs:', error.message);
    }

    console.log('\n✅ Logging tables fix migration completed!');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove added SystemLogs columns
    const columnsToRemove = [
      'log_level', 'module', 'category', 'error_details',
      'details', 'environment', 'timestamp'
    ];
    for (const col of columnsToRemove) {
      try {
        await queryInterface.removeColumn('SystemLogs', col);
      } catch (e) {
        // ignore
      }
    }

    // Drop user_activity_logs table
    try {
      await queryInterface.dropTable('user_activity_logs');
    } catch (e) {
      // ignore
    }
  }
};
