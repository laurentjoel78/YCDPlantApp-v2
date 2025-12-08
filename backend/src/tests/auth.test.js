const request = require('supertest');
const { app } = require('../index');
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

describe('Authentication Endpoints', () => {
  beforeEach(async () => {
    // Clear users table before each test
    await User.destroy({ where: {} });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '+237612345678',
        role: 'farmer',
        region: 'Central'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(userData.email);
    });

    it('should not register user with existing email', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'Password123!',
        first_name: 'John',
        last_name: 'Doe',
        role: 'farmer'
      };

      // Create a user first
      await User.create({
        ...userData,
        password_hash: await bcrypt.hash(userData.password, 12)
      });

      // Try to create another user with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user before each login test
      const password_hash = await bcrypt.hash('Password123!', 12);
      await User.create({
        email: 'test@example.com',
        password_hash,
        first_name: 'John',
        last_name: 'Doe',
        role: 'farmer',
        is_active: true,
        approval_status: 'approved'
      });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
    });

    it('should not login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/me', () => {
    let token;
    let user;

    beforeEach(async () => {
      // Create a test user and generate token
      const password_hash = await bcrypt.hash('Password123!', 12);
      user = await User.create({
        email: 'test@example.com',
        password_hash,
        first_name: 'John',
        last_name: 'Doe',
        role: 'farmer',
        is_active: true
      });

      token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    it('should get current user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user.id).toBe(user.id);
      expect(response.body.user.email).toBe(user.email);
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    it('should not allow access without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });
});