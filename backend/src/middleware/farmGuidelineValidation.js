const { body, param, query } = require('express-validator');

exports.validateGetGuidelines = [
  query('farm_id')
    .optional()
    .isUUID(4)
    .withMessage('Invalid farm ID')
];

exports.validateGetGuidelinesByParam = [
  param('farmId')
    .isUUID(4)
    .withMessage('Invalid farm ID')
];

exports.validateUpdateGuideline = [
  param('guidelineId')
    .isUUID(4)
    .withMessage('Invalid guideline ID'),
  
  body('modified_content')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Modified content cannot be empty if provided'),
  
  body('expert_notes')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Expert notes cannot be empty if provided'),
  
  body('status')
    .optional()
    .isIn(['active', 'archived'])
    .withMessage('Invalid status value')
];