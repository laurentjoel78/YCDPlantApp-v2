const axios = require('axios');
const { WeatherData, Farm, Notification } = require('../models');
const { sendNotification } = require('../utils/notificationHelper');

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.baseUrl = 'https://api.openweathermap.org/data/3.0';
  }

  // Convenience method used by suggestionService to get minimal weather summary
  // for given coordinates. Returns an object like { recentRain, tempMax }.
  async getWeatherForCoords({ lat, lng }) {
    try {
      if (!lat || !lng) return { recentRain: 0, tempMax: 30 };
      // If an API key is configured, fetch fresh data
      if (this.apiKey) {
        const data = await this.fetchWeatherData(lat, lng, console);
        const recentRain = (data.current && data.current.rain && data.current.rain['1h']) ? data.current.rain['1h'] : 0;
        let tempMax = 30;
        if (data.daily && Array.isArray(data.daily) && data.daily.length > 0) {
          // daily[].temp may be object with max/min depending on provider
          tempMax = data.daily[0].temp && data.daily[0].temp.max ? data.daily[0].temp.max : (data.daily[0].temp || 30);
        }
        return { recentRain: Number(recentRain), tempMax: Number(tempMax) };
      }

      // No API key - fall back to reasonable defaults for local development
      return { recentRain: 0, tempMax: 30 };
    } catch (err) {
      console.warn('getWeatherForCoords failed, returning defaults', err && err.message);
      return { recentRain: 0, tempMax: 30 };
    }
  }

  async fetchWeatherData(lat, lon, logger) {
    try {
      logger.debug('Fetching weather data from Tomorrow.io', {
        latitude: lat,
        longitude: lon
      });

      // Primary: Tomorrow.io
      const weatherData = await this.fetchFromTomorrowIO(lat, lon);
      return weatherData;

    } catch (error) {
      logger.warn('Tomorrow.io API failed, attempting fallback to Open-Meteo', {
        error: error.message
      });

      // Fallback: Open-Meteo
      try {
        const om = await this.fetchFromOpenMeteo(lat, lon);
        if (om) return om;
      } catch (omErr) {
        logger.error('Open-Meteo fallback failed', { error: omErr && omErr.message });
      }

      throw new Error('Failed to fetch weather data from available providers');
    }
  }

  async fetchFromTomorrowIO(lat, lon) {
    try {
      const apiKey = 'icp9EgKwnOTQsrUUQPMDQy9HStK3F2xC'; // User provided key
      const url = 'https://api.tomorrow.io/v4/timelines';

      const response = await axios.get(url, {
        params: {
          location: `${lat},${lon}`,
          fields: [
            'temperature',
            'temperatureApparent',
            'humidity',
            'windSpeed',
            'windDirection',
            'precipitationIntensity',
            'precipitationProbability',
            'pressureSurfaceLevel',
            'weatherCode',
            'uvIndex'
          ].join(','),
          timesteps: ['current', '1h', '1d'],
          units: 'metric',
          apikey: apiKey
        }
      });

      const data = response.data.data;
      const timelines = data.timelines;

      const current = timelines.find(t => t.timestep === 'current')?.intervals[0]?.values || {};
      const hourly = timelines.find(t => t.timestep === '1h')?.intervals || [];
      const daily = timelines.find(t => t.timestep === '1d')?.intervals || [];

      // Map Tomorrow.io weather codes to OpenWeather-like structure
      const mapWeatherCode = (code) => {
        // Simple mapping based on Tomorrow.io codes
        // 1000: Clear, 1100: Mostly Clear, 1101: Partly Cloudy, 1102: Mostly Cloudy, 1001: Cloudy
        // 4000: Drizzle, 4001: Rain, 4200: Light Rain, 4201: Heavy Rain
        // 5000: Snow, 5001: Flurries, 5100: Light Snow, 5101: Heavy Snow
        // 8000: Thunderstorm
        const map = {
          1000: { main: 'Clear', description: 'Clear, Sunny', icon: '01d' },
          1100: { main: 'Clear', description: 'Mostly Clear', icon: '02d' },
          1101: { main: 'Clouds', description: 'Partly Cloudy', icon: '03d' },
          1102: { main: 'Clouds', description: 'Mostly Cloudy', icon: '04d' },
          1001: { main: 'Clouds', description: 'Cloudy', icon: '04d' },
          4000: { main: 'Drizzle', description: 'Drizzle', icon: '09d' },
          4001: { main: 'Rain', description: 'Rain', icon: '10d' },
          4200: { main: 'Rain', description: 'Light Rain', icon: '10d' },
          4201: { main: 'Rain', description: 'Heavy Rain', icon: '10d' },
          5000: { main: 'Snow', description: 'Snow', icon: '13d' },
          5100: { main: 'Snow', description: 'Light Snow', icon: '13d' },
          5101: { main: 'Snow', description: 'Heavy Snow', icon: '13d' },
          8000: { main: 'Thunderstorm', description: 'Thunderstorm', icon: '11d' }
        };
        return map[code] || { main: 'Unknown', description: 'Unknown', icon: '50d' };
      };

      // Helper to safely get value
      const getVal = (obj, key, def = 0) => (obj && obj[key] !== undefined ? obj[key] : def);

      const mapped = {
        current: {
          dt: Math.floor(Date.now() / 1000),
          temp: getVal(current, 'temperature'),
          feels_like: getVal(current, 'temperatureApparent'),
          humidity: getVal(current, 'humidity'),
          pressure: getVal(current, 'pressureSurfaceLevel'),
          uv_index: getVal(current, 'uvIndex'),
          wind_speed: getVal(current, 'windSpeed'),
          wind_deg: getVal(current, 'windDirection'),
          rain: { '1h': getVal(current, 'precipitationIntensity') },
          weather: [mapWeatherCode(current.weatherCode)],
          uvi: getVal(current, 'uvIndex')
        },
        hourly: hourly.slice(0, 48).map(h => ({
          dt: Math.floor(new Date(h.startTime).getTime() / 1000),
          temp: getVal(h.values, 'temperature'),
          feels_like: getVal(h.values, 'temperatureApparent'),
          humidity: getVal(h.values, 'humidity'),
          pressure: getVal(h.values, 'pressureSurfaceLevel'),
          uv_index: getVal(h.values, 'uvIndex'),
          wind_speed: getVal(h.values, 'windSpeed'),
          wind_deg: getVal(h.values, 'windDirection'),
          rain: { '1h': getVal(h.values, 'precipitationIntensity') },
          pop: getVal(h.values, 'precipitationProbability') / 100,
          weather: [mapWeatherCode(h.values.weatherCode)],
          uvi: getVal(h.values, 'uvIndex')
        })),
        daily: daily.map(d => ({
          dt: Math.floor(new Date(d.startTime).getTime() / 1000),
          temp: {
            day: getVal(d.values, 'temperature'),
            min: getVal(d.values, 'temperature') - 5, // Approx range since daily usually gives avg/max in some APIs, timelines gives intervals
            max: getVal(d.values, 'temperature') + 5
          },
          feels_like: { day: getVal(d.values, 'temperatureApparent') },
          humidity: getVal(d.values, 'humidity'),
          pressure: getVal(d.values, 'pressureSurfaceLevel'),
          wind_speed: getVal(d.values, 'windSpeed'),
          wind_deg: getVal(d.values, 'windDirection'),
          rain: getVal(d.values, 'precipitationIntensity') * 24, // Approx daily sum
          pop: getVal(d.values, 'precipitationProbability') / 100,
          weather: [mapWeatherCode(d.values.weatherCode)],
          uvi: getVal(d.values, 'uvIndex')
        }))
      };

      return mapped;
    } catch (err) {
      console.warn('Tomorrow.io fetch failed', err.message);
      throw err;
    }
  }

  // Fallback: query Open-Meteo (free, no API key)
  async fetchFromOpenMeteo(lat, lon) {
    try {
      const url = 'https://api.open-meteo.com/v1/forecast';
      // Request hourly and daily fields that we commonly use
      const params = {
        latitude: lat,
        longitude: lon,
        hourly: 'temperature_2m,precipitation,precipitation_probability,windspeed_10m,winddirection_10m,relativehumidity_2m,surface_pressure',
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_hours,weathercode,windspeed_10m_max',
        current_weather: true,
        timezone: 'UTC'
      };

      const res = await axios.get(url, { params, timeout: 10000 });
      const data = res.data;

      // Helper to map WMO codes to OpenWeather-like structure
      const mapWeatherCode = (code) => {
        const map = {
          0: { main: 'Clear', description: 'Clear sky', icon: '01d' },
          1: { main: 'Clouds', description: 'Mainly clear', icon: '02d' },
          2: { main: 'Clouds', description: 'Partly cloudy', icon: '03d' },
          3: { main: 'Clouds', description: 'Overcast', icon: '04d' },
          45: { main: 'Fog', description: 'Fog', icon: '50d' },
          48: { main: 'Fog', description: 'Depositing rime fog', icon: '50d' },
          51: { main: 'Drizzle', description: 'Light drizzle', icon: '09d' },
          53: { main: 'Drizzle', description: 'Moderate drizzle', icon: '09d' },
          55: { main: 'Drizzle', description: 'Dense drizzle', icon: '09d' },
          61: { main: 'Rain', description: 'Slight rain', icon: '10d' },
          63: { main: 'Rain', description: 'Moderate rain', icon: '10d' },
          65: { main: 'Rain', description: 'Heavy rain', icon: '10d' },
          71: { main: 'Snow', description: 'Slight snow', icon: '13d' },
          73: { main: 'Snow', description: 'Moderate snow', icon: '13d' },
          75: { main: 'Snow', description: 'Heavy snow', icon: '13d' },
          95: { main: 'Thunderstorm', description: 'Thunderstorm', icon: '11d' }
        };
        return map[code] || { main: 'Unknown', description: 'Unknown', icon: '50d' };
      };

      // Get current hour index
      const currentHourIndex = new Date().getHours();

      // Map Open-Meteo shape to a minimal OpenWeather-like structure used elsewhere in the app
      const mapped = {
        current: {
          temp: data.current_weather?.temperature ?? null,
          wind_speed: data.current_weather?.windspeed ?? null,
          wind_deg: data.current_weather?.winddirection ?? null,
          // Get humidity/pressure from hourly data for current hour
          humidity: data.hourly?.relativehumidity_2m ? data.hourly.relativehumidity_2m[currentHourIndex] : 0,
          pressure: data.hourly?.surface_pressure ? data.hourly.surface_pressure[currentHourIndex] : 1013,
          rain: { '1h': (data.hourly?.precipitation && data.hourly.precipitation[currentHourIndex]) || 0 },
          weather: [mapWeatherCode(data.current_weather?.weathercode)]
        },
        hourly: [],
        daily: []
      };

      // Build hourly entries (limit to 48 points)
      if (data.hourly && Array.isArray(data.hourly.time)) {
        const times = data.hourly.time;
        for (let i = 0; i < Math.min(times.length, 48); i++) {
          mapped.hourly.push({
            dt: Math.floor(new Date(times[i]).getTime() / 1000),
            temp: data.hourly.temperature_2m ? data.hourly.temperature_2m[i] : null,
            wind_speed: data.hourly.windspeed_10m ? data.hourly.windspeed_10m[i] : null,
            wind_deg: data.hourly.winddirection_10m ? data.hourly.winddirection_10m[i] : null,
            humidity: data.hourly.relativehumidity_2m ? data.hourly.relativehumidity_2m[i] : 0,
            pressure: data.hourly.surface_pressure ? data.hourly.surface_pressure[i] : 1013,
            precipitation: data.hourly.precipitation ? data.hourly.precipitation[i] : 0,
            pop: data.hourly.precipitation_probability ? data.hourly.precipitation_probability[i] / 100 : 0,
            weather: [mapWeatherCode(data.hourly.weathercode ? data.hourly.weathercode[i] : 0)]
          });
        }
      }

      // Build daily entries
      if (data.daily && Array.isArray(data.daily.time)) {
        for (let i = 0; i < data.daily.time.length; i++) {
          mapped.daily.push({
            dt: Math.floor(new Date(data.daily.time[i]).getTime() / 1000),
            temp: {
              max: data.daily.temperature_2m_max ? data.daily.temperature_2m_max[i] : null,
              min: data.daily.temperature_2m_min ? data.daily.temperature_2m_min[i] : null,
              day: data.daily.temperature_2m_max ? data.daily.temperature_2m_max[i] : null // Fallback for controller
            },
            humidity: 60, // Daily average not available, use default
            pressure: 1013, // Daily average not available, use default
            wind_speed: data.daily.windspeed_10m_max ? data.daily.windspeed_10m_max[i] : 0,
            wind_deg: 0, // Not available in daily
            rain: data.daily.precipitation_sum ? data.daily.precipitation_sum[i] : 0,
            precipitation_probability: data.daily.precipitation_hours ? data.daily.precipitation_hours[i] / 24 : 0,
            weather: [mapWeatherCode(data.daily.weathercode ? data.daily.weathercode[i] : 0)]
          });
        }
      }

      return mapped;
    } catch (err) {
      throw err;
    }
  }

  async updateWeatherData(farm, logger) {
    try {
      logger.info('Starting weather data update for farm', {
        farmId: farm.id,
        farmLocation: {
          latitude: farm.location_lat,
          longitude: farm.location_lng
        }
      });

      const weatherData = await this.fetchWeatherData(farm.location_lat, farm.location_lng, logger);

      logger.debug('Storing current weather data', {
        farmId: farm.id,
        timestamp: new Date(weatherData.current.dt * 1000),
        weatherCondition: weatherData.current.weather[0].main
      });

      // Store current weather
      await WeatherData.create({
        farm_id: farm.id,
        timestamp: new Date(weatherData.current.dt * 1000),
        temperature: weatherData.current.temp,
        feels_like: weatherData.current.feels_like,
        humidity: weatherData.current.humidity,
        precipitation: weatherData.current.rain ? weatherData.current.rain['1h'] : 0,
        wind_speed: weatherData.current.wind_speed,
        wind_direction: weatherData.current.wind_deg,
        pressure: weatherData.current.pressure,
        uv_index: weatherData.current.uvi,
        weather_condition: weatherData.current.weather[0].main,
        weather_description: weatherData.current.weather[0].description,
        icon_code: weatherData.current.weather[0].icon,
        forecast_type: 'current'
      });

      logger.debug('Storing hourly forecast data', {
        farmId: farm.id,
        forecastHours: 48
      });

      // Store hourly forecasts (next 48 hours)
      for (const hourly of weatherData.hourly.slice(1, 49)) {
        await WeatherData.create({
          farm_id: farm.id,
          timestamp: new Date(hourly.dt * 1000),
          temperature: hourly.temp,
          feels_like: hourly.feels_like,
          humidity: hourly.humidity,
          precipitation: hourly.rain ? hourly.rain['1h'] : 0,
          precipitation_probability: Math.round(hourly.pop * 100),
          wind_speed: hourly.wind_speed,
          wind_direction: hourly.wind_deg,
          pressure: hourly.pressure,
          uv_index: hourly.uvi,
          weather_condition: hourly.weather[0].main,
          weather_description: hourly.weather[0].description,
          icon_code: hourly.weather[0].icon,
          forecast_type: 'hourly'
        });
      }

      logger.debug('Hourly forecasts stored successfully', {
        farmId: farm.id,
        entriesStored: 48
      });

      logger.debug('Storing daily forecast data', {
        farmId: farm.id,
        forecastDays: weatherData.daily.length - 1
      });

      // Store daily forecasts (next 7 days)
      for (const daily of weatherData.daily.slice(1)) {
        await WeatherData.create({
          farm_id: farm.id,
          timestamp: new Date(daily.dt * 1000),
          temperature: daily.temp.day,
          feels_like: daily.feels_like.day,
          humidity: daily.humidity,
          precipitation: daily.rain || 0,
          precipitation_probability: Math.round(daily.pop * 100),
          wind_speed: daily.wind_speed,
          wind_direction: daily.wind_deg,
          pressure: daily.pressure,
          uv_index: daily.uvi,
          weather_condition: daily.weather[0].main,
          weather_description: daily.weather[0].description,
          icon_code: daily.weather[0].icon,
          forecast_type: 'daily'
        });
      }

      logger.debug('Daily forecasts stored successfully', {
        farmId: farm.id,
        entriesStored: weatherData.daily.length - 1
      });

      // Process weather alerts
      if (weatherData.alerts && weatherData.alerts.length > 0) {
        logger.info('Processing weather alerts', {
          farmId: farm.id,
          alertCount: weatherData.alerts.length
        });
        await this.processWeatherAlerts(farm, weatherData.alerts, logger);
      }

      logger.info('Weather data update completed successfully', {
        farmId: farm.id
      });

      return true;
    } catch (error) {
      logger.error('Failed to update weather data', {
        farmId: farm.id,
        error: error.message,
        stack: error.stack
      });
      return false;
    }
  }

  async processWeatherAlerts(farm, alerts, logger) {
    try {
      logger.debug('Processing weather alerts for farm', {
        farmId: farm.id,
        alertCount: alerts.length
      });

      const alertTypes = {
        'Thunderstorm': { severity: 'high', icon: '⛈️' },
        'Drizzle': { severity: 'low', icon: '🌧️' },
        'Rain': { severity: 'medium', icon: '🌧️' },
        'Snow': { severity: 'high', icon: '🌨️' },
        'Extreme': { severity: 'critical', icon: '⚠️' },
        'Heat': { severity: 'high', icon: '🌡️' },
        'Cold': { severity: 'high', icon: '❄️' },
        'Storm': { severity: 'high', icon: '🌪️' },
        'Flood': { severity: 'critical', icon: '🌊' }
      };

      for (const alert of alerts) {
        const alertType = Object.keys(alertTypes).find(type =>
          alert.event.toLowerCase().includes(type.toLowerCase())
        ) || 'Other';

        const { severity, icon } = alertTypes[alertType] || { severity: 'medium', icon: '⚠️' };

        logger.debug('Processing individual weather alert', {
          farmId: farm.id,
          alertType,
          severity,
          event: alert.event,
          start: new Date(alert.start * 1000),
          end: new Date(alert.end * 1000)
        });

        // Store alert in weather data
        await WeatherData.create({
          farm_id: farm.id,
          timestamp: new Date(alert.start * 1000),
          forecast_type: 'daily',
          weather_condition: 'Alert',
          weather_description: alert.event,
          alerts: [{
            type: alertType,
            severity,
            title: alert.event,
            description: alert.description,
            start: new Date(alert.start * 1000),
            end: new Date(alert.end * 1000)
          }]
        });

        logger.debug('Weather alert stored in database', {
          farmId: farm.id,
          alertType,
          event: alert.event
        });

        // Send notification to farmer
        await sendNotification({
          user_id: farm.farmer_id,
          type: 'weather_alert',
          title: `${icon} Weather Alert: ${alert.event}`,
          message: alert.description,
          data: {
            farm_id: farm.id,
            alert_type: alertType,
            severity,
            start: alert.start,
            end: alert.end
          }
        });

        logger.debug('Weather alert notification sent to farmer', {
          farmId: farm.id,
          farmerId: farm.farmer_id,
          alertType,
          event: alert.event
        });
      }

      logger.info('Weather alerts processed successfully', {
        farmId: farm.id,
        alertCount: alerts.length
      });
    } catch (error) {
      logger.error('Failed to process weather alerts', {
        farmId: farm.id,
        error: error.message,
        stack: error.stack
      });
    }
  }

  async getWeatherForecast(farmId, type = 'all', logger) {
    try {
      logger.debug('Fetching weather forecast', {
        farmId,
        forecastType: type
      });

      const farm = await Farm.findOne({
        where: { id: farmId, is_active: true }
      });

      if (!farm) {
        logger.warn('Farm not found', { farmId });
        throw new Error('Farm not found');
      }

      // Check cache first
      const weatherCache = require('./weatherCache');
      const cachedData = type === 'daily' ?
        await weatherCache.getCachedForecast(farmId) :
        await weatherCache.getCachedWeather(farmId);

      if (cachedData) {
        logger.debug('Returning cached weather data', {
          farmId,
          forecastType: type,
          cacheHit: true
        });
        return cachedData;
      }

      // Update weather data if it's older than 1 hour
      const latestWeather = await WeatherData.findOne({
        where: { farm_id: farmId },
        order: [['created_at', 'DESC']]
      });

      if (!latestWeather ||
        (new Date() - new Date(latestWeather.created_at)) > 3600000) {
        logger.info('Weather data outdated, triggering update', {
          farmId,
          lastUpdate: latestWeather ? latestWeather.created_at : null
        });
        await this.updateWeatherData(farm, logger);
      }

      // Prepare query conditions
      const where = { farm_id: farmId };
      if (type !== 'all') {
        where.forecast_type = type;
      }

      // Get weather data
      const weatherData = await WeatherData.findAll({
        where,
        order: [['timestamp', 'ASC']],
        limit: type === 'hourly' ? 48 : type === 'daily' ? 7 : 1
      });

      logger.debug('Retrieved weather data from database', {
        farmId,
        forecastType: type,
        entriesCount: weatherData.length
      });

      const formattedData = {
        farm: {
          id: farm.id,
          name: farm.name,
          location: {
            lat: farm.location_lat,
            lng: farm.location_lng
          }
        },
        weather: weatherData
      };

      // Cache the results
      if (type === 'daily') {
        await weatherCache.setCachedForecast(farmId, formattedData);
      } else {
        await weatherCache.setCachedWeather(farmId, formattedData);
      }

      logger.info('Weather forecast retrieved successfully', {
        farmId,
        forecastType: type,
        dataCached: true
      });

      return formattedData;
    } catch (error) {
      logger.error('Failed to get weather forecast', {
        farmId,
        forecastType: type,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async getWeatherAlerts(farmId, logger) {
    try {
      logger.debug('Fetching weather alerts', { farmId });

      // Check cache first
      const weatherCache = require('./weatherCache');
      const cachedAlerts = await weatherCache.getCachedAlerts(farmId);

      if (cachedAlerts) {
        logger.debug('Returning cached alerts', {
          farmId,
          alertCount: cachedAlerts.length,
          cacheHit: true
        });
        return cachedAlerts;
      }

      const alerts = await WeatherData.findAll({
        where: {
          farm_id: farmId,
          weather_condition: 'Alert'
        },
        order: [['timestamp', 'DESC']],
        limit: 10
      });

      logger.debug('Retrieved alerts from database', {
        farmId,
        alertCount: alerts.length
      });

      // Cache the alerts
      await weatherCache.setCachedAlerts(farmId, alerts);

      logger.info('Weather alerts retrieved successfully', {
        farmId,
        alertCount: alerts.length,
        dataCached: true
      });

      return alerts;
    } catch (error) {
      logger.error('Failed to get weather alerts', {
        farmId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async analyzeCropWeatherImpact(farmId, logger) {
    try {
      logger.debug('Starting crop weather impact analysis', { farmId });

      const farm = await Farm.findOne({
        where: { id: farmId, is_active: true },
        include: [
          {
            model: Crop,
            through: { attributes: [] }
          }
        ]
      });

      if (!farm) {
        logger.warn('Farm not found for weather impact analysis', { farmId });
        throw new Error('Farm not found');
      }

      logger.debug('Farm crops retrieved', {
        farmId,
        cropCount: farm.Crops.length
      });

      // Check cache first for weather impacts
      const weatherCache = require('./weatherCache');
      const cachedImpacts = await weatherCache.getCachedImpacts(farmId);

      if (cachedImpacts) {
        logger.debug('Returning cached weather impacts', {
          farmId,
          impactCount: cachedImpacts.length,
          cacheHit: true
        });
        return cachedImpacts;
      }

      const forecast = await this.getWeatherForecast(farmId, 'all', logger);
      const impacts = [];

      for (const crop of farm.Crops) {
        logger.debug('Assessing weather impact for crop', {
          farmId,
          cropId: crop.id,
          cropName: crop.name
        });

        const impact = this.assessWeatherImpact(crop, forecast.weather, logger);
        if (impact.risk_level > 'low') {
          impacts.push({
            crop_name: crop.name,
            ...impact
          });

          logger.info('High risk weather impact detected for crop', {
            farmId,
            cropId: crop.id,
            cropName: crop.name,
            riskLevel: impact.risk_level,
            risks: impact.risks
          });

          // Send notification for medium or high risks
          await sendNotification({
            user_id: farm.farmer_id,
            type: 'crop_weather_alert',
            title: `🌱 Weather Impact Alert for ${crop.name}`,
            message: impact.recommendation,
            data: {
              farm_id: farm.id,
              crop_id: crop.id,
              risk_level: impact.risk_level
            }
          });

          logger.debug('Weather impact notification sent', {
            farmId,
            cropId: crop.id,
            farmerId: farm.farmer_id,
            riskLevel: impact.risk_level
          });
        }
      }

      // Cache the impacts analysis
      await weatherCache.setCachedImpacts(farmId, impacts);

      logger.info('Crop weather impact analysis completed', {
        farmId,
        impactCount: impacts.length,
        highRiskCrops: impacts.filter(i => i.risk_level === 'high').length
      });

      return impacts;
    } catch (error) {
      logger.error('Failed to analyze crop weather impact', {
        farmId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  assessWeatherImpact(crop, weatherData, logger) {
    logger.debug('Assessing weather impact details', {
      cropId: crop.id,
      cropName: crop.name
    });

    const impact = {
      risk_level: 'low',
      risks: [],
      recommendation: ''
    };

    // Example weather impact assessment logic (customize based on crop requirements)
    const currentWeather = weatherData.find(w => w.forecast_type === 'current');
    const dailyForecasts = weatherData.filter(w => w.forecast_type === 'daily');

    logger.debug('Current weather conditions', {
      cropId: crop.id,
      temperature: currentWeather.temperature,
      windSpeed: currentWeather.wind_speed
    });

    // Temperature stress check
    if (currentWeather.temperature > 35) {
      impact.risks.push('High temperature stress');
      impact.risk_level = 'high';
      logger.debug('High temperature stress detected', {
        cropId: crop.id,
        temperature: currentWeather.temperature
      });
    } else if (currentWeather.temperature < 5) {
      impact.risks.push('Low temperature stress');
      impact.risk_level = 'high';
      logger.debug('Low temperature stress detected', {
        cropId: crop.id,
        temperature: currentWeather.temperature
      });
    }

    // Rainfall analysis
    const totalRainfall = dailyForecasts.reduce((sum, day) => sum + day.precipitation, 0);
    logger.debug('Rainfall analysis', {
      cropId: crop.id,
      totalRainfall,
      forecastDays: dailyForecasts.length
    });

    if (totalRainfall > 100) {
      impact.risks.push('Excessive rainfall expected');
      impact.risk_level = 'high';
    } else if (totalRainfall < 10) {
      impact.risks.push('Drought conditions possible');
      impact.risk_level = 'medium';
    }

    // Wind damage risk
    if (currentWeather.wind_speed > 20) {
      impact.risks.push('High wind speed risk');
      impact.risk_level = Math.max(impact.risk_level, 'medium');
      logger.debug('High wind risk detected', {
        cropId: crop.id,
        windSpeed: currentWeather.wind_speed
      });
    }

    // Generate recommendations
    if (impact.risks.length > 0) {
      impact.recommendation = this.generateRecommendations(impact.risks, crop.name);
      logger.debug('Generated weather impact recommendations', {
        cropId: crop.id,
        riskCount: impact.risks.length,
        riskLevel: impact.risk_level
      });
    }

    return impact;
  }

  generateRecommendations(risks, cropName, logger) {
    logger.debug('Generating weather impact recommendations', {
      cropName,
      riskCount: risks.length,
      risks
    });

    const recommendations = [];

    risks.forEach(risk => {
      switch (risk) {
        case 'High temperature stress':
          recommendations.push(
            `Consider providing shade for ${cropName} and increase irrigation frequency.`
          );
          break;
        case 'Low temperature stress':
          recommendations.push(
            `Protect ${cropName} with covers or greenhouses if possible.`
          );
          break;
        case 'Excessive rainfall expected':
          recommendations.push(
            `Ensure proper drainage for ${cropName} and monitor for disease development.`
          );
          break;
        case 'Drought conditions possible':
          recommendations.push(
            `Plan irrigation schedule for ${cropName} and consider mulching.`
          );
          break;
        case 'High wind speed risk':
          recommendations.push(
            `Consider installing windbreaks or supports for ${cropName}.`
          );
          break;
      }
    });

    const finalRecommendations = recommendations.join(' ');
    logger.debug('Generated recommendations', {
      cropName,
      recommendationCount: recommendations.length,
      recommendations: finalRecommendations
    });

    return finalRecommendations;
  }
}

module.exports = new WeatherService();