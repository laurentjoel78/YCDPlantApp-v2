const { body } = require('express-validator');

const validateTransaction = [
    body('amount')
        .isNumeric()
        .withMessage('Amount must be a number')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be greater than 0'),
    
    body('payment_method')
        .isString()
        .withMessage('Payment method must be a string')
        .isIn(['mobile_money', 'bank_transfer', 'wallet'])
        .withMessage('Invalid payment method'),
        
    // Optional recipient_id for transfers
    body('recipient_id')
        .optional()
        .isUUID()
        .withMessage('Invalid recipient ID')
];

module.exports = {
    validateTransaction
};