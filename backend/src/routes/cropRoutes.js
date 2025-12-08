const express = require('express');
const router = express.Router();
const cropController = require('../controllers/cropController');
const { auth, requireAdmin } = require('../middleware/auth');
const {
  validateCreateCrop,
  validateUpdateCrop,
  validateCropId,
  validateCategory
} = require('../middleware/cropValidation');

// Public routes
router.get('/', cropController.getAllCrops);
router.get('/category/:category', validateCategory, cropController.getCropsByCategory);
router.get('/seasonal', cropController.getSeasonalCrops);
router.get('/:cropId', validateCropId, cropController.getCropById);

// Admin only routes
router.post('/', 
  auth, 
  requireAdmin, 
  validateCreateCrop, 
  cropController.createCrop
);

router.put('/:cropId',
  auth,
  requireAdmin,
  validateUpdateCrop,
  cropController.updateCrop
);

router.delete('/:cropId',
  auth,
  requireAdmin,
  validateCropId,
  cropController.deleteCrop
);

module.exports = router;