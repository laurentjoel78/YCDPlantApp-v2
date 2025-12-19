'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Order extends Model {
    static associate(models) {
      // Define associations
      this.belongsTo(models.User, {
        foreignKey: 'buyer_id',
        as: 'buyer'
      });
      this.belongsTo(models.User, {
        foreignKey: 'seller_id',
        as: 'seller'
      });
      this.hasMany(models.Transaction, {
        foreignKey: 'order_id',
        as: 'transactions'
      });
    }
  }

  Order.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    buyer_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    seller_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM(
        'pending',
        'processing',
        'shipped',
        'delivered',
        'cancelled'
      ),
      defaultValue: 'pending'
    },
    payment_status: {
      type: DataTypes.ENUM(
        'pending',
        'paid',
        'failed',
        'refunded'
      ),
      defaultValue: 'pending'
    },
    shipping_address: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    tracking_number: {
      type: DataTypes.STRING,
      allowNull: true
    },
    payment_method: {
      type: DataTypes.STRING,
      allowNull: true
    },
    payment_reference: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    underscored: true,
    timestamps: true,
    indexes: [
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
        fields: ['payment_status']
      }
    ]
  });

  return Order;
};