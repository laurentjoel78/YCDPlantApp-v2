const VoiceCommand = require('../models/voiceCommand');
const { Op } = require('sequelize');

class VoiceCommandService {
  async registerCommand(commandData) {
    try {
      const command = await VoiceCommand.create(commandData);
      return command;
    } catch (error) {
      throw new Error(`Failed to register voice command: ${error.message}`);
    }
  }

  async findMatchingCommand(text, language, category = null) {
    try {
      const whereClause = {
        language,
        enabled: true
      };

      if (category) {
        whereClause.category = category;
      }

      // First try exact match
      let command = await VoiceCommand.findOne({
        where: {
          ...whereClause,
          [Op.or]: [
            { command: text },
            { variations: { [Op.contains]: [text] } }
          ]
        }
      });

      if (!command) {
        // Try fuzzy matching using similarity
        command = await VoiceCommand.findOne({
          where: whereClause,
          order: [[sequelize.fn('similarity', sequelize.col('command'), text), 'DESC']],
          having: sequelize.where(
            sequelize.fn('similarity', sequelize.col('command'), text),
            '>',
            0.4
          )
        });
      }

      return command;
    } catch (error) {
      throw new Error(`Failed to find matching command: ${error.message}`);
    }
  }

  async getCommandsByCategory(category, language) {
    try {
      const commands = await VoiceCommand.findAll({
        where: {
          category,
          language,
          enabled: true
        }
      });
      return commands;
    } catch (error) {
      throw new Error(`Failed to get commands by category: ${error.message}`);
    }
  }

  async updateCommand(id, updates) {
    try {
      const [updated] = await VoiceCommand.update(updates, {
        where: { id }
      });
      if (!updated) {
        throw new Error('Command not found');
      }
      return await VoiceCommand.findByPk(id);
    } catch (error) {
      throw new Error(`Failed to update command: ${error.message}`);
    }
  }

  async deleteCommand(id) {
    try {
      const deleted = await VoiceCommand.destroy({
        where: { id }
      });
      if (!deleted) {
        throw new Error('Command not found');
      }
      return true;
    } catch (error) {
      throw new Error(`Failed to delete command: ${error.message}`);
    }
  }

  async validateCommandContext(command, context) {
    if (!command.contextRequired) {
      return true;
    }

    for (const [key, requirement] of Object.entries(command.contextRequired)) {
      if (!context[key] || !this._matchesRequirement(context[key], requirement)) {
        return false;
      }
    }
    return true;
  }

  _matchesRequirement(value, requirement) {
    if (Array.isArray(requirement)) {
      return requirement.includes(value);
    }
    return value === requirement;
  }
}

module.exports = new VoiceCommandService();