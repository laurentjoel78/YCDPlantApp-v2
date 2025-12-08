const { Farm, GuidanceTemplate, FarmGuideline, WeatherData, FarmCrop, Crop } = require('../models');
const weatherService = require('./weatherService');
const soilService = require('./soilService');
const regionCropService = require('./regionCropService');
const { Op } = require('sequelize');

class FarmGuidelineService {
  constructor() {
    this.weatherService = weatherService;
    this.soilService = soilService;
  }

  async generateGuidelines(farmId) {
    // Fetch farm data with associated crops
    const farm = await Farm.findByPk(farmId, {
      include: [
        { model: FarmCrop, as: 'crops', include: [{ model: Crop, as: 'crop' }] }
      ]
    });
    if (!farm) {
      throw new Error('Farm not found');
    }

    // Get weather data and soil data
    const [weather, soilData] = await Promise.all([
      this.weatherService.getWeatherForCoords({
        lat: farm.location_lat,
        lng: farm.location_lng
      }),
      this.soilService.getSoilDataForCoords({
        lat: farm.location_lat,
        lng: farm.location_lng
      })
    ]);

    // Get local climate zone and considerations
    const localData = this.getLocalConsiderations(farm.location_lat, farm.location_lng);

  // Normalize farm soil_type: treat empty/'Not specified' as null so generic templates can match
  const normalizedSoilType = (farm.soil_type && String(farm.soil_type).trim() && String(farm.soil_type).toLowerCase() !== 'not specified') ? farm.soil_type : null;

  // Find relevant guidance templates with enhanced location awareness
    // Check DB schema at runtime: some deployments may not have climate_zone column
    const queryInterface = GuidanceTemplate.sequelize.getQueryInterface();
    let hasClimateZone = false;
    try {
      const desc = await queryInterface.describeTable('GuidanceTemplates');
      hasClimateZone = !!desc.climate_zone;
    } catch (err) {
      // If describeTable fails for any reason, assume column missing and continue
      hasClimateZone = false;
    }

    const orConditions = [
      { soil_type: normalizedSoilType },
      { farming_type: farm.farming_type },
      { region: farm.region },
      { soil_type: null, farming_type: null, region: null } // Generic templates
    ];

    if (hasClimateZone) {
      orConditions.splice(3, 0, { climate_zone: localData.climateZone });
    }

    const templates = await GuidanceTemplate.findAll({
      where: {
        [Op.or]: orConditions
      }
    });

    console.log(`farmGuidelineService: found ${templates.length} guidance templates for farm ${farmId}`);

    // Filter and adapt templates based on conditions
    const relevantTemplates = templates.filter(template => {
      const conditions = template.conditions || {};

      // Check soil type match (if farm has a meaningful soil type)
      if (conditions.soil_type && normalizedSoilType && !conditions.soil_type.includes(normalizedSoilType)) {
        return false;
      }

      // Enhanced weather conditions check
      if (weather) {
        if (conditions.temperature_c) {
          const { min, max } = conditions.temperature_c;
          if ((min && weather.tempCurrent < min) || (max && weather.tempCurrent > max)) {
            return false;
          }
        }
        
        // Check rainfall patterns
        if (conditions.rainfall_mm && Math.abs(weather.rainfall - conditions.rainfall_mm) > 20) {
          return false;
        }

        // Check season appropriateness
        if (conditions.seasons && !this.isAppropriateSeasonForLocation(
          conditions.seasons,
          farm.location_lat,
          farm.location_lng,
          new Date()
        )) {
          return false;
        }

        if (conditions.rainfall_mm) {
          const { min, max } = conditions.rainfall_mm;
          if ((min && weather.recentRainMm < min) || (max && weather.recentRainMm > max)) {
            return false;
          }
        }
      }

      return true;
    });

    // If strict matching returned no templates, attempt a relaxed fallback query to pick useful templates
    if ((!templates || templates.length === 0) || (relevantTemplates.length === 0)) {
      try {
        console.log('farmGuidelineService: no strict matches, trying relaxed fallback query for farm', farmId);
        const relaxed = await GuidanceTemplate.findAll({
          where: {
            [Op.or]: [
              { region: null },
              { farming_type: null },
              { soil_type: null }
            ]
          },
          limit: 5
        });

        if (relaxed && relaxed.length > 0) {
          console.log(`farmGuidelineService: relaxed fallback found ${relaxed.length} templates for farm ${farmId}`);
          // prefer relaxed templates as relevantTemplates
          relevantTemplates.splice(0, relevantTemplates.length, ...relaxed);
        }
      } catch (err) {
        console.warn('farmGuidelineService: relaxed fallback query failed', err && err.message);
      }
    }

    // Create or update guidelines for the farm (if DB insert works). If DB creation fails or is not allowed,
    // fall back to in-memory formatting from templates to avoid FK errors.
    console.log('farmGuidelineService: creating guidelines from templates:', relevantTemplates.map(t => ({ id: t.id, title: t.title })));
    const guidelines = [];
    for (const template of relevantTemplates) {
      try {
        if (!template || !template.id) continue;
        const [guideline] = await FarmGuideline.findOrCreate({
          where: {
            farm_id: farm.id,
            template_id: template.id
          },
          defaults: {
            status: 'active'
          }
        });
        if (guideline) guidelines.push(guideline);
      } catch (err) {
        console.warn('farmGuidelineService: failed to create/find FarmGuideline for template', template && template.id, err && err.message);
        // don't abort the whole process for one failure; continue with others
      }
    }

    console.log(`farmGuidelineService: created/loaded ${guidelines.length} farmGuideline rows for farm ${farmId}`);

    // Enrich guidelines with region/crop specific recommendations if available
    const farmCrops = (farm.crops || []).map(fc => fc.crop && fc.crop.name).filter(Boolean);
    const region = farm.region;

    const extraRecommendations = [];
    if (region && farmCrops.length > 0) {
      for (const cropName of farmCrops) {
        try {
          const rec = regionCropService.getRecommendations(region, cropName);
          if (rec) {
            const noteParts = [];
            const safe = v => (v === null || v === undefined) ? '' : String(v).trim();
            const f = safe(rec.fertilizer);
            const p = safe(rec.pests);
            const d = safe(rec.diseases);
            const pc = safe(rec.pest_control || rec.pestControl || rec.Pest_Control);
            const n = safe(rec.notes || rec.note);
            if (f) noteParts.push(`Fertilizer: ${f}`);
            if (p) noteParts.push(`Pests: ${p}`);
            if (d) noteParts.push(`Diseases: ${d}`);
            if (pc) noteParts.push(`Pest control: ${pc}`);
            if (n) noteParts.push(`Notes: ${n}`);
            if (noteParts.length > 0) {
              extraRecommendations.push({ crop: cropName, details: noteParts.join('; ') });
            }
          }
        } catch (err) {
          // ignore per-crop failures
        }
      }
    }

    let formatted = [];
    if ((!guidelines || guidelines.length === 0) && relevantTemplates && relevantTemplates.length > 0) {
      // Create formatted guideline objects directly from templates (in-memory fallback)
      formatted = relevantTemplates.map(t => ({
        id: t.id,
        title: t.title,
        type: t.type || 'guideline',
        content: t.content || '',
        recommendations: t.recommendations || [],
        priority: t.priority || 'normal'
      }));
    } else {
      formatted = await this.formatGuidelines(guidelines);
    }
    // Merge extra recommendations into the recommendations array for each guideline
    if (extraRecommendations.length > 0) {
      for (const f of formatted) {
        f.recommendations = f.recommendations || [];
        // Append region/crop data as readable bullets
        for (const er of extraRecommendations) {
          const detail = (er && er.details) ? String(er.details).trim() : '';
          const cropName = (er && er.crop) ? String(er.crop).trim() : '';
          if (detail) f.recommendations.push(`Crop ${cropName}: ${detail}`);
        }
      }
    }

  console.log(`farmGuidelineService: extraRecommendations for farm ${farmId}:`, extraRecommendations);
  console.log(`farmGuidelineService: formatted guidelines count=${formatted.length} for farm ${farmId}`);

    // If no templates matched, return a fallback synthetic guideline that includes any extraRecommendations
    if (!formatted || formatted.length === 0) {
      const fallbackRecommendations = extraRecommendations.map(er => `Crop ${er.crop}: ${er.details}`);
      const seasonal = (localData && localData.seasonalGuidelines) ? localData.seasonalGuidelines : [];
      const fallback = {
        id: `fallback-${farmId}`,
        title: `General recommendations for ${farm.region || 'your area'}`,
        type: 'general',
        content: (seasonal && seasonal.length > 0) ? seasonal.join('; ') : 'No specific templates available for this farm. Follow general best practices and monitor conditions.',
        recommendations: fallbackRecommendations,
        priority: 'low'
      };
      console.log('farmGuidelineService: returning fallback guideline for farm', farmId, fallback);
      return [fallback];
    }

    return formatted;
  }

