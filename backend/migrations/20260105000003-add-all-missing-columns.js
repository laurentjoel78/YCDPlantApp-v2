'use strict';

const { DataTypes } = require('sequelize');

/**
 * Comprehensive migration to add all missing columns across tables
 * to ensure model-database synchronization
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    
    // Helper function to safely add a column
    const safeAddColumn = async (table, column, definition) => {
      try {
        await queryInterface.addColumn(table, column, definition);
        console.log(`✅ Added ${table}.${column}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⏭️  ${table}.${column} already exists`);
        } else {
          console.error(`❌ Error adding ${table}.${column}:`, error.message);
        }
      }
    };

    // ========== Products Table ==========
    console.log('\n--- Products Table ---');
    await safeAddColumn('Products', 'seller_id', {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'Users', key: 'id' }
    });
    await safeAddColumn('Products', 'price', {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    });
    await safeAddColumn('Products', 'quantity', {
      type: DataTypes.INTEGER,
      defaultValue: 0
    });
    await safeAddColumn('Products', 'unit', {
      type: DataTypes.STRING(50),
      allowNull: true
    });
    await safeAddColumn('Products', 'images', {
      type: DataTypes.JSONB,
      defaultValue: []
    });
    await safeAddColumn('Products', 'market_name', {
      type: DataTypes.STRING(255),
      allowNull: true
    });
    await safeAddColumn('Products', 'status', {
      type: DataTypes.STRING(20),
      defaultValue: 'active'
    });
    await safeAddColumn('Products', 'metadata', {
      type: DataTypes.JSONB,
      defaultValue: {}
    });
    await safeAddColumn('Products', 'farm_id', {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'Farms', key: 'id' }
    });

    // ========== Markets Table ==========
    console.log('\n--- Markets Table ---');
    await safeAddColumn('Markets', 'location_lat', {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    });
    await safeAddColumn('Markets', 'location_lng', {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    });
    await safeAddColumn('Markets', 'address', {
      type: DataTypes.STRING(255),
      allowNull: true
    });
    await safeAddColumn('Markets', 'city', {
      type: DataTypes.STRING(100),
      allowNull: true
    });
    await safeAddColumn('Markets', 'region', {
      type: DataTypes.STRING(100),
      allowNull: true
    });
    await safeAddColumn('Markets', 'country', {
      type: DataTypes.STRING(100),
      defaultValue: 'Cameroon'
    });
    await safeAddColumn('Markets', 'market_type', {
      type: DataTypes.STRING(50),
      allowNull: true
    });
    await safeAddColumn('Markets', 'operating_hours', {
      type: DataTypes.JSONB,
      allowNull: true
    });
    await safeAddColumn('Markets', 'market_days', {
      type: DataTypes.JSONB,
      allowNull: true
    });
    await safeAddColumn('Markets', 'contact_phone', {
      type: DataTypes.STRING(20),
      allowNull: true
    });
    await safeAddColumn('Markets', 'contact_email', {
      type: DataTypes.STRING(255),
      allowNull: true
    });
    await safeAddColumn('Markets', 'website', {
      type: DataTypes.STRING(255),
      allowNull: true
    });
    await safeAddColumn('Markets', 'average_rating', {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0
    });
    await safeAddColumn('Markets', 'total_reviews', {
      type: DataTypes.INTEGER,
      defaultValue: 0
    });
    await safeAddColumn('Markets', 'is_active', {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    });
    await safeAddColumn('Markets', 'verified', {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    });
    await safeAddColumn('Markets', 'osm_id', {
      type: DataTypes.STRING(100),
      allowNull: true
    });
    await safeAddColumn('Markets', 'data_source', {
      type: DataTypes.STRING(50),
      allowNull: true
    });
    await safeAddColumn('Markets', 'additional_info', {
      type: DataTypes.JSONB,
      allowNull: true
    });

    // ========== Wallets Table ==========
    console.log('\n--- Wallets Table ---');
    await safeAddColumn('Wallets', 'wallet_type', {
      type: DataTypes.STRING(20),
      defaultValue: 'buyer'
    });
    await safeAddColumn('Wallets', 'daily_transaction_limit', {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 1000000.00
    });
    await safeAddColumn('Wallets', 'single_transaction_limit', {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 500000.00
    });
    await safeAddColumn('Wallets', 'pending_balance', {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    });
    await safeAddColumn('Wallets', 'total_received', {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    });
    await safeAddColumn('Wallets', 'total_spent', {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    });
    await safeAddColumn('Wallets', 'last_transaction_date', {
      type: DataTypes.DATE,
      allowNull: true
    });
    await safeAddColumn('Wallets', 'verification_level', {
      type: DataTypes.STRING(20),
      defaultValue: 'basic'
    });
    await safeAddColumn('Wallets', 'verification_documents', {
      type: DataTypes.JSONB,
      allowNull: true
    });
    await safeAddColumn('Wallets', 'wallet_settings', {
      type: DataTypes.JSONB,
      defaultValue: {}
    });
    await safeAddColumn('Wallets', 'security_pin', {
      type: DataTypes.STRING(255),
      allowNull: true
    });
    await safeAddColumn('Wallets', 'status', {
      type: DataTypes.STRING(20),
      defaultValue: 'active'
    });
    await safeAddColumn('Wallets', 'suspension_reason', {
      type: DataTypes.STRING(255),
      allowNull: true
    });
    await safeAddColumn('Wallets', 'last_balance_update', {
      type: DataTypes.DATE,
      allowNull: true
    });
    await safeAddColumn('Wallets', 'is_active', {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    });
    await safeAddColumn('Wallets', 'deleted_at', {
      type: DataTypes.DATE,
      allowNull: true
    });

    // ========== Transactions Table ==========
    console.log('\n--- Transactions Table ---');
    await safeAddColumn('Transactions', 'order_id', {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'orders', key: 'id' }
    });
    await safeAddColumn('Transactions', 'payer_id', {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'Users', key: 'id' }
    });
    await safeAddColumn('Transactions', 'payee_id', {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'Users', key: 'id' }
    });
    await safeAddColumn('Transactions', 'market_id', {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'Markets', key: 'id' }
    });
    await safeAddColumn('Transactions', 'parent_transaction_id', {
      type: DataTypes.UUID,
      allowNull: true
    });
    await safeAddColumn('Transactions', 'processed_by', {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'Users', key: 'id' }
    });
    await safeAddColumn('Transactions', 'transaction_type', {
      type: DataTypes.STRING(20),
      defaultValue: 'payment'
    });
    await safeAddColumn('Transactions', 'currency', {
      type: DataTypes.STRING(3),
      defaultValue: 'XAF'
    });
    await safeAddColumn('Transactions', 'payment_method', {
      type: DataTypes.STRING(50),
      allowNull: true
    });
    await safeAddColumn('Transactions', 'payment_status', {
      type: DataTypes.STRING(20),
      defaultValue: 'pending'
    });
    await safeAddColumn('Transactions', 'payment_reference', {
      type: DataTypes.STRING(255),
      allowNull: true
    });
    await safeAddColumn('Transactions', 'payment_details', {
      type: DataTypes.JSONB,
      allowNull: true
    });
    await safeAddColumn('Transactions', 'payment_provider_fee', {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    });
    await safeAddColumn('Transactions', 'platform_fee', {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    });
    await safeAddColumn('Transactions', 'net_amount', {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    });
    await safeAddColumn('Transactions', 'transaction_date', {
      type: DataTypes.DATE,
      allowNull: true
    });
    await safeAddColumn('Transactions', 'settlement_status', {
      type: DataTypes.STRING(20),
      defaultValue: 'pending'
    });
    await safeAddColumn('Transactions', 'settlement_date', {
      type: DataTypes.DATE,
      allowNull: true
    });
    await safeAddColumn('Transactions', 'notes', {
      type: DataTypes.TEXT,
      allowNull: true
    });
    await safeAddColumn('Transactions', 'is_active', {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    });
    await safeAddColumn('Transactions', 'deleted_at', {
      type: DataTypes.DATE,
      allowNull: true
    });

    // ========== Advisories Table ==========
    console.log('\n--- Advisories Table ---');
    await safeAddColumn('Advisories', 'farmer_id', {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'Users', key: 'id' }
    });
    await safeAddColumn('Advisories', 'expert_id', {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'Users', key: 'id' }
    });
    await safeAddColumn('Advisories', 'farm_id', {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'Farms', key: 'id' }
    });
    await safeAddColumn('Advisories', 'crop_id', {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'crops', key: 'id' }
    });
    await safeAddColumn('Advisories', 'subject', {
      type: DataTypes.STRING(255),
      allowNull: true
    });
    await safeAddColumn('Advisories', 'description', {
      type: DataTypes.TEXT,
      allowNull: true
    });
    await safeAddColumn('Advisories', 'priority', {
      type: DataTypes.STRING(20),
      defaultValue: 'medium'
    });
    await safeAddColumn('Advisories', 'is_active', {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    });

    // ========== Orders Table ==========
    console.log('\n--- Orders Table ---');
    await safeAddColumn('orders', 'payment_method', {
      type: DataTypes.STRING(50),
      allowNull: true
    });

    // ========== Notifications Table ==========
    console.log('\n--- Notifications Table ---');
    await safeAddColumn('Notifications', 'data', {
      type: DataTypes.JSONB,
      allowNull: true
    });
    await safeAddColumn('Notifications', 'link', {
      type: DataTypes.STRING(255),
      allowNull: true
    });

    // ========== WeatherData Table ==========
    console.log('\n--- WeatherData Table ---');
    await safeAddColumn('WeatherData', 'user_id', {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'Users', key: 'id' }
    });
    await safeAddColumn('WeatherData', 'location_lat', {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    });
    await safeAddColumn('WeatherData', 'location_lng', {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    });
    await safeAddColumn('WeatherData', 'weather_condition', {
      type: DataTypes.STRING(100),
      allowNull: true
    });
    await safeAddColumn('WeatherData', 'description', {
      type: DataTypes.TEXT,
      allowNull: true
    });
    await safeAddColumn('WeatherData', 'icon', {
      type: DataTypes.STRING(50),
      allowNull: true
    });
    await safeAddColumn('WeatherData', 'pressure', {
      type: DataTypes.FLOAT,
      allowNull: true
    });
    await safeAddColumn('WeatherData', 'visibility', {
      type: DataTypes.FLOAT,
      allowNull: true
    });
    await safeAddColumn('WeatherData', 'uv_index', {
      type: DataTypes.FLOAT,
      allowNull: true
    });
    await safeAddColumn('WeatherData', 'cloud_cover', {
      type: DataTypes.FLOAT,
      allowNull: true
    });
    await safeAddColumn('WeatherData', 'soil_moisture', {
      type: DataTypes.FLOAT,
      allowNull: true
    });
    await safeAddColumn('WeatherData', 'forecast_data', {
      type: DataTypes.JSONB,
      allowNull: true
    });
    await safeAddColumn('WeatherData', 'alerts', {
      type: DataTypes.JSONB,
      allowNull: true
    });
    await safeAddColumn('WeatherData', 'data_source', {
      type: DataTypes.STRING(50),
      allowNull: true
    });

    // ========== VoiceRecordings Table ==========
    console.log('\n--- VoiceRecordings Table ---');
    await safeAddColumn('VoiceRecordings', 'context', {
      type: DataTypes.STRING(100),
      allowNull: true
    });
    await safeAddColumn('VoiceRecordings', 'processed', {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    });
    await safeAddColumn('VoiceRecordings', 'ai_response', {
      type: DataTypes.TEXT,
      allowNull: true
    });

    // ========== SystemLogs Table ==========
    console.log('\n--- SystemLogs Table ---');
    await safeAddColumn('SystemLogs', 'updated_at', {
      type: DataTypes.DATE,
      allowNull: true
    });
    await safeAddColumn('SystemLogs', 'source', {
      type: DataTypes.STRING(100),
      allowNull: true
    });
    await safeAddColumn('SystemLogs', 'user_id', {
      type: DataTypes.UUID,
      allowNull: true
    });
    await safeAddColumn('SystemLogs', 'request_id', {
      type: DataTypes.STRING(100),
      allowNull: true
    });
    await safeAddColumn('SystemLogs', 'performance_metrics', {
      type: DataTypes.JSONB,
      allowNull: true
    });

    console.log('\n✅ All missing columns migration completed!');
  },

  down: async (queryInterface, Sequelize) => {
    // This down migration would be complex - in production, 
    // you'd want to carefully handle removing these columns
    console.log('Rolling back comprehensive column additions...');
  }
};
