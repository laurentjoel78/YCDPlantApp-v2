const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const imageController = require('../controllers/imageController');
const imageUploadService = require('../services/imageUploadService');

// Plant disease detection routes
router.post(
  '/upload',
  auth,
  imageUploadService.getUploadMiddleware(),
  imageController.uploadPlantImage
);

router.post(
  '/camera',
  auth,
  imageController.uploadCameraImage
);

// Chatbot image processing route
router.post(
  '/chatbot/process-image',
  auth,
  imageUploadService.getUploadMiddleware(),
  imageController.processChatbotImage
);

module.exports = router;