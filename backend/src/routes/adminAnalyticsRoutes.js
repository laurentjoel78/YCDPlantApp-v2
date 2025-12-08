const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const adminAnalyticsController = require('../controllers/adminAnalyticsController');

// All routes require admin authentication
router.use(auth);

// Dashboard statistics
router.get('/dashboard/stats', adminAnalyticsController.getDashboardStats);

// Recent activities feed
router.get('/activities', adminAnalyticsController.getRecentActivities);

// User growth chart data
router.get('/users/growth', adminAnalyticsController.getUserGrowth);

// System health monitoring
router.get('/system/health', adminAnalyticsController.getSystemHealth);

module.exports = router;
