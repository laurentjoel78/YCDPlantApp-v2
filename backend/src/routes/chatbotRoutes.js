const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { auth } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimiter');

// Apply rate limiting to prevent abuse
const chatbotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Process chat messages (text or voice)
router.post('/message',
  auth,
  chatbotLimiter,
  chatbotController.processMessage
);

// Stream audio responses
router.get('/audio/:path',
  auth,
  chatbotController.streamAudio
);

module.exports = router;