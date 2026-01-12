const { validationResult } = require('express-validator');
const logger = require('../config/logger');
const farmGuidelineService = require('../services/farmGuidelineService');

class FarmGuidelineController {
  async getGuidelines(req, res) {
    try {
      // Accept farm id from either path param (/farm/:farmId), query param (?farm_id=...)
      // or fallback to user's associated farm_id
      const farmId = req.params?.farmId || req.query?.farm_id || req.user?.farm_id;
      
      if (!farmId) {
        return res.status(400).json({
          error: 'Farm ID is required'
        });
      }

      const guidelines = await farmGuidelineService.generateGuidelines(farmId);

      res.json({
        success: true,
        data: guidelines
      });
    } catch (error) {
      logger.error('Error in getGuidelines:', error);
      res.status(500).json({
        error: 'Failed to fetch farm guidelines'
      });
    }
  }

  async updateGuideline(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array()
        });
      }

      const { guidelineId } = req.params;
      const updates = req.body;

      // Only experts can update guidelines
      if (req.user.role !== 'expert') {
        return res.status(403).json({
          error: 'Only experts can modify guidelines'
        });
      }

      const updatedGuideline = await farmGuidelineService.updateGuideline(
        guidelineId,
        updates,
        req.user.id
      );

      res.json({
        success: true,
        data: updatedGuideline
      });
    } catch (error) {
      logger.error('Error in updateGuideline:', error);
      res.status(500).json({
        error: 'Failed to update farm guideline'
      });
    }
  }
}

module.exports = new FarmGuidelineController();