const TextToSpeechService = require('../services/textToSpeechService');
const { asyncHandler } = require('../utils/asyncHandler');
const { validateSchema } = require('../middleware/schemaValidator');

const synthesizeSchema = {
  type: 'object',
  required: ['text', 'language'],
  properties: {
    text: { 
      type: 'string',
      minLength: 1,
      maxLength: 5000
    },
    language: { 
      type: 'string',
      minLength: 2
    },
    gender: {
      type: 'string',
      enum: ['MALE', 'FEMALE', 'NEUTRAL'],
      default: 'NEUTRAL'
    }
  }
};

class TextToSpeechController {
  async synthesize(req, res) {
    const { text, language, gender } = req.body;

    const result = await TextToSpeechService.generateSpeech(text, language, gender);

    // Stream the audio file
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('X-Cache-Hit', result.cached);
    
    const fileStream = require('fs').createReadStream(result.audioPath);
    fileStream.pipe(res);
  }

  async cleanCache(req, res) {
    const { days } = req.query;
    const maxAge = (parseInt(days) || 7) * 24 * 60 * 60 * 1000;
    
    await TextToSpeechService.cleanCache(maxAge);
    
    res.json({
      success: true,
      message: 'Cache cleanup completed'
    });
  }
}

const controller = new TextToSpeechController();

module.exports = {
  synthesize: [
    validateSchema(synthesizeSchema),
    asyncHandler(controller.synthesize)
  ],
  cleanCache: asyncHandler(controller.cleanCache)
};