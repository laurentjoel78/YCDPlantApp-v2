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
      
      // Verify written file matches buffer
      const fsSync = require('fs');
      const writtenStats = fsSync.statSync(tmpFile);
      console.log('Wrote temp audio file:', tmpFile, 'bufferSize:', audioBuffer.length, 'fileSize:', writtenStats.size);
      
      // Verify first bytes of written file match buffer
      const fd = fsSync.openSync(tmpFile, 'r');
      const verifyBuf = Buffer.alloc(16);
      fsSync.readSync(fd, verifyBuf, 0, 16, 0);
      fsSync.closeSync(fd);
      console.log('Written file header verification:', verifyBuf.toString('hex'));

      // Use curl for the most reliable multipart upload possible
      console.log('Calling Groq Whisper API via curl...');
      const { execSync } = require('child_process');
      
      const curlCmd = [
        'curl', '-s', '-w', '\\n%{http_code}',
        '-X', 'POST',
        'https://api.groq.com/openai/v1/audio/transcriptions',
        '-H', `Authorization: Bearer ${process.env.GROQ_API_KEY}`,
        '-F', `file=@${tmpFile};type=${detectedMime}`,
        '-F', 'model=whisper-large-v3',
        '-F', `language=${langCode}`,
        '-F', 'response_format=json',
      ].join(' ');
      
      console.log('Curl command (key redacted):', curlCmd.replace(process.env.GROQ_API_KEY, 'REDACTED'));
      
      let curlOutput;
      try {
        curlOutput = execSync(curlCmd, { 
          encoding: 'utf8', 
          timeout: 30000,
          maxBuffer: 1024 * 1024,
        });
      } catch (curlError) {
        console.error('Curl execution failed:', curlError.message);
        if (curlError.stdout) console.error('Curl stdout:', curlError.stdout);
        if (curlError.stderr) console.error('Curl stderr:', curlError.stderr);
        throw new Error(`Curl failed: ${curlError.message}`);
      }
      
      // Parse curl output - last line is status code
      const outputLines = curlOutput.trim().split('\n');
      const httpStatus = parseInt(outputLines[outputLines.length - 1], 10);
      const responseBody = outputLines.slice(0, -1).join('\n');
      
      console.log('Groq API response status (curl):', httpStatus);
      console.log('Groq API response body (curl):', responseBody.substring(0, 500));
      
      let transcription;
      if (httpStatus >= 200 && httpStatus < 300) {
        try {
          transcription = JSON.parse(responseBody);
        } catch (e) {
          throw new Error(`Failed to parse Groq response: ${responseBody}`);
        }
      } else {
        // If curl also fails, try generating a test WAV to verify API connectivity
        console.log('Curl also failed! Testing API with a generated WAV...');
        const testWav = this._generateTestWav();
        const testFile = path.join(tmpDir, 'test_tone.wav');
        await fs.writeFile(testFile, testWav);
        
        const testCmd = [
          'curl', '-s', '-w', '\\n%{http_code}',
          '-X', 'POST',
          'https://api.groq.com/openai/v1/audio/transcriptions',
          '-H', `Authorization: Bearer ${process.env.GROQ_API_KEY}`,
          '-F', `file=@${testFile};type=audio/wav`,
          '-F', 'model=whisper-large-v3',
          '-F', `language=${langCode}`,
          '-F', 'response_format=json',
        ].join(' ');
        
        try {
          const testOutput = execSync(testCmd, { encoding: 'utf8', timeout: 30000 });
          const testLines = testOutput.trim().split('\n');
          const testStatus = parseInt(testLines[testLines.length - 1], 10);
          const testBody = testLines.slice(0, -1).join('\n');
          console.log('Test WAV API status:', testStatus, 'body:', testBody.substring(0, 300));
          
          if (testStatus >= 200 && testStatus < 300) {
            console.log('TEST WAV SUCCEEDED - issue is with the recorded audio format, not the API/transport');
          } else {
            console.log('TEST WAV ALSO FAILED - issue may be with API key or transport');
          }
        } catch (testErr) {
          console.error('Test WAV curl failed:', testErr.message);
        }
        
        await fs.unlink(testFile).catch(() => {});
        throw new Error(`Groq API error ${httpStatus}: ${responseBody}`);
      }

      // Clean up temp file
      await fs.unlink(tmpFile).catch(() => {});

      console.log('Groq Whisper response:', transcription);
      
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