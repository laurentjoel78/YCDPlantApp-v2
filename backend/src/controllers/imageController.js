const imageUploadService = require('../services/imageUploadService');
const diseaseDetectionService = require('../services/diseaseDetectionService');
const { asyncHandler } = require('../middleware/asyncHandler');
const { ApiError } = require('../utils/apiError');

exports.uploadPlantImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError('No image file provided', 400);
  }

  // Process the uploaded image
  const processedImage = await imageUploadService.processUploadedImage(req.file);
  
  // Validate the processed image
  const imageMetadata = await imageUploadService.validateImage(processedImage.filepath);

  // Run disease detection
  const detectionResult = await diseaseDetectionService.detectDisease(processedImage.filepath);

  res.status(200).json({
    success: true,
    data: {
      image: {
        filename: processedImage.filename,
        ...imageMetadata
      },
      detection: detectionResult
    }
  });
});

exports.uploadCameraImage = asyncHandler(async (req, res) => {
  const { image } = req.body;

  if (!image) {
    throw new ApiError('No camera image provided', 400);
  }

  // Save and process the base64 image
  const processedImage = await imageUploadService.saveBase64Image(image, req.user.id);
  
  // Validate the processed image
  const imageMetadata = await imageUploadService.validateImage(processedImage.filepath);

  // Run disease detection
  const detectionResult = await diseaseDetectionService.detectDisease(processedImage.filepath);

  res.status(200).json({
    success: true,
    data: {
      image: {
        filename: processedImage.filename,
        ...imageMetadata
      },
      detection: detectionResult
    }
  });
});

exports.processChatbotImage = asyncHandler(async (req, res) => {
  let processedImage;
  
  // Handle both file uploads and camera captures
  if (req.file) {
    processedImage = await imageUploadService.processUploadedImage(req.file);
  } else if (req.body.image) {
    processedImage = await imageUploadService.saveBase64Image(req.body.image, req.user.id);
  } else {
    throw new ApiError('No image provided', 400);
  }

  // Validate the processed image
  const imageMetadata = await imageUploadService.validateImage(processedImage.filepath);

  // Run disease detection
  const detectionResult = await diseaseDetectionService.detectDisease(processedImage.filepath);

  // Format response for chatbot
  const response = {
    type: 'plant-analysis',
    content: {
      detection: detectionResult,
      recommendations: await diseaseDetectionService.getRecommendations(detectionResult.disease),
      image: {
        url: `/uploads/plants/${processedImage.filename}`,
        ...imageMetadata
      }
    },
    metadata: {
      confidence: detectionResult.confidence,
      processingTime: detectionResult.processingTime
    }
  };

  res.status(200).json({
    success: true,
    data: response
  });
});