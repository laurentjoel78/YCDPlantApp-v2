const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const { sensitiveLimiter } = require('../middleware/rateLimiter');

// Payment endpoints
router.post('/initiate',
  authenticate(),
  sensitiveLimiter,
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