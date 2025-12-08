'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class PriceHistory extends Model {
    static associate(models) {
      // Define associations
      this.belongsTo(models.MarketProduct, {
        foreignKey: 'productId',
        as: 'product'
      });
      this.belongsTo(models.User, {
        foreignKey: 'reporterId',
        as: 'reporter'
      });
    }
  }

  PriceHistory.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'market_products',
        key: 'id'
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    recordedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    source: {
      type: DataTypes.ENUM('market-update', 'user-report', 'system'),
      defaultValue: 'market-update'
    },
    reporterId: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    notes: {
      type: DataTypes.TEXT
    }
  }, {
    sequelize,
    modelName: 'PriceHistory',
    tableName: 'price_histories',
    indexes: [
      {
        fields: ['productId', 'recordedAt']
      }
    ]
  });

  return PriceHistory;
};