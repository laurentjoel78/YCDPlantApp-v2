const logger = require('../config/logger');
const express = require('express');
const router = express.Router();
const { User } = require('../models');

/**
 * Development-only routes for email verification testing
 * These routes make it easy to test email verification without checking emails
 */

// Auto-verify a user by email address
router.post('/auto-verify', async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ error: 'Not available in production' });
        }

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.email_verified) {
            return res.status(200).json({
                message: 'Email already verified',
                user: {
                    id: user.id,
                    email: user.email,
                    email_verified: true
                }
            });
        }

        // Verify the email
        await user.update({
            email_verified: true,
            email_verification_token: null,
            email_verification_expires: null
        });

        logger.info('\n' + '='.repeat(70));
        logger.info('✅ EMAIL VERIFIED VIA DEV ENDPOINT');
        logger.info('   Email:', email);
        logger.info('   User ID:', user.id);
        logger.info('   User can now login!');
        logger.info('='.repeat(70) + '\n');

        res.json({
            message: 'Email verified successfully',
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role,
                email_verified: true
            }
        });
    } catch (error) {
        logger.error('Error auto-verifying email:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get verification status for a user
router.get('/verification-status/:email', async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ error: 'Not available in production' });
        }

        const { email } = req.params;

        const user = await User.findOne({
            where: { email },
            attributes: ['id', 'email', 'email_verified', 'email_verification_token', 'email_verification_expires']
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const status = {
            email: user.email,
            verified: user.email_verified,
            hasToken: !!user.email_verification_token,
            tokenExpires: user.email_verification_expires,
            tokenExpired: user.email_verification_expires ? new Date() > user.email_verification_expires : null
        };

        // If not verified, provide the verification URL
        if (!user.email_verified && user.email_verification_token) {
            status.verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${user.email_verification_token}`;
            status.apiVerificationUrl = `http://localhost:${process.env.PORT || 3000}/api/auth/verify-email/${user.email_verification_token}`;
        }

        res.json(status);
    } catch (error) {
        logger.error('Error getting verification status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify all unverified users (bulk operation for testing)
router.post('/verify-all', async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ error: 'Not available in production' });
        }

        const result = await User.update(
            {
                email_verified: true,
                email_verification_token: null,
                email_verification_expires: null
            },
            {
                where: {
                    email_verified: false
                }
            }
        );

        logger.info('\n' + '='.repeat(70));
        logger.info('✅ BULK EMAIL VERIFICATION COMPLETE');
        logger.info('   Verified users:', result[0]);
        logger.info('='.repeat(70) + '\n');

        res.json({
            message: 'All users verified successfully',
            count: result[0]
        });
    } catch (error) {
        logger.error('Error verifying all users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
