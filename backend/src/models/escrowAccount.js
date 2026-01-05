'use strict';

const { Model, DataTypes, Sequelize } = require('sequelize');

module.exports = (sequelize) => {
  class EscrowAccount extends Model {
    static associate(models) {
      // Define associations with transactions
      this.belongsTo(models.Transaction, { 
        as: 'fundingTransaction', 
        foreignKey: 'funding_transaction_id',
        onDelete: 'SET NULL'
      });
      
      this.belongsTo(models.Transaction, { 
        as: 'releaseTransaction', 
        foreignKey: 'release_transaction_id',
        onDelete: 'SET NULL'
      });

      // Define associations with users and order
      this.belongsTo(models.Order, {
        foreignKey: 'order_id',
        as: 'order'
      });

      this.belongsTo(models.User, {
        foreignKey: 'buyer_id',
        as: 'buyer'
      });

      this.belongsTo(models.User, {
        foreignKey: 'seller_id',
        as: 'seller'
      });

      this.belongsTo(models.User, {
        foreignKey: 'disputed_by',
        as: 'disputedBy'
      });
    }
  }

  EscrowAccount.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      },
      comment: 'Associated order'
    },
    buyer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Buyer who deposits funds'
    },
    seller_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Seller who receives funds'
    },
    funding_transaction_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'transactions',
        key: 'id'
      }
    },
    release_transaction_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'transactions',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      },
      comment: 'Total amount in escrow'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'XAF',
      allowNull: false,
      comment: 'Currency of the amount'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'awaiting_deposit',
      allowNull: false,
      validate: {
        isIn: [['awaiting_deposit', 'funded', 'releasing', 'released', 'refunding', 'refunded', 'disputed']]
      },
      comment: 'Current status of the escrow'
    },
    release_conditions: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Conditions that must be met to release funds'
    },
    commission_rate: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      defaultValue: 2.50,
      comment: 'Commission rate in percentage'
    },
    commission_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Calculated commission amount'
    },
    dispute_reason: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Reason if escrow is disputed'
    },
    disputed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who raised the dispute'
    },
    dispute_resolution: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Details of dispute resolution'
    },
    admin_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Administrative notes'
    },
    released_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When funds were released'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'When escrow expires if conditions not met'
    },
    last_status_change: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Timestamp of last status change'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional metadata'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'EscrowAccount',
    tableName: 'escrow_accounts',
    underscored: true,
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        fields: ['order_id']
      },
      {
        fields: ['buyer_id']
      },
      {
        fields: ['seller_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['expires_at']
      },
      {
        fields: ['funding_transaction_id']
      },
      {
        fields: ['release_transaction_id']
      }
    ],
    hooks: {
      beforeCreate: async (escrow) => {
        // Calculate commission amount
        escrow.commission_amount = (escrow.amount * escrow.commission_rate) / 100;
      },
      afterCreate: async (escrow, options) => {
        // Log escrow account creation
        await sequelize.models.AuditLog.create({
          user_id: escrow.buyer_id,
          user_role: 'user',
          action_type: 'ESCROW_CREATED',
          action_description: `New escrow account created for order ${escrow.order_id}`,
          table_name: 'escrow_accounts',
          record_id: escrow.id,
          new_values: escrow.toJSON()
        }, { transaction: options.transaction });
      },
      beforeUpdate: async (escrow) => {
        if (escrow.changed('status')) {
          escrow.last_status_change = new Date();
        }
      },
      afterUpdate: async (escrow, options) => {
        if (escrow.changed('status')) {
          // Log status change
          await sequelize.models.AuditLog.create({
            user_id: options.userId,
            user_role: options.userRole || 'system',
            action_type: 'ESCROW_STATUS_CHANGED',
            action_description: `Escrow status changed to ${escrow.status}`,
            table_name: 'escrow_accounts',
            record_id: escrow.id,
            old_values: { status: escrow.previous('status') },
            new_values: { status: escrow.status }
          }, { transaction: options.transaction });
        }
      }
    }
  });

  return EscrowAccount;
};