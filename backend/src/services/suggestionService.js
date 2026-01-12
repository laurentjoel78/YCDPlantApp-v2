const { Farm, Crop, Market, MarketPrice, GuidanceTemplate, FarmGuideline, FarmCrop } = require('../models');
const logger = require('../config/logger');
const weatherService = require('./weatherService');
const farmGuidelineService = require('./farmGuidelineService');
const regionCropService = require('./regionCropService');
const marketDiscoveryService = require('./marketDiscoveryService');

async function generateSuggestionsForFarm(farmId, options = {}) {
  const { userRole } = options || {};
  logger.info('generateSuggestionsForFarm called with farmId=', farmId);

  let farm = null;
  const isUuid = typeof farmId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(farmId);

  try {
    // Load farm data with crops and active guidelines
    // The association between Farm and Crop is declared as belongsToMany through FarmCrop
    // (see models/associations.js), so include Crop directly.
    farm = await Farm.findByPk(farmId, {
      include: [
        {
          model: FarmCrop,
          as: 'crops',
          required: false,
          include: [{
            model: Crop,
            as: 'crop'
          }]
        },
        {
          model: FarmGuideline,
          as: 'guidelines',
          where: { status: 'active' },
          required: false,
          include: [{
            model: GuidanceTemplate,
            as: 'template'
          }]
        }
      ]
    });

    if (!farm) {
      throw new Error('Farm not found');
    }

    // Get current weather data
    const weather = await weatherService.getWeatherForCoords({
      lat: farm.location_lat || farm.latitude,
      lng: farm.location_lng || farm.longitude
    }).catch(() => null);

    // Normalize crops list: farm.crops may be FarmCrop instances including { crop: Crop }
    const crops = (farm.crops || []).map(c => {
      // c may be a FarmCrop with .crop or may be a Crop directly
      const cropObj = (c && c.crop) ? c.crop : c;
      return {
        id: cropObj && (cropObj.id || cropObj.crop_id) ? (cropObj.id || cropObj.crop_id) : null,
        name: cropObj && (cropObj.name || cropObj.title) ? (cropObj.name || cropObj.title) : String(cropObj || '')
      };
    }).filter(Boolean);

    // Get or generate farm guidelines and ensure they are in the formatted shape
    let farmGuidelines = [];
    if (farm.guidelines && farm.guidelines.length > 0) {
      // Use the farmGuidelineService formatter to get consistent objects
      farmGuidelines = await farmGuidelineService.formatGuidelines(farm.guidelines);
    } else {
      farmGuidelines = await farmGuidelineService.generateGuidelines(farmId) || [];
    }

    // Convert guidelines to advisory format
    // Helper to sanitize accidental 'undefined' strings from templates
    const sanitize = (s) => {
      if (!s && s !== 0) return '';
      try {
        return String(s).replace(/undefined/g, '').trim();
      } catch (e) {
        return '';
      }
    };

    // Simple template interpolation helper that safely replaces {{var}} and ${var}
    const templateInterpolate = (text, vars = {}) => {
      if (!text) return '';
      let out = String(text);
      // Replace {{var}}
      out = out.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) => {
        const v = vars[k];
        return (v === null || v === undefined) ? '' : String(v);
      });
      // Replace ${var}
      out = out.replace(/\$\{\s*([a-zA-Z0-9_]+)\s*\}/g, (_, k) => {
        const v = vars[k];
        return (v === null || v === undefined) ? '' : String(v);
      });
      return out;
    };

    // We'll build advisories after we compute weather-derived vars (recentRain, tempMax)

    // Add weather-based advisories
    const recentRain = (weather && (weather.recentRain || weather.recentRainMm)) || 0;
    const tempMax = (weather && (weather.tempMax || weather.temp_max)) || (weather && weather.daily && weather.daily[0] && (weather.daily[0].temp?.max || weather.daily[0].temp)) || 30;

    // pick a representative crop for interpolation (first crop) if present
    const firstCropName = (crops && crops.length > 0) ? (crops[0].name || crops[0].title || '') : '';
    const vars = { crop: firstCropName, region: farm.region || '', recentRain, tempMax };

    // Debug: inspect farmGuidelines returned by farmGuidelineService
    try {
      logger.info('suggestionService: farmGuidelines count=', Array.isArray(farmGuidelines) ? farmGuidelines.length : 'not-array');
      if (Array.isArray(farmGuidelines) && farmGuidelines.length > 0) logger.info('suggestionService: sample guideline=', JSON.stringify(farmGuidelines[0]));
    } catch (e) { /* ignore logging errors */ }

    // Convert guidelines to advisory format (now that vars are available)
    const advisories = farmGuidelines.map(guideline => {
      // guideline may already be a formatted object (from formatGuidelines/generateGuidelines)
      if (guideline && guideline.title) {
        return {
          id: `guide-${guideline.id}`,
          type: guideline.type || guideline.template?.type || 'guideline',
          title: sanitize(templateInterpolate(guideline.title || guideline.template?.title || translate('Guideline'), vars)),
          detail: sanitize(templateInterpolate(guideline.modified_content || guideline.content || guideline.template?.content || '', vars)),
          priority: guideline.priority || guideline.template?.priority || 'normal',
          recommended_inputs: guideline.recommendations || guideline.template?.recommendations || []
        };
      }

      // Fallback for unexpected shape
      return {
        id: `guide-${guideline && guideline.id}`,
        type: (guideline && guideline.template && guideline.template.type) || 'guideline',
        title: sanitize((guideline && guideline.template && guideline.template.title) || translate('Guideline')),
        detail: sanitize((guideline && (guideline.modified_content || (guideline.template && guideline.template.content))) || ''),
        priority: (guideline && guideline.template && guideline.template.priority) || 'normal',
        recommended_inputs: (guideline && guideline.template && guideline.template.recommendations) || []
      };
    });

    // Translation dictionary for hardcoded service messages
    const translations = {
      fr: {
        'Add Crops to Your Farm': 'Ajoutez des cultures à votre ferme',
        'To get personalized fertilizer, pest, and disease recommendations, please add the crops you are growing to your farm profile.': 'Pour obtenir des recommandations personnalisées sur les engrais, les ravageurs et les maladies, veuillez ajouter les cultures de votre profil agricole.',
        'Guideline': 'Recommandation'
      }
    };

    // Helper to translate if language is French
    const translate = (text) => (options.language === 'fr' && translations.fr[text]) ? translations.fr[text] : text;

    // Add "No Crops" advisory if farm has no crops
    if (!crops || crops.length === 0) {
      advisories.unshift({
        id: 'setup-crops',
        type: 'setup',
        title: translate('Add Crops to Your Farm'),
        detail: translate('To get personalized fertilizer, pest, and disease recommendations, please add the crops you are growing to your farm profile.'),
        priority: 'high',
        recommended_inputs: []
      });
    }

    for (const crop of crops) {
      const cropName = crop && (crop.name || crop.title) ? (crop.name || crop.title) : 'your crop';

      // Get detailed crop recommendations from Cameroon agricultural data
      const cropData = regionCropService.getRecommendations(farm.region, cropName);

      if (cropData) {
        // FERTILIZER RECOMMENDATIONS
        const hasNPK = cropData.N_kg_per_ha || cropData.P2O5_kg_per_ha || cropData.K2O_kg_per_ha;
        if (hasNPK) {
          const npkDetails = [];
          if (cropData.N_kg_per_ha) npkDetails.push(`N: ${cropData.N_kg_per_ha} kg/ha`);
          if (cropData.P2O5_kg_per_ha) npkDetails.push(`P₂O₅: ${cropData.P2O5_kg_per_ha} kg/ha`);
          if (cropData.K2O_kg_per_ha) npkDetails.push(`K₂O: ${cropData.K2O_kg_per_ha} kg/ha`);

          advisories.push({
            id: `fertilizer-${crop.id}`,
            type: 'fertilizer',
            crop: cropName,
            title: `Fertilizer plan for ${cropName}`,
            detail: `Recommended: ${npkDetails.join(', ')}. ${cropData.Split_Timing || ''}`,
            priority: 'high',
            recommended_inputs: [{
              name: `NPK Fertilizer for ${cropName}`,
              amount: npkDetails.join(', '),
              timing: cropData.Split_Timing || 'Apply as needed',
              method: cropData.Application_Method || 'Follow standard practices'
            }],
            crop_data: {
              npk: { n: cropData.N_kg_per_ha, p: cropData.P2O5_kg_per_ha, k: cropData.K2O_kg_per_ha },
              timing: cropData.Split_Timing,
              method: cropData.Application_Method,
              soil_notes: cropData.Soil_Type_Notes
            }
          });
        }

        // PEST WARNINGS
        if (cropData.Common_Pests) {
          const pests = String(cropData.Common_Pests);
          advisories.push({
            id: `pest-${crop.id}`,
            type: 'pest_control',
            crop: cropName,
            title: `Pest watch for ${cropName}`,
            detail: `Common pests in ${farm.region}: ${pests}. ${cropData.Pest_Control_Methods || 'Monitor regularly'}`,
            priority: 'medium',
            recommended_inputs: [],
            crop_data: {
              pests: pests,
              control_methods: cropData.Pest_Control_Methods
            }
          });
        }

        // DISEASE WARNINGS
        if (cropData.Common_Diseases) {
          const diseases = String(cropData.Common_Diseases);
          advisories.push({
            id: `disease-${crop.id}`,
            type: 'disease_management',
            crop: cropName,
            title: `Disease prevention for ${cropName}`,
            detail: `Watch for: ${diseases}. ${cropData.Easy_Treatments || 'Practice good field hygiene'}`,
            priority: 'medium',
            recommended_inputs: [],
            crop_data: {
              diseases: diseases,
              treatments: cropData.Easy_Treatments
            }
          });
        }

        // RAINFALL ANALYSIS (compare weather to crop requirements)
        if (cropData.Rainfall_Water_Requirement && weather) {
          const rainfallReq = String(cropData.Rainfall_Water_Requirement);
          // Extract numeric range if possible (e.g., "400–800 mm/season")
          const rangeMatch = rainfallReq.match(/(\d+)[–-](\d+)/);
          if (rangeMatch) {
            const minRain = parseInt(rangeMatch[1]);
            const maxRain = parseInt(rangeMatch[2]);

            if (recentRain < minRain * 0.1) { // Less than 10% of minimum (rough seasonal approximation)
              advisories.push({
                id: `water-low-${crop.id}`,
                type: 'watering',
                crop: cropName,
                title: `Increase watering for ${cropName}`,
                detail: `${cropName} needs ${rainfallReq}. Recent rainfall: ${recentRain}mm. Consider irrigation.`,
                priority: 'high'
              });
            } else if (recentRain > maxRain * 0.15) { // More than 15% of maximum
              advisories.push({
                id: `water-high-${crop.id}`,
                type: 'watering',
                crop: cropName,
                title: `Reduce watering for ${cropName}`,
                detail: `Recent rainfall of ${recentRain}mm is sufficient for ${cropName}. ${rainfallReq}`,
                priority: 'low'
              });
            }
          }
        }

        // TEMPERATURE WARNINGS
        // High temperature warning
        if (tempMax >= 30) {
          advisories.push({
            id: `temp-high-${crop.id}`,
            type: 'climate',
            crop: cropName,
            title: `High temperature alert for ${cropName}`,
            detail: `Current temperature: ${tempMax}°C. Monitor for heat stress. Increase irrigation frequency.`,
            priority: 'medium'
          });
        }

        // SOIL ADAPTATION NOTES
        if (cropData.Adaptation_Notes && farm.soil_type) {
          advisories.push({
            id: `soil-${crop.id}`,
            type: 'soil_management',
            crop: cropName,
            title: `Soil management for ${cropName}`,
            detail: `${cropData.Adaptation_Notes}`,
            priority: 'low',
            crop_data: {
              soil_type: farm.soil_type,
              notes: cropData.Adaptation_Notes
            }
          });
        }
      } else {
        // Fallback to basic weather-based advisory if no crop data found
        if (recentRain >= 20) {
          advisories.push({
            id: `water-${crop.id}`,
            type: 'watering',
            crop: cropName,
            title: `Reduce watering for ${cropName}`,
            detail: `Recent rainfall of ${recentRain}mm suggests reducing irrigation for ${cropName}.`,
            priority: 'low'
          });
        } else if (tempMax >= 30) {
          advisories.push({
            id: `water-${crop.id}`,
            type: 'watering',
            crop: cropName,
            title: `Increase watering for ${cropName}`,
            detail: `High temperature (${tempMax}°C) may require more frequent irrigation for ${cropName}.`,
            priority: 'medium'
          });
        }
      }
    }

    // Market suggestions with distance calculation and OSM discovery
    let marketSuggestions = [];
    try {
      const farmLat = parseFloat(farm.location_lat || farm.latitude);
      const farmLng = parseFloat(farm.location_lng || farm.longitude);

      // Get crop names for filtering markets
      const cropNames = crops.map(c => c.name || c.title).filter(Boolean);

      // Use enhanced market discovery service with crop filtering
      if (!isNaN(farmLat) && !isNaN(farmLng)) {
        try {
          // The enhanced service now handles both DB and OSM markets, with caching and crop filtering
          // Using 100km radius for better rural coverage
          const allMarkets = await marketDiscoveryService.findNearbyMarkets(
            farmLat,
            farmLng,
            100, // 100km radius (increased for rural coverage)
            cropNames // Filter by crops the farmer grows
          );
          marketSuggestions = allMarkets.slice(0, 10); // Limit to top 10 closest markets
          logger.info(`suggestionService: found ${marketSuggestions.length} markets for farm`);
        } catch (err) {
          logger.warn('suggestionService: failed to discover markets', err.message);
        }
      }
    } catch (err) {
      logger.warn('suggestionService: error in market discovery', err.message);
    }

    // Note: marketSuggestions already contains formatted markets with distances from the enhanced service
    // No need for additional processing here

    const base = {
      farm_id: farm.id,
      generated_at: new Date().toISOString(),
      advisories,
      markets: marketSuggestions,
      farm_location: {
        lat: farm.location_lat || farm.latitude,
        lng: farm.location_lng || farm.longitude
      }
    };

    // If caller requested debug info, attach the raw farmGuidelines for inspection
    if (options && options.debug) {
      base._debug = { farmGuidelinesRaw: farmGuidelines };
    }

    return base;
  } catch (error) {
    logger.error('Error in generateSuggestionsForFarm:', error);
    return { error: error.message };
  }
}

module.exports = { generateSuggestionsForFarm };
