import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { TextInput, Button, HelperText } from 'react-native-paper';
import * as Location from 'expo-location';
import MapPicker from './MapPicker';
import { useTranslation } from 'react-i18next';

type FarmerRegistrationFormProps = {
  onSubmit: (farmerData: FarmerFormData) => void;
  loading: boolean;
};

export type FarmerFormData = {
  farmName: string;
  farmSizeHectares: string;
  farmLocationLat?: number;
  farmLocationLng?: number;
  cropsGrown: string[];
  farmingExperienceYears: string;
  soilType: string;
};

const commonCrops = [
  'Maize',
  'Cassava',
  'Plantains',
  'Cocoa',
  'Coffee',
  'Rice',
  'Vegetables',
  'Other'
];

const soilTypes = [
  'Clay',
  'Sandy',
  'Silty',
  'Loamy',
  'Chalky',
  'Peaty',
  'Saline',
  'Other'
];

export default function FarmerRegistrationForm({ onSubmit, loading }: FarmerRegistrationFormProps) {
  const [farmData, setFarmData] = useState<FarmerFormData>({
    farmName: '',
    farmSizeHectares: '',
    cropsGrown: [],
    farmingExperienceYears: '',
    farmLocationLat: undefined,
    farmLocationLng: undefined,
    soilType: '',
  });
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get initial location
  useEffect(() => {
    (async () => {
      try {
        setLocationError(null);
        // First check if location permission is already granted
        let { status } = await Location.getForegroundPermissionsAsync();

        // If not granted, request it
        if (status !== 'granted') {
          const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
          if (newStatus !== 'granted') {
            setLocationError('Location permission is required to set your farm location');
            return;
          }
        }

        // Get current location with high accuracy
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });

        setFarmData(prev => ({
          ...prev,
          farmLocationLat: location.coords.latitude,
          farmLocationLng: location.coords.longitude,
        }));
      } catch (error) {
        console.error('Error getting location:', error);
        setLocationError('Could not get your current location. Please select manually on the map.');
      }
    })();
  }, []);
  const [errors, setErrors] = useState<Partial<Record<keyof FarmerFormData, string>>>({});

  const { t } = useTranslation();

  const validateForm = () => {
    const newErrors: Partial<Record<keyof FarmerFormData, string>> = {};

    if (!farmData.farmSizeHectares) {
      newErrors.farmSizeHectares = t('farmer.registration.validation.farmSize');
    } else if (isNaN(Number(farmData.farmSizeHectares)) || Number(farmData.farmSizeHectares) <= 0) {
      newErrors.farmSizeHectares = t('farmer.registration.validation.farmSizeNumber');
    }

    if (!farmData.farmLocationLat || !farmData.farmLocationLng) {
      newErrors.farmLocationLat = t('farmer.registration.validation.location');
    }

    if (!farmData.farmingExperienceYears) {
      newErrors.farmingExperienceYears = t('farmer.registration.validation.experience');
    } else if (isNaN(Number(farmData.farmingExperienceYears)) || Number(farmData.farmingExperienceYears) < 0) {
      newErrors.farmingExperienceYears = t('farmer.registration.validation.experienceNumber');
    }

    if (!farmData.cropsGrown || farmData.cropsGrown.length === 0) {
      newErrors.cropsGrown = t('farmer.registration.validation.crops');
    }

    if (!farmData.soilType) {
      newErrors.soilType = t('farmer.registration.validation.soil');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(farmData);
    }
  };

  const toggleCrop = (crop: string) => {
    const currentCrops = farmData.cropsGrown;
    const newCrops = currentCrops.includes(crop)
      ? currentCrops.filter(c => c !== crop)
      : [...currentCrops, crop];

    setFarmData({
      ...farmData,
      cropsGrown: newCrops
    });
    setErrors({ ...errors, cropsGrown: undefined });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <TextInput
        label={t('farmer.registration.farmName')}
        value={farmData.farmName}
        onChangeText={(text) => {
          setFarmData({ ...farmData, farmName: text });
        }}
        style={styles.input}
      />

      <TextInput
        label={t('farmer.registration.farmSize')}
        value={farmData.farmSizeHectares}
        onChangeText={(text) => {
          setFarmData({ ...farmData, farmSizeHectares: text });
          setErrors({ ...errors, farmSizeHectares: undefined });
        }}
        keyboardType="numeric"
        style={styles.input}
        error={!!errors.farmSizeHectares}
      />
      <HelperText type="error" visible={!!errors.farmSizeHectares}>
        {errors.farmSizeHectares}
      </HelperText>

      <View style={styles.soilTypeContainer}>
        <View style={styles.soilTypeHeader}>
          <HelperText type="info">{t('farmer.registration.soil.title')}</HelperText>
          {!!errors.soilType && (
            <HelperText type="error">{errors.soilType}</HelperText>
          )}
        </View>
        <View style={styles.soilTypeGrid}>
          {soilTypes.map((type) => (
            <Button
              key={type}
              mode={farmData.soilType === type ? 'contained' : 'outlined'}
              onPress={() => {
                setFarmData({
                  ...farmData,
                  soilType: type
                });
                setErrors({ ...errors, soilType: undefined });
              }}
              style={styles.soilTypeButton}
              labelStyle={styles.buttonLabel}
            >
              {t(('farmer.registration.soil.' + type.toLowerCase()) as any)}
            </Button>
          ))}
        </View>
      </View>

      <TextInput
        label={t('farmer.registration.experience')}
        value={farmData.farmingExperienceYears}
        onChangeText={(text) => {
          setFarmData({ ...farmData, farmingExperienceYears: text });
          setErrors({ ...errors, farmingExperienceYears: undefined });
        }}
        keyboardType="numeric"
        style={styles.input}
        error={!!errors.farmingExperienceYears}
      />
      <HelperText type="error" visible={!!errors.farmingExperienceYears}>
        {errors.farmingExperienceYears}
      </HelperText>

      <View style={styles.mapContainer}>
        <MapPicker
          latitude={farmData.farmLocationLat || 0}
          longitude={farmData.farmLocationLng || 0}
          onLocationSelect={(lat, lng) => {
            setFarmData({
              ...farmData,
              farmLocationLat: lat,
              farmLocationLng: lng
            });
            setErrors({ ...errors, farmLocationLat: undefined });
          }}
          style={styles.mapPicker}
        />
        {!!errors.farmLocationLat && (
          <HelperText type="error" visible={true}>
            {errors.farmLocationLat}
          </HelperText>
        )}
      </View>

      <View style={styles.cropsContainer}>
        <View style={styles.cropsHeader}>
          <HelperText type="info">Select Crops (Multiple)</HelperText>
          {!!errors.cropsGrown && (
            <HelperText type="error">{errors.cropsGrown}</HelperText>
          )}
        </View>
        <View style={styles.cropsGrid}>
          {commonCrops.map((crop) => (
            <Button
              key={crop}
              mode={farmData.cropsGrown.includes(crop) ? 'contained' : 'outlined'}
              onPress={() => toggleCrop(crop)}
              style={styles.cropButton}
              compact
            >
              {t(('farmer.registration.crops.' + crop.toLowerCase()) as any)}
            </Button>
          ))}
        </View>
      </View>

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={styles.submitButton}
        contentStyle={{ height: 48 }}
      >
        {t('common.next')}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  input: {
    marginBottom: 4,
    backgroundColor: '#fff',
  },
  mapContainer: {
    marginVertical: 16,
  },
  mapPicker: {
    marginBottom: 4,
  },
  cropsContainer: {
    marginVertical: 16,
  },
  cropsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cropsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  cropButton: {
    margin: 4,
  },
  submitButton: {
    marginTop: 24,
    borderRadius: 8,
  },
  soilTypeContainer: {
    marginVertical: 16,
  },
  soilTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  soilTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  soilTypeButton: {
    margin: 4,
    minWidth: 100,
  },
  buttonLabel: {
    fontSize: 12,
  },
});