const crypto = require('crypto');
const { User } = require('../models');
const { Op } = require('sequelize');
const emailService = require('../services/emailService');

// Generate a random token
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send verification email
const sendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.email_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    const verificationToken = generateToken();
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await user.update({
      email_verification_token: verificationToken,
      email_verification_expires: tokenExpires
    });

    await emailService.sendVerificationEmail(user, verificationToken);

    res.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({ error: 'Error sending verification email' });
  }
};

// Verify email with token
// Development only - get verification token
const getVerificationToken = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Not available in production' });
    }

    const { email } = req.body;
    const user = await User.findOne({
      where: { email },
      attributes: ['email_verification_token']
    });

    if (!user || !user.email_verification_token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    res.json({ token: user.email_verification_token });
  } catch (error) {
    console.error('Error getting verification token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Verify email with token
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      where: {
        email_verification_token: token,
        email_verification_expires: { [Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    await user.update({
      email_verified: true,
      email_verification_token: null,
      email_verification_expires: null
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ error: 'Error verifying email' });
  }
};

module.exports = {
  sendVerificationEmail,
  verifyEmail,
  getVerificationToken
};