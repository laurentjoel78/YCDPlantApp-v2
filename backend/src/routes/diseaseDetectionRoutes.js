const express = require('express');
const router = express.Router();
const diseaseDetectionController = require('../controllers/diseaseDetectionController');
const { auth } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimiter');

// Apply rate limiting to prevent abuse
const detectionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50 // limit each IP to 50 requests per windowMs
});

// Submit image for disease detection
router.post('/detect',
  auth,
  detectionLimiter,
  diseaseDetectionController.detectDisease
);

module.exports = router;