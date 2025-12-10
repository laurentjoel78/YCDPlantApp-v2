import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, Dimensions, TextInput as RNTextInput } from 'react-native';
import { Button, Text, IconButton, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';

// Error Boundary to catch map crashes
class MapErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MapPicker Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

type MapPickerProps = {
  latitude: number;
  longitude: number;
  onLocationSelect: (latitude: number, longitude: number) => void;
  style?: object;
};

// Fallback component when maps don't work
function ManualLocationInput({
  latitude,
  longitude,
  onLocationSelect
}: {
  latitude: number;
  longitude: number;
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  const { t } = useTranslation();
  const [lat, setLat] = useState(latitude?.toString() || '');
  const [lng, setLng] = useState(longitude?.toString() || '');
  const [gettingLocation, setGettingLocation] = useState(false);

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newLat = location.coords.latitude;
      const newLng = location.coords.longitude;
      setLat(newLat.toString());
      setLng(newLng.toString());
      onLocationSelect(newLat, newLng);
    } catch (err) {
      console.error('Error getting location:', err);
      alert('Could not get current location');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleLatChange = (text: string) => {
    setLat(text);
    const parsedLat = parseFloat(text);
    const parsedLng = parseFloat(lng);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      onLocationSelect(parsedLat, parsedLng);
    }
  };

  const handleLngChange = (text: string) => {
    setLng(text);
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(text);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      onLocationSelect(parsedLat, parsedLng);
    }
  };

  return (
    <View style={fallbackStyles.container}>
      <Text style={fallbackStyles.title}>{t('farmer.registration.location')}</Text>
      <Text style={fallbackStyles.hint}>
        Enter coordinates manually or use your current location
      </Text>

      <Button
        mode="outlined"
        onPress={getCurrentLocation}
        loading={gettingLocation}
        disabled={gettingLocation}
        style={fallbackStyles.locationButton}
        icon="crosshairs-gps"
      >
        {gettingLocation ? 'Getting Location...' : 'Use My Current Location'}
      </Button>

      <View style={fallbackStyles.inputRow}>
        <TextInput
          label="Latitude"
          value={lat}
          onChangeText={handleLatChange}
          keyboardType="numeric"
          style={fallbackStyles.input}
          mode="outlined"
        />
        <TextInput
          label="Longitude"
          value={lng}
          onChangeText={handleLngChange}
          keyboardType="numeric"
          style={fallbackStyles.input}
          mode="outlined"
        />
      </View>

      {lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng)) && (
        <Text style={fallbackStyles.coordinates}>
          📍 {parseFloat(lat).toFixed(6)}, {parseFloat(lng).toFixed(6)}
        </Text>
      )}
    </View>
  );
}

const fallbackStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  locationButton: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
  },
  coordinates: {
    marginTop: 12,
    fontSize: 14,
    color: '#2E7D32',
    textAlign: 'center',
  },
});

export default function MapPicker({
  latitude,
  longitude,
  onLocationSelect,
  style
}: MapPickerProps) {
  const [mapAvailable, setMapAvailable] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.0922);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const { t } = useTranslation();

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError(t(('services.location.permissionDenied') as any));
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        // Auto-set location if not already set
        if (!latitude && !longitude) {
          onLocationSelect(location.coords.latitude, location.coords.longitude);
        }
      } catch (err) {
        setLocationError(t(('services.location.unableToGet') as any));
        console.warn('Error getting location:', err);
      }
    })();
  }, []);

  // Try to load MapView dynamically to catch import errors
  let MapView: any = null;
  let Marker: any = null;

  try {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
  } catch (e) {
    console.warn('react-native-maps failed to load:', e);
    setMapAvailable(false);
  }

  // If maps aren't available, use fallback
  if (!mapAvailable || !MapView) {
    return (
      <ManualLocationInput
        latitude={latitude}
        longitude={longitude}
        onLocationSelect={onLocationSelect}
      />
    );
  }

  const initialRegion = {
    latitude: latitude || currentLocation?.latitude || 7.3697,
    longitude: longitude || currentLocation?.longitude || 12.3547,
    latitudeDelta: zoomLevel,
    longitudeDelta: zoomLevel * (Dimensions.get('window').width / Dimensions.get('window').height),
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    onLocationSelect(latitude, longitude);
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  return (
    <MapErrorBoundary
      fallback={
        <ManualLocationInput
          latitude={latitude}
          longitude={longitude}
          onLocationSelect={onLocationSelect}
        />
      }
    >
      <View style={[styles.container, style]}>
        {locationError && (
          <Text style={styles.errorText}>{locationError}</Text>
        )}
        <View style={styles.header}>
          <Text style={styles.title}>{t('farmer.registration.location')}</Text>
          <IconButton
            icon={isExpanded ? 'chevron-up' : 'chevron-down'}
            onPress={() => setIsExpanded(!isExpanded)}
          />
        </View>

        <View style={[
          styles.mapContainer,
          isExpanded ? styles.mapExpanded : styles.mapCollapsed
        ]}>
          <View style={styles.zoomControls}>
            <IconButton
              icon="plus"
              size={24}
              onPress={() => {
                setZoomLevel(Math.max(zoomLevel / 2, 0.001));
              }}
            />
            <IconButton
              icon="minus"
              size={24}
              onPress={() => {
                setZoomLevel(Math.min(zoomLevel * 2, 50));
              }}
            />
          </View>
          <MapView
            style={[styles.map, isExpanded ? styles.mapExpanded : styles.mapCollapsed]}
            initialRegion={initialRegion}
            onPress={handleMapPress}
            onRegionChangeComplete={(region: any) => {
              setZoomLevel(region.latitudeDelta);
              onLocationSelect(region.latitude, region.longitude);
            }}
            minZoomLevel={5}
            maxZoomLevel={20}
          >
            {latitude && longitude && (
              <Marker
                coordinate={{
                  latitude,
                  longitude
                }}
                title={t('farmer.registration.location')}
                description={t('farmer.registration.location')}
                draggable
                onDragEnd={(e: any) => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  onLocationSelect(latitude, longitude);
                }}
              />
            )}
          </MapView>
        </View>

        {isExpanded && (
          <View style={styles.helpContainer}>
            <Text style={styles.helper}>{t('farmer.registration.location')}</Text>
            {latitude && longitude && (
              <Text style={styles.coordinates}>
                {t('farmer.registration.location')}: {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </Text>
            )}
          </View>
        )}
      </View>
    </MapErrorBoundary>
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
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  mapContainer: {
    overflow: 'hidden',
  },
  map: {
    width: Dimensions.get('window').width - 32,
    alignSelf: 'center',
  },
  mapCollapsed: {
    height: 200,
  },
  mapExpanded: {
    height: Dimensions.get('window').height * 0.6,
  },
  helpContainer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  helper: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  coordinates: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  zoomControls: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    padding: 4,
  },
  errorText: {
    color: 'red',
    padding: 8,
    textAlign: 'center',
    backgroundColor: '#ffebee',
    marginBottom: 8,
    borderRadius: 4,
  },
});
