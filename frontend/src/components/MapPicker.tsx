import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Button, Text, IconButton, TextInput } from 'react-native-paper';
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
        <Text style={styles.title}>{t('farmer.registration.location')}</Text>
        <View style={styles.headerButtons}>
          <IconButton
            icon="crosshairs-gps"
            size={20}
            onPress={getCurrentLocation}
            disabled={gettingLocation}
          />
          <IconButton
            icon={isExpanded ? 'chevron-up' : 'chevron-down'}
            onPress={() => setIsExpanded(!isExpanded)}
          />
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
          {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
        </Text>
      </View>

      {/* Manual coordinate input */}
      <View style={styles.manualInputContainer}>
        <Text style={styles.manualInputLabel}>Or enter manually:</Text>
        <View style={styles.inputRow}>
          <TextInput
            label="Lat"
            value={currentLat.toString()}
            onChangeText={(text) => {
              const val = parseFloat(text);
              if (!isNaN(val)) {
                setCurrentLat(val);
                onLocationSelect(val, currentLng);
              }
            }}
            keyboardType="numeric"
            style={styles.input}
            mode="outlined"
            dense
          />
          <TextInput
            label="Lng"
            value={currentLng.toString()}
            onChangeText={(text) => {
              const val = parseFloat(text);
              if (!isNaN(val)) {
                setCurrentLng(val);
                onLocationSelect(currentLat, val);
              }
            }}
            keyboardType="numeric"
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
    height: 200,
  },
  mapExpanded: {
    height: Dimensions.get('window').height * 0.5,
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
    fontSize: 13,
    color: '#1B5E20',
    fontFamily: 'monospace',
  },
  manualInputContainer: {
    padding: 12,
    backgroundColor: '#fafafa',
  },
  manualInputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
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
