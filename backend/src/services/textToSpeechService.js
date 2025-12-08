const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { google } = require('@google-cloud/text-to-speech');
const LanguagePack = require('../models/languagePack');

class TextToSpeechService {
  constructor() {
    this.client = new google.TextToSpeechClient();
    this.cacheDir = path.join(__dirname, '../../cache/audio');
  }

  async ensureCacheDirectory() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  async generateSpeech(text, language, gender = 'NEUTRAL') {
    try {
      // Check cache first
      const cacheKey = this._generateCacheKey(text, language, gender);
      const cachedPath = path.join(this.cacheDir, `${cacheKey}.mp3`);

      try {
        await fs.access(cachedPath);
        return {
          audioPath: cachedPath,
          cached: true
        };
      } catch {
        // File doesn't exist in cache, continue with generation
      }

      // Check if we have a local language pack
      const localPack = await this._checkLocalLanguagePack(language);
      if (localPack) {
        return await this._generateFromLocalPack(text, localPack);
      }

      // Use Google Cloud TTS if no local pack available
      const request = {
        input: { text },
        voice: {
          languageCode: this._mapToGoogleLanguage(language),
          ssmlGender: gender
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: 0.9,
          pitch: 0
        },
      };

      const [response] = await this.client.synthesizeSpeech(request);
      await this.ensureCacheDirectory();
      await fs.writeFile(cachedPath, response.audioContent, 'binary');

      return {
        audioPath: cachedPath,
        cached: false
      };
    } catch (error) {
      throw new Error(`Text-to-speech generation failed: ${error.message}`);
    }
  }

  async _checkLocalLanguagePack(language) {
    try {
      return await LanguagePack.findOne({
        where: {
          language,
          type: 'tts',
          status: 'active'
        }
      });
    } catch (error) {
      console.error('Error checking local language pack:', error);
      return null;
    }
  }

  async _generateFromLocalPack(text, languagePack) {
    // Implementation for local TTS generation using language pack
    // This would use pre-recorded audio segments or a local TTS model
    // Placeholder for future implementation
    throw new Error('Local TTS generation not yet implemented');
  }

  _generateCacheKey(text, language, gender) {
    const hash = require('crypto')
      .createHash('md5')
      .update(`${text}-${language}-${gender}`)
      .digest('hex');
    return hash;
  }

  _mapToGoogleLanguage(language) {
    // Map our language codes to Google's language codes
    const languageMap = {
      'en': 'en-US',
      'fr': 'fr-FR',
      'bam': 'fr-FR', // Fallback for Bamanankan
      'ful': 'fr-FR', // Fallback for Fula
      // Add more mappings as needed
    };
    return languageMap[language] || 'en-US';
  }

  async cleanCache(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days default
    try {
      const files = await fs.readdir(this.cacheDir);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtimeMs > maxAge) {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      console.error('Cache cleanup failed:', error);
    }
  }
}

module.exports = new TextToSpeechService();