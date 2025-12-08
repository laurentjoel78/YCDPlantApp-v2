import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, StyleSheet, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { StackNavigationProp } from '@react-navigation/stack';

import { useTheme } from '../theme';
import WeatherCard from '../components/WeatherCard';
import FeatureCard from '../components/FeatureCard';
import SuggestionsCard from '../components/SuggestionsCard';
import AIFAB from '../components/AIFAB';
import CommunityCard from '../components/CommunityCard';
import { useAuth } from '../hooks';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../i18n';
import { useSocket } from '../context/SocketContext';

import { getCurrentLocation, getAddressFromCoords, requestLocationPermission, LocationCoords } from '../services/locationService';
import { getWeather, getWeatherIcon, WeatherData } from '../services/weatherService';
import { cacheService, CACHE_KEYS } from '../services/cacheService';

type RootStackParamList = {
  DiseaseDetection: undefined;
  Weather: undefined;
  ExpertAdvisory: undefined;
  Marketplace: undefined;
  AIAssistant: undefined;
  Forums: undefined;
  Profile: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

type FeatureType = 'disease' | 'weather' | 'marketplace' | 'ai';

interface FeatureItem {
  id: FeatureType;
  title: string;
  icon: string;
  route: keyof RootStackParamList;
}

const features: FeatureItem[] = [
  { id: 'disease', title: 'Disease Detection', icon: 'leaf', route: 'DiseaseDetection' },
  { id: 'weather', title: 'Weather', icon: 'weather-partly-cloudy', route: 'Weather' },
  { id: 'marketplace', title: 'Marketplace', icon: 'store', route: 'Marketplace' },
  { id: 'ai', title: 'AI Assistant', icon: 'robot', route: 'AIAssistant' }
];

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  // Use cached weather to display immediately on return visits
  const cachedWeatherData = cacheService.get<{ weather: WeatherData, location: string }>(CACHE_KEYS.WEATHER);
  const [weather, setWeather] = useState<WeatherData | null>(cachedWeatherData?.weather || null);
  const [location, setLocation] = useState<string>(cachedWeatherData?.location || '');
  const [loading, setLoading] = useState(!cachedWeatherData);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { subscribe } = useSocket();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const toggleLanguage = async () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    await changeLanguage(newLang);
  };

  const fetchLocationAndWeather = useCallback(async () => {
    try {
      setError(null);
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setError('Location permission required for weather information');
        return;
      }

      const coords = await getCurrentLocation();
      const address = await getAddressFromCoords(coords);
      const weatherData = await getWeather(coords);

      setLocation(address.city);
      setWeather(weatherData);
      // Cache weather data for instant display on return
      cacheService.set(CACHE_KEYS.WEATHER, { weather: weatherData, location: address.city }, 10 * 60 * 1000); // 10 min TTL
    } catch (error: any) {
      console.error('Error fetching weather:', error);
      setError(error.message || 'Failed to load weather information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLocationAndWeather();
  }, [fetchLocationAndWeather]);

  useEffect(() => {
    const events = [
      'SUGGESTION_CREATE', 'SUGGESTION_UPDATE',
      'ADVICE_CREATE', 'ADVICE_UPDATE',
      'PRODUCT_CREATE', 'PRODUCT_UPDATE',
      'GUIDELINE_CREATE', 'GUIDELINE_UPDATE',
      'FORUM_TOPIC_CREATE'
    ];

    const unsubscribers = events.map(event =>
      subscribe(event, () => {
        console.log(`Home screen update: ${event}`);
        setRefreshKey(prev => prev + 1);
      })
    );

    return () => unsubscribers.forEach(unsub => unsub());
  }, [subscribe]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    cacheService.invalidate(CACHE_KEYS.WEATHER);
    cacheService.invalidate(CACHE_KEYS.SUGGESTIONS);
    setRefreshKey(prev => prev + 1);
    await fetchLocationAndWeather();
  }, [fetchLocationAndWeather]);

  const navigateToFeature = (feature: FeatureItem) => {
    navigation.navigate(feature.route);
  };

  const filteredFeatures = features.filter(feature =>
    (feature.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2D5016']}
            tintColor="#2D5016"
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>YCD Farmer Guide</Text>
              <Text style={styles.subtitle}>Smart Farming Made Simple</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={toggleLanguage}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: '#E8F5E9',
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: '#2D5016'
                }}
              >
                <Text style={{ color: '#2D5016', fontWeight: 'bold' }}>
                  {i18n.language === 'fr' ? 'EN' : 'FR'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('Profile')}
                accessibilityLabel="Open profile"
                accessibilityRole="button"
              >
                <Icon name="account-circle" size={36} color="#2D5016" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.searchBox}>
            <Icon name="magnify" size={24} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search features..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
              accessibilityLabel="Search features"
            />
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.weatherContainer}>
            <WeatherCard
              weather={weather}
              placeName={location}
              onPress={() => navigation.navigate('Weather')}
            />
          </View>

          <View style={styles.featuresGrid}>
            {filteredFeatures.map(feature => (
              <View key={feature.id} style={styles.featureCard}>
                <TouchableOpacity
                  style={styles.featureCardInner}
                  onPress={() => navigateToFeature(feature)}
                  accessibilityLabel={`Open ${feature.title}`}
                  accessibilityRole="button"
                >
                  <Icon
                    name={feature.icon}
                    size={32}
                    color="#2D5016"
                    style={{ marginBottom: 8 }}
                  />
                  <Text style={styles.featureText}>{feature.title}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <CommunityCard onPress={() => navigation.navigate('Forums')} />

          <View style={styles.guidelinesContainer}>
            <SuggestionsCard key={refreshKey} farmId={user?.farms?.[0]?.id} />
          </View>



        </View>
      </ScrollView>

      <AIFAB onPress={() => navigation.navigate('AIAssistant')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16 },
  header: { padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2D5016' },
  subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 8 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, fontSize: 16, marginLeft: 8, color: '#1F2937' },
  weatherContainer: { marginBottom: 16 },
  guidelinesContainer: { marginVertical: 12 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8, marginTop: 16 },
  featureCard: { width: '50%', padding: 8 },
  featureCardInner: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center', justifyContent: 'center', aspectRatio: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  featureText: { fontSize: 16, fontWeight: '600', color: '#1F2937', textAlign: 'center' },
});

export default HomeScreen;