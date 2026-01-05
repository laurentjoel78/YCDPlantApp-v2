const { Market, Farm, Product, Sequelize } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const marketService = require('../services/marketService');

// Helper function to calculate distance between two points using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Create a new market
exports.createMarket = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is admin or has permission
    if (req.user.role !== 'admin' && req.user.role !== 'market_operator') {
      return res.status(403).json({ error: 'Only admins and market operators can create markets' });
    }

    const marketData = {
      name: req.body.name,
      description: req.body.description,
      address: req.body.address,
      location_lat: req.body.location_lat,
      location_lng: req.body.location_lng,
      operating_hours: req.body.operating_hours,
      market_days: req.body.market_days,
      specialties: req.body.specialties,
      facilities: req.body.facilities,
      contact_info: req.body.contact_info,
      is_active: true
    };

    const market = await Market.create(marketData);

    req.log.info('Market created successfully', {
      userId: req.user.id,
      marketId: market.id,
      marketName: market.name
    });

    res.status(201).json({ market });
  } catch (error) {
    req.log.error('Failed to create market', {
      error: error.message,
      stack: error.stack,
      userId: req.user.id
    });
    res.status(500).json({ error: 'Failed to create market' });
  }
};

// Get nearby markets based on farm location
exports.getNearbyMarkets = async (req, res) => {
  try {
    const { farmId } = req.params;
    const { radius = 50 } = req.query; // Default radius: 50km

    req.log.info('Searching for nearby markets', {
      userId: req.user.id,
      farmId,
      searchRadius: radius
    });

    // Get farm location
    const farm = await Farm.findOne({
      where: {
        id: farmId,
        user_id: req.user.id, // Ensure farm belongs to requesting user
        is_active: true
      }
    });

    if (!farm) {
      req.log.warn('Farm not found or access denied for market search', {
        userId: req.user.id,
        farmId
      });
      return res.status(404).json({ error: 'Farm not found' });
    }

    req.log.debug('Found farm for market search', {
      userId: req.user.id,
      farmId,
      farmName: farm.name,
      location: {
        lat: farm.location_lat,
        lng: farm.location_lng
      }
    });

    // Get all active markets
    const markets = await Market.findAll({
      where: { is_active: true },
      attributes: [
        'id',
        'name',
        'description',
        'address',
        'location_lat',
        'location_lng',
        'operating_hours',
        'market_days',
        'specialties',
        'facilities',
        [
          Sequelize.literal(`
            2 * 6371 * asin(
              sqrt(
                power(sin((RADIANS(location_lat) - RADIANS(${farm.location_lat})) / 2), 2) +
                cos(RADIANS(${farm.location_lat})) * cos(RADIANS(location_lat)) *
                power(sin((RADIANS(location_lng) - RADIANS(${farm.location_lng})) / 2), 2)
              )
            )
          `),
          'distance'
        ]
      ],
      having: Sequelize.literal(`distance <= ${radius}`),
      order: [[Sequelize.literal('distance'), 'ASC']]
    });

    req.log.debug('Found nearby markets', {
      userId: req.user.id,
      farmId,
      marketCount: markets.length,
      searchRadius: radius
    });

    // Get products available in each market
    const marketsWithProducts = await Promise.all(markets.map(async (market) => {
      const products = await Product.findAll({
        where: {
          market_id: market.id,
          status: 'active',
          is_active: true
        },
        attributes: ['id', 'title', 'price_per_unit', 'unit', 'quantity']
      });

      return {
        ...market.toJSON(),
        products: products
      };
    }));

    req.log.info('Successfully retrieved nearby markets with products', {
      userId: req.user.id,
      farmId,
      marketCount: markets.length,
      totalProducts: marketsWithProducts.reduce((sum, m) => sum + m.products.length, 0),
      searchRadius: radius
    });

    res.status(200).json({
      markets: marketsWithProducts,
      farmLocation: {
        lat: farm.location_lat,
        lng: farm.location_lng
      }
    });
  } catch (error) {
    req.log.error('Failed to fetch nearby markets', {
      error: error.message,
      stack: error.stack,
      userId: req.user.id,
      farmId: req.params.farmId,
      searchRadius: req.query.radius
    });
    res.status(500).json({ error: 'Failed to fetch nearby markets' });
  }
};

