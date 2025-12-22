const paymentService = require('../services/paymentService');
const emailService = require('../services/emailService');
const db = require('../models');
const sequelize = db.sequelize;
const { getIO } = require('../services/socketService');

/**
 * Checkout - Convert cart to order and initiate payment
 */
exports.checkout = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const userId = req.user.id;
        const { deliveryAddress, paymentMethod, phoneNumber } = req.body;
        const { Cart, CartItem, Order, Product, OrderItem } = db;

        // Validate basic input
        if (!deliveryAddress || !deliveryAddress.address || !deliveryAddress.city || !deliveryAddress.region) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Complete delivery address required' });
        }

        if (!paymentMethod) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Payment method required' });
        }

        // Ensure Delivery Address is valid JSONB format
        const cleanDeliveryAddress = {
            address: deliveryAddress.address,
            city: deliveryAddress.city,
            region: deliveryAddress.region,
            postalCode: deliveryAddress.postalCode || '',
            country: 'Cameroon'
        };

        // Get active cart with items
        const cart = await Cart.findOne({
            where: { user_id: userId, status: 'active' },
            include: [{
                model: CartItem,
                as: 'items',
                include: [{
                    model: Product,
                    as: 'product'
                }]
            }],
            transaction
        });

        if (!cart || !cart.items || cart.items.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Validate stock and Check for Multiple Sellers
        const sellerIds = new Set();

        for (const item of cart.items) {
            // Product Availability Check
            if (item.product.status && item.product.status !== 'active') {
                await transaction.rollback();
                return res.status(400).json({
                    error: `Product "${item.product.name}" is no longer available`
                });
            }

            if (item.product.quantity !== undefined && item.product.quantity !== null && item.product.quantity < item.quantity) {
                await transaction.rollback();
                return res.status(400).json({
                    error: `Insufficient stock for "${item.product.name}"`,
                    available: item.product.quantity,
                    requested: item.quantity
                });
            }

            sellerIds.add(item.product.seller_id);
        }

        // Enforce Single Seller Rule
        if (sellerIds.size > 1) {
            await transaction.rollback();
            return res.status(400).json({
                error: 'Checkout failed: items from multiple sellers',
                details: 'Please purchase items from one seller at a time. Remove items from other sellers and try again.'
            });
        }

        const sellerId = [...sellerIds][0]; // safe because size > 0

        // Calculate totals
        const totals = await cart.calculateTotal();

        // Create order
        const order = await Order.create({
            buyer_id: userId,
            seller_id: sellerId,
            total_amount: totals.total,
            status: 'pending',
            payment_status: 'pending',
            payment_method: paymentMethod,
            shipping_address: cleanDeliveryAddress,
            // Initialize payment_reference to null or unique placeholder to avoid unique constraint violation if any
            // payment_reference: null,
            metadata: {
                subtotal: totals.subtotal,
                deliveryFee: totals.deliveryFee,
                itemCount: totals.itemCount
            }
        }, { transaction });

        // Create Order Items (Persistence!)
        const orderItemsData = cart.items.map(item => ({
            order_id: order.id,
            product_id: item.product.id,
            quantity: item.quantity,
            price_at_purchase: item.product.price
        }));

        await OrderItem.bulkCreate(orderItemsData, { transaction });

        // Initiate payment (if not cash on delivery)
        let paymentResult;
        if (paymentMethod !== 'cash_on_delivery') {
            try {
                paymentResult = await paymentService.initiatePayment({
                    senderId: userId,
                    receiverId: sellerId,
                    amount: totals.total,
                    paymentMethod,
                    description: `Order #${order.id.substring(0, 8)}`,
                    metadata: {
                        orderId: order.id,
                        phoneNumber: phoneNumber || req.user.phone_number
                    }
                });

                await order.update({
                    payment_reference: paymentResult.paymentReference || paymentResult.reference // Handle different provider responses (use snake_case in DB?)
                    // The model uses 'payment_reference'
                }, { transaction });

            } catch (paymentError) {
                await transaction.rollback();
                console.error('[Checkout] Payment initiation failed:', paymentError);
                return res.status(500).json({
                    error: 'Payment initiation failed',
                    details: paymentError.message
                });
            }
        } else {
            // Generate a placeholder ref for COD or leave null
            // payment_reference in model allows null? YES.
        }

        // Mark cart as checked out
        await cart.update({ status: 'checked_out' }, { transaction });

        // Commit transaction
        await transaction.commit();

        // Send confirmation email (async)
        emailService.sendOrderConfirmation(req.user, order, cart.items)
            .catch(err => console.error('Email send failed:', err));

        // Emit Socket.IO event
        const io = getIO();
        if (io) {
            io.to(`user_${userId}`).emit('ORDER_CREATED', {
                order: {
                    id: order.id,
                    total: totals.total,
                    status: order.status
                }
            });
        }

        // Return response
        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: {
                order: {
                    id: order.id,
                    total: totals.total,
                    status: order.status,
                    paymentStatus: order.payment_status,
                    paymentReference: order.payment_reference,
                    items: orderItemsData // Return items so frontend can see them immediately if needed
                },
                payment: paymentResult ? {
                    // paymentService.initiatePayment returns a Sequelize Transaction model instance
                    // The payment reference field is 'payment_reference' (snake_case)
                    reference: paymentResult.payment_reference || paymentResult.reference || paymentResult.paymentReference,
                    status: paymentResult.payment_status || paymentResult.status,
                    instructions: paymentResult.instructions || null
                } : {
                    method: 'cash_on_delivery',
                    note: 'Payment will be collected upon delivery'
                }
            }
        });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Checkout error:', error);

        // Handle Sequelize Validation Errors gracefully
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                error: 'Validation Error',
                details: error.errors.map(e => e.message).join(', ')
            });
        }

        res.status(500).json({
            error: 'Checkout failed',
            details: error.message
        });
    }
};

