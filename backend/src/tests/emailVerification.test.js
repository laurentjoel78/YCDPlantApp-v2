const request = require('supertest');
const { app } = require('../index');
const { User } = require('../models');
const emailService = require('../services/emailService');

// Mock email service
jest.mock('../services/emailService');

describe('Email Verification & Password Reset', () => {
  beforeEach(async () => {
    await User.destroy({ where: {} });
    jest.clearAllMocks();
  });

  describe('Email Verification', () => {
    it('should send verification email for unverified user', async () => {
      // Create unverified user
      const user = await User.create({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        first_name: 'John',
        last_name: 'Doe',
        role: 'farmer'
      });

      const response = await request(app)
        .post('/api/auth/verify-email/send')
        .send({ email: user.email });

      expect(response.status).toBe(200);
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should verify email with valid token', async () => {
      const token = 'valid-token';
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const user = await User.create({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        first_name: 'John',
        last_name: 'Doe',
        role: 'farmer',
        email_verification_token: token,
        email_verification_expires: expires
      });

      const response = await request(app)
        .get(`/api/auth/verify-email/${token}`);

      expect(response.status).toBe(200);
      
      const updatedUser = await User.findByPk(user.id);
      expect(updatedUser.email_verified).toBe(true);
      expect(updatedUser.email_verification_token).toBeNull();
    });
  });

  describe('Password Reset', () => {
    it('should initiate password reset process', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        first_name: 'John',
        last_name: 'Doe',
        role: 'farmer'
      });

      const response = await request(app)
        .post('/api/auth/password-reset/request')
        .send({ email: user.email });

      expect(response.status).toBe(200);
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should reset password with valid token', async () => {
      const token = 'valid-reset-token';
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      const user = await User.create({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        first_name: 'John',
        last_name: 'Doe',
        role: 'farmer',
        password_reset_token: token,
        password_reset_expires: expires
      });

      const response = await request(app)
        .post(`/api/auth/password-reset/${token}`)
        .send({ password: 'NewPassword123!' });

      expect(response.status).toBe(200);
      
      const updatedUser = await User.findByPk(user.id);
      expect(updatedUser.password_reset_token).toBeNull();
      expect(updatedUser.password_hash).not.toBe('hashedpassword');
    });
  });
});