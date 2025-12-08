const cron = require('node-cron');
const { Farm } = require('../models');
const weatherService = require('../services/weatherService');

class WeatherScheduler {
  constructor() {
    // Schedule hourly weather updates
    cron.schedule('0 * * * *', () => {
      this.updateAllFarmsWeather();
    });

    // Schedule daily forecast updates (early morning)
    cron.schedule('0 5 * * *', () => {
      this.updateAllFarmsForecast();
    });

    // Schedule weather alert checks (every 30 minutes)
    cron.schedule('*/30 * * * *', () => {
      this.checkWeatherAlerts();
    });
  }

  async updateAllFarmsWeather() {
    try {
      console.log('Starting hourly weather update for all farms...');
      const farms = await Farm.findAll({ where: { is_active: true } });
      
      for (const farm of farms) {
        try {
          await weatherService.updateWeatherData(farm);
          console.log(`Updated weather data for farm: ${farm.id}`);
        } catch (error) {
          console.error(`Failed to update weather for farm ${farm.id}:`, error);
        }
      }
      
      console.log('Completed hourly weather update for all farms');
    } catch (error) {
      console.error('Error in updateAllFarmsWeather:', error);
    }
  }

  async updateAllFarmsForecast() {
    try {
      console.log('Starting daily forecast update for all farms...');
      const farms = await Farm.findAll({ where: { is_active: true } });
      
      for (const farm of farms) {
        try {
          const forecast = await weatherService.getWeatherForecast(farm.id, 'daily');
          await weatherService.analyzeCropWeatherImpact(farm.id);
          console.log(`Updated forecast and analyzed impact for farm: ${farm.id}`);
        } catch (error) {
          console.error(`Failed to update forecast for farm ${farm.id}:`, error);
        }
      }
      
      console.log('Completed daily forecast update for all farms');
    } catch (error) {
      console.error('Error in updateAllFarmsForecast:', error);
    }
  }

  async checkWeatherAlerts() {
    try {
      console.log('Checking weather alerts for all farms...');
      const farms = await Farm.findAll({ where: { is_active: true } });
      
      for (const farm of farms) {
        try {
          const alerts = await weatherService.getWeatherAlerts(farm.id);
          if (alerts && alerts.length > 0) {
            console.log(`Found ${alerts.length} alerts for farm: ${farm.id}`);
          }
        } catch (error) {
          console.error(`Failed to check alerts for farm ${farm.id}:`, error);
        }
      }
      
      console.log('Completed weather alert check for all farms');
    } catch (error) {
      console.error('Error in checkWeatherAlerts:', error);
    }
  }

  // Method to start all schedulers
  start() {
    console.log('Starting weather schedulers...');
    // Perform initial update
    this.updateAllFarmsWeather();
    this.updateAllFarmsForecast();
    this.checkWeatherAlerts();
  }
}

module.exports = new WeatherScheduler();