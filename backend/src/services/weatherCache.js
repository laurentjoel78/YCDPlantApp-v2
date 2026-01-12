const logger = require('../config/logger');
const Redis = require('redis');
const { promisify } = require('util');

class WeatherCache {
  constructor() {
    this.client = Redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.client.on('error', (err) => logger.error('Redis Client Error:', err));
    this.client.on('connect', () => logger.info('Connected to Redis'));

    // Promisify Redis commands
    this.get = promisify(this.client.get).bind(this.client);
    this.set = promisify(this.client.set).bind(this.client);
    this.del = promisify(this.client.del).bind(this.client);
  }

  async getCachedWeather(farmId) {
    try {
      const cacheKey = `weather:${farmId}:current`;
      const cachedData = await this.get(cacheKey);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
      logger.error('Error getting cached weather:', error);
      return null;
    }
  }

  async cacheWeather(farmId, weatherData) {
    try {
      const cacheKey = `weather:${farmId}:current`;
      // Cache for 30 minutes
      await this.set(cacheKey, JSON.stringify(weatherData), 'EX', 1800);
    } catch (error) {
      logger.error('Error caching weather:', error);
    }
  }

  async getCachedForecast(farmId) {
    try {
      const cacheKey = `weather:${farmId}:forecast`;
      const cachedData = await this.get(cacheKey);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
      logger.error('Error getting cached forecast:', error);
      return null;
    }
  }

  async cacheForecast(farmId, forecastData) {
    try {
      const cacheKey = `weather:${farmId}:forecast`;
      // Cache for 3 hours
      await this.set(cacheKey, JSON.stringify(forecastData), 'EX', 10800);
    } catch (error) {
      logger.error('Error caching forecast:', error);
    }
  }

  async getCachedAlerts(farmId) {
    try {
      const cacheKey = `weather:${farmId}:alerts`;
      const cachedData = await this.get(cacheKey);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
      logger.error('Error getting cached alerts:', error);
      return null;
    }
  }

  async cacheAlerts(farmId, alertsData) {
    try {
      const cacheKey = `weather:${farmId}:alerts`;
      // Cache for 15 minutes
      await this.set(cacheKey, JSON.stringify(alertsData), 'EX', 900);
    } catch (error) {
      logger.error('Error caching alerts:', error);
    }
  }

  async invalidateCache(farmId) {
    try {
      const keys = [
        `weather:${farmId}:current`,
        `weather:${farmId}:forecast`,
        `weather:${farmId}:alerts`
      ];
      await Promise.all(keys.map(key => this.del(key)));
    } catch (error) {
      logger.error('Error invalidating cache:', error);
    }
  }
}

module.exports = new WeatherCache();