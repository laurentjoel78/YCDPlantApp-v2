const express = require('express');
const router = express.Router();
const performanceMonitor = require('../services/performanceMonitor');
const { protect, restrictTo } = require('../middleware/auth');
const loggingService = require('../services/loggingService');

// Protect all performance routes
router.use(protect);
router.use(restrictTo('admin'));

// Get current metrics
router.get('/metrics', async (req, res) => {
    const metrics = performanceMonitor.getMetrics();
    res.json({
        status: 'success',
        data: metrics
    });
});

// Get current thresholds
router.get('/thresholds', (req, res) => {
    res.json({
        status: 'success',
        data: performanceMonitor.thresholds
    });
});

// Update thresholds
router.patch('/thresholds', async (req, res) => {
    const newThresholds = req.body;
    
    // Log threshold changes
    await loggingService.logAudit({
        userId: req.user.id,
        actionType: 'update_performance_thresholds',
        oldValues: performanceMonitor.thresholds,
        newValues: newThresholds,
        severity: 'medium'
    });

    performanceMonitor.setThresholds(newThresholds);
    
    res.json({
        status: 'success',
        data: performanceMonitor.thresholds
    });
});

// Get alerts history
router.get('/alerts', (req, res) => {
    const metrics = performanceMonitor.getMetrics();
    res.json({
        status: 'success',
        data: metrics.alerts
    });
});

module.exports = router;