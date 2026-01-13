const { generateSuggestionsForFarm } = require('../services/suggestionService');
const logger = require('../config/logger');

exports.getSuggestions = async (req, res) => {
  try {
    const { Farm, User } = require('../models');
    let farmId = req.query.farm_id;

    // If no farm_id provided, try to find the farm using the authenticated user
    if (!farmId && req.user) {
      const user = await User.findOne({
        where: { id: req.user.id },
        include: [{
          model: Farm,
          as: 'farms'
        }]
      });

      if (user && user.farms && user.farms.length > 0) {
        farmId = user.farms[0].id;
      }
    }

    if (!farmId) {
      return res.status(400).json({ error: 'No farm found for the user' });
    }

    const userRole = req.user?.role;
    const language = req.headers['accept-language']?.startsWith('fr') ? 'fr' : 'en';
    const suggestions = await generateSuggestionsForFarm(farmId, { userRole, language });
    if (suggestions && suggestions.error) {
      // In development/testing, return a demo payload if the farm isn't found.
      if (suggestions.error === 'Farm not found') {
        const demo = {
          farm_id: 'demo-farm',
          generated_at: new Date().toISOString(),
          advisories: [
            { id: 'demo-water-1', type: 'watering', title: 'Water tomatoes more often', detail: 'High temperature — increase irrigation frequency.', priority: 'medium', recommended_inputs: [{ id: 'demo-fertilizer', name: 'Demo Fertilizer', dosage: '10g/plant' }] }
          ],
          markets: [
            { id: 'demo-market-1', name: 'Central Market', distance_km: 3.2, buy_recommendations: [{ item: 'Spinosad 500ml', expected_price: 6.5 }], sell_recommendations: [{ crop: 'Tomato', expected_price_per_kg: 1.2 }] }
          ]
        };
        return res.status(200).json(demo);
      }
      return res.status(404).json({ error: suggestions.error });
    }

    return res.status(200).json(suggestions);
  } catch (err) {
    logger.error('Error in getSuggestions:', err);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
};

// Public endpoint for development/testing: no auth required.
exports.getSuggestionsPublic = async (req, res) => {
  try {
    const { Farm, User } = require('../models');
    let farmId = req.query.farm_id;

    // If no farm_id provided, try to find the farm using the authenticated user's email
    if (!farmId && req.query.email) {
      // First find the user with their farms
      const user = await User.findOne({
        where: { email: req.query.email },
        include: [{
          model: Farm,
          as: 'farms'
        }]
      });

      if (user && user.farms && user.farms.length > 0) {
        farmId = user.farms[0].id;
        logger.info('Found farm for user:', { userId: user.id, farmId: user.farms[0].id });
      } else {
        logger.info('No farms found for user:', { userId: user?.id, email: req.query.email });
      }
    }

    const language = req.headers['accept-language']?.startsWith('fr') ? 'fr' : 'en';
    const suggestions = await generateSuggestionsForFarm(farmId, { debug: !!req.query?.debug, language });
    if (suggestions.error) {
      // If the farm isn't found in a dev environment, return a demo payload for UI testing.
      if (suggestions.error === 'Farm not found') {
        const demo = {
          farm_id: 'demo-farm',
          generated_at: new Date().toISOString(),
          advisories: [
            { id: 'demo-water-1', type: 'watering', title: 'Water tomatoes more often', detail: 'High temperature — increase irrigation frequency.', priority: 'medium', recommended_inputs: [{ id: 'demo-fertilizer', name: 'Demo Fertilizer', dosage: '10g/plant' }] }
          ],
          markets: [
            { id: 'demo-market-1', name: 'Central Market', distance_km: 3.2, buy_recommendations: [{ item: 'Spinosad 500ml', expected_price: 6.5 }], sell_recommendations: [{ crop: 'Tomato', expected_price_per_kg: 1.2 }] }
          ]
        };
        return res.status(200).json(demo);
      }
      return res.status(404).json({ error: suggestions.error });
    }

    // If debug query flag is present in non-production, include intermediate debug info
    if (req.query && req.query.debug && process.env.NODE_ENV !== 'production') {
      try {
        const farmGuidelineService = require('../services/farmGuidelineService');
        const debug = await farmGuidelineService.debugForFarm(farmId);
        return res.status(200).json(Object.assign({}, suggestions, { debug }));
      } catch (e) {
        logger.error('Failed to include debug data in public suggestions:', e);
      }
    }

    res.status(200).json(suggestions);
  } catch (err) {
    logger.error('Error in getSuggestionsPublic:', err);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
};

// Dev-only debug endpoint: returns intermediate guideline selection data for troubleshooting
exports.getDebugGuidelines = async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'Not allowed in production' });
  try {
    const farmId = req.params.farmId || req.query.farm_id;
    if (!farmId) return res.status(400).json({ error: 'farmId required' });
    const farmGuidelineService = require('../services/farmGuidelineService');
    const debug = await farmGuidelineService.debugForFarm(farmId);
    res.json(debug);
  } catch (err) {
    logger.error('Error in getDebugGuidelines:', err);
    res.status(500).json({ error: 'Failed to compute debug info' });
  }
};

// Dev helper to list guidance templates (small summary)
exports.listGuidanceTemplates = async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'Not allowed in production' });
  try {
    const { GuidanceTemplate } = require('../models');
    const rows = await GuidanceTemplate.findAll({
      attributes: ['id', 'title', 'region', 'soil_type', 'farming_type', 'climate_zone'],
      limit: 200
    });
    res.json(rows.map(r => r.toJSON()));
  } catch (err) {
    logger.error('Error in listGuidanceTemplates:', err);
    res.status(500).json({ error: 'Failed to list templates' });
  }
};
