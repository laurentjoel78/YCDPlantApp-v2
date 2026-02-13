const { Readable } = require('stream');
const fs = require('fs').promises;
const path = require('path');
const Groq = require('groq-sdk');
const { toFile } = require('groq-sdk');
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
   * Uses in-memory buffer (no filesystem needed - works on Railway)
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

      // Convert base64 to buffer - strip data URI prefix if present
      let cleanBase64 = audioBase64;
      if (cleanBase64.includes(',')) {
        cleanBase64 = cleanBase64.split(',')[1];
      }
      const audioBuffer = Buffer.from(cleanBase64, 'base64');
      
      // Log first bytes for format detection
      const header = audioBuffer.slice(0, 16);
      const headerHex = header.toString('hex');
      const headerAscii = header.toString('ascii').replace(/[^\x20-\x7E]/g, '.');
      console.log('Audio buffer debug:', {
        bufferSize: audioBuffer.length,
        language: langCode,
        mimeType,
        headerHex,
        headerAscii,
        first4bytes: headerHex.substring(0, 8),
      });

      // Detect actual format from magic bytes
      let detectedExt = 'm4a';
      let detectedMime = mimeType || 'audio/m4a';
      
      if (headerHex.startsWith('52494646')) { // RIFF = WAV
        detectedExt = 'wav';
        detectedMime = 'audio/wav';
      } else if (headerHex.startsWith('fff1') || headerHex.startsWith('fff9') || headerHex.startsWith('fff3') || headerHex.startsWith('ffe3')) { // AAC ADTS raw
        detectedExt = 'aac';
        detectedMime = 'audio/aac';
      } else if (headerHex.startsWith('4944330') || headerHex.startsWith('fffb') || headerHex.startsWith('fff3')) { // ID3/MP3
        detectedExt = 'mp3';
        detectedMime = 'audio/mpeg';
      } else if (headerHex.startsWith('1a45dfa3')) { // EBML = WebM/MKV
        detectedExt = 'webm';
        detectedMime = 'audio/webm';
      } else if (headerHex.startsWith('4f676753')) { // OggS
        detectedExt = 'ogg';
        detectedMime = 'audio/ogg';
      } else if (headerHex.startsWith('664c6143')) { // fLaC
        detectedExt = 'flac';
        detectedMime = 'audio/flac';
      } else if (headerHex.substring(8, 16) === '66747970') { // ftyp at offset 4 = MP4/M4A
        detectedExt = 'm4a';
        detectedMime = 'audio/mp4';
      } else if (headerHex.substring(0, 6) === '000000') { // Another MP4 variant
        detectedExt = 'mp4';
        detectedMime = 'audio/mp4';
      }
      
      console.log('Detected audio format:', { detectedExt, detectedMime, requestedMime: mimeType });

      // Write buffer to temp file
      const tmpDir = '/tmp/voice';
      await fs.mkdir(tmpDir, { recursive: true });
      const tmpFile = path.join(tmpDir, `transcribe_${Date.now()}.${detectedExt}`);
      await fs.writeFile(tmpFile, audioBuffer);
      console.log('Wrote temp audio file:', tmpFile, 'size:', audioBuffer.length);

      // Use Groq's Whisper API for transcription with file stream
      console.log('Calling Groq Whisper API...');
      const fsSync = require('fs');
      const transcription = await this.groq.audio.transcriptions.create({
        file: fsSync.createReadStream(tmpFile),
        model: 'whisper-large-v3',
        language: langCode,
        response_format: 'json',
      });

      // Clean up temp file
      await fs.unlink(tmpFile).catch(() => {});
      
      console.log('Groq Whisper response:', transcription);

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