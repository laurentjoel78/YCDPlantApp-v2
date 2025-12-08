const request = require('supertest');
const { app } = require('../index');
const { User, Crop } = require('../models');
const jwt = require('jsonwebtoken');

describe('Crop Management System', () => {
  let adminToken;
  let admin;
  let testCrop;

  beforeEach(async () => {
    await Crop.destroy({ where: {} });
    await User.destroy({ where: {} });

    // Create admin user
    admin = await User.create({
      email: 'admin@example.com',
      password_hash: 'hashedpassword',
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      is_active: true,
      approval_status: 'approved'
    });

    // Generate admin token
    adminToken = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/crops', () => {
    it('should create a new crop as admin', async () => {
      const cropData = {
        name: 'Test Crop',
        category: 'Vegetable',
        description: 'A test crop description',
        planting_guide: 'Test planting guide',
        growth_duration_days: 90,
        water_requirements: 'Moderate',
        soil_requirements: 'Well-drained soil',
        optimal_temperature: '20-25°C',
        seasonal_info: 'Best planted in spring',
        common_diseases: ['Blight', 'Rust'],
        prevention_measures: ['Crop rotation', 'Proper spacing']
      };

      const response = await request(app)
        .post('/api/crops')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(cropData);

      expect(response.status).toBe(201);
      expect(response.body.crop.name).toBe(cropData.name);
      expect(response.body.crop.category).toBe(cropData.category);

      testCrop = response.body.crop;
    });

    it('should not allow non-admin users to create crops', async () => {
      const farmer = await User.create({
        email: 'farmer@example.com',
        password_hash: 'hashedpassword',
        first_name: 'John',
        last_name: 'Farmer',
        role: 'farmer',
        is_active: true,
        approval_status: 'approved'
      });

      const farmerToken = jwt.sign(
        { id: farmer.id, email: farmer.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post('/api/crops')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ name: 'Test Crop' });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/crops', () => {
    it('should get all active crops', async () => {
      // Create test crops
      await Crop.create({
        name: 'Test Crop 1',
        category: 'Vegetable',
        description: 'Test description',
        planting_guide: 'Test guide',
        created_by: admin.id
      });

      await Crop.create({
        name: 'Test Crop 2',
        category: 'Fruit',
        description: 'Test description',
        planting_guide: 'Test guide',
        created_by: admin.id
      });

      const response = await request(app)
        .get('/api/crops');

      expect(response.status).toBe(200);
      expect(response.body.crops).toHaveLength(2);
    });

    it('should get crops by category', async () => {
      await Crop.create({
        name: 'Test Crop',
        category: 'Vegetable',
        description: 'Test description',
        planting_guide: 'Test guide',
        created_by: admin.id
      });

      const response = await request(app)
        .get('/api/crops/category/Vegetable');

      expect(response.status).toBe(200);
      expect(response.body.crops).toHaveLength(1);
      expect(response.body.crops[0].category).toBe('Vegetable');
    });
  });

  describe('PUT /api/crops/:cropId', () => {
    it('should update crop details as admin', async () => {
      testCrop = await Crop.create({
        name: 'Test Crop',
        category: 'Vegetable',
        description: 'Test description',
        planting_guide: 'Test guide',
        created_by: admin.id
      });

      const updateData = {
        name: 'Updated Crop Name',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/crops/${testCrop.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.crop.name).toBe(updateData.name);
      expect(response.body.crop.description).toBe(updateData.description);
    });
  });

  describe('DELETE /api/crops/:cropId', () => {
    it('should soft delete crop as admin', async () => {
      testCrop = await Crop.create({
        name: 'Test Crop',
        category: 'Vegetable',
        description: 'Test description',
        planting_guide: 'Test guide',
        created_by: admin.id
      });

      const response = await request(app)
        .delete(`/api/crops/${testCrop.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deletedCrop = await Crop.findByPk(testCrop.id);
      expect(deletedCrop.is_active).toBe(false);
    });
  });

  describe('GET /api/crops/seasonal', () => {
    it('should get seasonal crops', async () => {
      await Crop.create({
        name: 'Summer Crop',
        category: 'Vegetable',
        description: 'Test description',
        planting_guide: 'Test guide',
        seasonal_info: 'Best planted in July',
        created_by: admin.id
      });

      const response = await request(app)
        .get('/api/crops/seasonal')
        .query({ month: 'July' });

      expect(response.status).toBe(200);
      expect(response.body.crops).toHaveLength(1);
      expect(response.body.crops[0].name).toBe('Summer Crop');
    });
  });
});