  async formatGuidelines(guidelines) {
    // If there are no guidelines, return an empty array early to avoid
    // calling findAll with an empty id list (which can produce SQL like IN (NULL)).
    if (!guidelines || guidelines.length === 0) {
      return [];
    }

    // Load all needed relations
    const guidelineIds = guidelines.map(g => g && g.id).filter(Boolean);
    if (guidelineIds.length === 0) return [];

    const guidelinesWithData = await FarmGuideline.findAll({
      where: {
        id: guidelineIds
      },
      include: [
        {
          model: GuidanceTemplate,
          as: 'template',
          attributes: ['title', 'type', 'content', 'recommendations', 'priority']
        }
      ]
    });

    // Format guidelines for display
    return guidelinesWithData.map(guideline => ({
      id: guideline.id,
      title: guideline.template.title,
      type: guideline.template.type,
      content: guideline.modified_content || guideline.template.content,
      recommendations: guideline.template.recommendations || [],
      priority: guideline.template.priority,
      status: guideline.status,
      expert_notes: guideline.expert_notes
    }));
  }

  async updateGuideline(guidelineId, updates, expertId = null) {
    const guideline = await FarmGuideline.findByPk(guidelineId);
    if (!guideline) {
      throw new Error('Guideline not found');
    }

    await guideline.update({
      ...updates,
      expert_id: expertId
    });

    return guideline;
  }

