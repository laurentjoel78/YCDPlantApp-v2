const express = require('express');
const multer = require('multer');
const path = require('path');
const { auth } = require('../middleware/auth');
const { checkVoiceConfig, validateLanguage } = require('../middleware/voiceConfigMiddleware');
const voiceConfig = require('../config/voiceConfig');
const {
  uploadVoiceRecording,
  getVoiceRecording,
  listVoiceRecordings,
  deleteVoiceRecording,
  translateText,
  transcribeAudio
} = require('../controllers/voiceController');

const router = express.Router();

// Configure multer for voice uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, voiceConfig.upload.tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (voiceConfig.upload.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported audio format'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: voiceConfig.upload.maxFileSize
  }
});

// Apply protection to all routes
router.use(auth);

// Apply voice configuration check to all routes
router.use(checkVoiceConfig);

// Voice recording routes
router.post('/', validateLanguage, upload.single('audio'), uploadVoiceRecording);
router.get('/', listVoiceRecordings);
router.get('/:id', getVoiceRecording);
router.delete('/:id', deleteVoiceRecording);

// Translation route
router.post('/translate', validateLanguage, translateText);

// Direct transcription route (for real-time voice chat)
router.post('/transcribe', transcribeAudio);

// Language support information
router.get('/languages', (req, res) => {
  res.json({
    status: 'success',
    data: {
      languages: voiceConfig.supportedLanguages,
      features: voiceConfig.features
    }
  });
});

module.exports = router;