const logger = require('../config/logger');
const db = require('../models');
const sequelize = db.sequelize;
const { Op } = require('sequelize');
const { getIO } = require('../services/socketService');
const { validateUUIDParam } = require('../utils/validators');

/**
 * Get or create user's active cart
 */
exports.getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { Cart, CartItem, Product } = sequelize.models;

        let cart = await Cart.findOne({
            where: {
                user_id: userId,
                status: 'active'
            },
            include: [{
                model: CartItem,
                as: 'items',
                include: [{
                    model: Product,
                    as: 'product',
                    attributes: ['id', 'name', 'price', 'images', 'quantity', 'unit', 'status']
                }]
            }]
        });

        // Create cart if doesn't exist
        if (!cart) {
            cart = await Cart.create({ user_id: userId });
            cart.items = [];
        }

        // Calculate totals
        const totals = await cart.calculateTotal();

        res.json({
            success: true,
            data: {
                cart,
                ...totals
            }
        });
    } catch (error) {
        logger.error('Get cart error:', error);
        res.status(500).json({ error: 'Failed to retrieve cart' });
    }
};

/**
 * Add item to cart
 */
exports.addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { product_id, quantity = 1 } = req.body;
        const { Cart, CartItem, Product } = db;

        // Validate product
        const product = await Product.findByPk(product_id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check if product has status field and it's not active
        if (product.status && product.status !== 'active') {
            return res.status(400).json({ error: 'Product is not available' });
        }

        // Check stock if quantity field exists
        if (product.stock_quantity !== undefined && product.stock_quantity !== null && product.stock_quantity < quantity) {
            return res.status(400).json({
                error: 'Insufficient stock',
                available: product.stock_quantity
            });
        }

        // Get or create cart
        let cart = await Cart.findOne({
            where: { user_id: userId, status: 'active' }
        });

        if (!cart) {
            cart = await Cart.create({ user_id: userId });
        }

        // Check if item already in cart
        let cartItem = await CartItem.findOne({
            where: {
                cart_id: cart.id,
                product_id
            }
        });

        if (cartItem) {
            // Update quantity
            const newQuantity = cartItem.quantity + quantity;

            if (product.stock_quantity < newQuantity) {
                return res.status(400).json({
                    error: 'Insufficient stock for requested quantity',
                    available: product.stock_quantity,
                    currentInCart: cartItem.quantity
                });
            }

            await cartItem.update({ quantity: newQuantity });
        } else {
            // Add new item (lock current price)
            cartItem = await CartItem.create({
                cart_id: cart.id,
                product_id,
                quantity,
                price_at_add: product.price
            });
        }

        // Reload cart with items
        cart = await Cart.findByPk(cart.id, {
            include: [{
                model: CartItem,
                as: 'items',
                include: [{
                    model: Product,
                    as: 'product'
                }]
            }]
        });

        const totals = await cart.calculateTotal();

        res.json({
            success: true,
            message: 'Item added to cart',
            data: {
                cart,
                ...totals
            }
        });

        // Emit Socket.IO event for real-time updates
        const io = getIO();
        if (io) {
            io.to(`user_${userId}`).emit('CART_UPDATED', {
                cart,
                totals
            });
        }
    } catch (error) {
        logger.error('Add to cart error:', error);
        res.status(500).json({ error: 'Failed to add item to cart' });
    }
};

/**
 * Update cart item quantity
 */
exports.updateCartItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.params;
        const { quantity } = req.body;
        const { Cart, CartItem, Product } = sequelize.models;

        if (quantity < 1) {
            return res.status(400).json({ error: 'Quantity must be at least 1' });
        }

        // Find cart item
        const cartItem = await CartItem.findOne({
            where: { id: itemId },
            include: [{
                model: Cart,
                as: 'cart',
                where: { user_id: userId, status: 'active' }
            }, {
                model: Product,
                as: 'product'
            }]
        });

        if (!cartItem) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        // Check stock
        if (cartItem.product.stock_quantity < quantity) {
            return res.status(400).json({
                error: 'Insufficient stock',
                available: cartItem.product.stock_quantity
            });
        }

        await cartItem.update({ quantity });

        // Reload cart
        const cart = await Cart.findByPk(cartItem.cart.id, {
            include: [{
                model: CartItem,
                as: 'items',
                include: [{
                    model: Product,
                    as: 'product'
                }]
            }]
        });

        const totals = await cart.calculateTotal();

        res.json({
            success: true,
            message: 'Cart updated',
            data: {
                cart,
                ...totals
            }
        });
    } catch (error) {
        logger.error('Update cart item error:', error);
        res.status(500).json({ error: 'Failed to update cart item' });
    }
};

/**
 * Remove item from cart
 */
exports.removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.params;
        
        // Validate itemId
        const validation = validateUUIDParam(itemId, 'Item ID');
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }
        
        const { Cart, CartItem, Product } = sequelize.models;

        const cartItem = await CartItem.findOne({
            where: { id: itemId },
            include: [{
                model: Cart,
                as: 'cart',
                where: { user_id: userId, status: 'active' }
            }]
        });

        if (!cartItem) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        const cartId = cartItem.cart.id;
        await cartItem.destroy();

        // Reload cart
        const cart = await Cart.findByPk(cartId, {
            include: [{
                model: CartItem,
                as: 'items',
                include: [{
                    model: Product,
                    as: 'product'
                }]
            }]
        });

        const totals = await cart.calculateTotal();

        res.json({
            success: true,
            message: 'Item removed from cart',
            data: {
                cart,
                ...totals
            }
        });
    } catch (error) {
        logger.error('Remove from cart error:', error);
        res.status(500).json({ error: 'Failed to remove item from cart' });
    }
};

/**
 * Clear entire cart
 */
exports.clearCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { Cart, CartItem } = sequelize.models;

        const cart = await Cart.findOne({
            where: { user_id: userId, status: 'active' }
        });

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        await CartItem.destroy({
            where: { cart_id: cart.id }
        });

        res.json({
            success: true,
            message: 'Cart cleared',
            data: {
                cart,
                subtotal: 0,
                deliveryFee: 0,
                total: 0,
                itemCount: 0,
                totalQuantity: 0
            }
        });
    } catch (error) {
        logger.error('Clear cart error:', error);
        res.status(500).json({ error: 'Failed to clear cart' });
    }
};
