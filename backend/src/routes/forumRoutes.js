const express = require('express');
const router = express.Router();
const { auth, optionalAuth } = require('../middleware/auth');
const forumController = require('../controllers/forumController');

// Public routes (with no-cache headers to prevent stale data)
router.get('/topics', optionalAuth, (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
}, forumController.searchTopics);

router.get('/topics/:id', optionalAuth, forumController.getTopic);

// Protected routes
router.get('/nearby', auth, forumController.getNearbyTopics);
router.post('/topics', auth, forumController.createTopic);
router.post('/topics/:id/posts', auth, forumController.createPost);
router.post('/report', auth, forumController.reportContent);
router.post('/sync', auth, forumController.syncOffline);

// Membership routes
router.post('/topics/:id/join', auth, forumController.joinForum);
router.post('/topics/:id/leave', auth, forumController.leaveForum);
router.get('/topics/:id/members', auth, forumController.getForumMembers);

// Chat message routes
router.get('/topics/:id/messages', auth, forumController.getMessages);
router.post('/topics/:id/messages', auth, forumController.sendMessage);
router.delete('/messages/:messageId', auth, forumController.deleteMessage);

// Moderator routes
router.post('/moderate/:id', auth, forumController.moderateContent);

module.exports = router;