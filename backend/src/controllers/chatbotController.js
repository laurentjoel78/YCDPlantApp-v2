const ChatbotService = require('../services/chatbotService');
const { asyncHandler } = require('../utils/asyncHandler');
const { validateSchema } = require('../middleware/schemaValidator');

const messageSchema = {
  type: 'object',
  required: ['message'],
  properties: {
    message: {
      type: 'string',
      minLength: 1,
      maxLength: 1000
    },
    language: {
      type: 'string',
      minLength: 2
    },
    isVoice: {
      type: 'boolean',
      default: false
    },
    farmId: {
      type: 'string',
      format: 'uuid'
    }
  }
};

class ChatbotController {
  async processMessage(req, res) {
    const { message, language, isVoice, farmId: requestedFarmId } = req.body;
    const userId = req.user.id; // From auth middleware

    // Get farm ID associated with user if not provided
    let farmId = requestedFarmId;
    if (!farmId) {
      const { Farm } = require('../models');
      const farm = await Farm.findOne({ where: { user_id: userId } });
      if (farm) {
        farmId = farm.id;
      }
    }

    const response = await ChatbotService.processMessage(
      userId,
      message,
      farmId,
      language,
      isVoice
    );

    // If voice response, stream audio
    if (isVoice && response.audioPath) {
      res.setHeader('Content-Type', 'application/json');
      return res.json({
        success: true,
        data: {
          ...response,
          audioUrl: `/api/audio/${encodeURIComponent(response.audioPath)}`
        }
      });
    }

    res.json({
      success: true,
      data: response
    });
  }

  async streamAudio(req, res) {
    const { path } = req.params;
    const fullPath = decodeURIComponent(path);

    // Security check to prevent directory traversal
    if (fullPath.includes('..')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid audio path'
      });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    const fileStream = require('fs').createReadStream(fullPath);
    fileStream.pipe(res);
  }
}

const controller = new ChatbotController();

module.exports = {
  processMessage: [
    validateSchema(messageSchema),
    asyncHandler(controller.processMessage)
  ],
  streamAudio: asyncHandler(controller.streamAudio)
};
