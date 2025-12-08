import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Button, Text, IconButton } from 'react-native-paper';
import MapView, { Marker, Region } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';

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
  const [zoomLevel, setZoomLevel] = useState(0.0922); // Initial zoom level
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

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
      } catch (err) {
  setLocationError(t(('services.location.unableToGet') as any));
        console.warn('Error getting location:', err);
      }
    })();
  }, []);

  // Use current location if available, fall back to provided coordinates or Cameroon's center
  const initialRegion: Region = {
    latitude: latitude || currentLocation?.latitude || 7.3697,
    longitude: longitude || currentLocation?.longitude || 12.3547,
    latitudeDelta: zoomLevel,
    longitudeDelta: zoomLevel * (Dimensions.get('window').width / Dimensions.get('window').height),
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    onLocationSelect(latitude, longitude);
    if (!isExpanded) {
      setIsExpanded(true); // Automatically expand map when location is selected
    }
  };
  
  const { t } = useTranslation();
  return (
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
          onRegionChangeComplete={(region) => {
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
              onDragEnd={(e) => {
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
    width: Dimensions.get('window').width - 32, // Account for container padding
    alignSelf: 'center',
  },
  mapCollapsed: {
    height: 200,
  },
  mapExpanded: {
    height: Dimensions.get('window').height * 0.6, // 60% of screen height
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