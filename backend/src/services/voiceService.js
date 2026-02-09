const { Readable } = require('stream');
const fs = require('fs').promises;
const path = require('path');
const Groq = require('groq-sdk');
const VoiceRecording = require('../models/voiceRecording');
const loggingService = require('./loggingService');
const { AppError } = require('../middleware/errorHandling');

class VoiceService {
  constructor() {
    // Use Groq's Whisper API for transcription (free tier available)
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey) {
      this.groq = new Groq({ apiKey });
    } else {
      console.warn('GROQ_API_KEY not found - voice transcription will not work');
      this.groq = null;
    }
    this.supportedLanguages = new Set(['en', 'fr', 'en-US', 'fr-FR']);
    // Use /tmp for Railway (ephemeral filesystem) or local uploads folder
    this.uploadDir = process.env.NODE_ENV === 'production' 
      ? '/tmp/voice' 
      : path.join(__dirname, '../../uploads/voice');
  }

  async init() {
    // Ensure upload directory exists
    await fs.mkdir(this.uploadDir, { recursive: true });
  }

  async processVoiceRecording(file, userId, language) {
    try {
      // Normalize language
      const langCode = language.split('-')[0];
      if (!['en', 'fr'].includes(langCode)) {
        throw new AppError(`Language ${language} is not supported`, 400);
      }

      // Generate unique filename
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.m4a`;
      const outputPath = path.join(this.uploadDir, filename);

      // Copy the uploaded file
      await fs.copyFile(file.path, outputPath);

      // Create recording record
      const recording = await VoiceRecording.create({
        userId,
        recordingPath: filename,
        language: langCode,
        processingStatus: 'processing'
      });

      // Process transcription using Groq Whisper
      this.transcribeFromFile(recording.id, outputPath, langCode)
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

  async transcribeFromFile(recordingId, audioPath, language) {
    try {
      if (!this.groq) {
        throw new AppError('Groq API not configured', 503);
      }

      const transcription = await this.groq.audio.transcriptions.create({
        file: require('fs').createReadStream(audioPath),
        model: 'whisper-large-v3',
        language: language,
        response_format: 'json',
      });

      await VoiceRecording.update({
        transcription: transcription.text,
        processingStatus: 'completed'
      }, {
        where: { id: recordingId }
      });

      return transcription.text;
    } catch (error) {
      await VoiceRecording.update({
        processingStatus: 'failed',
        metadata: { error: error.message }
      }, {
        where: { id: recordingId }
      });
      throw error;
    }
  }

  // Removed convertAudio and getAudioDuration - not needed with Groq Whisper

  /**
   * Translate text using Groq LLM
   * Used for disease detection translations
   */
  async translateText(text, targetLanguage) {
    try {
      if (!this.groq) {
        throw new AppError('Groq API not configured for translation', 503);
      }

      const langName = targetLanguage === 'fr' ? 'French' : 'English';
      
      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are a translator. Translate the following text to ${langName}. Only output the translation, nothing else.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      const translation = completion.choices[0]?.message?.content?.trim() || text;

      await loggingService.logSystem({
        logLevel: 'info',
        module: 'VoiceService',
        message: 'Successfully translated text with Groq',
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
      // Return original text if translation fails
      return text;
    }
  }

  /**
   * Direct transcription from base64 audio data using Groq Whisper
   * Used for real-time voice input in chat
   */
  async transcribeBase64Audio(audioBase64, language, mimeType = 'audio/m4a') {
    try {
      if (!this.groq) {
        console.error('GROQ_API_KEY not set - voice transcription unavailable');
        throw new AppError('Voice transcription service not configured. Please set GROQ_API_KEY.', 503);
      }

      // Normalize language code (accept both 'fr' and 'fr-FR')
      const langCode = language.split('-')[0]; // 'fr-FR' -> 'fr', 'en-US' -> 'en'
      
      if (!['en', 'fr'].includes(langCode)) {
        throw new AppError(`Language ${language} is not supported. Use English (en) or French (fr).`, 400);
      }

      // Convert base64 to buffer
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      
      console.log('Received audio for transcription:', {
        bufferSize: audioBuffer.length,
        language: langCode,
        mimeType,
        uploadDir: this.uploadDir
      });
      
      // Determine file extension from mimeType
      const extMap = {
        'audio/m4a': 'm4a',
        'audio/mp4': 'm4a',
        'audio/x-m4a': 'm4a',
        'audio/mpeg': 'mp3',
        'audio/mp3': 'mp3',
        'audio/wav': 'wav',
        'audio/webm': 'webm',
        'audio/ogg': 'ogg'
      };
      const ext = extMap[mimeType] || 'm4a';
      
      // Create a temporary file for the audio (Groq requires file upload)
      const tempFilename = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const tempPath = path.join(this.uploadDir, tempFilename);
      
      // Ensure upload directory exists
      await fs.mkdir(this.uploadDir, { recursive: true });
      
      // Write audio to temp file
      await fs.writeFile(tempPath, audioBuffer);
      console.log('Audio file written to:', tempPath);

      try {
        // Use Groq's Whisper API for transcription
        console.log('Calling Groq Whisper API...');
        const transcription = await this.groq.audio.transcriptions.create({
          file: require('fs').createReadStream(tempPath),
          model: 'whisper-large-v3',
          language: langCode, // 'en' or 'fr'
          response_format: 'json',
        });
        
        console.log('Groq Whisper response:', transcription);

        // Clean up temp file
        await fs.unlink(tempPath).catch(() => {});

        const text = transcription.text?.trim() || '';

        await loggingService.logSystem({
          logLevel: 'info',
          module: 'VoiceService',
          message: 'Groq Whisper transcription completed',
          metadata: {
            language: langCode,
            textLength: text.length,
          }
        });

        return { 
          text, 
          confidence: 0.95, // Whisper doesn't return confidence, assume high
          language: langCode 
        };
      } catch (groqError) {
        // Clean up temp file on error
        await fs.unlink(tempPath).catch(() => {});
        console.error('Groq Whisper API error:', {
          message: groqError.message,
          status: groqError.status,
          error: groqError.error,
        });
        throw groqError;
      }
    } catch (error) {
      console.error('Voice transcription failed:', {
        message: error.message,
        stack: error.stack
      });
      await loggingService.logSystem({
        logLevel: 'error',
        module: 'VoiceService',
        message: 'Failed to transcribe audio with Groq Whisper',
        errorDetails: {
          error: error.message,
          language
        }
      });
      throw new AppError(error.message || 'Failed to transcribe audio', error.statusCode || 500);
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