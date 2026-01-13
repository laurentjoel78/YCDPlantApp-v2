import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Alert } from 'react-native';
import { Button, Text, IconButton, TextInput, ActivityIndicator } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';

// MapTiler API Key
const MAPTILER_API_KEY = '9lMTxlVC1EysZQBcOfdS';

type MapPickerProps = {
  latitude: number;
  longitude: number;
  onLocationSelect: (latitude: number, longitude: number) => void;
  style?: object;
};

export default function MapPicker({
  latitude,
  longitude,
  onLocationSelect,
  style
}: MapPickerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentLat, setCurrentLat] = useState(latitude || 7.3697); // Default: Cameroon
  const [currentLng, setCurrentLng] = useState(longitude || 12.3547);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const { t } = useTranslation();

  // Update state when props change
  useEffect(() => {
    if (latitude && longitude) {
      setCurrentLat(latitude);
      setCurrentLng(longitude);
    }
  }, [latitude, longitude]);

  // Get current location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLat = location.coords.latitude;
      const newLng = location.coords.longitude;
      setCurrentLat(newLat);
      setCurrentLng(newLng);
      onLocationSelect(newLat, newLng);

      // Update map if webview is loaded
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          if (typeof map !== 'undefined' && typeof marker !== 'undefined') {
            map.setView([${newLat}, ${newLng}], 13);
            marker.setLatLng([${newLat}, ${newLng}]);
          }
          true;
        `);
      }
    } catch (err) {
      console.error('Error getting location:', err);
      setLocationError('Could not get location');
    } finally {
      setGettingLocation(false);
    }
  };

  // Search for landmarks to help farmers find their location
  const searchLandmark = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    try {
      // Use Nominatim OpenStreetMap search API
      const query = encodeURIComponent(`${searchQuery.trim()}, Cameroon`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
        { headers: { 'User-Agent': 'YCD-Farmer-Guide/1.0' } }
      );
      
      const results = await response.json();
      
      if (results && results.length > 0) {
        const result = results[0];
        const newLat = parseFloat(result.lat);
        const newLng = parseFloat(result.lon);
        
        setCurrentLat(newLat);
        setCurrentLng(newLng);
        onLocationSelect(newLat, newLng);
        
        // Update map
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(`
            if (typeof map !== 'undefined' && typeof marker !== 'undefined') {
              map.setView([${newLat}, ${newLng}], 14);
              marker.setLatLng([${newLat}, ${newLng}]);
            }
            true;
          `);
        }
        
        Alert.alert('Location Found', `Found: ${result.display_name}`);
        setSearchQuery(''); // Clear search after successful search
      } else {
        Alert.alert('Location Not Found', `Could not find "${searchQuery}". Try searching for a nearby town, village, or landmark in Cameroon.`);
      }
    } catch (err) {
      console.error('Search error:', err);
      Alert.alert('Search Error', 'Could not search for location. Please check your internet connection.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle messages from WebView (map clicks)
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'locationSelected') {
        setCurrentLat(data.lat);
        setCurrentLng(data.lng);
        onLocationSelect(data.lat, data.lng);
      }
    } catch (e) {
      console.error('Error parsing WebView message:', e);
    }
  };

  // MapTiler HTML with Leaflet
  const mapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; }
    #map { width: 100%; height: 100%; }
    .leaflet-control-attribution { font-size: 8px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([${currentLat}, ${currentLng}], 13);
    
    L.tileLayer('https://api.maptiler.com/maps/openstreetmap/{z}/{x}/{y}.jpg?key=${MAPTILER_API_KEY}', {
      attribution: '© MapTiler © OpenStreetMap',
      maxZoom: 19
    }).addTo(map);
    
    var marker = L.marker([${currentLat}, ${currentLng}], { draggable: true }).addTo(map);
    
    // Handle marker drag
    marker.on('dragend', function(e) {
      var pos = marker.getLatLng();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'locationSelected',
        lat: pos.lat,
        lng: pos.lng
      }));
    });
    
    // Handle map click
    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'locationSelected',
        lat: e.latlng.lat,
        lng: e.latlng.lng
      }));
    });
  </script>
</body>
</html>
  `;

  return (
    <View style={[styles.container, style]}>
      {locationError && (
        <Text style={styles.errorText}>{locationError}</Text>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>📍 {t('farmer.registration.location')}</Text>
        <View style={styles.headerButtons}>
          <IconButton
            icon="crosshairs-gps"
            size={24}
            onPress={getCurrentLocation}
            disabled={gettingLocation}
            iconColor={gettingLocation ? '#ccc' : '#2196F3'}
            style={{ backgroundColor: gettingLocation ? '#f5f5f5' : '#e3f2fd' }}
          />
          <IconButton
            icon={isExpanded ? 'chevron-up' : 'chevron-down'}
            onPress={() => setIsExpanded(!isExpanded)}
            iconColor="#666"
          />
        </View>
      </View>

      {/* Help text for farmers */}
      <View style={styles.helpContainer}>
        <Text style={styles.helpText}>
          💡 Tap the GPS button to use your current location, or tap on the map to select your farm location
        </Text>
      </View>

      {/* Landmark Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchLabel}>🔍 Search for a nearby town or landmark:</Text>
        <View style={styles.searchRow}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="e.g., Douala, Bamenda, Bafoussam..."
            style={styles.searchInput}
            mode="outlined"
            dense
            onSubmitEditing={searchLandmark}
          />
          <Button
            mode="contained"
            onPress={searchLandmark}
            disabled={!searchQuery.trim() || searchLoading}
            style={styles.searchButton}
            compact
          >
            {searchLoading ? <ActivityIndicator size="small" color="#fff" /> : 'Find'}
          </Button>
        </View>
      </View>

      <View style={[
        styles.mapContainer,
        isExpanded ? styles.mapExpanded : styles.mapCollapsed
      ]}>
        <WebView
          ref={webViewRef}
          source={{ html: mapHtml }}
          style={styles.webView}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scrollEnabled={false}
          bounces={false}
        />
      </View>

      {/* Coordinates display */}
      <View style={styles.coordinatesContainer}>
        <Text style={styles.coordinatesLabel}>📍 Selected Location:</Text>
        <Text style={styles.coordinates}>
          {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
        </Text>
        <Text style={styles.coordinatesHelper}>
          Latitude: {currentLat.toFixed(4)} • Longitude: {currentLng.toFixed(4)}
        </Text>
      </View>

      {/* Manual coordinate input */}
      <View style={styles.manualInputContainer}>
        <Text style={styles.manualInputLabel}>🔧 Advanced: Enter coordinates manually</Text>
        <Text style={styles.manualInputHelper}>
          For Cameroon: Latitude (1-13), Longitude (8-17)
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            label="Latitude"
            value={currentLat.toFixed(6)}
            onChangeText={(text) => {
              const val = parseFloat(text);
              if (!isNaN(val) && val >= -90 && val <= 90) {
                setCurrentLat(val);
                onLocationSelect(val, currentLng);
              }
            }}
            keyboardType="decimal-pad"
            style={styles.input}
            mode="outlined"
            dense
          />
          <TextInput
            label="Longitude"
            value={currentLng.toFixed(6)}
            onChangeText={(text) => {
              const val = parseFloat(text);
              if (!isNaN(val) && val >= -180 && val <= 180) {
                setCurrentLng(val);
                onLocationSelect(currentLat, val);
              }
            }}
            keyboardType="decimal-pad"
            style={styles.input}
            mode="outlined"
            dense
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: '#f5f5f5',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  mapContainer: {
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: '#e0e0e0',
  },
  mapCollapsed: {
    height: 250, // Increased from 200 for better usability
  },
  mapExpanded: {
    height: Dimensions.get('window').height * 0.6, // Increased from 0.5
  },
  coordinatesContainer: {
    padding: 12,
    backgroundColor: '#e8f5e9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  coordinatesLabel: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  coordinates: {
    fontSize: 14,
    color: '#1B5E20',
    fontWeight: '600',
  },
  coordinatesHelper: {
    fontSize: 11,
    color: '#4caf50',
    marginTop: 2,
  },
  helpContainer: {
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  helpText: {
    fontSize: 13,
    color: '#2e7d32',
    lineHeight: 18,
  },
  searchContainer: {
    padding: 12,
    backgroundColor: '#fff3e0',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  searchLabel: {
    fontSize: 13,
    color: '#e65100',
    marginBottom: 8,
    fontWeight: '500',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchButton: {
    height: 40,
    justifyContent: 'center',
  },
  manualInputContainer: {
    padding: 12,
    backgroundColor: '#fafafa',
  },
  manualInputLabel: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
    fontWeight: '500',
  },
  manualInputHelper: {
    fontSize: 11,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
  },
  errorText: {
    color: 'red',
    padding: 8,
    textAlign: 'center',
    backgroundColor: '#ffebee',
  },
});
