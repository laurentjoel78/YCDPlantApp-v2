const { Readable } = require('stream');
const fs = require('fs').promises;
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const speech = require('@google-cloud/speech');
const { Translate } = require('@google-cloud/translate').v2;
const VoiceRecording = require('../models/voiceRecording');
const loggingService = require('./loggingService');
const { AppError } = require('../middleware/errorHandling');

class VoiceService {
  constructor() {
    this.speechClient = new speech.SpeechClient();
    this.translateClient = new Translate();
    this.supportedLanguages = new Set(['en-US', 'fr-FR', 'ta-IN', 'hi-IN', 'te-IN', 'kn-IN']);
    this.uploadDir = path.join(__dirname, '../../uploads/voice');
  }

  async init() {
    // Ensure upload directory exists
    await fs.mkdir(this.uploadDir, { recursive: true });
  }

  async processVoiceRecording(file, userId, language) {
    try {
      if (!this.supportedLanguages.has(language)) {
        throw new AppError(`Language ${language} is not supported`, 400);
      }

      // Generate unique filename
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.wav`;
      const outputPath = path.join(this.uploadDir, filename);

      // Convert to WAV format suitable for Google Speech-to-Text
      await this.convertAudio(file.path, outputPath);

      // Create recording record
      const recording = await VoiceRecording.create({
        userId,
        recordingPath: filename,
        language,
        duration: await this.getAudioDuration(outputPath),
        processingStatus: 'processing'
      });

      // Process in background
      this.transcribeAudio(recording.id, outputPath, language)
        .catch(error => {
          loggingService.logSystem({
            logLevel: 'error',
            module: 'VoiceService',
            message: 'Failed to transcribe audio',
            errorDetails: {
              recordingId: recording.id,
              error: error.message
            }
          });
        });

      return recording;
    } catch (error) {
      await loggingService.logSystem({
        logLevel: 'error',
        module: 'VoiceService',
        message: 'Error processing voice recording',
        errorDetails: {
          error: error.message,
          stack: error.stack
        }
      });
      throw error;
    }
  }

  async convertAudio(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('wav')
        .audioChannels(1)
        .audioFrequency(16000)
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });
  }

  async getAudioDuration(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (error, metadata) => {
        if (error) reject(error);
        else resolve(Math.ceil(metadata.format.duration));
      });
    });
  }

  async transcribeAudio(recordingId, audioPath, language) {
    try {
      const audioBytes = await fs.readFile(audioPath);

      const audio = {
        content: audioBytes.toString('base64')
      };

      const config = {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: language,
        model: 'default',
        enableAutomaticPunctuation: true
      };

      const request = {
        audio,
        config
      };

      const [response] = await this.speechClient.recognize(request);
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');

      await VoiceRecording.update({
        transcription,
        processingStatus: 'completed'
      }, {
        where: { id: recordingId }
      });

      await loggingService.logSystem({
        logLevel: 'info',
        module: 'VoiceService',
        message: 'Successfully transcribed audio',
        metadata: {
          recordingId,
          language
        }
      });

      return transcription;
    } catch (error) {
      await VoiceRecording.update({
        processingStatus: 'failed',
        metadata: {
          error: error.message
        }
      }, {
        where: { id: recordingId }
      });

      throw error;
    }
  }

  async translateText(text, targetLanguage) {
    try {
      const [translation] = await this.translateClient.translate(text, targetLanguage);

      await loggingService.logSystem({
        logLevel: 'info',
        module: 'VoiceService',
        message: 'Successfully translated text',
        metadata: {
          targetLanguage,
          textLength: text.length
        }
      });

      return translation;
    } catch (error) {
      await loggingService.logSystem({
        logLevel: 'error',
        module: 'VoiceService',
        message: 'Failed to translate text',
        errorDetails: {
          error: error.message,
          targetLanguage
        }
      });
      throw error;
    }
  }

  /**
   * Direct transcription from base64 audio data
   * Used for real-time voice input in chat
   */
  async transcribeBase64Audio(audioBase64, language, mimeType = 'audio/m4a') {
    try {
      if (!this.supportedLanguages.has(language)) {
        throw new AppError(`Language ${language} is not supported`, 400);
      }

      // Map MIME types to Google encoding formats
      const encodingMap = {
        'audio/m4a': 'MP3',
        'audio/mp4': 'MP3',
        'audio/mpeg': 'MP3',
        'audio/wav': 'LINEAR16',
        'audio/webm': 'WEBM_OPUS',
        'audio/ogg': 'OGG_OPUS',
      };

      const encoding = encodingMap[mimeType] || 'MP3';

      const audio = {
        content: audioBase64
      };

      const config = {
        encoding,
        languageCode: language,
        model: language === 'fr-FR' ? 'default' : 'default',
        enableAutomaticPunctuation: true,
        // Allow alternative languages for better accuracy
        alternativeLanguageCodes: language === 'fr-FR' ? ['en-US'] : ['fr-FR'],
      };

      // Only set sample rate for LINEAR16 encoding
      if (encoding === 'LINEAR16') {
        config.sampleRateHertz = 16000;
      }

      const request = {
        audio,
        config
      };

      const [response] = await this.speechClient.recognize(request);
      
      if (!response.results || response.results.length === 0) {
        return { text: '', confidence: 0 };
      }

      const transcription = response.results
        .map(result => result.alternatives[0]?.transcript || '')
        .join(' ')
        .trim();

      const confidence = response.results[0]?.alternatives[0]?.confidence || 0;

      await loggingService.logSystem({
        logLevel: 'info',
        module: 'VoiceService',
        message: 'Direct voice transcription completed',
        metadata: {
          language,
          textLength: transcription.length,
          confidence
        }
      });

      return { 
        text: transcription, 
        confidence,
        language 
      };
    } catch (error) {
      await loggingService.logSystem({
        logLevel: 'error',
        module: 'VoiceService',
        message: 'Failed to transcribe base64 audio',
        errorDetails: {
          error: error.message,
          language
        }
      });
      throw error;
    }
  }

  async getVoiceRecording(id, userId) {
    const recording = await VoiceRecording.findOne({
      where: { id, userId }
    });

    if (!recording) {
      throw new AppError('Voice recording not found', 404);
    }

    return recording;
  }

  async listVoiceRecordings(userId, filters = {}) {
    const where = { userId };

    if (filters.status) {
      where.processingStatus = filters.status;
    }
    if (filters.language) {
      where.language = filters.language;
    }

    return await VoiceRecording.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });
  }

  async deleteVoiceRecording(id, userId) {
    const recording = await this.getVoiceRecording(id, userId);
    
    try {
      // Delete file
      await fs.unlink(path.join(this.uploadDir, recording.recordingPath));
      
      // Delete record
      await recording.destroy();

      await loggingService.logSystem({
        logLevel: 'info',
        module: 'VoiceService',
        message: 'Deleted voice recording',
        metadata: {
          recordingId: id,
          userId
        }
      });
    } catch (error) {
      await loggingService.logSystem({
        logLevel: 'error',
        module: 'VoiceService',
        message: 'Failed to delete voice recording',
        errorDetails: {
          error: error.message,
          recordingId: id
        }
      });
      throw error;
    }
  }
}

module.exports = new VoiceService();