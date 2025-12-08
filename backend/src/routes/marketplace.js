const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  validateCreateProduct,
  validateUpdateProduct,
  validateCreateOrder,
  validateUpdateOrderStatus,
  validateCancelOrder
} = require('../middleware/marketplaceValidation');

const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const marketController = require('../controllers/marketController');
const transactionController = require('../controllers/transactionController');

// Market routes
router.get('/farms/:farmId/nearby-markets',
  auth,
  marketController.getNearbyMarkets
);

router.get('/farms/:farmId/market-recommendations',
  auth,
  marketController.getMarketRecommendations
);

router.get('/markets/:marketId',
  auth,
  marketController.getMarketDetails
);

router.get('/markets/:marketId/analytics',
  auth,
  marketController.getMarketAnalytics
);

// Transaction routes
router.post('/transactions/initiate',
  auth,
  validatePaymentInitiation,
  transactionController.initiatePayment
);

router.post('/transactions/confirm',
  auth,
  validatePaymentConfirmation,
  transactionController.confirmPayment
);

router.post('/transactions/:transactionId/settlement',
  auth,
  transactionController.processSettlement
);

router.get('/transactions/:transactionId',
  auth,
  transactionController.getTransactionDetails
);

router.post('/transactions/:transactionId/refund',
  auth,
  validateRefundRequest,
  transactionController.requestRefund
);

// Product routes
router.post('/products',
  auth,
  validateCreateProduct,
  productController.createProduct
);

router.get('/products',
  auth,
  productController.getProducts
);

router.get('/farmer/products',
  auth,
  productController.getFarmerProducts
);

router.get('/products/:productId',
  auth,
  productController.getProductById
);

router.put('/products/:productId',
  auth,
  validateUpdateProduct,
  productController.updateProduct
);

router.delete('/products/:productId',
  auth,
  productController.deleteProduct
);

// Order routes
router.post('/orders',
  auth,
  validateCreateOrder,
  orderController.createOrder
);

router.get('/buyer/orders',
  auth,
  orderController.getBuyerOrders
);

router.get('/farmer/orders',
  auth,
  orderController.getFarmerOrders
);

router.get('/orders/:orderId',
  auth,
  orderController.getOrderById
);

router.put('/orders/:orderId/status',
  auth,
  validateUpdateOrderStatus,
  orderController.updateOrderStatus
);

router.put('/orders/:orderId/cancel',
  auth,
  validateCancelOrder,
  orderController.cancelOrder
);

module.exports = router;