// Get market details with current products
exports.getMarketDetails = async (req, res) => {
  try {
    const marketId = req.params.marketId;

    req.log.info('Fetching market details', {
      userId: req.user.id,
      marketId
    });

    const market = await Market.findOne({
      where: {
        id: marketId,
        is_active: true
      }
    });

    if (!market) {
      req.log.warn('Market not found', {
        userId: req.user.id,
        marketId
      });
      return res.status(404).json({ error: 'Market not found' });
    }

    req.log.debug('Found market, fetching products', {
      userId: req.user.id,
      marketId,
      marketName: market.name,
      location: {
        address: market.address,
        coordinates: {
          lat: market.location_lat,
          lng: market.location_lng
        }
      }
    });

    // Get active products in this market
    const products = await Product.findAll({
      where: {
        market_id: market.id,
        status: 'active',
        is_active: true
      },
      include: [
        {
          model: Farm,
          attributes: ['name', 'address']
        }
      ]
    });

    req.log.info('Successfully retrieved market details', {
      userId: req.user.id,
      marketId,
      marketName: market.name,
      productCount: products.length,
      uniqueFarms: new Set(products.map(p => p.Farm?.id)).size
    });

    res.status(200).json({
      market: {
        ...market.toJSON(),
        products
      }
    });
  } catch (error) {
    req.log.error('Failed to fetch market details', {
      error: error.message,
      stack: error.stack,
      userId: req.user.id,
      marketId: req.params.marketId
    });
    res.status(500).json({ error: 'Failed to fetch market details' });
  }
};

// Get market recommendations based on farm's products
exports.getMarketRecommendations = async (req, res) => {
  try {
    const { farmId } = req.params;
    const { radius = 50 } = req.query;

    req.log.info('Fetching market recommendations', {
      userId: req.user.id,
      farmId,
      searchRadius: radius
    });

    // Get farm and its products
    const farm = await Farm.findOne({
      where: {
        id: farmId,
        user_id: req.user.id,
        is_active: true
      },
      include: [
        {
          model: Product,
          where: { is_active: true },
          required: false
        }
      ]
    });

    if (!farm) {
      req.log.warn('Farm not found or access denied for market recommendations', {
        userId: req.user.id,
        farmId
      });
      return res.status(404).json({ error: 'Farm not found' });
    }

    req.log.debug('Found farm, analyzing product categories', {
      userId: req.user.id,
      farmId,
      farmName: farm.name,
      productCount: farm.Products?.length
    });

    // Get farm's crop categories
    const farmProducts = await Product.findAll({
      where: { farm_id: farmId, is_active: true },
      include: [
        {
          model: Crop,
          attributes: ['category']
        }
      ]
    });

    const farmCategories = [...new Set(farmProducts.map(p => p.Crop.category))];

    req.log.debug('Analyzing farm categories for market matching', {
      userId: req.user.id,
      farmId,
      categories: farmCategories,
      productCount: farmProducts.length
    });

    // Find markets that specialize in farm's products
    const markets = await Market.findAll({
      where: {
        is_active: true,
        [Op.or]: [
          { specialties: { [Op.overlap]: farmCategories } },
          { specialties: null }
        ]
      },
      attributes: {
        include: [
          [
            Sequelize.literal(`
              2 * 6371 * asin(
                sqrt(
                  power(sin((RADIANS(location_lat) - RADIANS(${farm.location_lat})) / 2), 2) +
                  cos(RADIANS(${farm.location_lat})) * cos(RADIANS(location_lat)) *
                  power(sin((RADIANS(location_lng) - RADIANS(${farm.location_lng})) / 2), 2)
                )
              )
            `),
            'distance'
          ]
        ]
      },
      having: Sequelize.literal(`distance <= ${radius}`),
      order: [
        [Sequelize.literal('distance'), 'ASC'],
        [Sequelize.literal(`CASE WHEN specialties && ARRAY[${farmCategories.map(c => `'${c}'`).join(',')}] THEN 0 ELSE 1 END`)]
      ]
    });

    req.log.debug('Found potential matching markets', {
      userId: req.user.id,
      farmId,
      marketCount: markets.length,
      searchRadius: radius
    });

    // Enhance market data with relevance information
    const enhancedMarkets = markets.map(market => {
      const matchingSpecialties = market.specialties ?
        market.specialties.filter(s => farmCategories.includes(s)) : [];

      req.log.debug('Analyzing market relevance', {
        userId: req.user.id,
        marketId: market.id,
        marketName: market.name,
        matchingSpecialties,
        relevanceScore: (matchingSpecialties.length / farmCategories.length) * 100
      });

      return {
        ...market.toJSON(),
        relevance: {
          matchingSpecialties,
          matchingSpecialtiesCount: matchingSpecialties.length,
          totalSpecialties: market.specialties ? market.specialties.length : 0
        }
      };
    });

    req.log.info('Successfully generated market recommendations', {
      userId: req.user.id,
      farmId,
      totalMarkets: enhancedMarkets.length,
      matchingMarkets: enhancedMarkets.filter(m => m.relevance.matchingSpecialtiesCount > 0).length,
      searchRadius: radius,
      categories: farmCategories
    });

    res.status(200).json({
      markets: enhancedMarkets,
      farmDetails: {
        location: {
          lat: farm.location_lat,
          lng: farm.location_lng
        },
        productCategories: farmCategories
      }
    });
  } catch (error) {
    req.log.error('Failed to fetch market recommendations', {
      error: error.message,
      stack: error.stack,
      userId: req.user.id,
      farmId: req.params.farmId,
      searchRadius: req.query.radius
    });
    res.status(500).json({ error: 'Failed to fetch market recommendations' });
  }
};

