const request = require('supertest');
const { app } = require('../index');
const { User, Farm, Crop, FarmCrop } = require('../models');
const jwt = require('jsonwebtoken');

describe('Farm Management System', () => {
  let farmerToken;
  let farmer;
  let testFarm;
  let testCrop;

  beforeEach(async () => {
    await Farm.destroy({ where: {} });
    await User.destroy({ where: {} });
    await Crop.destroy({ where: {} });
    await FarmCrop.destroy({ where: {} });

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

    // Create test crop
    testCrop = await Crop.create({
      name: 'Test Crop',
      category: 'Vegetable',
      description: 'A test crop'
    });

    // Generate farmer token
    farmerToken = jwt.sign(
      { id: farmer.id, email: farmer.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/farms', () => {
    it('should create a new farm', async () => {
      const farmData = {
        name: 'Test Farm',
        description: 'A test farm',
        location_lat: 4.0511,
        location_lng: 9.7679,
        address: 'Test Address',
        region: 'Central',
        size: 5.5,
        soil_type: 'Clay',
        water_source: 'River',
        farming_type: 'organic'
      };

      const response = await request(app)
        .post('/api/farms')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send(farmData);

      expect(response.status).toBe(201);
      expect(response.body.farm.name).toBe(farmData.name);
      expect(response.body.farm.farmer_id).toBe(farmer.id);

      testFarm = response.body.farm;
    });
  });

  describe('GET /api/farms', () => {
    it('should get all farms for farmer', async () => {
      // Create a test farm first
      testFarm = await Farm.create({
        farmer_id: farmer.id,
        name: 'Test Farm',
        location_lat: 4.0511,
        location_lng: 9.7679,
        address: 'Test Address',
        region: 'Central',
        size: 5.5
      });

      const response = await request(app)
        .get('/api/farms')
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.farms).toHaveLength(1);
      expect(response.body.farms[0].id).toBe(testFarm.id);
    });
  });

  describe('POST /api/farms/:farmId/crops', () => {
    it('should add crop to farm', async () => {
      // Create a test farm first
      testFarm = await Farm.create({
        farmer_id: farmer.id,
        name: 'Test Farm',
        location_lat: 4.0511,
        location_lng: 9.7679,
        address: 'Test Address',
        region: 'Central',
        size: 5.5
      });

      const cropData = {
        crop_id: testCrop.id,
        area: 1.5,
        planting_date: '2025-10-01',
        expected_harvest_date: '2026-01-01',
        yield_estimate: 3.5
      };

      const response = await request(app)
        .post(`/api/farms/${testFarm.id}/crops`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send(cropData);

      expect(response.status).toBe(201);
      expect(response.body.farmCrop.crop_id).toBe(testCrop.id);
      expect(response.body.farmCrop.farm_id).toBe(testFarm.id);
    });
  });

  describe('PUT /api/farms/:farmId', () => {
    it('should update farm details', async () => {
      testFarm = await Farm.create({
        farmer_id: farmer.id,
        name: 'Test Farm',
        location_lat: 4.0511,
        location_lng: 9.7679,
        address: 'Test Address',
        region: 'Central',
        size: 5.5
      });

      const updateData = {
        name: 'Updated Farm Name',
        size: 6.5
      };

      const response = await request(app)
        .put(`/api/farms/${testFarm.id}`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.farm.name).toBe(updateData.name);
      expect(response.body.farm.size).toBe(updateData.size);
    });
  });

  describe('DELETE /api/farms/:farmId', () => {
    it('should soft delete farm', async () => {
      testFarm = await Farm.create({
        farmer_id: farmer.id,
        name: 'Test Farm',
        location_lat: 4.0511,
        location_lng: 9.7679,
        address: 'Test Address',
        region: 'Central',
        size: 5.5
      });

      const response = await request(app)
        .delete(`/api/farms/${testFarm.id}`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(response.status).toBe(200);

      const deletedFarm = await Farm.findByPk(testFarm.id);
      expect(deletedFarm.is_active).toBe(false);
    });
  });
});