/**
 * Verify payment and complete order
 */
exports.verifyPayment = async (req, res) => {
    try {
        const { orderId, paymentReference } = req.body;
        const userId = req.user.id;
        const { Order, Transaction } = db;

        const order = await Order.findOne({
            where: { id: orderId, buyer_id: userId }
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.payment_status === 'paid') {
            return res.json({
                success: true,
                message: 'Payment already confirmed',
                data: { order }
            });
        }

        // Validate payment reference
        if (!paymentReference) {
            return res.status(400).json({
                error: 'Payment reference is required',
                success: false
            });
        }

        const paymentTx = await Transaction.findOne({
            where: { payment_reference: paymentReference }
        });

        if (!paymentTx) {
            return res.status(404).json({ error: 'Payment transaction not found' });
        }

        if (paymentTx.payment_status !== 'completed') {
            return res.json({
                success: false,
                message: 'Payment not yet completed',
                status: paymentTx.payment_status
            });
        }

        await order.update({
            payment_status: 'paid',
            paid_at: new Date()
        });

        res.json({
            success: true,
            message: 'Payment verified and order confirmed',
            data: { order }
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ error: 'Payment verification failed' });
    }
};

/**
 * Get user's orders
 */
exports.getOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;
        const { Order } = db;

        const where = { buyer_id: userId };
        if (status) {
            where.status = status;
        }

        const orders = await Order.findAll({
            where,
            include: [{
                model: db.OrderItem,
                as: 'items',
                include: [{
                    model: db.Product,
                    as: 'product',
                    attributes: ['id', 'name', 'images']
                }]
            }],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: { orders }
        });

    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

/**
 * Get single order details
 */
exports.getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;
        const { Order } = db;

        const order = await Order.findOne({
            where: {
                id: orderId,
                buyer_id: userId
            },
            include: [{
                model: db.OrderItem,
                as: 'items',
                include: [{
                    model: db.Product,
                    as: 'product'
                }]
            }]
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({
            success: true,
            data: { order }
        });

    } catch (error) {
        console.error('Get order details error:', error);
        res.status(500).json({ error: 'Failed to fetch order details' });
    }
};
