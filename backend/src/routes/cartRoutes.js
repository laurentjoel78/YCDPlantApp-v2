const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { auth } = require('../middleware/auth');

// All cart routes require authentication
router.use(auth);

/**
 * @route   GET /api/cart
 * @desc    Get user's active cart
 * @access  Private
 */
router.get('/', cartController.getCart);

/**
 * @route   POST /api/cart/items
 * @desc    Add item to cart
 * @access  Private
 */
router.post('/items', cartController.addToCart);

/**
 * @route   PUT /api/cart/items/:itemId
 * @desc    Update cart item quantity
 * @access  Private
 */
router.put('/items/:itemId', cartController.updateCartItem);

/**
 * @route   DELETE /api/cart/items/:itemId
 * @desc    Remove item from cart
 * @access  Private
 */
router.delete('/items/:itemId', cartController.removeFromCart);

/**
 * @route   DELETE /api/cart
 * @desc    Clear entire cart
 * @access  Private
 */
router.delete('/', cartController.clearCart);

module.exports = router;
