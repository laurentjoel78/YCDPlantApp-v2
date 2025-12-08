const express = require('express');
const router = express.Router();
const textToSpeechController = require('../controllers/textToSpeechController');
const { authenticate } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimiter');

// Apply rate limiting to prevent abuse
const ttsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Generate speech from text
router.post('/synthesize',
  authenticate(),
  ttsLimiter,
  textToSpeechController.synthesize
);

// Clean audio cache (admin only)
router.post('/clean-cache',
  authenticate(['admin']),
  textToSpeechController.cleanCache
);

module.exports = router;