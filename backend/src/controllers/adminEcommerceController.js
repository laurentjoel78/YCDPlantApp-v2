const { ActivityLog } = require('../models');
const { Op } = require('sequelize');

/**
 * Admin endpoint to get all e-commerce transaction activity
 * Tracks: Cart operations, Orders, Payments, Expert bookings, Ratings
 */
exports.getEcommerceActivity = async (req, res) => {
    try {
        const { type, startDate, endDate, limit = 100 } = req.query;

        const where = {
            activity_type: {
                [Op.in]: ['CART_ITEM_ADDED', 'CART_ITEM_REMOVED', 'CART_UPDATED',
                    'ORDER_CREATED', 'ORDER_STATUS_CHANGED', 'PAYMENT_COMPLETED',
                    'PAYMENT_FAILED', 'EXPERT_BOOKING_CREATED', 'CONSULTATION_RATED']
            }
        };

        if (type) {
            where.activity_type = type;
        }

        if (startDate || endDate) {
            where.created_at = {};
            if (startDate) where.created_at[Op.gte] = new Date(startDate);
            if (endDate) where.created_at[Op.lte] = new Date(endDate);
        }

        const activities = await ActivityLog.findAll({
            where,
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            include: [{
                model: sequelize.models.User,
                as: 'user',
                attributes: ['id', 'first_name', 'last_name', 'email']
            }]
        });

        res.json({
            success: true,
            data: { activities }
        });
    } catch (error) {
        console.error('Get e-commerce activity error:', error);
        res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
};

/**
 * Get e-commerce metrics for admin dashboard
 */
exports.getEcommerceMetrics = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { Order, Cart, Transaction } = sequelize.models;

        // Today's metrics
        const [
            ordersToday,
            cartsToday,
            revenueToday,
            pendingOrders,
            failedPayments
        ] = await Promise.all([
            Order.count({
                where: {
                    created_at: { [Op.gte]: today }
                }
            }),
            Cart.count({
                where: {
                    created_at: { [Op.gte]: today }
                }
            }),
            Order.sum('total_amount', {
                where: {
                    payment_status: 'paid',
                    created_at: { [Op.gte]: today }
                }
            }),
            Order.count({
                where: {
                    status: 'pending'
                }
            }),
            Transaction.count({
                where: {
                    status: 'failed',
                    created_at: { [Op.gte]: today }
                }
            })
        ]);

        res.json({
            success: true,
            data: {
                metrics: {
                    ordersToday: ordersToday || 0,
                    cartsToday: cartsToday || 0,
                    revenueToday: revenueToday || 0,
                    pendingOrders: pendingOrders || 0,
                    failedPayments: failedPayments || 0
                }
            }
        });
    } catch (error) {
        console.error('Get e-commerce metrics error:', error);
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
};
