const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  logger.info('Validating request body:', {
    path: req.path,
    method: req.method,
    body: req.body
  });

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value
    }));

    logger.error('Validation failed:', {
      path: req.path,
      method: req.method,
      errors: validationErrors
    });

    return res.status(400).json({
      error: 'Validation error',
      details: validationErrors
    });
  }
  logger.info('Validation passed for:', req.path);
  next();
};

// Export a middleware factory function
module.exports = {
  validate: (req, res, next) => {
    validate(req, res, next);
  }
};