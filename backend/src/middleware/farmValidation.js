const { body, param } = require('express-validator');
const { validate } = require('./validation');
const { logRequest } = require('../utils/logger');

// Custom validation middleware that logs validation details
const validateWithLogging = (req, res, next) => {
  // Log validation attempt
  logRequest(req, {
    message: 'Farm validation started',
    metadata: {
      path: req.path,
      method: req.method,
      body: req.method === 'GET' ? undefined : req.body,
      params: req.params
    }
  });
  
  validate(req, res, (err) => {
    if (err) {
      logRequest(req, {
        level: 'warn',
        message: 'Farm validation failed',
        metadata: {
          errors: err.array()
        }
      });
    }
    next(err);
  });
};

const farmValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Farm name is required')
    .isLength({ max: 100 })
    .withMessage('Farm name must be less than 100 characters'),
  body('location_lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('location_lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),
  body('region')
    .trim()
    .notEmpty()
    .withMessage('Region is required'),
  body('size')
    .isFloat({ min: 0.01 })
    .withMessage('Size must be greater than 0'),
  body('soil_type')
    .notEmpty()
    .withMessage('Soil type is required')
    .isIn(['Clay', 'Sandy', 'Silty', 'Loamy', 'Chalky', 'Peaty', 'Saline', 'Other'])
    .withMessage('Invalid soil type'),
  body('farming_type')
    .optional()
    .isIn(['conventional', 'organic', 'mixed'])
    .withMessage('Invalid farming type'),
  validateWithLogging
];

const farmIdValidation = [
  param('farmId')
    .isUUID(4)
    .withMessage('Invalid farm ID'),
  validateWithLogging
];

const farmCropValidation = [
  body('crop_id')
    .isUUID(4)
    .withMessage('Invalid crop ID'),
  body('area')
    .isFloat({ min: 0.01 })
    .withMessage('Area must be greater than 0'),
  body('planting_date')
    .isISO8601()
    .withMessage('Invalid planting date'),
  body('expected_harvest_date')
    .isISO8601()
    .withMessage('Invalid expected harvest date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.planting_date)) {
        throw new Error('Harvest date must be after planting date');
      }
      return true;
    }),
  body('yield_estimate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Yield estimate must be a positive number'),
  validateWithLogging
];

module.exports = {
  farmValidation,
  farmIdValidation,
  farmCropValidation
};