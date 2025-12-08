import axios from 'axios';
import { LocationCoords } from './locationService';
import { getStoredToken } from '../utils/authStorage';

// Use the backend API URL (assuming running on emulator)
// Use the configured API URL
import { BASE_URL } from './api';

// Use the configured API URL from api.ts which handles localhost/emulator logic
const API_URL = BASE_URL;

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  icon?: string;
  daily?: DailyForecast[];
}

export interface DailyForecast {
  dt: number;
  temp: {
    max: number;
    min: number;
  };
  weather: {
    main: string;
    description: string;
    icon: string;
  }[];
}

export const getWeather = async (coords: LocationCoords): Promise<WeatherData> => {
  try {
    const token = await getStoredToken();

    // Call our backend instead of external API directly
    const response = await axios.get(`${API_URL}/weather/forecast`, {
      params: {
        lat: coords.latitude,
        lng: coords.longitude,
        type: 'all' // Request both current and forecast
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const { weather } = response.data.data;

    // Parse the response which contains an array of weather data points
    // The backend returns a flat array, we need to separate current vs daily
    // Note: The backend implementation might need adjustment to return structured data
    // For now, let's assume the backend returns { current: {}, daily: [] } structure 
    // or we parse the flat array based on 'forecast_type'

    const current = weather.find((w: any) => w.forecast_type === 'current') || weather[0];
    const daily = weather.filter((w: any) => w.forecast_type === 'daily');

    return {
      temperature: Math.round(current.temperature),
      condition: current.weather_condition,
      humidity: current.humidity,
      pressure: current.pressure,
      windSpeed: current.wind_speed,
      windDirection: current.wind_direction,
      icon: current.icon_code,
      daily: daily.map((d: any) => ({
        dt: new Date(d.timestamp).getTime() / 1000,
        temp: {
          max: d.temperature, // Backend stores max temp in temperature field for daily
          min: d.temperature - 5 // Approximation if min not available
        },
        weather: [{
          main: d.weather_condition,
          description: d.weather_description,
          icon: d.icon_code
        }]
      }))
    };
  } catch (error) {
    console.error('Weather API error:', error);

    // Fallback for demo/offline if backend fails
    return {
      temperature: 28,
      condition: 'Partly Cloudy',
      humidity: 75,
      pressure: 1012,
      windSpeed: 12,
      windDirection: 180,
      daily: Array(5).fill(0).map((_, i) => ({
        dt: Date.now() / 1000 + i * 86400,
        temp: { max: 30, min: 22 },
        weather: [{ main: 'Cloudy', description: 'Cloudy', icon: '03d' }]
      }))
    };
  }
};

export const getWeatherIcon = (condition: string): string => {
  const cond = condition.toLowerCase();

  if (cond.includes('clear') || cond.includes('sun')) return 'weather-sunny';
  if (cond.includes('cloud')) return 'weather-cloudy';
  if (cond.includes('rain') || cond.includes('drizzle')) return 'weather-rainy';
  if (cond.includes('thunder') || cond.includes('storm')) return 'weather-lightning';
  if (cond.includes('snow')) return 'weather-snowy';
  if (cond.includes('mist') || cond.includes('fog')) return 'weather-fog';

  return 'weather-partly-cloudy';
};