  // Development helper: return intermediate data used to compute guidelines for debugging
  async debugForFarm(farmId) {
    const farm = await Farm.findByPk(farmId, {
      include: [
        { model: FarmCrop, as: 'crops', include: [{ model: Crop, as: 'crop' }] }
      ]
    });
    if (!farm) return { error: 'Farm not found' };

    const localData = this.getLocalConsiderations(farm.location_lat, farm.location_lng);

    // Check DB schema for climate_zone
    const queryInterface = GuidanceTemplate.sequelize.getQueryInterface();
    let hasClimateZone = false;
    try {
      const desc = await queryInterface.describeTable('GuidanceTemplates');
      hasClimateZone = !!desc.climate_zone;
    } catch (err) {
      hasClimateZone = false;
    }

    const normalizedSoilTypeDbg = (farm.soil_type && String(farm.soil_type).trim() && String(farm.soil_type).toLowerCase() !== 'not specified') ? farm.soil_type : null;
    const orConditions = [
      { soil_type: normalizedSoilTypeDbg },
      { farming_type: farm.farming_type },
      { region: farm.region },
      { soil_type: null, farming_type: null, region: null }
    ];
    if (hasClimateZone) orConditions.splice(3, 0, { climate_zone: localData.climateZone });

    const templates = await GuidanceTemplate.findAll({ where: { [Op.or]: orConditions } });

    // Filter templates as in generateGuidelines
    const relevantTemplates = templates.filter(template => {
      const conditions = template.conditions || {};
      // basic checks (skip detailed weather/season checks here)
      if (conditions.soil_type && normalizedSoilTypeDbg && !conditions.soil_type.includes(normalizedSoilTypeDbg)) return false;
      return true;
    });

    const guidelines = await Promise.all(relevantTemplates.map(async t => {
      const [g] = await FarmGuideline.findOrCreate({ where: { farm_id: farmId, template_id: t.id }, defaults: { status: 'active' } });
      return g;
    }));

    const farmCrops = (farm.crops || []).map(fc => fc.crop && fc.crop.name).filter(Boolean);
    const region = farm.region;
    const extraRecommendations = [];
    if (region && farmCrops.length > 0) {
      for (const cropName of farmCrops) {
        try {
          const rec = regionCropService.getRecommendations(region, cropName);
          if (rec) {
            const noteParts = [];
            if (rec.fertilizer) noteParts.push(`Fertilizer: ${rec.fertilizer}`);
            if (rec.pests) noteParts.push(`Pests: ${rec.pests}`);
            if (rec.diseases) noteParts.push(`Diseases: ${rec.diseases}`);
            if (rec.pest_control) noteParts.push(`Pest control: ${rec.pest_control}`);
            if (rec.notes) noteParts.push(`Notes: ${rec.notes}`);
            if (noteParts.length > 0) extraRecommendations.push({ crop: cropName, details: noteParts.join('; ') });
          }
        } catch (err) {
          // ignore
        }
      }
    }

    const formatted = await this.formatGuidelines(guidelines);

    return {
      farm: { id: farm.id, region: farm.region, soil_type: farm.soil_type, farming_type: farm.farming_type },
      localData,
      hasClimateZone,
      templatesFound: templates.length,
      relevantTemplates: relevantTemplates.map(t => ({ id: t.id, title: t.title })),
      guidelinesCreated: guidelines.map(g => g.id),
      extraRecommendations,
      formatted
    };
  }

