const axios = require('axios');
const models = require('../models');
const SoilData = models.SoilData; // may be undefined in some deployments
const { Op } = require('sequelize');

class SoilService {
  async getSoilDataForCoords({ lat, lng }) {
    try {
      // First check if we have cached data
      const cachedData = await this.getCachedSoilData(lat, lng);
      if (cachedData) {
        return cachedData;
      }

      // If no cached data, fetch from external API
      const soilData = await this.fetchSoilData(lat, lng);
      
      // Cache the results
      await this.cacheSoilData(lat, lng, soilData);

      return soilData;
    } catch (error) {
      console.error('Error fetching soil data:', error);
      // Return default data if fetch fails
      return this.getDefaultSoilData(lat);
    }
  }

  async getCachedSoilData(lat, lng) {
    // If the SoilData model isn't available, skip DB cache lookup
    if (!SoilData || typeof SoilData.findOne !== 'function') {
      return null;
    }

    // Look for cached soil data within 0.01 degrees (roughly 1km)
    const cachedData = await SoilData.findOne({
      where: {
        latitude: {
          [Op.between]: [lat - 0.01, lat + 0.01]
        },
        longitude: {
          [Op.between]: [lng - 0.01, lng + 0.01]
        },
        // Only return data less than 30 days old
        updatedAt: {
          [Op.gt]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      order: [['updatedAt', 'DESC']]
    });

    return cachedData?.data || null;
  }

  async cacheSoilData(lat, lng, data) {
    // If the SoilData model isn't available in this deployment, skip caching.
    if (!SoilData || typeof SoilData.create !== 'function') {
      return null;
    }

    try {
      return await SoilData.create({
        latitude: lat,
        longitude: lng,
        data: data
      });
    } catch (err) {
      // Don't let caching failures break the caller --- log and continue
      console.warn('soilService.cacheSoilData: failed to create cache record', err && err.message);
      return null;
    }
  }

  async fetchSoilData(lat, lng) {
    // Implement actual API call to soil data service
    // For now, return calculated data based on latitude
    return this.getDefaultSoilData(lat);
  }

  getDefaultSoilData(lat) {
    const absLat = Math.abs(lat);
    
    if (absLat < 23.5) { // Tropical
      return {
        soilType: 'laterite',
        ph: 5.5,
        organicMatter: 'high',
        texture: 'clay-loam',
        drainage: 'good',
        fertility: 'medium',
        characteristics: {
          waterHoldingCapacity: 'high',
          nutrientRetention: 'medium',
          erosionRisk: 'high'
        }
      };
    } else if (absLat < 35) { // Subtropical
      return {
        soilType: 'red earth',
        ph: 6.5,
        organicMatter: 'medium',
        texture: 'loam',
        drainage: 'good',
        fertility: 'high',
        characteristics: {
          waterHoldingCapacity: 'medium',
          nutrientRetention: 'high',
          erosionRisk: 'medium'
        }
      };
    } else { // Temperate
      return {
        soilType: 'brown earth',
        ph: 7.0,
        organicMatter: 'medium',
        texture: 'silt-loam',
        drainage: 'moderate',
        fertility: 'medium',
        characteristics: {
          waterHoldingCapacity: 'medium',
          nutrientRetention: 'medium',
          erosionRisk: 'low'
        }
      };
    }
  }
}

module.exports = new SoilService();