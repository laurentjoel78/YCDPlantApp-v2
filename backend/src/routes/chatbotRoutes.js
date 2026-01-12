const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { auth } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// Process chat messages (text or voice)
router.post('/message',
  auth,
  apiLimiter,
  chatbotController.processMessage
);

// Stream audio responses
router.get('/audio/:path',
  auth,
  chatbotController.streamAudio
);

module.exports = router;