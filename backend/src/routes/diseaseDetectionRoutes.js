const express = require('express');
const router = express.Router();
const diseaseDetectionController = require('../controllers/diseaseDetectionController');
const { auth } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// Submit image for disease detection
router.post('/detect',
  auth,
  apiLimiter,
  diseaseDetectionController.detectDisease
);

module.exports = router;