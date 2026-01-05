'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class MarketProduct extends Model {
    static associate(models) {
      // Define associations
      this.belongsTo(models.Market, {
        foreignKey: 'market_id',
        as: 'market'
      });
      this.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product'
      });
    }
  }

  MarketProduct.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    market_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'markets',
        key: 'id'
      }
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Products',
        key: 'id'
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    available_quantity: {
      type: DataTypes.FLOAT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'MarketProduct',
    tableName: 'MarketProducts',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        fields: ['market_id']
      },
      {
        fields: ['product_id']
      }
    ]
  });

  return MarketProduct;
};