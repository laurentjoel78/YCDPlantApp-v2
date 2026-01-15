const { body, param, validationResult } = require('express-validator');
const logger = require('../config/logger');

// Validation middleware factory
const createValidationMiddleware = (validations) => {
  return async (req, res, next) => {
    // Apply all validation rules
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const validationErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value
    }));

    // Log validation errors for debugging
    logger.info('Validation failed:', req.path, JSON.stringify(validationErrors, null, 2));

    return res.status(400).json({
      error: 'Validation error',
      details: validationErrors
    });
  };
};


// Registration validation rules
const registrationValidation = createValidationMiddleware([
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
    .withMessage('Password must include uppercase, lowercase, number and special character'),
  body('first_name')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  body('last_name')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  body('role')
    .isIn(['farmer', 'expert', 'buyer', 'admin', 'general'])
    .withMessage('Invalid role specified'),
  body('phone_number')
    .optional()
    .matches(/^\+\d{1,4}\d{4,15}$/)
    .withMessage('Please provide a valid international phone number with country code (e.g., +237612345678, +33612345678, +1234567890)')
]);

// Login validation rules
const loginValidation = createValidationMiddleware([
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
]);

// Email verification validation rules
const emailVerificationValidation = createValidationMiddleware([
  param('token')
    .notEmpty()
    .withMessage('Verification token is required')
]);

// Password reset request validation rules
const passwordResetRequestValidation = createValidationMiddleware([
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
]);

// Password reset validation rules
const passwordResetValidation = createValidationMiddleware([
  param('token')
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid reset token'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
    .withMessage('Password must include uppercase, lowercase, number and special character')
]);

module.exports = {
  registrationValidation,
  loginValidation,
  emailVerificationValidation,
  passwordResetRequestValidation,
  passwordResetValidation
};