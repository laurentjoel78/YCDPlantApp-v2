const { Order, Product, User } = require('../models');
const { validationResult } = require('express-validator');
const { sendNotification } = require('../utils/notificationHelper');
const logger = require('../config/logger');
const auditService = require('../services/auditService');
const socketService = require('../services/socketService');

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const logger = req.log || console;
    logger.info('Creating new order', {
      userId: req.user.id,
      productId: req.body.product_id,
      quantity: req.body.quantity
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findOne({
      where: {
        id: req.body.product_id,
        status: 'active',
        is_active: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found or unavailable' });
    }

    if (req.user.id === product.farmer_id) {
      return res.status(400).json({ error: 'You cannot order your own product' });
    }

    if (req.body.quantity > product.quantity) {
      return res.status(400).json({ error: 'Requested quantity not available' });
    }

    const orderData = {
      buyer_id: req.user.id,
      product_id: product.id,
      farmer_id: product.farmer_id,
      quantity: req.body.quantity,
      total_price: product.price_per_unit * req.body.quantity,
      currency: product.currency,
      status: 'pending',
      delivery_address: req.body.delivery_address,
      delivery_date: req.body.delivery_date,
      payment_method: req.body.payment_method,
      notes: req.body.notes
    };

    const order = await Order.create(orderData);

    await auditService.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      actionType: 'ORDER_CREATE',
      actionDescription: `Created order for ${product.title}`,
      req,
      tableName: 'orders',
      recordId: order.id,
      metadata: {
        productId: product.id,
        quantity: req.body.quantity,
        totalPrice: order.total_price
      }
    });

    await sendNotification({
      user_id: product.farmer_id,
      type: 'new_order',
      title: 'New Order Received',
      message: `You have received a new order for ${product.title}`,
      data: { order_id: order.id }
    });

    const orderWithDetails = await Order.findOne({
      where: { id: order.id },
      include: [
        { model: Product, attributes: ['title', 'description', 'unit', 'price_per_unit'] },
        { model: User, as: 'buyer', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'farmer', attributes: ['id', 'first_name', 'last_name'] }
      ]
    });

    // Emit real-time event
    socketService.emitToAll('ORDER_CREATE', { order: orderWithDetails });
    socketService.emitToUser(product.farmer_id, 'NEW_ORDER', { order: orderWithDetails });

    res.status(201).json({ order: orderWithDetails });
  } catch (error) {
    logger.error('Error in createOrder:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

// Get user's orders (as buyer)
exports.getBuyerOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { buyer_id: req.user.id, is_active: true },
      include: [
        { model: Product, attributes: ['title', 'description', 'unit', 'price_per_unit'] },
        { model: User, as: 'farmer', attributes: ['id', 'first_name', 'last_name'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({ orders });
  } catch (error) {
    logger.error('Error in getBuyerOrders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Get farmer's received orders
exports.getFarmerOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { farmer_id: req.user.id, is_active: true },
      include: [
        { model: Product, attributes: ['title', 'description', 'unit', 'price_per_unit'] },
        { model: User, as: 'buyer', attributes: ['id', 'first_name', 'last_name'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({ orders });
  } catch (error) {
    logger.error('Error in getFarmerOrders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Update order status (farmer only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const order = await Order.findOne({
      where: { id: req.params.orderId, farmer_id: req.user.id, is_active: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const validStatuses = ['accepted', 'rejected', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(req.body.status)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    const oldStatus = order.status;

    await order.update({
      status: req.body.status,
      rejection_reason: req.body.status === 'rejected' ? req.body.rejection_reason : null
    });

    await auditService.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      actionType: 'ORDER_STATUS_UPDATE',
      actionDescription: `Updated order status from ${oldStatus} to ${req.body.status}`,
      req,
      tableName: 'orders',
      recordId: order.id,
      oldValues: { status: oldStatus },
      newValues: { status: req.body.status }
    });

    // Emit real-time event
    socketService.emitToAll('ORDER_UPDATE', { orderId: order.id, status: req.body.status });
    socketService.emitToUser(order.buyer_id, 'ORDER_STATUS_CHANGED', { orderId: order.id, status: req.body.status });

    res.status(200).json({ order });
  } catch (error) {
    logger.error('Error in updateOrderStatus:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

// Cancel order (buyer only)
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.orderId, buyer_id: req.user.id, is_active: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!['pending', 'accepted'].includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be cancelled at this stage' });
    }

    await order.update({ status: 'cancelled' });

    await auditService.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      actionType: 'ORDER_CANCEL',
      actionDescription: `Cancelled order ${order.id}`,
      req,
      tableName: 'orders',
      recordId: order.id
    });

    // Emit real-time event
    socketService.emitToAll('ORDER_UPDATE', { orderId: order.id, status: 'cancelled' });
    socketService.emitToUser(order.farmer_id, 'ORDER_CANCELLED', { orderId: order.id });

    res.status(200).json({ message: 'Order cancelled successfully' });
  } catch (error) {
    logger.error('Error in cancelOrder:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};

// Get order details
exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.orderId, is_active: true },
      include: [
        { model: Product, attributes: ['title', 'description', 'unit', 'price_per_unit'] },
        { model: User, as: 'buyer', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'farmer', attributes: ['id', 'first_name', 'last_name'] }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.buyer_id !== req.user.id && order.farmer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.status(200).json({ order });
  } catch (error) {
    logger.error('Error in getOrderDetails:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
};