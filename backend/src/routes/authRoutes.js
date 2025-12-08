const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { register, login, getCurrentUser, logout } = require('../controllers/authController');
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

// Public routes
router.post('/register', registrationValidation, register);
router.post('/login', loginValidation, login);
router.post('/logout', auth, logout);
router.put('/profile', auth, upload.single('profileImage'), async (req, res, next) => {
  // Delegate to controller method if available
  try {
    const { updateProfile } = require('../controllers/authController');
    return updateProfile(req, res, next);
  } catch (err) {
    console.error('Failed to handle /auth/profile route:', err);
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
      console.error('Error approving farmer:', error);
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
      console.error('Error updating password:', error);
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