const { body, param } = require('express-validator');

exports.validateCreateCrop = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Crop name is required')
    .isLength({ max: 100 })
    .withMessage('Crop name must not exceed 100 characters'),
  
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['Vegetable', 'Fruit', 'Grain', 'Tuber', 'Legume', 'Other'])
    .withMessage('Invalid crop category'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  
  body('planting_guide')
    .trim()
    .notEmpty()
    .withMessage('Planting guide is required'),
  
  body('growth_duration_days')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Growth duration must be a positive number'),
  
  body('water_requirements')
    .trim()
    .notEmpty()
    .withMessage('Water requirements are required'),
  
  body('soil_requirements')
    .trim()
    .notEmpty()
    .withMessage('Soil requirements are required'),
  
  body('optimal_temperature')
    .trim()
    .notEmpty()
    .withMessage('Optimal temperature range is required'),
  
  body('seasonal_info')
    .trim()
    .notEmpty()
    .withMessage('Seasonal information is required'),
  
  body('common_diseases')
    .optional()
    .isArray()
    .withMessage('Common diseases must be an array'),
  
  body('prevention_measures')
    .optional()
    .isArray()
    .withMessage('Prevention measures must be an array')
];

exports.validateUpdateCrop = [
  param('cropId')
    .isUUID(4)
    .withMessage('Invalid crop ID'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Crop name must not exceed 100 characters'),
  
  body('category')
    .optional()
    .trim()
    .isIn(['Vegetable', 'Fruit', 'Grain', 'Tuber', 'Legume', 'Other'])
    .withMessage('Invalid crop category'),
  
  body('growth_duration_days')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Growth duration must be a positive number'),
  
  body('common_diseases')
    .optional()
    .isArray()
    .withMessage('Common diseases must be an array'),
  
  body('prevention_measures')
    .optional()
    .isArray()
    .withMessage('Prevention measures must be an array')
];

exports.validateCropId = [
  param('cropId')
    .isUUID(4)
    .withMessage('Invalid crop ID')
];

exports.validateCategory = [
  param('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['Vegetable', 'Fruit', 'Grain', 'Tuber', 'Legume', 'Other'])
    .withMessage('Invalid crop category')
];