// Get market analytics
exports.getMarketAnalytics = async (req, res) => {
  try {
    const { marketId } = req.params;
    const { startDate, endDate } = req.query;

    req.log.info('Fetching market analytics', {
      userId: req.user.id,
      marketId,
      dateRange: {
        start: startDate,
        end: endDate
      }
    });

    const market = await Market.findOne({
      where: {
        id: marketId,
        is_active: true
      }
    });

    if (!market) {
      req.log.warn('Market not found for analytics', {
        userId: req.user.id,
        marketId
      });
      return res.status(404).json({ error: 'Market not found' });
    }

    req.log.debug('Found market, retrieving sales data', {
      userId: req.user.id,
      marketId,
      marketName: market.name,
      dateRange: {
        start: startDate,
        end: endDate
      }
    });

    // Get sales data for the market
    const orders = await Order.findAll({
      where: {
        market_id: marketId,
        status: 'delivered',
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: Product,
          include: [
            {
              model: Crop,
              attributes: ['category']
            }
          ]
        }
      ]
    });

    req.log.debug('Retrieved order data for analytics', {
      userId: req.user.id,
      marketId,
      orderCount: orders.length,
      dateRange: {
        start: startDate,
        end: endDate
      }
    });

    // Calculate analytics
    const analytics = {
      totalSales: orders.reduce((sum, order) => sum + order.total_price, 0),
      totalOrders: orders.length,
      averageOrderValue: orders.length > 0 ?
        orders.reduce((sum, order) => sum + order.total_price, 0) / orders.length : 0,
      productCategories: {},
      topSellingProducts: [],
      busyDays: {}
    };

    // Process orders for detailed analytics
    orders.forEach(order => {
      // Category analysis
      const category = order.Product.Crop.category;
      if (!analytics.productCategories[category]) {
        analytics.productCategories[category] = {
          totalSales: 0,
          orderCount: 0
        };
      }
      analytics.productCategories[category].totalSales += order.total_price;
      analytics.productCategories[category].orderCount += 1;

      // Day of week analysis
      const dayOfWeek = new Date(order.created_at).toLocaleLowerCase('en-US', { weekday: 'long' });
      analytics.busyDays[dayOfWeek] = (analytics.busyDays[dayOfWeek] || 0) + 1;
    });

    // Get top selling products
    const productSales = {};
    orders.forEach(order => {
      const productId = order.Product.id;
      if (!productSales[productId]) {
        productSales[productId] = {
          id: productId,
          name: order.Product.title,
          totalSales: 0,
          quantity: 0
        };
      }
      productSales[productId].totalSales += order.total_price;
      productSales[productId].quantity += order.quantity;
    });

    analytics.topSellingProducts = Object.values(productSales)
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 10);

    req.log.info('Successfully generated market analytics', {
      userId: req.user.id,
      marketId,
      marketName: market.name,
      analytics: {
        totalSales: analytics.totalSales,
        totalOrders: analytics.totalOrders,
        categoryCount: Object.keys(analytics.productCategories).length,
        topProducts: analytics.topSellingProducts.length,
        dateRange: {
          start: startDate,
          end: endDate
        }
      }
    });

    res.status(200).json({
      market: {
        id: market.id,
        name: market.name,
        location: {
          lat: market.location_lat,
          lng: market.location_lng
        }
      },
      analytics
    });
  } catch (error) {
    console.error('Error in getMarketAnalytics:', error);
    res.status(500).json({ error: 'Failed to fetch market analytics' });
  }
};

