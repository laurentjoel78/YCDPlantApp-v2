const { body, param } = require('express-validator');

exports.validateCreateQuery = [
  body('farm_id')
    .optional()
    .isUUID(4)
    .withMessage('Invalid farm ID'),
  
  body('crop_id')
    .optional()
    .isUUID(4)
    .withMessage('Invalid crop ID'),
  
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ max: 200 })
    .withMessage('Subject must not exceed 200 characters'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority level')
];

exports.validateAssignExpert = [
  param('advisoryId')
    .isUUID(4)
    .withMessage('Invalid advisory ID'),
  
  body('expert_id')
    .isUUID(4)
    .withMessage('Invalid expert ID')
];

exports.validateExpertResponse = [
  param('advisoryId')
    .isUUID(4)
    .withMessage('Invalid advisory ID'),
  
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Response content is required'),
  
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array')
];

exports.validateAdvisoryId = [
  param('advisoryId')
    .isUUID(4)
    .withMessage('Invalid advisory ID')
];