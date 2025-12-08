const request = require('supertest');
const { app } = require('../index');
const { User, Advisory, AdvisoryResponse, Notification } = require('../models');
const jwt = require('jsonwebtoken');

describe('Advisory System', () => {
  let farmerToken;
  let expertToken;
  let farmer;
  let expert;
  let testAdvisory;

  beforeEach(async () => {
    await Advisory.destroy({ where: {} });
    await AdvisoryResponse.destroy({ where: {} });
    await Notification.destroy({ where: {} });
    await User.destroy({ where: {} });

    // Create farmer
    farmer = await User.create({
      email: 'farmer@example.com',
      password_hash: 'hashedpassword',
      first_name: 'John',
      last_name: 'Farmer',
      role: 'farmer',
      is_active: true,
      approval_status: 'approved'
    });

    // Create expert
    expert = await User.create({
      email: 'expert@example.com',
      password_hash: 'hashedpassword',
      first_name: 'Jane',
      last_name: 'Expert',
      role: 'expert',
      is_active: true,
      approval_status: 'approved'
    });

    // Generate tokens
    farmerToken = jwt.sign(
      { id: farmer.id, email: farmer.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    expertToken = jwt.sign(
      { id: expert.id, email: expert.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/advisories', () => {
    it('should create a new advisory request', async () => {
      const advisoryData = {
        expert_id: expert.id,
        subject: 'Test Advisory',
        description: 'Test advisory description',
        priority: 'high'
      };

      const response = await request(app)
        .post('/api/advisories')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send(advisoryData);

      expect(response.status).toBe(201);
      expect(response.body.advisory.subject).toBe(advisoryData.subject);
      expect(response.body.advisory.farmer_id).toBe(farmer.id);

      // Check if notification was created
      const notification = await Notification.findOne({
        where: {
          user_id: expert.id,
          type: 'new_advisory'
        }
      });
      expect(notification).toBeTruthy();

      testAdvisory = response.body.advisory;
    });
  });

  describe('GET /api/advisories/farmer', () => {
    it('should get all advisories for farmer', async () => {
      // Create test advisory
      testAdvisory = await Advisory.create({
        farmer_id: farmer.id,
        expert_id: expert.id,
        subject: 'Test Advisory',
        description: 'Test description'
      });

      const response = await request(app)
        .get('/api/advisories/farmer')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.advisories).toHaveLength(1);
      expect(response.body.advisories[0].id).toBe(testAdvisory.id);
    });
  });

  describe('GET /api/advisories/expert', () => {
    it('should get all advisories for expert', async () => {
      // Create test advisory
      testAdvisory = await Advisory.create({
        farmer_id: farmer.id,
        expert_id: expert.id,
        subject: 'Test Advisory',
        description: 'Test description'
      });

      const response = await request(app)
        .get('/api/advisories/expert')
        .set('Authorization', `Bearer ${expertToken}`);

      expect(response.status).toBe(200);
      expect(response.body.advisories).toHaveLength(1);
      expect(response.body.advisories[0].id).toBe(testAdvisory.id);
    });
  });

  describe('PATCH /api/advisories/:advisoryId/status', () => {
    it('should update advisory status', async () => {
      testAdvisory = await Advisory.create({
        farmer_id: farmer.id,
        expert_id: expert.id,
        subject: 'Test Advisory',
        description: 'Test description'
      });

      const response = await request(app)
        .patch(`/api/advisories/${testAdvisory.id}/status`)
        .set('Authorization', `Bearer ${expertToken}`)
        .send({ status: 'in-progress' });

      expect(response.status).toBe(200);
      expect(response.body.advisory.status).toBe('in-progress');

      // Check if notification was created
      const notification = await Notification.findOne({
        where: {
          user_id: farmer.id,
          type: 'status_change'
        }
      });
      expect(notification).toBeTruthy();
    });
  });

  describe('POST /api/advisories/:advisoryId/responses', () => {
    it('should add response to advisory', async () => {
      testAdvisory = await Advisory.create({
        farmer_id: farmer.id,
        expert_id: expert.id,
        subject: 'Test Advisory',
        description: 'Test description'
      });

      const responseData = {
        content: 'Test response content'
      };

      const response = await request(app)
        .post(`/api/advisories/${testAdvisory.id}/responses`)
        .set('Authorization', `Bearer ${expertToken}`)
        .send(responseData);

      expect(response.status).toBe(201);
      expect(response.body.response.content).toBe(responseData.content);

      // Check if notification was created
      const notification = await Notification.findOne({
        where: {
          user_id: farmer.id,
          type: 'advisory_response'
        }
      });
      expect(notification).toBeTruthy();
    });
  });
});