const path = require('path');

const voiceConfig = {
  // Speech-to-Text using Groq Whisper API
  
  // Supported languages
  supportedLanguages: [
    {
      code: 'en',
      name: 'English',
      supported: {
        speech: true,
        translation: true
      }
    },
    {
      code: 'en-US',
      name: 'English (US)',
      supported: {
        speech: true,
        translation: true
      }
    },
    {
      code: 'fr',
      name: 'French',
      supported: {
        speech: true,
        translation: true
      }
    },
    {
      code: 'fr-FR',
      name: 'French (France)',
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
      'audio/webm',
      'audio/m4a',
      'audio/mp4',
      'audio/x-m4a'
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
    transcription: true,  // Enabled - using Groq Whisper API
    translation: true,    // Enabled - using Groq LLM
    audioProcessing: true
  }
};

module.exports = voiceConfig;