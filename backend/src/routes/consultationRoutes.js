const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');
const { auth } = require('../middleware/auth');
const { isAdmin, isExpert } = require('../middleware/roles');
const upload = require('../middleware/uploadMiddleware');

// Base path: /api/consultations

// Farmer routes
router.post('/',
  auth,
  upload.array('images', 5),
  consultationController.createConsultation
);
router.post('/book-with-payment',
  auth,
  consultationController.bookConsultationWithPayment
);
router.post('/verify-payment',
  auth,
  consultationController.verifyPayment
);
router.post('/:consultationId/rate',
  auth,
  consultationController.rateConsultation
);
router.get('/farmer',
  auth,
  consultationController.getFarmerConsultations
);

// Expert routes
router.put('/:consultationId/accept',
  auth,
  isExpert,
  consultationController.acceptConsultation
);
router.put('/:consultationId/complete',
  auth,
  isExpert,
  consultationController.completeConsultation
);
router.get('/expert',
  auth,
  isExpert,
  consultationController.getExpertConsultations
);

// Admin routes
router.put('/:consultationId/approve',
  auth,
  isAdmin,
  consultationController.approveConsultation
);
router.get('/admin',
  auth,
  isAdmin,
  consultationController.getAdminConsultations
);

module.exports = router;