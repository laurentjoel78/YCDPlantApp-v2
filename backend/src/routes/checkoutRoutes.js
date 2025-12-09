const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

/**
 * @route   POST /api/checkout
 * @desc    Convert cart to order and initiate payment
 * @access  Private
 */
router.post('/', checkoutController.checkout);

/**
 * @route   POST /api/checkout/verify-payment
 * @desc    Verify payment and complete order
 * @access  Private
 */
router.post('/verify-payment', checkoutController.verifyPayment);

/**
 * @route   GET /api/orders
 * @desc    Get user's orders
 * @access  Private
 */
router.get('/', checkoutController.getOrders);

/**
 * @route   GET /api/orders/:orderId
 * @desc    Get single order details
 * @access  Private
 */
router.get('/:orderId', checkoutController.getOrderDetails);

module.exports = router;