  getLocalConsiderations(lat, lng) {
    return {
      climateZone: this.getClimateZone(lat, lng),
      weatherPatterns: this.getTypicalWeatherPatterns(lat, lng),
      commonPests: this.getCommonPests(lat, lng),
      soilCharacteristics: this.getLocalSoilCharacteristics(lat, lng),
      seasonalGuidelines: this.getSeasonalGuidelines(lat, lng)
    };
  }

  getClimateZone(lat) {
    // Determine climate zone based on latitude
    if (lat < -60) return 'polar';
    if (lat < -40) return 'subpolar';
    if (lat < -23.5) return 'temperate';
    if (lat < 23.5) return 'tropical';
    if (lat < 40) return 'subtropical';
    if (lat < 60) return 'temperate';
    return 'polar';
  }

  getTypicalWeatherPatterns(lat, lng) {
    // Get historical weather patterns for the location
    const hemisphere = lat >= 0 ? 'northern' : 'southern';
    const month = new Date().getMonth();
    
    return {
      season: this.getCurrentSeason(month, hemisphere),
      rainfallPattern: this.getRainfallPattern(lat, lng),
      temperatureRange: this.getTemperatureRange(lat, lng)
    };
  }

  getCurrentSeason(month, hemisphere) {
    if (hemisphere === 'northern') {
      if (month >= 2 && month <= 4) return 'spring';
      if (month >= 5 && month <= 7) return 'summer';
      if (month >= 8 && month <= 10) return 'autumn';
      return 'winter';
    } else {
      if (month >= 2 && month <= 4) return 'autumn';
      if (month >= 5 && month <= 7) return 'winter';
      if (month >= 8 && month <= 10) return 'spring';
      return 'summer';
    }
  }

