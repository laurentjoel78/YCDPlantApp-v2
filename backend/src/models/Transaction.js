'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Transaction extends Model {
    static associate(models) {
      // Define associations
      this.belongsTo(models.Order, {
        foreignKey: 'order_id',
        as: 'order'
      });

      this.belongsTo(models.User, {
        foreignKey: 'payer_id',
        as: 'payer'
      });

      this.belongsTo(models.User, {
        foreignKey: 'payee_id',
        as: 'payee'
      });

      this.belongsTo(models.User, {
        foreignKey: 'processed_by',
        as: 'processor'
      });

      // For refund transactions
      this.belongsTo(models.Transaction, {
        foreignKey: 'parent_transaction_id',
        as: 'parentTransaction'
      });

      this.hasMany(models.Transaction, {
        foreignKey: 'parent_transaction_id',
        as: 'childTransactions'
      });

      this.belongsTo(models.Market, {
        foreignKey: 'market_id',
        as: 'market'
      });
    }
  }

  Transaction.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'orders',
        key: 'id'
      },
      comment: 'Related order ID if this is a payment for an order'
    },
    payer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who made the payment'
    },
    payee_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who receives the payment'
    },
    market_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'markets',
        key: 'id'
      },
      comment: 'Market where the transaction occurred'
    },
    parent_transaction_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'transactions',
        key: 'id'
      },
      comment: 'For refunds, reference to the original transaction'
    },
    processed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Admin or system user who processed the transaction'
    },
    transaction_type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'payment',
      validate: {
        isIn: [['payment', 'refund', 'withdrawal', 'deposit', 'transfer', 'fee']]
      },
      comment: 'Type of transaction'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'XAF'
    },
    payment_method: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['mobile_money_mtn', 'mobile_money_orange', 'cash_on_delivery', 'bank_transfer', 'wallet', 'system']]
      },
      comment: 'Method used for the payment'
    },
    payment_status: {
      type: DataTypes.STRING,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'processing', 'completed', 'failed', 'refunded']]
      }
    },
    payment_reference: {
      type: DataTypes.STRING,
      allowNull: true
    },
    payment_details: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional payment details like mobile money provider response'
    },
    payment_provider_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Fee charged by the payment provider'
    },
    platform_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Fee charged by our platform'
    },
    net_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Amount after deducting fees'
    },
    transaction_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    settlement_status: {
      type: DataTypes.STRING,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'completed', 'failed']]
      }
    },
    settlement_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Transaction',
    tableName: 'Transactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    indexes: [
      {
        fields: ['order_id']
      },
      {
        fields: ['payer_id']
      },
      {
        fields: ['payee_id']
      },
      {
        fields: ['transaction_date']
      },
      {
        fields: ['payment_status']
      },
      {
        fields: ['payment_method']
      },
      {
        fields: ['transaction_type']
      }
    ],
    hooks: {
      beforeCreate: async (transaction) => {
        if (!transaction.net_amount) {
          // Calculate net amount by subtracting fees
          const totalFees = (transaction.payment_provider_fee || 0) + (transaction.platform_fee || 0);
          transaction.net_amount = transaction.amount - totalFees;
        }
      },
      afterCreate: async (transaction, options) => {
        // Log the transaction creation
        await sequelize.models.AuditLog.create({
          userId: transaction.processed_by || transaction.payer_id,
          userRole: options.userRole || 'system',
          actionType: 'TRANSACTION_CREATED',
          actionDescription: `New ${transaction.transaction_type} transaction created`,
          tableName: 'transactions',
          recordId: transaction.id,
          newValues: transaction.toJSON()
        }, { transaction: options.transaction });
      }
    }
  });

  return Transaction;
};