const express = require('express');
const router = express.Router();
const { getVerificationToken } = require('../controllers/devController');

// Development routes - DO NOT USE IN PRODUCTION
if (process.env.NODE_ENV !== 'production') {
  router.post('/get-verification-token', getVerificationToken);
}

module.exports = router;