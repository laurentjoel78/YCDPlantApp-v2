const express = require('express');
const router = express.Router();
const textToSpeechController = require('../controllers/textToSpeechController');
const { authenticate } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// Generate speech from text
router.post('/synthesize',
  authenticate(),
  apiLimiter,
  textToSpeechController.synthesize
);

// Clean audio cache (admin only)
router.post('/clean-cache',
  authenticate(['admin']),
  textToSpeechController.cleanCache
);

module.exports = router;