const { Farm, FarmCrop, Crop, User } = require('../models');
const { Op } = require('sequelize');
const auditService = require('../services/auditService');

// Get all farms for a farmer
const getFarmerFarms = async (req, res) => {
  try {
    const logger = (req && req.log) ? req.log : console;
    logger.info('Fetching farms for farmer', {
      userId: req.user.id
    });

    const farms = await Farm.findAll({
      where: {
        farmer_id: req.user.id,
        is_active: true
      },
      include: [{
        model: FarmCrop,
        as: 'crops',
        include: [{
          model: Crop,
          as: 'crop'
        }]
      }]
    });

    res.json({ farms });
  } catch (error) {
    const logger = (req && req.log) ? req.log : console;
    logger.error('Failed to fetch farms', {
      error: error.message,
      stack: error.stack,
      userId: req.user && req.user.id
    });
    res.status(500).json({ error: 'Error fetching farms' });
  }
};

// Get single farm details
const getFarm = async (req, res) => {
  try {
    const farmId = req.params.farmId;
    const logger = (req && req.log) ? req.log : console;

    const farm = await Farm.findOne({
      where: {
        id: farmId,
        farmer_id: req.user.id,
        is_active: true
      },
      include: [{
        model: FarmCrop,
        as: 'crops',
        include: [{
          model: Crop,
          as: 'crop'
        }]
      }]
    });

    if (!farm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    res.json({ farm });
  } catch (error) {
    const logger = (req && req.log) ? req.log : console;
    logger.error('Failed to fetch farm details', {
      error: error.message,
      stack: error.stack,
      userId: req.user && req.user.id,
      farmId: req.params.farmId
    });
    res.status(500).json({ error: 'Error fetching farm details' });
  }
};

// Create new farm
const createFarm = async (req, res) => {
  try {
    const {
      name,
      description,
      location_lat,
      location_lng,
      address,
      region,
      size,
      soil_type,
      water_source,
      farming_type,
      irrigation_system,
      certification
    } = req.body;

    const logger = (req && req.log) ? req.log : console;

    const farm = await Farm.create({
      farmer_id: req.user.id,
      name,
      description,
      location_lat,
      location_lng,
      address,
      region,
      size,
      soil_type,
      water_source,
      farming_type,
      irrigation_system,
      certification
    });

    // Log activity
    await auditService.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      actionType: 'FARM_CREATE',
      actionDescription: `Created farm: ${name}`,
      req,
      tableName: 'farms',
      recordId: farm.id,
      metadata: { name, region, size }
    });

    res.status(201).json({
      message: 'Farm created successfully',
      farm
    });
  } catch (error) {
    const logger = (req && req.log) ? req.log : console;
    logger.error('Failed to create farm', {
      error: error.message,
      stack: error.stack,
      userId: req.user && req.user.id
    });
    res.status(500).json({ error: 'Error creating farm' });
  }
};

// Update farm details
const updateFarm = async (req, res) => {
  try {
    const farmId = req.params.farmId;
    const logger = (req && req.log) ? req.log : console;

    const farm = await Farm.findOne({
      where: {
        id: farmId,
        farmer_id: req.user.id,
        is_active: true
      }
    });

    if (!farm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    const {
      name,
      description,
      location_lat,
      location_lng,
      address,
      region,
      size,
      soil_type,
      water_source,
      farming_type,
      irrigation_system,
      certification
    } = req.body;

    const oldValues = {
      name: farm.name,
      size: farm.size,
      region: farm.region
    };

    await farm.update({
      name,
      description,
      location_lat,
      location_lng,
      address,
      region,
      size,
      soil_type,
      water_source,
      farming_type,
      irrigation_system,
      certification
    });

    // Log activity
    await auditService.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      actionType: 'FARM_UPDATE',
      actionDescription: `Updated farm: ${farm.name}`,
      req,
      tableName: 'farms',
      recordId: farm.id,
      oldValues,
      newValues: req.body
    });

    res.json({
      message: 'Farm updated successfully',
      farm
    });
  } catch (error) {
    const logger = (req && req.log) ? req.log : console;
    logger.error('Failed to update farm', {
      error: error.message,
      stack: error.stack,
      userId: req.user && req.user.id,
      farmId: req.params.farmId
    });
    res.status(500).json({ error: 'Error updating farm' });
  }
};

// Delete farm (soft delete)
const deleteFarm = async (req, res) => {
  try {
    const farmId = req.params.farmId;
    const logger = (req && req.log) ? req.log : console;

    const farm = await Farm.findOne({
      where: {
        id: farmId,
        farmer_id: req.user.id,
        is_active: true
      }
    });

    if (!farm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    await farm.update({ is_active: false });

    // Log activity
    await auditService.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      actionType: 'FARM_DELETE',
      actionDescription: `Deleted farm: ${farm.name}`,
      req,
      tableName: 'farms',
      recordId: farm.id,
      metadata: { name: farm.name }
    });

    res.json({ message: 'Farm deleted successfully' });
  } catch (error) {
    const logger = (req && req.log) ? req.log : console;
    logger.error('Failed to delete farm', {
      error: error.message,
      stack: error.stack,
      userId: req.user && req.user.id,
      farmId: req.params.farmId
    });
    res.status(500).json({ error: 'Error deleting farm' });
  }
};

// Add crop to farm
const addCropToFarm = async (req, res) => {
  try {
    const farmId = req.params.farmId;
    const logger = (req && req.log) ? req.log : console;

    const farm = await Farm.findOne({
      where: {
        id: farmId,
        farmer_id: req.user.id,
        is_active: true
      }
    });

    if (!farm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    const {
      crop_id,
      area,
      planting_date,
      expected_harvest_date,
      yield_estimate,
      notes
    } = req.body;

    const farmCrop = await FarmCrop.create({
      farm_id: farm.id,
      crop_id,
      area,
      planting_date,
      expected_harvest_date,
      yield_estimate,
      notes
    });

    const cropWithDetails = await FarmCrop.findOne({
      where: { id: farmCrop.id },
      include: [{
        model: Crop,
        as: 'crop'
      }]
    });

    // Log activity
    await auditService.logUserAction({
      userId: req.user.id,
      userRole: req.user.role,
      actionType: 'FARM_CROP_ADD',
      actionDescription: `Added crop ${cropWithDetails.crop.name} to farm ${farm.name}`,
      req,
      tableName: 'farm_crops',
      recordId: farmCrop.id,
      metadata: {
        farmId: farm.id,
        cropName: cropWithDetails.crop.name,
        area
      }
    });

    res.status(201).json({
      message: 'Crop added to farm successfully',
      farmCrop: cropWithDetails
    });
  } catch (error) {
    const logger = (req && req.log) ? req.log : console;
    logger.error('Failed to add crop to farm', {
      error: error.message,
      stack: error.stack,
      userId: req.user && req.user.id,
      farmId: req.params.farmId
    });
    res.status(500).json({ error: 'Error adding crop to farm' });
  }
};

module.exports = {
  getFarmerFarms,
  getFarm,
  createFarm,
  updateFarm,
  deleteFarm,
  addCropToFarm
};