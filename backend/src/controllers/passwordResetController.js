const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const emailService = require('../services/emailService');
const { Op } = require('sequelize');

// Generate a random token
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Check if mock email is enabled
const isMockEmailEnabled = () => {
  return process.env.USE_MOCK_EMAIL === 'true';
};

// Request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // For security, don't reveal if email exists (unless mock mode for testing)
      if (isMockEmailEnabled()) {
        return res.json({ 
          message: 'If your email is registered, you will receive a password reset link',
          mockMode: true,
          userNotFound: true
        });
      }
      return res.json({ message: 'If your email is registered, you will receive a password reset link' });
    }

    const resetToken = generateToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await user.update({
      password_reset_token: resetToken,
      password_reset_expires: resetExpires
    });

    await emailService.sendPasswordResetEmail(user, resetToken);

    // In mock email mode, return the token so the user can reset without real email
    if (isMockEmailEnabled()) {
      return res.json({ 
        message: 'Password reset token generated. In mock mode, use this token to reset your password.',
        mockMode: true,
        resetToken: resetToken,
        expiresIn: '1 hour'
      });
    }

    res.json({ message: 'If your email is registered, you will receive a password reset link' });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({ error: 'Error requesting password reset' });
  }
};

// Reset password with token
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      where: {
        password_reset_token: token,
        password_reset_expires: { [Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const password_hash = await bcrypt.hash(password, 12);

    await user.update({
      password_hash,
      password_reset_token: null,
      password_reset_expires: null
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Error resetting password' });
  }
};

module.exports = {
  requestPasswordReset,
  resetPassword
};