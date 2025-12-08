import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface LocationAddress {
  city: string;
  country: string;
  fullAddress: string;
}

export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    // First check if location services are enabled
    const serviceEnabled = await Location.hasServicesEnabledAsync();
    if (!serviceEnabled) {
      Alert.alert(
        'Location Services Disabled',
        'Please enable location services in your device settings to get weather information for your area.',
        [
          {
            text: 'Open Settings',
            onPress: async () => {
              try {
                await Location.enableNetworkProviderAsync();
              } catch (error) {
                console.warn('Could not enable location provider:', error);
              }
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
      return false;
    }

    // Then request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Location Permission Needed',
        'YCD Farmer Guide needs to access your location to provide accurate weather information.',
        [
          {
            text: 'Open Settings',
            onPress: () => {
              try {
                Linking.openSettings();
              } catch (error) {
                console.warn('Could not open settings:', error);
              }
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Error requesting location permission:', err);
    Alert.alert(
      'Location Error',
      'An error occurred while requesting location permissions. Please try again.',
      [{ text: 'OK' }]
    );
    return false;
  }
};

export const getCurrentLocation = async (): Promise<LocationCoords> => {
  try {
    // First check if location services are enabled
    const serviceEnabled = await Location.hasServicesEnabledAsync();
    if (!serviceEnabled) {
      throw new Error('Location services are disabled');
    }

    // Get current position with high accuracy
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 5000, // Update every 5 seconds
      mayShowUserSettingsDialog: true // Show settings dialog if needed
    });

    // Return formatted coordinates
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error: any) {
    console.warn('Location error:', error);

    // Provide more specific error messages
    if (error.message.includes('Location request failed')) {
      throw new Error('Unable to determine location. Please check your device settings.');
    } else if (error.message.includes('denied')) {
      throw new Error('Location permission denied. Please enable location access in settings.');
    } else if (error.message.includes('disabled')) {
      throw new Error('Please enable location services in your device settings.');
    }

    // Generic error fallback
    throw new Error('Unable to get current location: ' + error.message);
  }
};

export const getAddressFromCoords = async (coords: LocationCoords): Promise<LocationAddress> => {
  try {
    // Create a timeout promise that rejects after 2 seconds
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Geocoding timed out')), 10000);
    });

    // Using Expo Location's reverse geocoding instead of external API
    // Race against the timeout
    const result = await Promise.race([
      Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude
      }),
      timeout
    ]);

    if (result && result.length > 0) {
      const address = result[0];
      return {
        city: address.city || address.subregion || address.district || 'Unknown',
        country: address.country || 'Unknown',
        fullAddress: [
          address.street,
          address.city,
          address.region,
          address.country
        ].filter(Boolean).join(', ') || 'Unknown location',
      };
    }

    // Fallback in case reverse geocoding returns empty
    return {
      city: 'Unknown City',
      country: 'Unknown Country',
      fullAddress: `${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)}`,
    };
  } catch (error) {
    console.warn('Geocoding failed or timed out:', error);
    // Return a fallback instead of throwing
    return {
      city: 'Location Unavailable',
      country: '',
      fullAddress: 'Could not determine location',
    };
  }
};