  getRainfallPattern(lat) {
    // Simplified rainfall pattern based on latitude
    if (Math.abs(lat) < 23.5) return 'tropical';
    if (Math.abs(lat) < 35) return 'subtropical';
    return 'temperate';
  }

  getTemperatureRange(lat) {
    // Simplified temperature range based on latitude
    const absLat = Math.abs(lat);
    if (absLat < 23.5) return { min: 20, max: 35 };
    if (absLat < 35) return { min: 15, max: 30 };
    if (absLat < 50) return { min: 5, max: 25 };
    return { min: -5, max: 20 };
  }

  getCommonPests(lat, lng) {
    // Return common pests based on climate zone
    const climateZone = this.getClimateZone(lat);
    const commonPests = {
      tropical: ['fruit flies', 'aphids', 'mealybugs'],
      subtropical: ['whiteflies', 'spider mites', 'scale insects'],
      temperate: ['caterpillars', 'beetles', 'aphids'],
      subpolar: ['root maggots', 'cutworms'],
      polar: ['hardy insects']
    };
    return commonPests[climateZone] || [];
  }

  getLocalSoilCharacteristics(lat, lng) {
    // Get typical soil characteristics for the region
    const climateZone = this.getClimateZone(lat);
    return {
      type: this.getTypicalSoilType(climateZone),
      characteristics: this.getSoilCharacteristics(climateZone)
    };
  }

  getTypicalSoilType(climateZone) {
    const soilTypes = {
      tropical: 'laterite',
      subtropical: 'red earth',
      temperate: 'brown earth',
      subpolar: 'podzol',
      polar: 'tundra'
    };
    return soilTypes[climateZone] || 'unknown';
  }

  getSoilCharacteristics(climateZone) {
    const characteristics = {
      tropical: { pH: '4.5-6.0', organic: 'high', drainage: 'good' },
      subtropical: { pH: '5.5-7.0', organic: 'medium', drainage: 'variable' },
      temperate: { pH: '6.0-7.5', organic: 'medium', drainage: 'good' },
      subpolar: { pH: '4.0-6.0', organic: 'high', drainage: 'poor' },
      polar: { pH: '6.0-8.0', organic: 'low', drainage: 'poor' }
    };
    return characteristics[climateZone] || {};
  }

  getSeasonalGuidelines(lat, lng) {
    const climateZone = this.getClimateZone(lat);
    const currentSeason = this.getCurrentSeason(
      new Date().getMonth(),
      lat >= 0 ? 'northern' : 'southern'
    );
    
    return this.getSeasonalRecommendations(climateZone, currentSeason);
  }

  getSeasonalRecommendations(climateZone, season) {
    const recommendations = {
      tropical: {
        spring: ['Prepare for monsoon season', 'Plant humidity-resistant crops'],
        summer: ['Implement irrigation systems', 'Use shade cloth for sensitive crops'],
        autumn: ['Focus on pest control', 'Prepare for dry season'],
        winter: ['Plant drought-resistant varieties', 'Maintain soil moisture']
      },
      temperate: {
        spring: ['Start early crops', 'Prepare soil after frost'],
        summer: ['Regular irrigation', 'Monitor for pests'],
        autumn: ['Harvest main crops', 'Plant cover crops'],
        winter: ['Protect from frost', 'Plan for next season']
      }
      // Add more climate zones as needed
    };
    
    return recommendations[climateZone]?.[season] || [];
  }

  isAppropriateSeasonForLocation(seasons, lat, lng, date) {
    const hemisphere = lat >= 0 ? 'northern' : 'southern';
    const currentSeason = this.getCurrentSeason(date.getMonth(), hemisphere);
    return seasons.includes(currentSeason);
  }
}

module.exports = new FarmGuidelineService();