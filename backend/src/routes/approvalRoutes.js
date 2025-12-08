const express = require('express');
const router = express.Router();
const { getPendingApprovals, updateApprovalStatus } = require('../controllers/approvalController');
const { auth, requireAdmin } = require('../middleware/auth');
const { param, body } = require('express-validator');
const { validate } = require('../middleware/validation');

const approvalValidation = [
  param('userId')
    .isUUID(4)
    .withMessage('Invalid user ID'),
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('Invalid approval status'),
  body('reason')
    .optional()
    .isString()
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters'),
  validate
];

// All routes require authentication and admin role
router.use(auth, requireAdmin);

router.get('/pending', getPendingApprovals);
router.put('/:userId', approvalValidation, updateApprovalStatus);

module.exports = router;