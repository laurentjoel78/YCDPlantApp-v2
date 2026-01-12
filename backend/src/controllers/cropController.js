const { Crop, FarmCrop } = require('../models');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');

// Get all available crops
exports.getAllCrops = async (req, res) => {
  try {
    const crops = await Crop.findAll({
      where: { is_active: true }
    });
    res.status(200).json({ crops });
  } catch (error) {
    logger.error('Error in getAllCrops:', error);
    res.status(500).json({ error: 'Failed to fetch crops' });
  }
};

// Get crop by ID
exports.getCropById = async (req, res) => {
  try {
    const crop = await Crop.findOne({
      where: { id: req.params.cropId, is_active: true }
    });

    if (!crop) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    res.status(200).json({ crop });
  } catch (error) {
    logger.error('Error in getCropById:', error);
    res.status(500).json({ error: 'Failed to fetch crop' });
  }
};

// Create new crop (Admin only)
exports.createCrop = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const cropData = {
      name: req.body.name,
      category: req.body.category,
      description: req.body.description,
      planting_guide: req.body.planting_guide,
      growth_duration_days: req.body.growth_duration_days,
      water_requirements: req.body.water_requirements,
      soil_requirements: req.body.soil_requirements,
      optimal_temperature: req.body.optimal_temperature,
      seasonal_info: req.body.seasonal_info,
      common_diseases: req.body.common_diseases,
      prevention_measures: req.body.prevention_measures,
      created_by: req.user.id
    };

    const crop = await Crop.create(cropData);
    res.status(201).json({ crop });
  } catch (error) {
    logger.error('Error in createCrop:', error);
    res.status(500).json({ error: 'Failed to create crop' });
  }
};

// Update crop (Admin only)
exports.updateCrop = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const crop = await Crop.findOne({
      where: { id: req.params.cropId, is_active: true }
    });

    if (!crop) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    const updateData = {
      name: req.body.name || crop.name,
      category: req.body.category || crop.category,
      description: req.body.description || crop.description,
      planting_guide: req.body.planting_guide || crop.planting_guide,
      growth_duration_days: req.body.growth_duration_days || crop.growth_duration_days,
      water_requirements: req.body.water_requirements || crop.water_requirements,
      soil_requirements: req.body.soil_requirements || crop.soil_requirements,
      optimal_temperature: req.body.optimal_temperature || crop.optimal_temperature,
      seasonal_info: req.body.seasonal_info || crop.seasonal_info,
      common_diseases: req.body.common_diseases || crop.common_diseases,
      prevention_measures: req.body.prevention_measures || crop.prevention_measures,
      updated_by: req.user.id
    };

    await crop.update(updateData);
    res.status(200).json({ crop });
  } catch (error) {
    logger.error('Error in updateCrop:', error);
    res.status(500).json({ error: 'Failed to update crop' });
  }
};

// Delete crop (Admin only)
exports.deleteCrop = async (req, res) => {
  try {
    const { cropId } = req.params;
    
    // Validate cropId
    if (!cropId || cropId === 'undefined' || cropId === 'null') {
      return res.status(400).json({ error: 'Crop ID is required' });
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cropId)) {
      return res.status(400).json({ error: 'Invalid Crop ID format' });
    }
    
    const crop = await Crop.findOne({
      where: { id: cropId, is_active: true }
    });

    if (!crop) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    // Soft delete
    await crop.update({ 
      is_active: false,
      updated_by: req.user.id
    });

    res.status(200).json({ message: 'Crop deleted successfully' });
  } catch (error) {
    logger.error('Error in deleteCrop:', error);
    res.status(500).json({ error: 'Failed to delete crop' });
  }
};

// Get crops by category
exports.getCropsByCategory = async (req, res) => {
  try {
    const crops = await Crop.findAll({
      where: { 
        category: req.params.category,
        is_active: true
      }
    });
    res.status(200).json({ crops });
  } catch (error) {
    logger.error('Error in getCropsByCategory:', error);
    res.status(500).json({ error: 'Failed to fetch crops by category' });
  }
};

// Get seasonal crops
exports.getSeasonalCrops = async (req, res) => {
  const { month } = req.query;
  try {
    const crops = await Crop.findAll({
      where: {
        is_active: true,
        seasonal_info: {
          [Op.like]: `%${month}%`
        }
      }
    });
    res.status(200).json({ crops });
  } catch (error) {
    logger.error('Error in getSeasonalCrops:', error);
    res.status(500).json({ error: 'Failed to fetch seasonal crops' });
  }
};