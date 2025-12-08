const express = require('express');
const router = express.Router();
const expertController = require('../controllers/expertController');
const { auth } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roles');
const upload = require('../middleware/uploadMiddleware');

// Base path: /api/experts

// Public route - Get all approved experts
router.get('/', expertController.getAllExperts);

// Admin routes
router.post('/',
  auth,
  isAdmin,
  upload.fields([
    { name: 'certifications', maxCount: 5 },
    { name: 'profileImage', maxCount: 1 }
  ]),
  expertController.createExpert
);

router.put('/:expertId/approve',
  auth,
  isAdmin,
  expertController.approveExpert
);

router.put('/:expertId',
  auth,
  isAdmin,
  upload.fields([
    { name: 'certifications', maxCount: 5 },
    { name: 'profileImage', maxCount: 1 }
  ]),
  expertController.updateExpertProfile
);

// Public routes (requires authentication)
router.get('/search', auth, expertController.searchExperts);
router.get('/:expertId', auth, expertController.getExpertProfile);
router.get('/:expertId/reviews', auth, expertController.getExpertReviews);
router.get('/:expertId/stats', auth, expertController.getExpertStats);
router.post('/:expertId/rate', auth, expertController.rateExpert);

module.exports = router;