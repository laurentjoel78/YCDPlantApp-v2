const VoiceCommandService = require('../services/voiceCommandService');
const { validateSchema } = require('../middleware/schemaValidator');
const { asyncHandler } = require('../utils/asyncHandler');

const createCommandSchema = {
  type: 'object',
  required: ['language', 'command', 'action', 'variations', 'intentType', 'category'],
  properties: {
    language: { type: 'string', minLength: 2 },
    command: { type: 'string', minLength: 1 },
    action: { type: 'string', minLength: 1 },
    parameters: { type: 'object' },
    variations: { 
      type: 'array',
      items: { type: 'string' }
    },
    intentType: { type: 'string' },
    contextRequired: { type: 'object' },
    category: { type: 'string' }
  }
};

class VoiceCommandController {
  async registerCommand(req, res) {
    const command = await VoiceCommandService.registerCommand(req.body);
    res.status(201).json({
      success: true,
      data: command
    });
  }

  async processCommand(req, res) {
    const { text, language, context, category } = req.body;
    
    const command = await VoiceCommandService.findMatchingCommand(text, language, category);
    if (!command) {
      return res.status(404).json({
        success: false,
        message: 'No matching command found'
      });
    }

    const isContextValid = await VoiceCommandService.validateCommandContext(command, context);
    if (!isContextValid) {
      return res.status(400).json({
        success: false,
        message: 'Command context requirements not met'
      });
    }

    res.json({
      success: true,
      data: {
        command: command.command,
        action: command.action,
        parameters: command.parameters,
        intentType: command.intentType
      }
    });
  }

  async getCommandsByCategory(req, res) {
    const { category, language } = req.params;
    const commands = await VoiceCommandService.getCommandsByCategory(category, language);
    res.json({
      success: true,
      data: commands
    });
  }

  async updateCommand(req, res) {
    const { id } = req.params;
    const command = await VoiceCommandService.updateCommand(id, req.body);
    res.json({
      success: true,
      data: command
    });
  }

  async deleteCommand(req, res) {
    const { id } = req.params;
    
    // Validate id
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ error: 'Command ID is required' });
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid Command ID format' });
    }
    
    await VoiceCommandService.deleteCommand(id);
    res.json({
      success: true,
      message: 'Command deleted successfully'
    });
  }
}

const controller = new VoiceCommandController();

module.exports = {
  registerCommand: [validateSchema(createCommandSchema), asyncHandler(controller.registerCommand)],
  processCommand: asyncHandler(controller.processCommand),
  getCommandsByCategory: asyncHandler(controller.getCommandsByCategory),
  updateCommand: asyncHandler(controller.updateCommand),
  deleteCommand: asyncHandler(controller.deleteCommand)
};