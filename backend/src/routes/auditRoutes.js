const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { auth } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roles');

// All audit routes require admin access
router.use(isAdmin);

// Get audit logs with filters
router.get('/logs', auditController.getAuditLogs);

// Get system metrics
router.get('/metrics', auditController.getSystemMetrics);

// Get specific user's activity
router.get('/user-activity/:userId', auditController.getUserActivity);

// Get dashboard statistics
router.get('/dashboard-stats', auditController.getDashboardStats);

module.exports = router;