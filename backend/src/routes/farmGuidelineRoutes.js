const express = require('express');
const router = express.Router();
const farmGuidelineController = require('../controllers/farmGuidelineController');
const { auth } = require('../middleware/auth');
const { isActive } = require('../middleware/userStatus');
const { validateGetGuidelines, validateUpdateGuideline } = require('../middleware/farmGuidelineValidation');

// Get guidelines for a farm (query param: ?farm_id=...)
router.get('/',
  auth,
  isActive,
  validateGetGuidelines,
  farmGuidelineController.getGuidelines
);

// Get guidelines for a farm by path param (compatibility for frontend calls to /farm/:farmId)
router.get('/farm/:farmId',
  auth,
  isActive,
  // validate param farmId
  require('../middleware/farmGuidelineValidation').validateGetGuidelinesByParam,
  farmGuidelineController.getGuidelines
);

// Update a specific guideline (expert only)
router.patch('/:guidelineId',
  auth,
  isActive,
  validateUpdateGuideline,
  farmGuidelineController.updateGuideline
);

module.exports = router;