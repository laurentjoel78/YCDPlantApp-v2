const weatherService = require('../services/weatherService');
const { validationResult } = require('express-validator');
const { Farm } = require('../models');

// Helper to get logger if attached to req, or console
const getLogger = (req) => req.log || console;

exports.getCurrentWeather = async (req, res) => {
  try {
    const logger = getLogger(req);
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    logger.info('Fetching current weather for coordinates', { lat, lng });

    const weatherData = await weatherService.fetchWeatherData(lat, lng, logger);

    // Format response to match expected frontend structure
    const response = {
      success: true,
      data: {
        current: {
          temp: weatherData.current.temp,
          humidity: weatherData.current.humidity,
          pressure: weatherData.current.pressure,
          wind_speed: weatherData.current.wind_speed,
          wind_deg: weatherData.current.wind_deg,
          weather: weatherData.current.weather
        }
      }
    };

    res.status(200).json(response);
  } catch (error) {
    const logger = getLogger(req);
    logger.error('Failed to fetch current weather', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
};

exports.getForecast = async (req, res) => {
  try {
    const logger = getLogger(req);
    const { lat, lng, type = 'all' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    logger.info('Fetching weather forecast for coordinates', { lat, lng, type });

    const weatherData = await weatherService.fetchWeatherData(lat, lng, logger);

    // Format response
    const response = {
      success: true,
      data: {
        weather: [
          // Current weather
          {
            forecast_type: 'current',
            temperature: weatherData.current.temp,
            humidity: weatherData.current.humidity,
            pressure: weatherData.current.pressure,
            wind_speed: weatherData.current.wind_speed,
            wind_direction: weatherData.current.wind_deg,
            weather_condition: weatherData.current.weather[0].main,
            weather_description: weatherData.current.weather[0].description,
            icon_code: weatherData.current.weather[0].icon,
            timestamp: new Date(weatherData.current.dt * 1000)
          },
          // Daily forecast
          ...(weatherData.daily || []).map(day => ({
            forecast_type: 'daily',
            temperature: day.temp.day || day.temp.max, // Handle different formats
            humidity: day.humidity,
            pressure: day.pressure,
            wind_speed: day.wind_speed,
            wind_direction: day.wind_deg,
            weather_condition: day.weather[0].main,
            weather_description: day.weather[0].description,
            icon_code: day.weather[0].icon,
            timestamp: new Date(day.dt * 1000)
          }))
        ]
      }
    };

    res.status(200).json(response);
  } catch (error) {
    const logger = getLogger(req);
    logger.error('Failed to fetch forecast', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch forecast data' });
  }
};

exports.getWeatherForecast = async (req, res) => {
  // ... existing implementation ...
  // Keeping this for backward compatibility if used elsewhere
  exports.getForecast(req, res);
};

exports.getWeatherAlerts = async (req, res) => {
  try {
    const logger = getLogger(req);
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      // If no coords, try farmId if authenticated
      if (req.params.farmId) {
        return exports.getFarmWeatherAlerts(req, res);
      }
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const weatherData = await weatherService.fetchWeatherData(lat, lng, logger);

    res.status(200).json({
      success: true,
      data: {
        alerts: weatherData.alerts || []
      }
    });
  } catch (error) {
    const logger = getLogger(req);
    logger.error('Failed to fetch alerts', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch weather alerts' });
  }
};

// Existing farm-specific method
exports.getFarmWeatherAlerts = async (req, res) => {
  try {
    const { farmId } = req.params;
    const logger = getLogger(req);

    logger.info('Fetching weather alerts for farm', { farmId });

    const alerts = await weatherService.getWeatherAlerts(farmId, logger);

    res.status(200).json({ alerts });
  } catch (error) {
    const logger = getLogger(req);
    logger.error('Failed to fetch weather alerts', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch weather alerts' });
  }
};

exports.getLocationByCity = async (req, res) => {
  // Placeholder implementation
  res.status(501).json({ error: 'Not implemented' });
};

exports.getCacheStats = async (req, res) => {
  // Placeholder implementation
  res.status(200).json({ stats: {} });
};

exports.clearCache = async (req, res) => {
  // Placeholder implementation
  res.status(200).json({ message: 'Cache cleared' });
};

exports.getCropWeatherImpact = async (req, res) => {
  try {
    const { farmId } = req.params;
    const logger = getLogger(req);

    logger.info('Analyzing crop weather impact', { farmId });

    const impacts = await weatherService.analyzeCropWeatherImpact(farmId, logger);

    res.status(200).json({ impacts });
  } catch (error) {
    const logger = getLogger(req);
    logger.error('Failed to analyze weather impact', { error: error.message });
    res.status(500).json({ error: 'Failed to analyze weather impact' });
  }
};