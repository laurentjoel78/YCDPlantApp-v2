const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimiter');

// Apply rate limiting to prevent abuse
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30 // limit each IP to 30 payment requests per windowMs
});

// Payment endpoints
router.post('/initiate',
  authenticate(),
  paymentLimiter,
  paymentController.initiatePayment
);

// Escrow endpoints
router.post('/escrow',
  authenticate(),
  paymentLimiter,
  paymentController.createEscrow
);

router.post('/escrow/:escrowId/release',
  authenticate(),
  paymentController.releaseEscrow
);

// Payment provider callbacks
router.post('/callback/mtn',
  paymentController.handleMTNCallback
);

router.post('/callback/orange',
  paymentController.handleOrangeCallback
);

// Transaction retrieval
router.get('/transaction/:id',
  authenticate(),
  paymentController.getTransaction
);

module.exports = router;