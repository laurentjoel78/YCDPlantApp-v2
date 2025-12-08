const express = require('express');
const router = express.Router();
const {
  getFarmerFarms,
  getFarm,
  createFarm,
  updateFarm,
  deleteFarm,
  addCropToFarm
} = require('../controllers/farmController');
const { auth } = require('../middleware/auth');
const {
  farmValidation,
  farmIdValidation,
  farmCropValidation
} = require('../middleware/farmValidation');

// All routes require authentication
router.use(auth);

// Farm routes
router.get('/', getFarmerFarms);
router.get('/:farmId', farmIdValidation, getFarm);
router.post('/', farmValidation, createFarm);
router.put('/:farmId', farmIdValidation, farmValidation, updateFarm);
router.delete('/:farmId', farmIdValidation, deleteFarm);

// Farm crop routes
router.post('/:farmId/crops', farmIdValidation, farmCropValidation, addCropToFarm);

module.exports = router;