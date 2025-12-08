import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { weatherImages } from '../assets/weather';
import { LinearGradient } from 'expo-linear-gradient';

interface WeatherDisplayProps {
  temperature: number;
  condition: string;
  wind: string;
  location?: string;
}

const WeatherDisplay = ({ temperature, condition, wind }: WeatherDisplayProps) => {
  const { colors } = useTheme();

  const textStyles = {
    temperature: {
      ...styles.temperature,
      color: colors.surface,
    },
    condition: {
      ...styles.condition,
      color: colors.surface,
    },
    wind: {
      ...styles.wind,
      color: colors.surface,
    },
  };

  const getWeatherBackground = () => {
    const cond = (condition || '').toLowerCase();
    switch (cond) {
      case 'sunny':
        return require('../assets/weather/sunny.jpg');
      case 'partly cloudy':
        return require('../assets/weather/partly-cloudy.jpg');
      case 'cloudy':
        return require('../assets/weather/cloudy.jpg');
      case 'rainy':
        return require('../assets/weather/rainy.jpg');
      default:
        return require('../assets/weather/default.jpg');
    }
  };

  const getWeatherIcon = () => {
    const cond = (condition || '').toLowerCase();
    switch (cond) {
      case 'sunny':
        return '☀️';
      case 'partly cloudy':
        return '⛅';
      case 'cloudy':
        return '☁️';
      case 'rainy':
        return '🌧️';
      default:
        return '☀️';
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={getWeatherBackground()}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <View style={styles.overlay}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Text style={styles.weatherIcon}>{getWeatherIcon()}</Text>
            </View>
            <View style={styles.infoContainer}>
              <Text style={textStyles.temperature}>{temperature}°C</Text>
              <Text style={textStyles.condition}>{condition}</Text>
              <Text style={textStyles.wind}>{wind}</Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: 10,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backgroundImageStyle: {
    borderRadius: 20,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 20,
  },
  weatherIcon: {
    fontSize: 48,
  },
  infoContainer: {
    flex: 1,
  },
  temperature: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  condition: {
    fontSize: 18,
    marginBottom: 4,
  },
  wind: {
    fontSize: 14,
    opacity: 0.8,
  },
});

export default WeatherDisplay;