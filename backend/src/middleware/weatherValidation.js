const { param, query } = require('express-validator');

exports.validateWeatherRequest = [
  param('farmId')
    .isUUID()
    .withMessage('Invalid farm ID format'),

  query('type')
    .optional()
    .isIn(['all', 'current', 'hourly', 'daily'])
    .withMessage('Invalid forecast type')
];

exports.validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (req.query.startDate && value < req.query.startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
];