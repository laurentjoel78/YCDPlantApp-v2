const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const marketController = require('../controllers/marketController');

// Public routes
router.get('/nearby', marketController.findNearbyMarkets);
router.get('/:marketId/products', marketController.getMarketProducts);
router.get('/products/:productId/price-history', marketController.getPriceHistory);

// Protected routes
router.post('/', auth, marketController.createMarket);
router.post('/:marketId/products', auth, marketController.addProduct);
router.post('/products/:productId/price', auth, marketController.updateProductPrice);
router.post('/sync', auth, marketController.syncOfflineChanges);

module.exports = router;