const { body, param, query } = require('express-validator');

// Market-specific validations
exports.validateMarketQuery = [
  query('radius')
    .optional()
    .isFloat({ min: 1, max: 500 })
    .withMessage('Radius must be between 1 and 500 kilometers'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO date')
    .custom((value, { req }) => {
      if (req.query.startDate && value < req.query.startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
];

exports.validateCreateProduct = [
  body('farm_id')
    .notEmpty()
    .withMessage('Farm ID is required')
    .isUUID()
    .withMessage('Invalid farm ID format'),
  
  body('crop_id')
    .notEmpty()
    .withMessage('Crop ID is required')
    .isUUID()
    .withMessage('Invalid crop ID format'),

  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isString()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),

  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isString()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),

  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isFloat({ min: 0.1 })
    .withMessage('Quantity must be greater than 0'),

  body('unit')
    .notEmpty()
    .withMessage('Unit is required')
    .isIn(['kg', 'g', 'ton', 'piece', 'bunch', 'crate', 'bag'])
    .withMessage('Invalid unit'),

  body('price_per_unit')
    .notEmpty()
    .withMessage('Price per unit is required')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be greater than 0'),

  body('currency')
    .optional()
    .isIn(['XAF', 'USD', 'EUR'])
    .withMessage('Invalid currency'),

  body('availability_date')
    .notEmpty()
    .withMessage('Availability date is required')
    .isISO8601()
    .withMessage('Invalid date format'),

  body('certification')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Certification must not exceed 200 characters'),

  body('organic')
    .optional()
    .isBoolean()
    .withMessage('Organic must be a boolean value'),

  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array')
    .custom((value) => {
      if (value && value.length > 5) {
        throw new Error('Maximum 5 images allowed');
      }
      return true;
    })
];

exports.validateUpdateProduct = [
  body('title')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),

  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),

  body('quantity')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Quantity must be greater than 0'),

  body('unit')
    .optional()
    .isIn(['kg', 'g', 'ton', 'piece', 'bunch', 'crate', 'bag'])
    .withMessage('Invalid unit'),

  body('price_per_unit')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Price must be greater than 0'),

  body('currency')
    .optional()
    .isIn(['XAF', 'USD', 'EUR'])
    .withMessage('Invalid currency'),

  body('availability_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),

  body('certification')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Certification must not exceed 200 characters'),

  body('organic')
    .optional()
    .isBoolean()
    .withMessage('Organic must be a boolean value'),

  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array')
    .custom((value) => {
      if (value && value.length > 5) {
        throw new Error('Maximum 5 images allowed');
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(['draft', 'active', 'inactive'])
    .withMessage('Invalid status')
];

exports.validateCreateOrder = [
  body('product_id')
    .notEmpty()
    .withMessage('Product ID is required')
    .isUUID()
    .withMessage('Invalid product ID format'),

  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isFloat({ min: 0.1 })
    .withMessage('Quantity must be greater than 0'),

  body('delivery_address')
    .notEmpty()
    .withMessage('Delivery address is required')
    .isString()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Delivery address must be between 10 and 500 characters'),

  body('delivery_date')
    .notEmpty()
    .withMessage('Delivery date is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      if (date < now) {
        throw new Error('Delivery date must be in the future');
      }
      return true;
    }),

  body('payment_method')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['mobile_money', 'cash_on_delivery', 'bank_transfer'])
    .withMessage('Invalid payment method'),

  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
];

exports.validateUpdateOrderStatus = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['accepted', 'rejected', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),

  body('rejection_reason')
    .if(body('status').equals('rejected'))
    .notEmpty()
    .withMessage('Rejection reason is required when rejecting an order')
    .isString()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Rejection reason must be between 10 and 500 characters')
];

exports.validateCancelOrder = [
  body('cancellation_reason')
    .notEmpty()
    .withMessage('Cancellation reason is required')
    .isString()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Cancellation reason must be between 10 and 500 characters')
];

exports.validatePaymentInitiation = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isUUID()
    .withMessage('Invalid order ID format'),

  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['mobile_money', 'cash_on_delivery', 'bank_transfer'])
    .withMessage('Invalid payment method')
];

exports.validatePaymentConfirmation = [
  body('transactionId')
    .notEmpty()
    .withMessage('Transaction ID is required')
    .isUUID()
    .withMessage('Invalid transaction ID format'),

  body('paymentReference')
    .notEmpty()
    .withMessage('Payment reference is required')
    .isString()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Payment reference must be between 3 and 100 characters')
];

exports.validateRefundRequest = [
  param('transactionId')
    .isUUID()
    .withMessage('Invalid transaction ID format'),

  body('reason')
    .notEmpty()
    .withMessage('Refund reason is required')
    .isString()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Refund reason must be between 10 and 500 characters')
];