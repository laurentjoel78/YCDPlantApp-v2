import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WeatherData, getWeather, getWeatherIcon } from '../services/weatherService';
import { getCurrentLocation, getAddressFromCoords } from '../services/locationService';

export default function WeatherScreen() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState('');

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async () => {
    try {
      if (!refreshing) setLoading(true);
      setError(null);
      const coords = await getCurrentLocation();
      const [address, weatherData] = await Promise.all([
        getAddressFromCoords(coords),
        getWeather(coords)
      ]);
      setLocation(address.city || 'Your Location');
      setWeather(weatherData);
    } catch (err) {
      setError('Failed to fetch weather data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWeatherData();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D5016" />
        <Text style={styles.loadingText}>Loading weather information...</Text>
      </View>
    );
  }

  if (error && !weather) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="weather-cloudy-alert" size={48} color="#DC2626" />
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryText} onPress={fetchWeatherData}>Tap to retry</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2D5016']} />
      }
    >
      <Text style={styles.locationTitle}>{location}</Text>
      <Card style={styles.currentWeatherCard}>
        <Card.Content>
          <View style={styles.weatherMain}>
            <MaterialCommunityIcons
              name={getWeatherIcon(weather?.condition || 'Clear') as any}
              size={64}
              color="#2D5016"
            />
            <Text style={styles.temperature}>{weather?.temperature ?? '--'}°C</Text>
          </View>
          <Text style={styles.condition}>{weather?.condition ?? 'Unknown'}</Text>
          <View style={styles.detailsGrid}>
            <WeatherDetailItem
              icon="water-percent"
              label="Humidity"
              value={`${weather?.humidity ?? '--'}%`}
            />
            <WeatherDetailItem
              icon="weather-windy"
              label="Wind"
              value={`${weather?.windSpeed ?? '--'} km/h`}
            />
            <WeatherDetailItem
              icon="gauge"
              label="Pressure"
              value={`${weather?.pressure ?? '--'} hPa`}
            />
            <WeatherDetailItem
              icon="eye"
              label="Visibility"
              value="10 km"
            />
          </View>
        </Card.Content>
      </Card>

      <Text style={styles.sectionTitle}>5-Day Forecast</Text>
      <View style={styles.dailyForecast}>
        {weather?.daily?.map((day, i) => {
          const date = new Date(day.dt * 1000);
          const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);

          return (
            <Card key={i} style={styles.dailyCard}>
              <Card.Content style={styles.dailyCardContent}>
                <Text style={styles.dayName}>{dayName}</Text>
                <MaterialCommunityIcons
                  name={getWeatherIcon(day.weather[0].main) as any}
                  size={24}
                  color="#2D5016"
                />
                <View style={styles.tempRange}>
                  <Text style={styles.maxTemp}>{Math.round(day.temp.max)}°C</Text>
                  <Text style={styles.minTemp}>{Math.round(day.temp.min)}°C</Text>
                </View>
              </Card.Content>
            </Card>
          );
        })}
      </View>
    </ScrollView>
  );
}

function WeatherDetailItem({
  icon,
  label,
  value
}: {
  icon: "water-percent" | "weather-windy" | "gauge" | "eye";
  label: string;
  value: string
}) {
  return (
    <View style={styles.detailItem}>
      <MaterialCommunityIcons name={icon} size={24} color="#2D5016" />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#2D5016',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#DC2626',
  },
  retryText: {
    marginTop: 8,
    fontSize: 14,
    color: '#2D5016',
    textDecorationLine: 'underline',
  },
  locationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 16,
  },
  currentWeatherCard: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  temperature: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2D5016',
    marginLeft: 16,
  },
  condition: {
    fontSize: 20,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#2D5016',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 12,
    marginTop: 8,
  },
  dailyForecast: {
    marginBottom: 24,
  },
  dailyCard: {
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  dailyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayName: {
    fontSize: 16,
    color: '#2D5016',
    width: 100,
  },
  tempRange: {
    flexDirection: 'row',
    width: 100,
    justifyContent: 'flex-end',
  },
  maxTemp: {
    fontSize: 16,
    color: '#2D5016',
    marginRight: 8,
  },
  minTemp: {
    fontSize: 16,
    color: '#6B7280',
  },
});