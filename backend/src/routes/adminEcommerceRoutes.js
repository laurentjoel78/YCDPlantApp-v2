const express = require('express');
const router = express.Router();
const adminEcommerceController = require('../controllers/adminEcommerceController');
const { auth, requireAdmin } = require('../middleware/auth');

// All routes require admin access
router.use(auth);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/ecommerce/activity
 * @desc    Get all e-commerce transaction activity logs
 * @access  Private/Admin
 */
router.get('/activity', adminEcommerceController.getEcommerceActivity);

/**
 * @route   GET /api/admin/ecommerce/metrics
 * @desc    Get e-commerce metrics (orders, revenue, etc.)
 * @access  Private/Admin
 */
router.get('/metrics', adminEcommerceController.getEcommerceMetrics);

module.exports = router;
