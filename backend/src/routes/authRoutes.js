const logger = require('../config/logger');
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { register, login, getCurrentUser, logout, socialLogin } = require('../controllers/authController');
const { sendVerificationEmail, verifyEmail, getVerificationToken } = require('../controllers/emailVerificationController');
const { User } = require('../models');
const { requestPasswordReset, resetPassword } = require('../controllers/passwordResetController');
const { auth } = require('../middleware/auth');
const {
  registrationValidation,
  loginValidation,
  emailVerificationValidation,
  passwordResetRequestValidation,
  passwordResetValidation
} = require('../middleware/authValidation');
const upload = require('../middleware/imageUpload');
const { authLimiter, sensitiveLimiter } = require('../middleware/rateLimiter');
const bruteForceProtection = require('../services/bruteForceProtection');
const multer = require('multer'); // Added this line

// Public routes with rate limiting and brute force protection
router.post('/register', authLimiter, registrationValidation, register);
router.post('/login', authLimiter, bruteForceProtection.checkBlocked(), loginValidation, login);
router.post('/social', authLimiter, socialLogin);
router.post('/logout', auth, logout);
router.put('/profile', auth, sensitiveLimiter, upload.single('profileImage'), async (req, res, next) => {
  // Delegate to controller method if available
  try {
    const { updateProfile } = require('../controllers/authController');
    return updateProfile(req, res, next);
  } catch (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        logger.warn('MulterError: File size limit exceeded during profile update.', { userId: req.user ? req.user.id : 'N/A' });
        return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
      }
      // Handle other Multer errors if necessary
      logger.error('MulterError during profile update:', err);
      return res.status(400).json({ error: `File upload failed: ${err.message}` });
    }
    logger.error('Failed to handle /auth/profile route:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Development routes
if (process.env.NODE_ENV !== 'production') {
  router.post('/get-verification-token', getVerificationToken);
  router.post('/approve-farmer', async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      await user.update({
        approval_status: 'approved',
        approved_at: new Date()
      });
      res.json({ message: 'Farmer account approved successfully' });
    } catch (error) {
      logger.error('Error approving farmer:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Development route to reset password
  router.post('/dev-reset-password', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      // Do NOT pre-hash here. The User model has a beforeSave hook which will hash
      // the `password_hash` property when it changes. Store the raw password so
      // the hook performs the hashing exactly once.
      await user.update({ password_hash: password });
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      logger.error('Error updating password:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}
router.post('/verify-email/send', emailVerificationValidation, sendVerificationEmail);
router.get('/verify-email/:token', emailVerificationValidation, verifyEmail);
router.post('/password-reset/request', passwordResetRequestValidation, requestPasswordReset);
router.post('/password-reset/:token', passwordResetValidation, resetPassword);

// Protected routes
router.get('/me', auth, getCurrentUser);

module.exports = router;