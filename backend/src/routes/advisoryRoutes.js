const express = require('express');
const router = express.Router();
const advisoryController = require('../controllers/advisoryController');
const { auth } = require('../middleware/auth');
const { isActive } = require('../middleware/userStatus');
const { isFarmer, isExpert, isAdmin } = require('../middleware/roles');
const { 
  validateCreateQuery,
  validateAssignExpert,
  validateExpertResponse,
  validateAdvisoryId
} = require('../middleware/advisoryValidation');

// Farmer routes
router.post('/query',
  auth,
  isActive,
  isFarmer,
  validateCreateQuery,
  advisoryController.submitFarmerQuery
);

router.get('/farmer/queries',
  auth,
  isActive,
  isFarmer,
  advisoryController.getFarmerQueries
);

// Expert routes
router.post('/:advisoryId/expert-response',
  auth,
  isActive,
  isExpert,
  validateExpertResponse,
  advisoryController.submitExpertResponse
);

router.get('/expert/queries',
  auth,
  isActive,
  isExpert,
  advisoryController.getExpertQueries
);

// Admin routes
router.get('/admin/queries',
  auth,
  isActive,
  isAdmin,
  advisoryController.getAdminQueries
);

router.post('/:advisoryId/assign',
  auth,
  isActive,
  isAdmin,
  validateAssignExpert,
  advisoryController.assignToExpert
);

router.post('/:advisoryId/approve',
  auth,
  isActive,
  isAdmin,
  validateAdvisoryId,
  advisoryController.approveAndForwardResponse
);

module.exports = router;