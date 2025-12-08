const DiseaseDetectionService = require('../services/diseaseDetectionService');
const { asyncHandler } = require('../utils/asyncHandler');
const multer = require('multer');
const path = require('path');
const auditService = require('../services/auditService');

// Configure multer for image upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, and PNG files are allowed'));
    }
  }
}).single('image');

class DiseaseDetectionController {
  async detectDisease(req, res) {
    // Fallback to console if logger not attached to request
    const logger = (req.log && req.log.child)
      ? req.log.child({ controller: 'DiseaseDetectionController', method: 'detectDisease' })
      : console;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    try {
      const detectionResult = await DiseaseDetectionService.detectDisease(
        req.file.buffer,
        logger
      );

      const language = req.headers['accept-language']?.startsWith('fr') ? 'fr' : 'en';
      let finalResult = {
        disease: detectionResult.disease,
        confidence: detectionResult.confidence,
        description: detectionResult.description,
        treatment: detectionResult.treatment
      };

      // Translate if requested language is French
      if (language === 'fr') {
        try {
          const voiceService = require('../services/voiceService');
          const [diseaseFr, descriptionFr, treatmentFr] = await Promise.all([
            voiceService.translateText(detectionResult.disease, 'fr'),
            voiceService.translateText(detectionResult.description, 'fr'),
            voiceService.translateText(detectionResult.treatment, 'fr')
          ]);

          finalResult.disease = diseaseFr;
          finalResult.description = descriptionFr;
          finalResult.treatment = treatmentFr;
        } catch (transError) {
          logger.warn('Translation failed, returning English', { error: transError.message });
          // Fallback to English is already set in finalResult
        }
      }

      // Log activity
      await auditService.logUserAction({
        userId: req.user ? req.user.id : null, // Handle potential unauthenticated scans if allowed
        userRole: req.user ? req.user.role : 'guest',
        actionType: 'DISEASE_SCAN',
        actionDescription: 'Performed disease detection scan',
        req,
        metadata: {
          disease: detectionResult.disease,
          confidence: detectionResult.confidence,
          filename: req.file.originalname,
          language
        }
      });

      // Format response for frontend
      res.json({
        success: true,
        ...finalResult
      });
    } catch (error) {
      if (logger.error) {
        logger.error('Disease detection failed', {
          error: error.message,
          stack: error.stack
        });
      }
      throw error;
    }
  }
}

const controller = new DiseaseDetectionController();

module.exports = {
  detectDisease: [
    (req, res, next) => {
      const logger = req.log || console;

      upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`
          });
        } else if (err) {
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }

        next();
      });
    },
    asyncHandler(controller.detectDisease.bind(controller))
  ]
};