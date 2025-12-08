const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, requireAdmin } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(auth, requireAdmin);

// Expert Management
router.post('/experts', adminController.createExpert);
router.get('/experts/applications', adminController.getExpertApplications);
router.put('/experts/:expertId/review', adminController.reviewExpertApplication);

// User Management (Block/Delete)
router.put('/users/:userId/block', adminController.blockUser);
router.put('/users/:userId/unblock', adminController.unblockUser);
router.delete('/users/:userId', adminController.deleteUser);

// Activity Monitoring
router.get('/activities/recent', adminController.getAllRecentActivities);
router.get('/activities/stats', adminController.getActivityStats);
router.get('/users/:userId/activities', adminController.getUserActivityLogs);

module.exports = router;
