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
   * Transcribe audio from an uploaded file (multipart upload)
   * No base64 encoding/decoding - file is written directly by multer
   * Converts to WAV via ffmpeg then sends to Groq Whisper
   */
  async transcribeFileUpload(filePath, language, mimeType = 'audio/m4a') {
    try {
      if (!this.groq) {
        throw new AppError('Voice transcription service not configured.', 503);
      }

      const langCode = language.split('-')[0];
      if (!['en', 'fr'].includes(langCode)) {
        throw new AppError(`Language ${language} is not supported.`, 400);
      }

      const fsSync = require('fs');
      const fileStats = fsSync.statSync(filePath);
      
      // Read first 16 bytes for format detection
      const fd = fsSync.openSync(filePath, 'r');
      const headerBuf = Buffer.alloc(16);
      fsSync.readSync(fd, headerBuf, 0, 16, 0);
      fsSync.closeSync(fd);
      const headerHex = headerBuf.toString('hex');
      
      console.log('transcribeFileUpload:', {
        filePath,
        fileSize: fileStats.size,
        language: langCode,
        mimeType,
        headerHex,
        headerAscii: headerBuf.toString('ascii').replace(/[^\x20-\x7E]/g, '.'),
      });

      // Convert to WAV via ffmpeg (Groq accepts WAV reliably)
      const ffmpegPath = require('ffmpeg-static');
      const { execSync } = require('child_process');
      const wavFile = filePath.replace(/\.[^.]+$/, '.wav');
      
      console.log('Converting uploaded audio to WAV via ffmpeg...');
      let useWav = false;
      try {
        const ffmpegCmd = `"${ffmpegPath}" -i "${filePath}" -acodec pcm_s16le -ar 16000 -ac 1 -y "${wavFile}"`;
        execSync(ffmpegCmd, { timeout: 15000, stdio: 'pipe' });
        const wavStats = fsSync.statSync(wavFile);
        console.log('WAV conversion successful. WAV size:', wavStats.size);
        useWav = true;
      } catch (ffErr) {
        console.error('ffmpeg conversion failed:', ffErr.message);
        if (ffErr.stderr) console.error('ffmpeg stderr:', ffErr.stderr.toString().substring(0, 500));
      }

      const fileToSend = useWav ? wavFile : filePath;
      const sendMime = useWav ? 'audio/wav' : mimeType;
      const sendExt = useWav ? 'wav' : (filePath.split('.').pop() || 'm4a');
      console.log('Sending to Groq:', { file: fileToSend, ext: sendExt, mime: sendMime });

      // Upload to Groq via axios + form-data
      const axios = require('axios');
      const FormData = require('form-data');
      
      const form = new FormData();
      form.append('file', fsSync.createReadStream(fileToSend), {
        filename: `audio.${sendExt}`,
        contentType: sendMime,
      });
      form.append('model', 'whisper-large-v3');
      form.append('language', langCode);
      form.append('response_format', 'json');

      let transcription;
      try {
        const response = await axios.post(
          'https://api.groq.com/openai/v1/audio/transcriptions',
          form,
          {
            headers: {
              'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
              ...form.getHeaders(),
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 30000,
          }
        );
        console.log('Groq Whisper response status:', response.status);
        transcription = response.data;
      } catch (axiosError) {
        const status = axiosError.response?.status || 'unknown';
        const body = axiosError.response?.data ? JSON.stringify(axiosError.response.data) : axiosError.message;
        console.error('Groq API error:', { status, body: body.substring(0, 500) });
        throw new Error(`Groq API error ${status}: ${body}`);
      }

      // Clean up WAV file
      if (useWav) await fs.unlink(wavFile).catch(() => {});

      const text = transcription.text?.trim() || '';
      console.log('Transcription result:', text.substring(0, 200));

      await loggingService.logSystem({
        logLevel: 'info',
        module: 'VoiceService',
        message: 'File upload transcription completed',
        metadata: { language: langCode, textLength: text.length }
      });

      return { text, confidence: 0.95, language: langCode };
    } catch (error) {
      console.error('File upload transcription failed:', { message: error.message });
      await loggingService.logSystem({
        logLevel: 'error',
        module: 'VoiceService',
        message: 'Failed to transcribe uploaded audio',
        errorDetails: { error: error.message, language }
      });
      throw new AppError(error.message || 'Failed to transcribe audio', error.statusCode || 500);
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
      
      const fsSync = require('fs');
      console.log('Wrote temp audio file:', tmpFile, 'size:', audioBuffer.length);

      // Convert ANY format to WAV using ffmpeg (Groq accepts WAV reliably)
      const ffmpegPath = require('ffmpeg-static');
      const { execSync } = require('child_process');
      const wavFile = tmpFile.replace(/\.[^.]+$/, '.wav');
      
      console.log('Converting audio to WAV via ffmpeg...');
      console.log('ffmpeg path:', ffmpegPath);
      
      try {
        const ffmpegCmd = `"${ffmpegPath}" -i "${tmpFile}" -acodec pcm_s16le -ar 16000 -ac 1 -y "${wavFile}"`;
        execSync(ffmpegCmd, { timeout: 15000, stdio: 'pipe' });
        const wavStats = fsSync.statSync(wavFile);
        console.log('WAV conversion successful. WAV size:', wavStats.size);
      } catch (ffmpegError) {
        console.error('ffmpeg conversion failed:', ffmpegError.message);
        if (ffmpegError.stderr) console.error('ffmpeg stderr:', ffmpegError.stderr.toString());
        // Fall back to sending original file
        console.log('Falling back to original file format...');
      }

      // Use the WAV file if conversion succeeded, otherwise use original
      const fileToSend = fsSync.existsSync(wavFile) ? wavFile : tmpFile;
      const sendExt = fsSync.existsSync(wavFile) ? 'wav' : detectedExt;
      const sendMime = fsSync.existsSync(wavFile) ? 'audio/wav' : detectedMime;
      console.log('Sending to Groq:', { file: fileToSend, ext: sendExt, mime: sendMime });

      // Upload to Groq via axios + form-data
      const axios = require('axios');
      const FormData = require('form-data');
      
      const form = new FormData();
      form.append('file', fsSync.createReadStream(fileToSend), {
        filename: `audio.${sendExt}`,
        contentType: sendMime,
      });
      form.append('model', 'whisper-large-v3');
      form.append('language', langCode);
      form.append('response_format', 'json');

      let transcription;
      try {
        const response = await axios.post(
          'https://api.groq.com/openai/v1/audio/transcriptions',
          form,
          {
            headers: {
              'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
              ...form.getHeaders(),
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 30000,
          }
        );
        console.log('Groq Whisper response status:', response.status);
        console.log('Groq Whisper transcription:', JSON.stringify(response.data).substring(0, 500));
        transcription = response.data;
      } catch (axiosError) {
        const status = axiosError.response?.status || 'unknown';
        const body = axiosError.response?.data ? JSON.stringify(axiosError.response.data) : axiosError.message;
        console.error('Groq API error:', { status, body: body.substring(0, 500) });
        throw new Error(`Groq API error ${status}: ${body}`);
      }

      // Clean up temp files
      await fs.unlink(tmpFile).catch(() => {});
      await fs.unlink(wavFile).catch(() => {});

      const text = transcription.text?.trim() || '';
      console.log('Transcription result:', text.substring(0, 200));

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

  /**
   * Generate a minimal valid WAV file with a 440Hz tone (1 second)
   * Used for diagnostic testing of the Groq API
   */
  _generateTestWav() {
    const sampleRate = 16000;
    const duration = 2; // seconds - long enough for Groq to accept
    const numSamples = sampleRate * duration;
    const bitsPerSample = 16;
    const numChannels = 1;
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const dataSize = numSamples * blockAlign;
    
    const buffer = Buffer.alloc(44 + dataSize);
    
    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);
    
    // fmt chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);        // PCM
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    
    // data chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);
    
    // Generate 440Hz sine wave at 50% volume
    for (let i = 0; i < numSamples; i++) {
      const sample = Math.round(16383 * Math.sin(2 * Math.PI * 440 * i / sampleRate));
      buffer.writeInt16LE(sample, 44 + i * 2);
    }
    
    return buffer;
  }
}

module.exports = new VoiceService();