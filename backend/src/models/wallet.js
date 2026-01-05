'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Wallet extends Model {
    static associate(models) {
      // Define associations
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'owner'
      });

      this.hasMany(models.Transaction, {
        foreignKey: 'wallet_id',
        as: 'transactions'
      });
    }
  }

  Wallet.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who owns this wallet'
    },
    balance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Current wallet balance'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'XAF',
      allowNull: false,
      comment: 'Wallet currency'
    },
    wallet_type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['buyer', 'seller', 'expert', 'admin']]
      },
      comment: 'Type of wallet based on user role'
    },
    daily_transaction_limit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 1000000.00,
      comment: 'Daily transaction limit'
    },
    single_transaction_limit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 500000.00,
      comment: 'Single transaction limit'
    },
    pending_balance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Balance pending clearance'
    },
    total_received: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Total amount received'
    },
    total_spent: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      },
      comment: 'Total amount spent'
    },
    last_transaction_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date of last transaction'
    },
    verification_level: {
      type: DataTypes.STRING,
      defaultValue: 'basic',
      allowNull: false,
      validate: {
        isIn: [['basic', 'verified', 'enhanced']]
      },
      comment: 'Wallet verification level'
    },
    verification_documents: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Verification documents submitted'
    },
    wallet_settings: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        notifications: {
          low_balance: true,
          transaction_alerts: true
        },
        security: {
          require_2fa: false,
          allow_mobile_money: true,
          allow_bank_transfer: true
        }
      },
      comment: 'Wallet settings and preferences'
    },
    security_pin: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Encrypted security PIN for transactions'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active',
      allowNull: false,
      validate: {
        isIn: [['active', 'suspended', 'blocked']]
      },
      comment: 'Current wallet status'
    },
    suspension_reason: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Reason if wallet is suspended'
    },
    last_balance_update: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Last balance update timestamp'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Wallet',
    tableName: 'Wallets',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['wallet_type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['verification_level']
      },
      {
        fields: ['last_transaction_date']
      }
    ],
    hooks: {
      afterCreate: async (wallet, options) => {
        // Log wallet creation
        await sequelize.models.AuditLog.create({
          userId: wallet.user_id,
          userRole: options.userRole || 'system',
          actionType: 'WALLET_CREATED',
          actionDescription: `New ${wallet.wallet_type} wallet created`,
          tableName: 'wallets',
          recordId: wallet.id,
          newValues: wallet.toJSON()
        }, { transaction: options.transaction });
      },
      beforeUpdate: async (wallet) => {
        if (wallet.changed('balance')) {
          wallet.last_balance_update = new Date();
        }
      },
      afterUpdate: async (wallet, options) => {
        const changes = wallet.changed();
        if (changes && changes.length > 0) {
          const oldValues = {};
          const newValues = {};
          
          changes.forEach(field => {
            oldValues[field] = wallet.previous(field);
            newValues[field] = wallet.get(field);
          });

          // Log the changes
          await sequelize.models.AuditLog.create({
            userId: options.userId,
            userRole: options.userRole || 'system',
            actionType: 'WALLET_UPDATED',
            actionDescription: `Wallet ${wallet.id} updated`,
            tableName: 'wallets',
            recordId: wallet.id,
            oldValues,
            newValues
          }, { transaction: options.transaction });
        }
      }
    }
  });

  return Wallet;
};