// Public: find nearby markets by lat/lon query or return active markets when no coords provided
exports.findNearbyMarkets = async (req, res) => {
  try {
    const { lat, lon, radius } = req.query;
    if (lat && lon) {
      const loc = { latitude: Number(lat), longitude: Number(lon) };
      const r = radius ? Number(radius) : undefined;
      const markets = await marketService.findNearbyMarkets(loc, r);
      return res.status(200).json({ markets });
    }

    // Fallback: return active markets (lightweight list)
    const markets = await Market.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'description', 'address', 'location_lat', 'location_lng', 'specialties']
    });
    return res.status(200).json({ markets });
  } catch (error) {
    console.error('Error in findNearbyMarkets:', error);
    res.status(500).json({ error: 'Failed to find nearby markets' });
  }
};

// Public: get products for a market
exports.getMarketProducts = async (req, res) => {
  try {
    const marketId = req.params.marketId;
    const products = await marketService.getMarketProducts(marketId, req.query || {});
    res.status(200).json({ products });
  } catch (error) {
    console.error('Error in getMarketProducts:', error);
    res.status(500).json({ error: 'Failed to fetch market products' });
  }
};

// Protected: add product to a market (market operators or farmers can call this)
exports.addProduct = async (req, res) => {
  try {
    // Role check: only farmers, market operators or admins can add products
    if (!req.user || !['farmer', 'market_operator', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions to add products' });
    }

    // Basic validation: require name and price
    const name = req.body.name || req.body.title || req.body.product_name;
    const price = req.body.currentPrice || req.body.price || req.body.price_per_unit;
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Missing required fields: name and price' });
    }

    const marketId = req.params.marketId;

    const productData = {
      marketId,
      name: String(name),
      category: req.body.category || 'general',
      unit: req.body.unit || 'kg',
      currentPrice: Number(price),
      availability: req.body.availability || 'in-stock',
      qualityGrade: req.body.qualityGrade || null,
      description: req.body.description || req.body.desc || null,
      seasonality: req.body.seasonality || {},
      images: req.body.images || [],
      lastSyncedAt: new Date()
    };

    const product = await marketService.addProduct(productData);
    res.status(201).json({ product });
  } catch (error) {
    console.error('Error in addProduct:', error);
    res.status(500).json({ error: 'Failed to add product to market' });
  }
};

// Protected: update market product price
exports.updateProductPrice = async (req, res) => {
  try {
    // Role check: allow market operators, admins, or the farmer who owns the product
    if (!req.user || !['market_operator', 'admin', 'farmer'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions to update product price' });
    }

    const productId = req.params.productId;
    const price = req.body.price || req.body.currentPrice;
    if (price === undefined) return res.status(400).json({ error: 'Price is required' });

    const updated = await marketService.updateProductPrice(productId, {
      price: Number(price),
      source: req.body.source,
      reporterId: req.user?.id,
      notes: req.body.notes
    });

    res.status(200).json({ product: updated });
  } catch (error) {
    console.error('Error in updateProductPrice:', error);
    res.status(500).json({ error: 'Failed to update product price' });
  }
};

// Public: get price history for a market product
exports.getPriceHistory = async (req, res) => {
  try {
    const productId = req.params.productId;
    const { startDate, endDate } = req.query;
    const history = await marketService.getPriceHistory(productId, startDate, endDate);
    res.status(200).json({ history });
  } catch (error) {
    console.error('Error in getPriceHistory:', error);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
};

// Protected: sync offline changes (batch)
exports.syncOfflineChanges = async (req, res) => {
  try {
    const changes = req.body.changes || [];
    const result = await marketService.syncOfflineChanges(changes);
    res.status(200).json({ ok: result });
  } catch (error) {
    console.error('Error in syncOfflineChanges:', error);
    res.status(500).json({ error: 'Failed to sync offline changes' });
  }
};
