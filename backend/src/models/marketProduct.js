'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class MarketProduct extends Model {
    static associate(models) {
      // Define associations
      this.belongsTo(models.Market, {
        foreignKey: 'marketId',
        as: 'market'
      });
    }
  }

  MarketProduct.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    marketId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'markets',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false
    },
    currentPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    availability: {
      type: DataTypes.ENUM('in-stock', 'low-stock', 'out-of-stock'),
      defaultValue: 'in-stock'
    },
    qualityGrade: {
      type: DataTypes.STRING
    },
    description: {
      type: DataTypes.TEXT
    },
    seasonality: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    lastPriceUpdate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    lastSyncedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'MarketProduct',
    tableName: 'MarketProducts',
    indexes: [
      {
        fields: ['marketId']
      },
      {
        fields: ['category']
      }
    ]
  });

  return MarketProduct;
};