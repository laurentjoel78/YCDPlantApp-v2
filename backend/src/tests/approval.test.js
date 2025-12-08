const request = require('supertest');
const { app } = require('../index');
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');

jest.mock('../services/emailService');

describe('Account Approval System', () => {
  let adminToken;
  let adminUser;
  let pendingFarmer;

  beforeEach(async () => {
    await User.destroy({ where: {} });
    jest.clearAllMocks();

    // Create admin user
    adminUser = await User.create({
      email: 'admin@example.com',
      password_hash: 'hashedpassword',
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      is_active: true
    });

    // Create pending farmer
    pendingFarmer = await User.create({
      email: 'farmer@example.com',
      password_hash: 'hashedpassword',
      first_name: 'John',
      last_name: 'Farmer',
      role: 'farmer',
      approval_status: 'pending',
      is_active: true
    });

    // Generate admin token
    adminToken = jwt.sign(
      { id: adminUser.id, email: adminUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/approvals/pending', () => {
    it('should get list of pending approvals for admin', async () => {
      const response = await request(app)
        .get('/api/approvals/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.users).toHaveLength(1);
      expect(response.body.users[0].email).toBe(pendingFarmer.email);
    });

    it('should not allow non-admin access', async () => {
      const farmerToken = jwt.sign(
        { id: pendingFarmer.id, email: pendingFarmer.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/approvals/pending')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/approvals/:userId', () => {
    it('should approve a pending user', async () => {
      const response = await request(app)
        .put(`/api/approvals/${pendingFarmer.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'approved',
          reason: 'Application meets all requirements'
        });

      expect(response.status).toBe(200);
      expect(response.body.user.approval_status).toBe('approved');
      expect(emailService.sendAccountApprovalEmail).toHaveBeenCalled();

      const updatedUser = await User.findByPk(pendingFarmer.id);
      expect(updatedUser.approval_status).toBe('approved');
      expect(updatedUser.approved_at).not.toBeNull();
    });

    it('should reject a pending user', async () => {
      const response = await request(app)
        .put(`/api/approvals/${pendingFarmer.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'rejected',
          reason: 'Application does not meet requirements'
        });

      expect(response.status).toBe(200);
      expect(response.body.user.approval_status).toBe('rejected');
      expect(emailService.sendAccountApprovalEmail).toHaveBeenCalled();

      const updatedUser = await User.findByPk(pendingFarmer.id);
      expect(updatedUser.approval_status).toBe('rejected');
      expect(updatedUser.approved_at).toBeNull();
    });

    it('should validate approval status', async () => {
      const response = await request(app)
        .put(`/api/approvals/${pendingFarmer.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'invalid-status',
          reason: 'Test reason'
        });

      expect(response.status).toBe(400);
    });
  });
});