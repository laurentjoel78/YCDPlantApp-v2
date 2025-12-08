const path = require('path');

const voiceConfig = {
  // Speech-to-Text and Translation credentials will be loaded from environment variables:
  // GOOGLE_APPLICATION_CREDENTIALS should point to your JSON credentials file
  
  // Supported languages
  supportedLanguages: [
    {
      code: 'en-US',
      name: 'English (US)',
      supported: {
        speech: true,
        translation: true
      }
    },
    {
      code: 'ta-IN',
      name: 'Tamil',
      supported: {
        speech: true,
        translation: true
      }
    },
    {
      code: 'hi-IN',
      name: 'Hindi',
      supported: {
        speech: true,
        translation: true
      }
    },
    {
      code: 'te-IN',
      name: 'Telugu',
      supported: {
        speech: true,
        translation: true
      }
    },
    {
      code: 'kn-IN',
      name: 'Kannada',
      supported: {
        speech: true,
        translation: true
      }
    }
  ],

  // Upload configuration
  upload: {
    tempDir: path.join(__dirname, '../../uploads/temp'),
    storageDir: path.join(__dirname, '../../uploads/voice'),
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'audio/wav',
      'audio/mp3',
      'audio/mpeg',
      'audio/ogg',
      'audio/webm'
    ]
  },

  // Audio processing configuration
  audio: {
    outputFormat: 'wav',
    sampleRate: 16000,
    channels: 1
  },

  // Feature flags (for graceful degradation when services are unavailable)
  features: {
    transcription: false, // Will be enabled when credentials are configured
    translation: false,   // Will be enabled when credentials are configured
    audioProcessing: true
  }
};

module.exports = voiceConfig;