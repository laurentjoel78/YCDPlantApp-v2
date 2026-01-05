const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Market = require('../models/Market');
const MarketProduct = require('../models/marketProduct');
const PriceHistory = require('../models/priceHistory');

class MarketService {
  async createMarket(marketData) {
    const transaction = await sequelize.transaction();

    try {
      // Create market with geospatial point
      const market = await Market.create({
        ...marketData,
        location: {
          type: 'Point',
          coordinates: [marketData.longitude, marketData.latitude]
        },
        lastSyncedAt: new Date()
      }, { transaction });

      await transaction.commit();
      return market;

    } catch (error) {
      await transaction.rollback();
      throw new Error(`Market creation failed: ${error.message}`);
    }
  }

  async findNearbyMarkets(location, radius = 50000) { // Default 50km radius
    try {
      const markets = await Market.findAll({
        where: sequelize.literal(
          `ST_DWithin(
            location::geography,
            ST_SetSRID(ST_MakePoint(${location.longitude}, ${location.latitude}), 4326)::geography,
            ${radius}
          )`
        ),
        attributes: {
          include: [
            [
              sequelize.literal(
                `ST_Distance(
                  location::geography,
                  ST_SetSRID(ST_MakePoint(${location.longitude}, ${location.latitude}), 4326)::geography
                )`
              ),
              'distance'
            ]
          ]
        },
        order: [[sequelize.literal('distance'), 'ASC']]
      });

      return markets;
    } catch (error) {
      throw new Error(`Failed to find nearby markets: ${error.message}`);
    }
  }

  async addProduct(productData) {
    const transaction = await sequelize.transaction();

    try {
      // Create product link to market
      const product = await MarketProduct.create({
        market_id: productData.market_id,
        product_id: productData.product_id,
        price: productData.price,
        available_quantity: productData.available_quantity
      }, { transaction });

      await transaction.commit();
      return product;

    } catch (error) {
      await transaction.rollback();
      throw new Error(`Product creation failed: ${error.message}`);
    }
  }

  async updateProductPrice(productId, priceData) {
    const transaction = await sequelize.transaction();

    try {
      const product = await MarketProduct.findByPk(productId, { transaction });
      
      if (!product) {
        throw new Error('Product not found');
      }

      // Update product price
      await product.update({
        price: priceData.price
      }, { transaction });

      await transaction.commit();
      return product;

    } catch (error) {
      await transaction.rollback();
      throw new Error(`Price update failed: ${error.message}`);
    }
  }

  async getMarketProducts(marketId, query = {}) {
    try {
      const whereClause = { market_id: marketId };

      const products = await MarketProduct.findAll({
        where: whereClause,
        include: [
          {
            model: sequelize.models.Product,
            as: 'product'
          }
        ]
      });

      return products;

    } catch (error) {
      throw new Error(`Failed to get market products: ${error.message}`);
    }
  }

  async getPriceHistory(productId, startDate, endDate) {
    try {
      const whereClause = {
        productId,
        recordedAt: {}
      };

      if (startDate) {
        whereClause.recordedAt[Op.gte] = startDate;
      }

      if (endDate) {
        whereClause.recordedAt[Op.lte] = endDate;
      }

      const priceHistory = await PriceHistory.findAll({
        where: whereClause,
        order: [['recordedAt', 'ASC']]
      });

      return priceHistory;

    } catch (error) {
      throw new Error(`Failed to get price history: ${error.message}`);
    }
  }

  async syncOfflineChanges(changes) {
    const transaction = await sequelize.transaction();

    try {
      for (const change of changes) {
        switch (change.type) {
          case 'market':
            if (change.action === 'create') {
              await this.createMarket({
                ...change.data,
                lastSyncedAt: new Date()
              });
            } else if (change.action === 'update') {
              await Market.update({
                ...change.data,
                lastSyncedAt: new Date()
              }, {
                where: { id: change.id },
                transaction
              });
            }
            break;

          case 'product':
            if (change.action === 'create') {
              await this.addProduct({
                ...change.data,
                lastSyncedAt: new Date()
              });
            } else if (change.action === 'update') {
              await MarketProduct.update({
                ...change.data,
                lastSyncedAt: new Date()
              }, {
                where: { id: change.id },
                transaction
              });
            }
            break;

          case 'price':
            await this.updateProductPrice(change.productId, {
              ...change.data,
              source: 'user-report'
            });
            break;
        }
      }

      await transaction.commit();
      return true;

    } catch (error) {
      await transaction.rollback();
      throw new Error(`Offline sync failed: ${error.message}`);
    }
  }
}

module.exports = new MarketService();