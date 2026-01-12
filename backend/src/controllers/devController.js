const { User } = require('../models');
const logger = require('../config/logger');

// For development testing only - DO NOT USE IN PRODUCTION
const getVerificationToken = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Not available in production' });
    }
    const { email } = req.body;

    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Not available in production' });
    }

    const user = await User.findOne({
      where: { email },
      attributes: ['email_verification_token']
    });

    if (!user || !user.email_verification_token) {
      return res.status(404).json({ error: 'Token not found' });
    }

    res.json({ token: user.email_verification_token });
  } catch (error) {
    logger.error('Error getting verification token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getVerificationToken
};